import { organizationCopy } from '@/lib/organizationCopy';
import { useState } from 'react';
import { organizationBilling, requestOrganizationSeats, changeOrganizationSeatRequest } from '@/services/organizationBillingService';
export default function OrganizationBilling({
  ctx,
  locale = 'en'
}) {
  const t = (key, params) => organizationCopy(locale, key, params);
  const [seats, setSeats] = useState('');
  const [purpose, setPurpose] = useState('');
  const [notice, setNotice] = useState('');
  const [failed, setFailed] = useState(false);
  const [, refresh] = useState(0);
  let data, error;
  try {
    data = organizationBilling(ctx);
  } catch (failure) {
    error = failure.message;
  }
  function perform(action, message) {
    try {
      action();
      setNotice(message);
      setFailed(false);
    } catch (failure) {
      setNotice(failure.message);
      setFailed(true);
    }
  }
  return <div className="v-page" lang={locale}><header><h1 className="v-title">{t("Organization seats and billing")}</h1><p className="v-muted mt-2">{t("Plan an access request with your owner. Organization pricing and invoices are not connected.")}</p></header>{error ? <div className="v-notice v-error" role="alert"><span lang="en">{error}</span><button className="v-button ml-3" onClick={() => refresh(value => value + 1)}>{t("Retry")}</button></div> : <><section className="v-card"><h2 className="text-lg font-medium">{t("Request seats")}</h2><p className="v-muted mt-2">{t("This saves a planning request on this device. Acknowledgement does not activate seats, grant access or create a charge.")}</p><form className="mt-4 space-y-4" onSubmit={event => {
          event.preventDefault();
          perform(() => {
            requestOrganizationSeats(ctx, Number(seats), purpose);
            setSeats('');
            setPurpose('');
          }, 'Seat request saved locally for owner review.');
        }}><label className="block text-sm">{t("Requested seats")}<input className="v-field mt-2" type="number" min="1" max="100000" step="1" required value={seats} onChange={event => setSeats(event.target.value)} /></label><label className="block text-sm">{t("Purpose")}<textarea aria-label={t('Purpose')} className="v-field mt-2" required maxLength={1000} value={purpose} onChange={event => setPurpose(event.target.value)} /></label><button className="v-button primary" disabled={data.requests.some(row => row.status === 'pending')}>{t("Save seat request")}</button></form></section><section className="v-card"><h2 className="text-lg font-medium">{t("Request history")}</h2>{data.requests.length ? data.requests.map(row => <article key={row.id} className="mt-4 border-t border-[#dadce0] pt-4"><h3 className="text-sm font-medium">{t('{count} seats · {status}',{count:row.seats,status:t(row.status)})}</h3><p className="v-muted mt-2 whitespace-pre-wrap break-words">{row.purpose}</p><time className="v-muted mt-2 block" dateTime={row.at}>{new Date(row.at).toLocaleString(locale)}</time>{row.status === 'pending' && <div className="mt-4 flex flex-wrap gap-3">{data.profile === 'owner' && <button className="v-button" onClick={() => perform(() => changeOrganizationSeatRequest(ctx, row.id, 'acknowledged'), 'Owner acknowledged the planning request. No seats activated.')}>{t("Acknowledge request")}</button>}{(data.profile === 'owner' || row.requestedBy === ctx.personId) && <button className="v-button" onClick={() => perform(() => changeOrganizationSeatRequest(ctx, row.id, 'cancelled'), 'Seat request cancelled locally.')}>{t("Cancel request")}</button>}</div>}</article>) : <p className="v-muted mt-3">{t("No saved seat requests.")}</p>}</section></>}{notice && <p className={`v-notice ${failed ? 'v-error' : ''}`} lang={failed?'en':locale} role={failed ? 'alert' : 'status'}>{failed?notice:t(notice)}</p>}</div>;
}
