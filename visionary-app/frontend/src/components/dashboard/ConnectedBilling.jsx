import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, CreditCard, FileText, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { appClient } from '@/api/appClient';
import { createBillingClient, loadRazorpay, openRazorpay } from '@/services/billingClient';
import { billingSelection } from '@/lib/billingIntent';
import BillingInvoice from './BillingInvoice';
import { useAuth } from '@/lib/AuthContext';
import { useConnectedWorkspace } from '@/hooks/ConnectedWorkspaceProvider';
import { billingCopy } from '@/lib/billingCopy';
import { authLink } from '@/lib/authReturnTo';
import '@/styles/billing.css';

const money = amount => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount / 100);
const names = { start: 'Start (Free)', personal: 'Personal', family: 'Family' };
const features = { start: ['Learning & saved activities', 'Your own learning space'], personal: ['Personal learning & projects', 'Higher guided access · fair use applies'], family: ['Personal benefits for six accounts', 'Private learning for every member'] };

export default function ConnectedBilling({ profile }) {
  const { checkUserAuth } = useAuth();
  const { data: workspace } = useConnectedWorkspace();
  const locale = workspace?.preferences?.interfaceLocale || 'en';
  const t = useMemo(() => billingCopy(locale), [locale]);
  const date = value => value ? new Intl.DateTimeFormat(locale === 'en' ? 'en-IN' : locale, { dateStyle: 'medium' }).format(new Date(value)) : t('Not scheduled');
  const [search, setSearch] = useSearchParams();
  const initial = billingSelection(search.toString());
  const [interval, setInterval] = useState(initial?.interval || 'monthly');
  const [selected, setSelected] = useState(initial?.plan || null);
  const [catalog, setCatalog] = useState(null), [data, setData] = useState(null);
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [busy, setBusy] = useState('');
  const [agreed, setAgreed] = useState(false), [cancel, setCancel] = useState(false), [receipt, setReceipt] = useState(null);
  const [email, setEmail] = useState(''), [inviteLink, setInviteLink] = useState(''), [invitation, setInvitation] = useState(null);
  const mounted = useRef(true), active = useRef(false), popup = useRef(null), sequence = useRef(0), command = useRef(null);
  const invoiceTrigger = useRef(null);
  const uid = profile?.id;
  const client = useMemo(() => createBillingClient({ getAccountId: () => appClient.auth.currentProfile?.()?.id }), []);
  const check = useCallback(() => { if (!mounted.current || appClient.auth.currentProfile?.()?.id !== uid) throw new Error(t('Your account changed. Return to Plans before continuing.')); }, [uid, t]);
  const reportFailure = useCallback(failure => {
    if (!mounted.current || appClient.auth.currentProfile?.()?.id !== uid) return;
    setError(failure.status === 401 ? t('Your session ended. Sign in again; your saved payments are kept.') : failure.message || t('Payment status is unavailable. Refresh before trying again.'));
    if (failure.status === 401) void checkUserAuth({ quiet: true });
  }, [uid, checkUserAuth, t]);
  const apply = useCallback(value => {
    check(); if (value?.uid !== uid || !Array.isArray(value.invoices) || !names[value.plan]) throw new Error(t('Billing could not be read safely. Please reload.'));
    setData(previous => previous && previous.revision > value.revision ? previous : value);
  }, [check, uid, t]);
  const refresh = useCallback(async (sync = false) => {
    const request = ++sequence.current;
    const value = sync ? await client.sync() : await client.account();
    if (request === sequence.current) apply(value);
    return value;
  }, [client, apply]);
  useEffect(() => {
    mounted.current = true;
    if (!uid) return;
    Promise.all([client.catalog(), client.account()]).then(([offers, account]) => { check(); setCatalog(offers); apply(account); }).catch(reportFailure);
    return () => { mounted.current = false; ++sequence.current; popup.current?.close(); };
  }, [uid, client, check, apply, reportFailure]);
  useEffect(() => {
    if (!data || active.current) return;
    let cancelled = false, timer;
    const tick = async () => {
      if (!cancelled && document.visibilityState === 'visible' && !active.current) {
        try { await refresh(); } catch (failure) { if (failure.status === 401) reportFailure(failure); }
      }
      if (!cancelled) timer = setTimeout(tick, 15000);
    };
    timer = setTimeout(tick, 15000);
    const foreground = () => { if (document.visibilityState === 'visible' && !active.current) void refresh().catch(failure => { if (failure.status === 401) reportFailure(failure); }); };
    window.addEventListener('focus', foreground); document.addEventListener('visibilitychange', foreground);
    return () => { cancelled = true; clearTimeout(timer); window.removeEventListener('focus', foreground); document.removeEventListener('visibilitychange', foreground); };
  }, [!!data, refresh, reportFailure]);
  useEffect(() => {
    const token = search.get('invite');
    if (!uid || !token) return;
    let valid = true;
    client.invitation(token).then(value => { if (valid) setInvitation(value); }).catch(failure => { if (valid) reportFailure(failure); });
    return () => { valid = false; };
  }, [search, uid, client, reportFailure]);
  async function action(label, task) {
    if (active.current) return;
    active.current = true; setBusy(label); setError(''); setNotice('');
    try { await task(); }
    catch (failure) { reportFailure(failure); }
    finally { active.current = false; if (mounted.current) setBusy(''); }
  }
  function closeReview() { if (!active.current) { setSelected(null); setAgreed(false); const next = new URLSearchParams(search); next.delete('plan'); next.delete('billing'); setSearch(next, { replace: true }); } }
  async function pay() {
    if (!agreed || !selected || !catalog) return;
    await action(t('Preparing secure checkout…'), async () => {
      // Load before creating a provider subscription so blocked scripts don't strand it.
      await loadRazorpay(); check();
      const signature = `${selected}:${interval}`;
      if (command.current?.signature !== signature) command.current = { signature, id: crypto.randomUUID() };
      const checkout = await client.checkout({ plan: selected, interval, commandId: command.current.id, catalogVersion: catalog.version });
      check(); setSelected(null); setAgreed(false); setBusy(t('Complete payment in secure checkout…'));
      // Once reserved, the saved account attempt is the recovery destination.
      // A reload must not reopen URL-driven purchase review after a charge.
      const next = new URLSearchParams(search); next.delete('plan'); next.delete('billing'); setSearch(next, { replace: true });
      // Release Radix focus/pointer containment before the provider mounts its modal.
      await new Promise((resolve, reject) => { const start = performance.now(); const settled = () => { if (!document.querySelector('[data-billing-review]')) resolve(); else if (performance.now() - start > 1500) reject(new Error(t('Checkout could not open. Refresh the saved payment status and retry.'))); else requestAnimationFrame(settled); }; requestAnimationFrame(settled); });
      check();
      const result = await openRazorpay(checkout, { profile, beforeOpen: check, onReady: instance => { popup.current = instance; } });
      popup.current = null; check();
      setSelected(null); setAgreed(false); setBusy(t('Checking your saved payment…'));
      if (result.dismissed) {
        await refresh(true);
        setNotice(result.failed ? t('The payment attempt was not confirmed. Check the saved status below before retrying.') : t('Checkout closed. Your saved attempt is kept; check its status before trying again.'));
      } else {
        const confirmed = await client.verify({ attemptId: checkout.attemptId, razorpay_payment_id: result.razorpay_payment_id, razorpay_subscription_id: result.razorpay_subscription_id, razorpay_signature: result.razorpay_signature });
        apply(confirmed);
        setNotice(confirmed.plan !== 'start' ? t('Test payment confirmed. Your plan is saved to this account and available on your other signed-in devices.') : t('Razorpay authorization received. Payment is still being confirmed. Your current access is unchanged.'));
      }
    });
    if (mounted.current) void refresh().catch(() => {});
  }
  const chosen = catalog?.plans.find(plan => plan.id === selected);
  const sub = data?.subscription;
  const hasSubscription = sub && (!['cancelled', 'completed', 'expired'].includes(sub.status) || data.plan !== 'start');
  const blocksSelection = data?.family?.member || hasSubscription && !(data?.pending?.recoverable && selected === sub.plan && interval === sub.interval);
  const reviewDisabled = busy || blocksSelection;
  useEffect(() => {
    if (!selected || !blocksSelection) return;
    setSelected(null); setAgreed(false);
    setNotice(t('You already have a subscription or saved payment. Review its status below before choosing another plan.'));
    const next = new URLSearchParams(search); next.delete('plan'); next.delete('billing'); setSearch(next, { replace: true });
  }, [selected, blocksSelection, search, setSearch, t]);
  if (!profile) return <div lang={locale} className="v-page" role="status">{t('Loading your account…')}</div>;
  if (!data || !catalog) return <div lang={locale} className="v-page"><h1 className="v-title">{t('Plans & payments')}</h1>{error ? <><p role="alert" className="v-notice v-error">{error}</p><button className="v-button" onClick={() => action(t('Loading billing…'), async () => { const [c, a] = await Promise.all([client.catalog(), client.account()]); check(); setCatalog(c); apply(a); })}>{t('Retry billing')}</button></> : <p role="status">{t('Loading your saved plan and payment history…')}</p>}</div>;
  return <div lang={locale} className="v-page billing-page" data-font-surface="product">
    <header className="billing-heading"><div><p className="billing-eyebrow">YOUR VISIONARY ACCOUNT</p><h1 className="v-title">{t('Plans & payments')}</h1><p className="v-muted mt-2">A little more room to learn.</p></div><span className="billing-test-badge"><ShieldCheck size={14} aria-hidden="true" />{t('Test mode · No real charges')}</span></header>
    {error && <div role="alert" className="v-notice v-error"><p>{error}</p>{error === t('Your session ended. Sign in again; your saved payments are kept.') && <Link className="underline" to={authLink('/login')}>{t('Sign in again')}</Link>}</div>}
    {notice && <p role="status" className="v-notice">{notice}</p>}
    {busy && <p role="status" aria-live="polite" className="v-muted">{busy}</p>}
    {invitation && <section className="v-card"><h2 className="text-lg font-medium">{t('Join {name}’s billing family', { name: invitation.ownerName })}</h2><p className="v-muted mt-2">{t('This shares plan benefits only. Your conversations, learning activity and reports remain private.')}</p><button className="v-button primary mt-4" disabled={!!busy} onClick={() => action(t('Joining family…'), async () => { apply(await client.accept(invitation.id)); setInvitation(null); setSearch({}, { replace: true }); setNotice(t('Family membership saved. Your private activity is unchanged.')); })}>{t('Accept Family invitation')}</button></section>}
    <section className="v-card">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="v-muted">{t('Current plan')}</p><h2 className="mt-2 text-3xl font-medium">{names[data.plan]}</h2><p className="v-muted mt-2 break-all">{profile.email}</p><p className="v-muted mt-2">{data.family.member ? t('Benefits managed by your Family billing owner.') : data.plan !== 'start' ? `${sub.interval === 'annual' ? t('Annual') : t('Monthly')} · ${money(sub.amount)} ${t(sub.interval === 'annual' ? 'per year' : 'per month')}` : t('Free · No payment required')}</p></div><button className="v-button" disabled={!!busy} onClick={() => action(t('Refreshing payment status…'), async () => { await refresh(true); setNotice(t('Saved billing refreshed.')); })}><RefreshCw size={15} aria-hidden="true" />{t('Refresh')}</button></div>
      {sub && <dl className="mt-6 grid gap-4 sm:grid-cols-3"><div><dt className="v-muted">{t('Payment status')}</dt><dd className="mt-1 text-sm">{data.cancellationPending ? t('Cancellation awaiting confirmation') : sub.cancelAtPeriodEnd ? t('Renewal cancelled') : data.plan !== 'start' ? t('Paid period confirmed') : sub.status === 'created' ? t('Awaiting payment') : sub.status === 'authenticated' ? t('Authorization received · awaiting charge') : sub.status}</dd></div><div><dt className="v-muted">{t('Paid access until')}</dt><dd className="mt-1 text-sm">{date(sub.paidThrough)}</dd></div><div><dt className="v-muted">{t('Next renewal')}</dt><dd className="mt-1 text-sm">{date(sub.renewalAt)}</dd></div></dl>}
      {data.lastSyncedAt && <p className="v-muted mt-4">{t('Updated {time}', { time: new Date(data.lastSyncedAt).toLocaleString(locale === 'en' ? 'en-IN' : locale) })}</p>}
      {hasSubscription && !data.family.member && !sub.cancelAtPeriodEnd && <button className="v-button mt-5" disabled={!!busy} onClick={() => setCancel(true)}>{data.plan === 'start' ? t('Cancel unfinished subscription') : t('Cancel renewal')}</button>}
      {sub?.cancelAtPeriodEnd && <p className="v-muted mt-4">{t('Renewal is off. Paid access continues until {date}. You can choose a new plan after this one ends.', { date: date(sub.paidThrough) })}</p>}
      {data.pending && <div className="v-notice mt-5"><p>{data.pending.state === 'reconciling' || data.pending.state === 'creating' ? t('Your saved payment is being reconciled. No second subscription will be created.') : data.pending.recoverable ? t('Your saved payment is not yet confirmed. Review the saved checkout to continue.') : t('Your saved payment is awaiting payment confirmation. Refresh its status, or contact Support if it needs attention.')}</p>{data.pending.recoverable && <button className="v-button mt-3" disabled={!!busy} onClick={() => { setInterval(data.pending.interval); setSelected(data.pending.plan); setAgreed(false); }}>{t('Review saved checkout')}</button>}<details className="billing-details"><summary>{t('Payment reference')}</summary><p className="break-all">{data.pending.id}</p></details></div>}
    </section>
    <section className="billing-options" aria-label={t('Choose a plan')}><div className="mb-5 flex flex-wrap items-center justify-between gap-4"><h2 className="text-xl font-medium">Made for your next step</h2><div className="flex rounded-full border p-1" role="group" aria-label={t('Billing period')}>{['monthly', 'annual'].map(value => <button type="button" className={`min-h-10 rounded-full px-5 text-sm ${interval === value ? 'bg-[#eef5ff] text-[#0071e3]' : ''}`} aria-pressed={interval === value} disabled={!!busy} onClick={() => setInterval(value)} key={value}>{value === 'annual' ? t('Yearly · Save 17%') : t('Monthly')}</button>)}</div></div>
      <div className="billing-plan-grid">{catalog.plans.map(plan => <section className={`v-card billing-plan ${plan.id === 'personal' ? 'billing-plan-featured' : ''}`} key={plan.id}><span className="billing-plan-kicker">{plan.id === 'start' ? 'THE ESSENTIALS' : plan.id === 'personal' ? 'YOUR OWN PACE' : 'BETTER TOGETHER'}</span><h3 className="text-xl font-medium">{plan.name}</h3><p className="my-4 text-3xl font-medium">{money(plan[interval])}<span className="text-sm font-normal text-[#6e6e73]">{plan[interval] ? ` / ${t(interval === 'annual' ? 'year' : 'month')}` : ''}</span></p>{interval === 'annual' && plan.annual > 0 && <p className="v-muted">{money(plan.annual / 12)}/{t('month')} equivalent</p>}<ul className="my-6 space-y-3 text-sm">{features[plan.id].map(feature => <li className="flex gap-2" key={feature}><Check size={16} className="shrink-0 text-[#137333]" />{t(feature)}</li>)}</ul>{plan.id === 'start' ? <p className="v-muted mt-auto">{data.plan === 'start' ? t('Current plan · Free') : t('Available after your paid period ends')}</p> : <button className="v-button mt-auto" disabled={!!reviewDisabled} onClick={() => { command.current = null; setSelected(plan.id); setAgreed(false); setError(''); }}>{data.plan === plan.id ? t('Current plan') : hasSubscription || data.family.member ? t('Unavailable') : t('Choose {name}', { name: plan.name })}</button>}</section>)}</div>
      {(hasSubscription || data.family.member) && <p className="v-muted mt-4">{data.family.member ? t('Your Family owner manages this plan.') : t('Manage your current subscription above before choosing another.')}</p>}
      <div className="billing-plan-footer"><span>{t('One account. Every signed-in device.')}</span><Link to="/contact">{t('For your institution')} <span aria-hidden="true">↗</span></Link></div>
      <details className="billing-details"><summary>{t('Plan & test details')}</summary><p>{t('Use Razorpay test details only. Subscriptions and receipts are for testing; no real money or tax is collected. Guided AI usage is not connected to a production meter. Plans do not grant classroom, employer or guardian permissions.')}</p></details>
    </section>
    {(data.family.owner || data.family.member) && <section className="v-card"><h2 className="flex items-center gap-2 text-lg font-medium"><Users size={20} />{t('Family billing')}</h2><p className="v-muted mt-2">{t('Six places including the owner. Membership shares benefits, never private conversations or reports.')}</p>{data.family.member ? <button className="v-button mt-4" disabled={!!busy} onClick={() => action(t('Leaving family…'), async () => { apply(await client.leave()); setNotice(t('You left the billing family. Your saved activity is kept.')); })}>{t('Leave billing family')}</button> : <>
      <p className="mt-4 text-sm">{t('{joined} joined · {pending} pending', { joined: 1 + data.family.members.length, pending: data.family.invitations.length })}</p>
      <form className="mt-4 flex flex-wrap gap-3" onSubmit={event => { event.preventDefault(); void action(t('Preparing invitation…'), async () => { const invite = await client.invite(email); check(); setInviteLink(window.location.origin + invite.path); setEmail(''); await refresh(); }); }}><label className="min-w-0 flex-1 text-sm">{t('Member’s account email')}<input required type="email" value={email} maxLength={254} onChange={event => setEmail(event.target.value)} className="v-field mt-2" /></label><button className="v-button self-end" disabled={!!busy || data.plan !== 'family'}>{t('Create invite link')}</button></form>
      {inviteLink && <div className="v-notice mt-4"><p className="text-sm">{t('Share this link with the invited person. They must sign in with the addressed account to accept.')}</p><input aria-label={t('Family invitation link')} readOnly value={inviteLink} onFocus={event => event.target.select()} className="v-field mt-2" /><button className="v-button mt-2" onClick={() => action(t('Copying invitation…'), async () => { await navigator.clipboard.writeText(inviteLink); setNotice(t('Invitation link copied.')); })}>{t('Copy link')}</button></div>}
      {data.family.members.map(member => <div className="v-list-row" key={member.uid}><span className="min-w-0 break-all text-sm">{member.email}</span><button className="v-button" disabled={!!busy} onClick={() => action(t('Removing member…'), async () => apply(await client.remove({ memberUid: member.uid })))}>{t('Remove member')}</button></div>)}
      {data.family.invitations.map(invite => <div className="v-list-row" key={invite.id}><span className="min-w-0 break-all text-sm">{invite.email} · {t('Pending')}</span><button className="v-button" disabled={!!busy} onClick={() => action(t('Revoking invitation…'), async () => apply(await client.remove({ invitationId: invite.id })))}>{t('Revoke invitation')}</button></div>)}
    </>}</section>}
    <section className="v-card billing-invoices"><h2 className="flex items-center gap-2 text-lg font-medium"><FileText size={18} aria-hidden="true" />{t('Invoices')}</h2><p className="v-muted mt-2">{t('Test receipts · Latest 50 · Not tax invoices')}</p>{data.invoices.length ? data.invoices.map(invoice => <div className="v-list-row flex-wrap gap-3" key={invoice.id}><div><p className="text-sm">{names[invoice.plan]} · {invoice.number}</p><p className="v-muted mt-1">{date(invoice.paidAt)} · {invoice.status.replaceAll('_', ' ')}</p></div><div className="flex items-center gap-4"><span>{money(invoice.amount)}</span><button className="v-button" disabled={!!busy} onClick={event => { invoiceTrigger.current = event.currentTarget; void action(t('Loading invoice…'), async () => { const value = await client.invoice(invoice.id); check(); setReceipt(value); }); }}>{t('View invoice')}</button></div></div>) : <p className="v-muted mt-5">{t('Your receipts will appear here after a confirmed payment.')}</p>}</section>
    <Dialog open={!!selected && !!chosen && !blocksSelection} onOpenChange={open => { if (!open) closeReview(); }}><DialogContent lang={locale} data-billing-review="true" className="billing-review max-h-[90dvh] overflow-y-auto"><DialogTitle>{t('Review {plan}', { plan: chosen?.name })}</DialogTitle><DialogDescription className="break-all">{t('For {email}', { email: profile.email })}</DialogDescription><p className="text-3xl font-medium">{money(chosen?.[interval] || 0)}<span className="text-sm font-normal"> / {t(interval === 'annual' ? 'year' : 'month')}</span></p><div className="billing-review-facts"><p>{interval === 'annual' ? t('Billed yearly in one payment.') : t('Billed monthly.')}</p><p>{t('Auto-renews · Cancel renewal anytime')}</p></div><details className="billing-details"><summary>{t('Renewal details')}</summary><p>{t('Starts after payment verification. Renews automatically for up to 10 years unless cancelled. Keep access through your confirmed paid period after cancelling renewal.')}</p></details><p className="billing-test-note">{t('Test checkout · No real charges. Use test card, bank or UPI details only.')}</p><label className="flex items-start gap-3 text-sm leading-6"><input type="checkbox" className="mt-1 h-5 w-5 shrink-0" checked={agreed} disabled={!!busy} onChange={event => setAgreed(event.target.checked)} /><span>{t('I agree to a recurring test subscription of {amount} per {unit}.', { amount: money(chosen?.[interval] || 0), unit: t(interval === 'annual' ? 'year' : 'month') })} <Link to="/terms" target="_blank" rel="noreferrer" className="underline">{t('Review the service terms')}</Link></span></label>{error && <p role="alert" className="text-sm text-[#b3261e]">{error}</p>}<button className="v-button primary" disabled={!agreed || !!reviewDisabled} onClick={pay}><CreditCard size={18} />{busy || t('Continue to secure checkout')}</button><button className="v-button" disabled={!!busy} onClick={closeReview}>{t('Back to plans')}</button></DialogContent></Dialog>
    <Dialog open={cancel} onOpenChange={setCancel}><DialogContent><DialogTitle>{data.plan === 'start' ? t('Cancel unfinished subscription?') : t('Cancel automatic renewal?')}</DialogTitle><DialogDescription>{data.plan === 'start' ? t('We will ask Razorpay to close this unfinished subscription. If payment has already completed, refresh to see the confirmed period.') : t('Your paid access remains until {date}. Saved learning is kept. Razorpay will stop future renewals once it confirms cancellation.', { date: date(sub?.paidThrough) })}</DialogDescription><button className="v-button primary" disabled={!!busy} onClick={() => action(t('Confirming cancellation…'), async () => { apply(await client.cancel({ subscriptionId: sub.id, revision: data.revision })); setCancel(false); command.current = null; setNotice(t('Razorpay confirmed the cancellation request. Review the renewal status above.')); })}>{t('Confirm cancellation')}</button><button className="v-button" disabled={!!busy} onClick={() => setCancel(false)}>{t('Keep subscription')}</button>{error && <p role="alert" className="text-sm text-[#b3261e]">{error}</p>}</DialogContent></Dialog>
    <BillingInvoice key={receipt?.id || 'closed'} receipt={receipt} onClose={() => setReceipt(null)} returnFocus={invoiceTrigger} />
  </div>;
}
