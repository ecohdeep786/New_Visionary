// DATA-02 — migration/runtime identity separation.
//
// Cloud SQL production alignment: schema DDL must run with a dedicated
// migration role/service account (IAM database authentication) that holds DDL
// rights; the product runtime connects with a separate DML-only role. A runtime
// process must never be granted DDL, and migration runs must never use the
// runtime credential. This enforces that boundary before any statement runs.
export type IdentityPurpose = 'migration' | 'runtime';

export interface DatabaseIdentity {
  purpose: IdentityPurpose;
  role: string;
  url: string;
}

export interface IdentityConfig {
  migrationUrl: string;
  runtimeUrl: string;
  migrationRole: string;
  runtimeRole: string;
  env: 'development' | 'production';
}

export function parseIdentity(url: string, role: string, purpose: IdentityPurpose): DatabaseIdentity {
  if (!url || !role) throw new Error('DATABASE_IDENTITY_INCOMPLETE: connection URL and role are required.');
  return { purpose, role, url };
}

/**
 * Enforce that migration and runtime identities are separate in every
 * environment, and hard-fail in production when they collide or when the
 * migration identity is absent (prevents accidental DDL from the runtime path).
 */
export function assertSeparateIdentities(cfg: IdentityConfig): void {
  if (!cfg.migrationUrl) throw new Error('MIGRATION_IDENTITY_MISSING: a separate migration connection is required.');
  if (cfg.migrationUrl === cfg.runtimeUrl) {
    throw new Error('IDENTITY_CONFLICT: migration and runtime must use separate connections.');
  }
  if (cfg.migrationRole === cfg.runtimeRole) {
    throw new Error('IDENTITY_CONFLICT: migration and runtime must use separate database roles.');
  }
  if (cfg.env === 'production' && !/^migration[-_:]/i.test(cfg.migrationRole)) {
    throw new Error('IDENTITY_CONFLICT: migration role must be clearly distinct (e.g. migration-visionary).');
  }
}

/** A migration runner must only ever run under a migration identity. */
export function assertMigrationPurpose(id: DatabaseIdentity): void {
  if (id.purpose !== 'migration') throw new Error('IDENTITY_DENIED: schema migrations require the migration identity, not the runtime identity.');
}
