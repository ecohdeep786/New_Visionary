import { createAuthTransport } from '../api/firebase/authTransport.js';

export function createBillingClient({ getAccountId, request = createAuthTransport({ basePath: '/api/billing', timeoutMs: 60000 }) }) {
  async function call(path, body) {
    const uid = getAccountId();
    const check = () => { if (!uid || getAccountId() !== uid) throw Object.assign(new Error('The signed-in account changed. Return to Plans and check the saved payment.'), { status: 409 }); };
    check();
    const value = await request(path, { ...(body === undefined ? {} : { method: 'POST', body }), accountId: uid, beforeSend: check });
    check();
    if (value?.uid && value.uid !== uid) throw new Error('Billing returned a different account. Reload before continuing.');
    return value;
  }
  return { account: () => call('/account'), catalog: () => call('/catalog'), sync: () => call('/sync', {}), checkout: body => call('/checkouts', body), verify: body => call('/verify', body), cancel: body => call('/cancel', body), invoice: id => call(`/invoices/${encodeURIComponent(id)}`),
    invite: email => call('/family/invitations', { email }), invitation: id => call(`/family/invitations/${encodeURIComponent(id)}`), accept: invitationId => call('/family/accept', { invitationId }), remove: body => call('/family/remove', body), leave: () => call('/family/leave', {}) };
}

let scriptPromise;
export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const timer = setTimeout(() => { script.remove(); scriptPromise = null; reject(new Error('Secure checkout took too long to load. Your payment has not been started. Retry when connected.')); }, 15000);
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'; script.async = true;
    script.onload = () => { clearTimeout(timer); if (window.Razorpay) resolve(); else { script.remove(); scriptPromise = null; reject(new Error('Secure checkout is unavailable. Please retry.')); } };
    script.onerror = () => { clearTimeout(timer); script.remove(); scriptPromise = null; reject(new Error('Secure checkout could not load. Check your connection and retry.')); };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function openRazorpay(checkout, { profile, beforeOpen, onReady }) {
  return new Promise((resolve, reject) => {
    let failure = false;
    const popup = new window.Razorpay({ key: checkout.keyId, subscription_id: checkout.subscriptionId, name: 'Visionary', description: `${checkout.offer.name} · ${checkout.offer.interval === 'annual' ? 'Yearly' : 'Monthly'} · Test mode`,
      prefill: { name: profile.full_name || '', email: profile.email || '' }, theme: { color: '#0b57d0' },
      handler: result => resolve(result), modal: { ondismiss: () => resolve({ dismissed: true, failed: failure }) } });
    popup.on('payment.failed', () => { failure = true; });
    try { beforeOpen(); onReady(popup); popup.open(); } catch (error) { reject(error); }
  });
}
