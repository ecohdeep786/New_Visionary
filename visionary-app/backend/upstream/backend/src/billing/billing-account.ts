// Account defaults have no provider dependency and never initiate a charge.
export { LEGACY_BILLING_ACCOUNTS as BILLING_ACCOUNTS } from '../auth/firebase-product/account-storage';
export function freeBillingAccount(uid: string, now = Date.now()) {
  return { uid, schemaVersion: 1, mode: 'test', basePlan: 'start', revision: 0,
    createdAt: now, updatedAt: now, invoices: [], subscription: null, attempt: null };
}
