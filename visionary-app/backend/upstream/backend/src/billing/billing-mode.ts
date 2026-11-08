import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CATALOG_VERSION } from './catalog';

// Billing environment separation (BILL-07 / KAN-108).
//
// The recorded law (docs/architecture/BACKEND_LAUNCH_CHECKLIST.md § P09) is:
// "production-money capability is explicitly separated from current test mode"
// and "Implement explicit separately configured live mode/records/secrets/plan
// provisioning and acceptance. Retain UID but never convert test transactions
// into live history; startup/scaling cannot provision plans or charges."
//
// This module is the single source of truth for that separation. Before it, the
// mode was a compile-time literal: every collection name, the per-account doc id
// `billing/test`, `mode: 'test'`, the `VTEST-` invoice prefix and the
// `-test-v1` catalog version were hardcoded across six files, so live mode could
// not be configured and test history could not be told apart from live history.
//
// Design rules enforced here:
//  1. **Fail closed.** An absent or unrecognized `BILLING_MODE` resolves to
//     `test`, which is byte-identically the previous behavior. Live is opt-in.
//  2. **Separate records.** Each mode owns its own top-level collections and its
//     own per-account document. The two namespaces never alias, so a test
//     transaction can never appear in live history (and vice versa) even though
//     both are keyed on the same retained UID.
//  3. **Double opt-in for real money.** `BILLING_MODE=live` alone is not enough
//     to charge: `BILLING_LIVE_ENABLED=true` must also be set. Live that is not
//     explicitly enabled is refused with a typed 503 and performs no provider
//     call, so a lone configuration change cannot start collecting real money.
export type BillingMode = 'test' | 'live';

/** Test is the default for every absent, empty or unrecognized value. */
export function resolveMode(config: ConfigService): BillingMode {
  return config.get<string>('BILLING_MODE') === 'live' ? 'live' : 'test';
}

/** Live charges require the explicit second opt-in, not just the mode. */
export function isLiveOperable(config: ConfigService): boolean {
  return resolveMode(config) === 'live' && config.get<string>('BILLING_LIVE_ENABLED') === 'true';
}

export interface BillingPaths {
  mode: BillingMode;
  /** Per-account billing document id under `visionary_accounts/{uid}/billing`. */
  accountDocumentId: 'test' | 'live';
  /** Retained pre-migration account collection (test lineage only). */
  legacyAccounts: string;
  /** Global due-time/revision index scanned by reconciliation. */
  queue: string;
  subscriptions: string;
  events: string;
  memberships: string;
  invitations: string;
  payments: string;
  /** Invoice number prefix; never shared across modes. */
  invoicePrefix: 'VTEST' | 'V';
  /** Catalog version tag, so a client cannot carry a stale cross-mode catalog. */
  catalogVersion: string;
}

// The test namespace is exactly the historical set of literals: the mode split
// must not rename a single existing collection, or an unattended deploy would
// orphan live test subscriptions already stored under these names. The test
// catalogue version is imported from `catalog.ts` so there is one definition.
const PATHS: Record<BillingMode, BillingPaths> = {
  test: {
    mode: 'test', accountDocumentId: 'test', legacyAccounts: 'visionary_billing_test_accounts',
    queue: 'visionary_billing_test_queue', subscriptions: 'visionary_billing_test_subscriptions',
    events: 'visionary_billing_test_events', memberships: 'visionary_billing_test_memberships',
    invitations: 'visionary_billing_test_invitations', payments: 'visionary_billing_test_payments',
    invoicePrefix: 'VTEST', catalogVersion: CATALOG_VERSION,
  },
  live: {
    mode: 'live', accountDocumentId: 'live', legacyAccounts: 'visionary_billing_live_accounts',
    queue: 'visionary_billing_live_queue', subscriptions: 'visionary_billing_live_subscriptions',
    events: 'visionary_billing_live_events', memberships: 'visionary_billing_live_memberships',
    invitations: 'visionary_billing_live_invitations', payments: 'visionary_billing_live_payments',
    invoicePrefix: 'V', catalogVersion: '2026-10-15-live-v1',
  },
};

export function modePaths(mode: BillingMode): BillingPaths {
  return PATHS[mode];
}

/** Refuse live work that was not explicitly and completely enabled. */
export function assertChargeable(config: ConfigService): BillingMode {
  const mode = resolveMode(config);
  if (mode === 'live' && !isLiveOperable(config)) {
    throw new ServiceUnavailableException('Live billing is not enabled. No charge was attempted.');
  }
  return mode;
}
