// Account defaults have no provider dependency and never initiate a charge.
export const BILLING_ACCOUNTS = 'visionary_billing_test_accounts';
export function freeBillingAccount(uid: string, now = Date.now()) {
  return { uid, schemaVersion: 1, mode: 'test', basePlan: 'start', revision: 0,
    createdAt: now, updatedAt: now, invoices: [], subscription: null, attempt: null };
}
