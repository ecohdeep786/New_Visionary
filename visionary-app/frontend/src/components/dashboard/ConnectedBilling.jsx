import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, CreditCard, FileText, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { appClient } from '@/api/appClient';
import { createBillingClient, loadRazorpay, openRazorpay } from '@/services/billingClient';
import { billingSelection } from '@/lib/billingIntent';
import BillingInvoice from './BillingInvoice';
import { useAuth } from '@/lib/AuthContext';
import { authLink } from '@/lib/authReturnTo';
import '@/styles/billing.css';

const money = amount => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount / 100);
const date = value => value ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(value)) : 'Not scheduled';
const names = { start: 'Start (Free)', personal: 'Personal', family: 'Family' };
const features = { start: ['Personal learning and saved activities', 'Upgrade when you are ready'], personal: ['One account across your devices', 'Personal learning and projects', 'Higher guided access, subject to fair use'], family: ['Personal benefits for up to six accounts', 'One owner and five invited members', 'Private activity for every member'] };

export default function ConnectedBilling({ profile }) {
  const { checkUserAuth } = useAuth();
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
  const check = useCallback(() => { if (!mounted.current || appClient.auth.currentProfile?.()?.id !== uid) throw new Error('Your account changed. Return to Plans before continuing.'); }, [uid]);
  const reportFailure = useCallback(failure => {
    if (!mounted.current || appClient.auth.currentProfile?.()?.id !== uid) return;
    setError(failure.status === 401 ? 'Your session ended. Sign in again; your saved payments are kept.' : failure.message || 'Payment status is unavailable. Refresh before trying again.');
    if (failure.status === 401) void checkUserAuth({ quiet: true });
  }, [uid, checkUserAuth]);
  const apply = useCallback(value => {
    check(); if (value?.uid !== uid || !Array.isArray(value.invoices) || !names[value.plan]) throw new Error('Billing could not be read safely. Please reload.');
    setData(previous => previous && previous.revision > value.revision ? previous : value);
  }, [check, uid]);
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
    await action('Preparing secure checkout…', async () => {
      // Load before creating a provider subscription so blocked scripts don't strand it.
      await loadRazorpay(); check();
      const signature = `${selected}:${interval}`;
      if (command.current?.signature !== signature) command.current = { signature, id: crypto.randomUUID() };
      const checkout = await client.checkout({ plan: selected, interval, commandId: command.current.id, catalogVersion: catalog.version });
      check(); setSelected(null); setAgreed(false); setBusy('Complete payment in secure checkout…');
      // Once reserved, the saved account attempt is the recovery destination.
      // A reload must not reopen URL-driven purchase review after a charge.
      const next = new URLSearchParams(search); next.delete('plan'); next.delete('billing'); setSearch(next, { replace: true });
      // Release Radix focus/pointer containment before the provider mounts its modal.
      await new Promise((resolve, reject) => { const start = performance.now(); const settled = () => { if (!document.querySelector('[data-billing-review]')) resolve(); else if (performance.now() - start > 1500) reject(new Error('Checkout could not open. Refresh the saved payment status and retry.')); else requestAnimationFrame(settled); }; requestAnimationFrame(settled); });
      check();
      const result = await openRazorpay(checkout, { profile, beforeOpen: check, onReady: instance => { popup.current = instance; } });
      popup.current = null; check();
      setSelected(null); setAgreed(false); setBusy('Checking your saved payment…');
      if (result.dismissed) {
        await refresh(true);
        setNotice(result.failed ? 'The payment attempt was not confirmed. Check the saved status below before retrying.' : 'Checkout closed. Your saved attempt is kept; check its status before trying again.');
      } else {
        const confirmed = await client.verify({ attemptId: checkout.attemptId, razorpay_payment_id: result.razorpay_payment_id, razorpay_subscription_id: result.razorpay_subscription_id, razorpay_signature: result.razorpay_signature });
        apply(confirmed);
        setNotice(confirmed.plan !== 'start' ? 'Test payment confirmed. Your plan is saved to this account and available on your other signed-in devices.' : 'Razorpay authorization received. Payment is still being confirmed. Your current access is unchanged.');
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
    setNotice('You already have a subscription or saved payment. Review its status below before choosing another plan.');
    const next = new URLSearchParams(search); next.delete('plan'); next.delete('billing'); setSearch(next, { replace: true });
  }, [selected, blocksSelection, search, setSearch]);
  if (!profile) return <div lang="en" className="v-page" role="status">Loading your account…</div>;
  if (!data || !catalog) return <div lang="en" className="v-page"><h1 className="v-title">Plans & payments</h1>{error ? <><p role="alert" className="v-notice v-error">{error}</p><button className="v-button" onClick={() => action('Loading billing…', async () => { const [c, a] = await Promise.all([client.catalog(), client.account()]); check(); setCatalog(c); apply(a); })}>Retry billing</button></> : <p role="status">Loading your saved plan and payment history…</p>}</div>;
  return <div lang="en" className="v-page" data-font-surface="product">
    <header><h1 className="v-title">Plans & payments</h1><p className="v-muted mt-2">One account, across your devices. Review your plan, renewals and invoices here.</p></header>
    <p className="v-notice flex items-start gap-3"><ShieldCheck size={20} className="shrink-0" /><span><strong>Test mode.</strong> Use Razorpay test payment details only. No real money is collected. These subscriptions and invoices are for testing.</span></p>
    {error && <div role="alert" className="v-notice v-error"><p>{error}</p>{error.includes('Sign in again') && <Link className="underline" to={authLink('/login')}>Sign in again</Link>}</div>}
    {notice && <p role="status" className="v-notice">{notice}</p>}
    {busy && <p role="status" aria-live="polite" className="v-muted">{busy}</p>}
    {invitation && <section className="v-card"><h2 className="text-lg font-medium">Join {invitation.ownerName}’s billing family</h2><p className="v-muted mt-2">This shares plan benefits only. Your conversations, learning activity and reports remain private.</p><button className="v-button primary mt-4" disabled={!!busy} onClick={() => action('Joining family…', async () => { apply(await client.accept(invitation.id)); setInvitation(null); setSearch({}, { replace: true }); setNotice('Family membership saved. Your private activity is unchanged.'); })}>Accept Family invitation</button></section>}
    <section className="v-card">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="v-muted">Your account plan</p><h2 className="mt-2 text-3xl font-medium">{names[data.plan]}</h2><p className="v-muted mt-2 break-all">{profile.email}</p><p className="v-muted mt-2">{data.family.member ? 'Benefits managed by your Family billing owner.' : data.plan !== 'start' ? `${sub.interval === 'annual' ? 'Annual' : 'Monthly'} · ${money(sub.amount)} per ${sub.interval === 'annual' ? 'year' : 'month'}` : 'Free · No payment required'}</p></div><button className="v-button" disabled={!!busy} onClick={() => action('Refreshing payment status…', async () => { await refresh(true); setNotice('Saved billing refreshed.'); })}><RefreshCw size={16} />Refresh status</button></div>
      {sub && <dl className="mt-6 grid gap-4 sm:grid-cols-3"><div><dt className="v-muted">Payment status</dt><dd className="mt-1 text-sm">{data.cancellationPending ? 'Cancellation awaiting confirmation' : sub.cancelAtPeriodEnd ? 'Renewal cancelled' : data.plan !== 'start' ? 'Paid period confirmed' : sub.status === 'created' ? 'Awaiting payment' : sub.status === 'authenticated' ? 'Authorization received · awaiting charge' : sub.status}</dd></div><div><dt className="v-muted">Paid access until</dt><dd className="mt-1 text-sm">{date(sub.paidThrough)}</dd></div><div><dt className="v-muted">Next renewal</dt><dd className="mt-1 text-sm">{date(sub.renewalAt)}</dd></div></dl>}
      {data.lastSyncedAt && <p className="v-muted mt-4">Last checked with Razorpay: {new Date(data.lastSyncedAt).toLocaleString('en-IN')}. Saved billing refreshes while this page is open.</p>}
      {hasSubscription && !data.family.member && !sub.cancelAtPeriodEnd && <button className="v-button mt-5" disabled={!!busy} onClick={() => setCancel(true)}>{data.plan === 'start' ? 'Cancel unfinished subscription' : 'Cancel renewal'}</button>}
      {sub?.cancelAtPeriodEnd && <p className="v-muted mt-4">No further renewal is scheduled. Your paid access stays available until {date(sub.paidThrough)}. Razorpay subscriptions cannot be restarted once cancelled; review a new plan after this one ends.</p>}
      {data.pending && <div className="v-notice mt-5"><p>Your saved payment is {data.pending.state === 'reconciling' || data.pending.state === 'creating' ? 'being reconciled. No second subscription will be created.' : data.pending.recoverable ? 'not yet confirmed. Review the saved checkout to continue.' : 'awaiting payment confirmation. Refresh its status, or contact Support if it needs attention.'}</p>{data.pending.recoverable && <button className="v-button mt-3" disabled={!!busy} onClick={() => { setInterval(data.pending.interval); setSelected(data.pending.plan); setAgreed(false); }}>Review saved checkout</button>}<p className="mt-2 break-all text-xs">Reference: {data.pending.id}</p></div>}
    </section>
    <section aria-label="Choose a plan"><div className="mb-5 flex flex-wrap items-center justify-between gap-4"><h2 className="text-xl font-medium">Choose your plan</h2><div className="flex rounded-full border p-1" role="group" aria-label="Billing period">{['monthly', 'annual'].map(value => <button type="button" className={`min-h-10 rounded-full px-5 text-sm ${interval === value ? 'bg-[#e8f0fe] text-[#0b57d0]' : ''}`} aria-pressed={interval === value} disabled={!!busy} onClick={() => setInterval(value)} key={value}>{value === 'annual' ? 'Annual · 2 months free' : 'Monthly'}</button>)}</div></div>
      <div className="grid gap-4 lg:grid-cols-3">{catalog.plans.map(plan => <section className="v-card flex flex-col" key={plan.id}><h3 className="text-xl font-medium">{plan.name}</h3><p className="my-4 text-3xl font-medium">{money(plan[interval])}<span className="text-sm font-normal text-[#5f6368]">{plan[interval] ? ` / ${interval === 'annual' ? 'year' : 'month'}` : ''}</span></p>{interval === 'annual' && plan.annual > 0 && <p className="v-muted">Equivalent to about {money(plan.annual / 12)}/month, billed yearly.</p>}<ul className="my-6 space-y-3 text-sm">{features[plan.id].map(feature => <li className="flex gap-2" key={feature}><Check size={16} className="shrink-0 text-[#137333]" />{feature}</li>)}</ul>{plan.id === 'start' ? <p className="v-muted mt-auto">{data.plan === 'start' ? 'Current plan · Free' : 'Available after your paid period ends'}</p> : <button className="v-button mt-auto" disabled={!!reviewDisabled} onClick={() => { command.current = null; setSelected(plan.id); setAgreed(false); setError(''); }}>{data.plan === plan.id ? 'Current plan' : hasSubscription || data.family.member ? 'Resolve current subscription first' : `Review ${plan.name}`}</button>}</section>)}</div>
      <p className="v-muted mt-4">Institution billing is arranged separately. <Link to="/contact" className="underline">Contact Visionary</Link>. Guided AI usage is not yet connected to a production meter; payment does not create classroom, employer or guardian permissions.</p>
    </section>
    {(data.family.owner || data.family.member) && <section className="v-card"><h2 className="flex items-center gap-2 text-lg font-medium"><Users size={20} />Family billing</h2><p className="v-muted mt-2">Six places including the owner. Membership shares benefits, never private conversations or reports.</p>{data.family.member ? <button className="v-button mt-4" disabled={!!busy} onClick={() => action('Leaving family…', async () => { apply(await client.leave()); setNotice('You left the billing family. Your saved activity is kept.'); })}>Leave billing family</button> : <>
      <p className="mt-4 text-sm">{1 + data.family.members.length} joined · {data.family.invitations.length} pending</p>
      <form className="mt-4 flex flex-wrap gap-3" onSubmit={event => { event.preventDefault(); void action('Preparing invitation…', async () => { const invite = await client.invite(email); check(); setInviteLink(window.location.origin + invite.path); setEmail(''); await refresh(); }); }}><label className="min-w-0 flex-1 text-sm">Member’s account email<input required type="email" value={email} maxLength={254} onChange={event => setEmail(event.target.value)} className="v-field mt-2" /></label><button className="v-button self-end" disabled={!!busy || data.plan !== 'family'}>Create invite link</button></form>
      {inviteLink && <div className="v-notice mt-4"><p className="text-sm">Share this link with the invited person. They must sign in with the addressed account to accept.</p><input aria-label="Family invitation link" readOnly value={inviteLink} onFocus={event => event.target.select()} className="v-field mt-2" /><button className="v-button mt-2" onClick={() => action('Copying invitation…', async () => { await navigator.clipboard.writeText(inviteLink); setNotice('Invitation link copied.'); })}>Copy link</button></div>}
      {data.family.members.map(member => <div className="v-list-row" key={member.uid}><span className="min-w-0 break-all text-sm">{member.email}</span><button className="v-button" disabled={!!busy} onClick={() => action('Removing member…', async () => apply(await client.remove({ memberUid: member.uid })))}>Remove member</button></div>)}
      {data.family.invitations.map(invite => <div className="v-list-row" key={invite.id}><span className="min-w-0 break-all text-sm">{invite.email} · Pending</span><button className="v-button" disabled={!!busy} onClick={() => action('Revoking invitation…', async () => apply(await client.remove({ invitationId: invite.id })))}>Revoke invitation</button></div>)}
    </>}</section>}
    <section className="v-card"><h2 className="flex items-center gap-2 text-lg font-medium"><FileText size={20} />Invoices & receipts</h2><p className="v-muted mt-2">Visionary test invoices from verified subscription payments. These are not tax invoices. Your latest 50 are shown.</p>{data.invoices.length ? data.invoices.map(invoice => <div className="v-list-row flex-wrap gap-3" key={invoice.id}><div><p className="text-sm">{names[invoice.plan]} · {invoice.number}</p><p className="v-muted mt-1">{date(invoice.paidAt)} · {invoice.status.replaceAll('_', ' ')}</p></div><div className="flex items-center gap-4"><span>{money(invoice.amount)}</span><button className="v-button" disabled={!!busy} onClick={event => { invoiceTrigger.current = event.currentTarget; void action('Loading invoice…', async () => { const value = await client.invoice(invoice.id); check(); setReceipt(value); }); }}>View invoice</button></div></div>) : <p className="v-muted mt-5">No verified payments yet. A receipt will appear here once payment is confirmed.</p>}</section>
    <Dialog open={!!selected && !!chosen && !blocksSelection} onOpenChange={open => { if (!open) closeReview(); }}><DialogContent lang="en" data-billing-review="true" className="max-h-[90dvh] overflow-y-auto"><DialogTitle>Review {chosen?.name}</DialogTitle><DialogDescription>Check the account, amount and renewal before continuing to secure payment.</DialogDescription><p className="break-all text-sm">For {profile.email}</p><p className="text-3xl font-medium">{money(chosen?.[interval] || 0)}<span className="text-sm font-normal"> / {interval === 'annual' ? 'year' : 'month'}</span></p><p className="v-muted">{interval === 'annual' ? 'The full annual amount is billed together, not each month.' : 'Billed monthly.'} Starts after payment is verified. Renews automatically until cancelled, for up to 10 years. Cancel renewal from this page; paid access is kept until the confirmed period ends.</p><p className="v-notice">Test checkout · No real money or tax is collected. Never use real card, bank or UPI credentials in test mode.</p><label className="flex items-start gap-3 text-sm leading-6"><input type="checkbox" className="mt-1 h-5 w-5 shrink-0" checked={agreed} disabled={!!busy} onChange={event => setAgreed(event.target.checked)} /><span>I agree to a recurring test subscription of {money(chosen?.[interval] || 0)} per {interval === 'annual' ? 'year' : 'month'} and the <Link to="/terms" target="_blank" rel="noreferrer" className="underline">service terms</Link>.</span></label>{error && <p role="alert" className="text-sm text-[#b3261e]">{error}</p>}<button className="v-button primary" disabled={!agreed || !!reviewDisabled} onClick={pay}><CreditCard size={18} />{busy || 'Continue to secure checkout'}</button><button className="v-button" disabled={!!busy} onClick={closeReview}>Back to plans</button></DialogContent></Dialog>
    <Dialog open={cancel} onOpenChange={setCancel}><DialogContent><DialogTitle>{data.plan === 'start' ? 'Cancel unfinished subscription?' : 'Cancel automatic renewal?'}</DialogTitle><DialogDescription>{data.plan === 'start' ? 'We will ask Razorpay to close this unfinished subscription. If payment has already completed, refresh to see the confirmed period.' : `Your paid access remains until ${date(sub?.paidThrough)}. Saved learning is kept. Razorpay will stop future renewals once it confirms cancellation.`}</DialogDescription><button className="v-button primary" disabled={!!busy} onClick={() => action('Confirming cancellation…', async () => { apply(await client.cancel({ subscriptionId: sub.id, revision: data.revision })); setCancel(false); command.current = null; setNotice('Razorpay confirmed the cancellation request. Review the renewal status above.'); })}>Confirm cancellation</button><button className="v-button" disabled={!!busy} onClick={() => setCancel(false)}>Keep subscription</button>{error && <p role="alert" className="text-sm text-[#b3261e]">{error}</p>}</DialogContent></Dialog>
    <BillingInvoice key={receipt?.id || 'closed'} receipt={receipt} onClose={() => setReceipt(null)} returnFocus={invoiceTrigger} />
  </div>;
}
