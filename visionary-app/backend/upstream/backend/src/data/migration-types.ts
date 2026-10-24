// DATA-02 — migration machinery shared types (pure, no Nest/runtime wiring).
export type MigrationStatus = 'applied' | 'rejected' | 'rolled_back';

export interface MigrationReceipt {
  version: number;
  name: string;
  checksum: string;
  appliedAt: string;
  appliedBy: string;
  status: MigrationStatus;
  reason?: string;
}

export interface RegisteredMigration {
  version: number;
  name: string;
  checksum: string;
  /** Prerequisite versions that must already be applied. */
  requires: number[];
  /** Canonical ordered DDL executed under the migration identity. */
  statements: readonly string[];
  /** Explicit reversible statements; absent migration is NOT reversible. */
  down?: readonly string[];
  reversible: boolean;
}

export interface ApplyOptions {
  /** Identity that owns the migration run (migration role, not runtime). */
  appliedBy: string;
  /** Explicit confirmation that an empty synthetic staging DB is being used.
   *  Refused otherwise when the domain store already contains rows. */
  stagingConfirmed?: boolean;
}

export interface ApplyingResult {
  applied: number;
  skipped: number;
  receipts: MigrationReceipt[];
}

export interface VerifyResult {
  consistent: boolean;
  issues: string[];
}
