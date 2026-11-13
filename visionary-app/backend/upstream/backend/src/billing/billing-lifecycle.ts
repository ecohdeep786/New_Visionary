// BILL-05 released lifecycle. This module declares - in one versioned place -
// which subscription lifecycle behaviors are released for billing, how the
// renewal/failure/grace/recovery transitions derive from provider truth, and
// which capabilities must NOT be advertised because they are not released.
//
// Release rule ("Unreleased changes must not be advertised as working"):
//   - Released: renewal advance, charge-failure dunning, grace window with
//     recovery, cancel at/not-at period end, refund recognition, and dispute
//     routing through the payment-adjustment path.
//   - NOT released (must never surface as a capability or endpoint):
//     plan-change, payment-method update, and in-app dispute escalation.
// releasedCapabilities() returns the advertised set so a refusal test can
// assert the unreleased ones are absent.

export const BILLING_LIFECYCLE_VERSION = 1;

// A charge failure dunning status (Razorpay `halted`/`paused` after a
// declined renewal) opens a grace window during which the account keeps its
// stored data and can still recover; after the window it reads as suspended
// (never a silent deletion, never an over-grant).
export const GRACE_MS = 3 * 86400000; // released grace window: 3 days
export const DUNNING_STATUSES = new Set(['halted', 'paused']);
// Renewal is "upcoming" when a confirmed renewal charge is due within this
// window; outside it the subscription is simply active with a renewal time.
export const RENEWAL_WINDOW_MS = 24 * 3600000;

const terminal = new Set(['cancelled', 'completed', 'expired']);
export const confirmed = new Set(['active', 'authenticated']);

// Provider times (subscription.charge_at) are UNIX seconds; the grace fields
// the service persists are epoch milliseconds. Keep the two explicit.
const isoSeconds = (value: number) => (value && value > 0 ? new Date(value * 1000).toISOString() : null);
const isoMillis = (value: number) => (value && value > 0 ? new Date(value).toISOString() : null);

// Released capabilities the product advertises today. Whatever is not in this
// set must not exist as a surface (endpoint, action, or advertised feature).
export function releasedCapabilities() {
  return {
    version: BILLING_LIFECYCLE_VERSION,
    renewal: true, failure: true, grace: true, recovery: true, cancel: true, refund: true, dispute: true,
  };
}

export type Lifecycle = {
  version: number;
  state: 'free' | 'active' | 'renewing' | 'grace' | 'suspended' | 'pending_activation' | 'ended';
  plan: string;
  // Active / renewing only: the next confirmed renewal charge, if scheduled.
  renewalAt: string | null;
  // Grace / suspended only: the window the owner still has to recover.
  graceUntil: string | null;
  pastDueSince: string | null;
  // Ended / free only: why the entitlement no longer stands.
  reason: string | null;
};

// The released derivation from the stored billing account. The grace →
// suspended edge is time-derived (no transition write needed), so a restart
// or a missed reconciliation cannot strand an account in the wrong state.
export function lifecycleOf(data: any): Lifecycle {
  const now = Date.now();
  const sub = data.subscription;
  const plan = sub?.plan || 'start';
  if (!sub) return { version: BILLING_LIFECYCLE_VERSION, state: 'free', plan, renewalAt: null, graceUntil: null, pastDueSince: null, reason: 'no_subscription' };
  if (terminal.has(sub.status)) return { version: BILLING_LIFECYCLE_VERSION, state: 'ended', plan, renewalAt: null, graceUntil: null, pastDueSince: null, reason: sub.status };

  const pastDueSince = data.pastDueSince || 0;
  const graceUntil = data.graceUntil || 0;

  // A provider-confirmed charge failure that has already exhausted the grace
  // window reads as suspended: data retained, no paid entitlement advertised.
  const dunning = DUNNING_STATUSES.has(sub.status) || !!pastDueSince;
  if (dunning && graceUntil && graceUntil <= now) {
    return { version: BILLING_LIFECYCLE_VERSION, state: 'suspended', plan, renewalAt: null, graceUntil: isoMillis(graceUntil), pastDueSince: isoMillis(pastDueSince), reason: 'grace_expired' };
  }
  // A current dunning status or a persisted in-window past-due opens grace:
  // the account keeps its data and can still recover.
  if (dunning) {
    return { version: BILLING_LIFECYCLE_VERSION, state: 'grace', plan, renewalAt: null, graceUntil: isoMillis(graceUntil || now + GRACE_MS), pastDueSince: isoMillis(pastDueSince || now), reason: dunning ? 'charge_failed' : null };
  }
  // Confirmed and not dunning: active, or renewing when the next charge is
  // due within the renewal window. A cancel-at-period-end subscription will
  // NOT be charged again, so it never claims a renewal — the paid period
  // stays active and the surface agrees with the account view's
  // subscription.renewalAt=null for the same condition.
  if (confirmed.has(sub.status)) {
    const chargeMs = sub.chargeAt ? sub.chargeAt * 1000 : 0;
    // willCharge: a next charge WILL happen (so the next charge time is
    // advertised as renewalAt regardless of how far out it is). due: that
    // charge falls inside the renewal window (state reads 'renewing'). A
    // cancel-at-period-end subscription never charges again, so it never
    // claims a renewal — the paid period stays active with renewalAt null,
    // agreeing with the account view for the same condition.
    const willCharge = !!chargeMs && !sub.cancelAtPeriodEnd;
    const due = willCharge && chargeMs <= now + RENEWAL_WINDOW_MS;
    return { version: BILLING_LIFECYCLE_VERSION, state: due ? 'renewing' : 'active', plan, renewalAt: willCharge ? isoSeconds(sub.chargeAt) : null, graceUntil: null, pastDueSince: null, reason: null };
  }
  // An unconfirmed, non-dunning provider state ('created'/'pending'/…) reads
  // as pending activation: never advertised as active, never ended, with no
  // renewal claim.
  return { version: BILLING_LIFECYCLE_VERSION, state: 'pending_activation', plan, renewalAt: null, graceUntil: null, pastDueSince: null, reason: sub.status };
}
