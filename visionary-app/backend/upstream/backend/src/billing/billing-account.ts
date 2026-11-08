import type { BillingMode } from './billing-mode';

// Account defaults have no provider dependency and never initiate a charge.
export { LEGACY_BILLING_ACCOUNTS as BILLING_ACCOUNTS } from '../auth/firebase-product/account-storage';
// `mode` is recorded on the document itself so a stored account always states
// which environment produced it; the default keeps the historical test value
// for every pre-existing caller. `now` stays the second parameter to preserve
// the existing positional call sites (e.g. account migration passes createdAt).
export function freeBillingAccount(uid: string, now = Date.now(), mode: BillingMode = 'test') {
  return { uid, schemaVersion: 1, mode, basePlan: 'start', revision: 0,
    createdAt: now, updatedAt: now, invoices: [], subscription: null, attempt: null };
}
