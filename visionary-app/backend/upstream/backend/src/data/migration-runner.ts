// DATA-02 — migration runner: preflight, ordered apply, verify, rollback.
//
// Production/rollback rules encoded here:
//   - Domain tables must be empty (synthetic staging) before a first apply,
//     unless the operator explicitly confirms continue-from-existing.
//   - Applied history is immutable: a changed checksum or a removed/renamed
//     past migration is drift and blocked.
//   - Prerequisites must be applied before a migration; gaps are refused.
//   - Only the last applied, explicitly reversible migration may be rolled
//     back, and only with the same empty-staging/confirmation guard.
//   - Every outcome is recorded as an append-only ledger receipt.
import type { ApplyingResult, MigrationReceipt, ApplyOptions, RegisteredMigration, VerifyResult } from './migration-types';
import type { MigrationStore } from './migration-store';

const now = () => new Date().toISOString();

export class MigrationRunner {
  constructor(private readonly store: MigrationStore, private readonly migrations: readonly RegisteredMigration[]) {}

  private ordered() {
    return [...this.migrations].sort((a, b) => a.version - b.version);
  }

  private async driftIssues(): Promise<string[]> {
    const issues: string[] = [];
    const applied = await this.store.appliedReceipts();
    for (const receipt of applied) {
      const entry = this.migrations.find((m) => m.version === receipt.version);
      if (!entry) {
        issues.push(`applied version ${receipt.version} (${receipt.name}) is no longer registered`);
        continue;
      }
      if (entry.checksum !== receipt.checksum) {
        issues.push(`checksum drift on version ${receipt.version} (${entry.name}): applied history no longer matches the registry`);
      }
    }
    return issues;
  }

  /** Refuse obvious corruption before any statement runs. */
  async preflight(): Promise<string[]> {
    const issues: string[] = [];
    const ordered = this.ordered();
    if (ordered.length === 0) issues.push('no migrations registered');
    const seen = new Set<number>();
    for (const m of ordered) {
      if (seen.has(m.version)) issues.push(`duplicate version ${m.version}`);
      seen.add(m.version);
      for (const prereq of m.requires) {
        if (!seen.has(prereq) && !(await this.store.appliedReceipts()).some((r) => r.version === prereq)) {
          issues.push(`missing prerequisite version ${prereq} for ${m.name}`);
        }
      }
    }
    issues.push(...(await this.driftIssues()));
    return issues;
  }

  /** Apply every pending migration in ascending order with an outcome ledger. */
  async applyAll(options: ApplyOptions): Promise<ApplyingResult> {
    const issues = await this.preflight();
    if (issues.length > 0) throw new Error(`MIGRATION_PREFLIGHT_FAILED: ${issues.join('; ')}`);

    await this.store.ensureLedger();
    const applied = await this.store.appliedReceipts();
    const appliedVersions = new Set(applied.map((r) => r.version));
    const isEmpty = await this.store.isDomainEmpty();

    // First apply against a domain that already has data is refused unless the
    // operator explicitly confirmed this (empty synthetic staging rule).
    if (appliedVersions.size === 0 && !isEmpty && !options.stagingConfirmed) {
      throw new Error('NON_EMPTY_REQUIRES_CONFIRMATION: empty synthetic staging is required before touching existing records.');
    }

    const result: ApplyingResult = { applied: 0, skipped: 0, receipts: [] };
    for (const m of this.ordered()) {
      if (appliedVersions.has(m.version)) {
        result.skipped += 1;
        result.receipts.push(await this.store.appliedReceipts().then((r) => r.find((x) => x.version === m.version)!));
        continue;
      }
      for (const prereq of m.requires) {
        if (!appliedVersions.has(prereq)) throw new Error(`PREREQUISITE_MISSING: version ${prereq} must precede version ${m.version}.`);
      }
      const startedAt = Date.now();
      for (const statement of m.statements) await this.store.exec(statement);
      const receipt: MigrationReceipt = {
        version: m.version,
        name: m.name,
        checksum: m.checksum,
        appliedAt: now(),
        appliedBy: options.appliedBy,
        status: 'applied',
        reason: `applied in ${Date.now() - startedAt}ms`,
      };
      await this.store.recordReceipt(receipt);
      result.applied += 1;
      result.receipts.push(receipt);
      appliedVersions.add(m.version);
    }
    return result;
  }

  /** Re-check applied history against the registry after the run. */
  async verify(): Promise<VerifyResult> {
    const issues = await this.preflight();
    const applied = await this.store.appliedReceipts();
    const appliedVersions = new Set(applied.map((r) => r.version));
    for (const m of this.ordered()) {
      if (!appliedVersions.has(m.version)) issues.push(`version ${m.version} (${m.name}) not applied`);
    }
    return { consistent: issues.length === 0, issues };
  }

  /**
   * Roll back exactly one applied, reversible migration (the newest). Refuses
   * rolling back a non-reversible migration or skipping intermediate versions;
   * the same staging confirmation guard applies to destructive steps.
   */
  async rollbackLast(options: ApplyOptions): Promise<MigrationReceipt> {
    const applied = (await this.store.appliedReceipts()).filter((r) => r.status === 'applied');
    if (applied.length === 0) throw new Error('NOTHING_TO_ROLLBACK: no applied migrations.');
    const newest = applied[applied.length - 1];
    const entry = this.migrations.find((m) => m.version === newest.version);
    if (!entry) throw new Error('ROLLBACK_DENIED: the newest applied migration is no longer registered.');
    if (!entry.reversible || !entry.down) throw new Error('ROLLBACK_DENIED: migration is not reversible (would delete retained domain data).');
    if (!(await this.store.isDomainEmpty()) && !options.stagingConfirmed) {
      throw new Error('NON_EMPTY_REQUIRES_CONFIRMATION: empty synthetic staging is required before rolling back over existing records.');
    }
    for (const statement of entry.down) await this.store.exec(statement);
    const receipt: MigrationReceipt = {
      ...newest,
      appliedAt: now(),
      appliedBy: options.appliedBy,
      status: 'rolled_back',
      reason: 'explicit staged rollback',
    };
    await this.store.recordReceipt(receipt);
    return receipt;
  }
}
