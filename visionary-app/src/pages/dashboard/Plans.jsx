import { learningDate } from '@/lib/learningCopy';
import { primaryWorkspaceCopy } from '@/lib/primaryWorkspaceCopy';
import FamilyBilling from '@/components/dashboard/FamilyBilling';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ShieldCheck } from 'lucide-react';
import { useWorkspace } from '@/hooks/useWorkspace';
import { plans, changeSubscription } from '@/services/workspaceService';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
const money = (value, locale = "en") => new Intl.NumberFormat(locale + '-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
}).format(value);
export default function Plans() {
  const {
    data: copyWorkspace
  } = useWorkspace();
  const locale = copyWorkspace?.preferences.interfaceLocale || 'en';
  const copy = primaryWorkspaceCopy(locale);
  const {
    ctx,
    data,
    person,
    error: readError,
    refresh
  } = useWorkspace();
  const [selected, setSelected] = useState(null);
  const [outcome, setOutcome] = useState('active');
  const [notice, setNotice] = useState('');const [noticeError,setNoticeError]=useState(false);
  const [cancel, setCancel] = useState(false);
  useEffect(() => {
    setSelected(null);
    setCancel(false);
    setNotice('');
  }, [ctx?.personId, ctx?.workspaceId]);
  if (readError) return <div className="v-page" role="alert"><h1 className="v-title">{copy("Plans & usage")}</h1> {copy('Saved billing is unavailable. Original records have not been changed.')}  <button className="v-button" onClick={refresh}> {copy('Retry saved billing')} </button></div>;
  if (!ctx || !data) return <div role="status" className="v-page"> {copy("Loading plans\u2026")} </div>;
  const sub = data.subscription;
  if (!sub || !['Free', 'Premium', 'Family'].includes(sub.plan) || !['active', 'pending', 'failed', 'cancelled'].includes(sub.state) || !Number.isFinite(sub.usage) || sub.usage < 0 || !Array.isArray(sub.invoices) || sub.invoices.some(i => !i || typeof i.id !== 'string' || !['Free', 'Premium', 'Family'].includes(i.plan) || !Number.isFinite(i.amount) || i.amount < 0)) return <div className="v-page"><h1 className="v-title"> {copy('Plans & usage')} </h1><p role="alert"> {copy('Saved billing is unavailable. Original records have not been changed.')} </p><button className="v-button" onClick={refresh}> {copy('Retry saved billing')} </button></div>;
  function updateRenewal() {
    setNoticeError(false);try {
      changeSubscription(ctx, sub.plan, sub.state === 'cancelled' ? 'active' : 'cancelled');
      setCancel(false);
      setNotice('Demo subscription updated. Saved work remains available.');
    } catch (error) {
      setNoticeError(true);setNotice(error.message);
    }
  }
  function checkout() {
    setNoticeError(false);try {
      changeSubscription(ctx, selected.id, outcome);
      setSelected(null);
      setNotice(outcome === 'active' ? 'Demo subscription activated. No payment was collected.' : outcome === 'pending' ? 'Demo payment is pending. Your current access has not changed.' : 'Demo payment failed. No charge was made and your current plan is unchanged.');
    } catch (e) {
      setNoticeError(true);setNotice(e.message);
    }
  }
  return <div className="v-page" lang={locale}><header><h1 className="v-title"> {copy("Plans & usage")} </h1><p className="v-muted mt-2"> {copy("Choose how you learn and build. All billing here is simulated.")} </p></header><section className="v-card"><div className="flex flex-wrap justify-between gap-4"><div><p className="v-muted"> {copy("Current account plan")} </p><h2 className="mt-2 text-2xl font-medium"> {copy(sub.plan)} </h2><p className="v-muted mt-2">{sub.state === 'cancelled' ? copy('Cancellation scheduled. Demo access retained until {date}.', {
              date: learningDate(sub.renewsAt, locale)
            }) : sub.state === 'pending' || sub.state === 'failed' ? copy('Latest checkout {state} · Existing access retained', {
              state: copy(sub.state === 'pending' ? 'Pending' : 'Failure')
            }) : copy("Active local preview")}</p></div>{sub.plan !== 'Free' && <button className="v-button" onClick={() => {setNotice('');setNoticeError(false);setCancel(true);}}>{sub.state === 'cancelled' ? copy("Resume subscription") : copy("Cancel subscription")}</button>}</div><div className="mt-6 rounded-xl bg-[#ffffff] p-4"><h3 className="text-sm font-medium"> {copy("Guided conversation usage")} </h3><p className="v-muted mt-2">{sub.usage} {copy("guided turns today")} {sub.plan === 'Free' ? copy(" \xB7 10-turn demo allowance") : ''} {copy(". Resets at 00:00 UTC. Demo counts are not production entitlements.")} </p>{sub.plan === 'Free' && <progress className="mt-3 w-full" aria-label={copy("Daily demo conversation usage")} value={Math.min(sub.usage, 10)} max="10" />}<p className="v-muted mt-2"> {copy("Saved learning, practice, projects and required classwork remain available at the limit.")} </p></div></section>{notice && <p className="v-notice" lang={noticeError&&copy(notice)===notice?"en":locale} role={noticeError?"alert":"status"}> {copy(notice)} </p>}<div className="grid gap-4 lg:grid-cols-3">{plans.map(plan => <section key={plan.id} className="v-card flex flex-col"><h2 className="text-xl font-medium">{copy(plan.id)}</h2><p className="my-4 text-3xl font-medium">{money(plan.price, locale)}<span className="text-sm font-normal text-[#5f6368]">{plan.price ? copy("/month") : ''}</span></p><p className="v-muted">{plan.id === 'Free' ? copy("Start with guided learning and saved activities.") : plan.id === 'Family' ? copy("Up to six separate profiles. Billing and guardian permission stay separate.") : copy("An ad-free experience with higher guided limits.")}</p><ul className="my-6 space-y-3 text-sm">{['Personal learning and projects', 'Clear connections and sharing', plan.price ? 'No ads · Demo expanded access' : 'Saved activities stay accessible'].map(f => <li className="flex gap-2" key={f}><Check size={16} className="shrink-0 text-[#137333]" /> {copy(f)} </li>)}</ul>{plan.provisional && <p className="v-muted mb-4"> {copy("Provisional family pricing.")} </p>}<button className="v-button mt-auto" disabled={plan.id === sub.plan} onClick={() => {
          setNotice('');setNoticeError(false);setSelected(plan);
          setOutcome('active');
        }}>{plan.id === sub.plan ? copy("Current plan") : copy("Review demo plan")}</button></section>)}</div><FamilyBilling ctx={ctx} /><section className="v-card"><h2 className="text-lg font-medium"> {copy("Demo invoices")} </h2>{sub.invoices.length ? sub.invoices.map(i => <div className="v-list-row" key={i.id}><div><p className="text-sm"> {copy(i.plan)}  {copy("\xB7 Demo receipt")} </p><p className="v-muted">{learningDate(i.at, locale)}</p></div><span className="text-sm">{money(i.amount, locale)}</span></div>) : <p className="v-muted mt-4"> {copy("No invoices. This preview has no payment method.")} </p>}</section><section className="v-notice flex items-start gap-3"><ShieldCheck className="mt-1 shrink-0" size={18} /><p> {copy("No real checkout, renewal, tax calculation, or payment method is connected. Paid plan limits and tax treatment require confirmed service policies.")} {person?.ageBand !== 'adult' ? copy("This youth/unknown-age preview does not display sponsorship.") : copy("Adult sponsorship is not currently served.")} {copy("Organization pricing is arranged separately.")} <Link to="/dashboard/support" className="underline"> {copy("Contact and service information")} </Link></p></section>
 <Dialog open={!!selected} onOpenChange={open => {
      if (!open) setSelected(null);
    }}><DialogContent lang={locale}><DialogTitle> {copy("Review")}  {copy(selected?.id || '')} </DialogTitle><DialogDescription> {copy("Simulation only. Never enter card, bank, or UPI details.")} </DialogDescription><p className="text-xl">{money(selected?.price || 0, locale)} {copy("/ month")} </p><p className="v-muted"> {copy("Monthly renewal is represented by a 30-day demo period. Cancel to retain access until that period ends. Taxes and live terms are not configured.")} </p><label className="text-sm"> {copy("Demo checkout outcome")} <select aria-label={copy("Demo checkout outcome")} className="v-field mt-2" value={outcome} onChange={e => setOutcome(e.target.value)}><option value="active"> {copy("Success \u2014 no payment")} </option><option value="pending"> {copy("Pending")} </option><option value="failed"> {copy("Failure")} </option></select></label>{noticeError&&notice&&<p role="alert" lang={copy(notice)===notice?"en":locale} className="text-sm text-[#b3261e]">{copy(notice)}</p>}<button className="v-button primary" onClick={checkout}> {copy("Simulate checkout")} </button></DialogContent></Dialog>
 <Dialog open={cancel} onOpenChange={setCancel}><DialogContent lang={locale}><DialogTitle>{sub.state === 'cancelled' ? copy("Resume demo subscription?") : copy("Cancel demo renewal?")}</DialogTitle><DialogDescription> {copy("Your saved work is retained. No real subscription is changed.")} </DialogDescription><button className="v-button" onClick={() => setCancel(false)}> {copy("Keep current state")} </button>{noticeError&&notice&&<p role="alert" className="text-sm text-[#b3261e]">{copy(notice)}</p>}<button className="v-button primary" onClick={updateRenewal}> {copy("Confirm")} </button></DialogContent></Dialog></div>;
}
