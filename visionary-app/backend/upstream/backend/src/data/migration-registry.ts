// DATA-02 — versioned migration registry and integrity checks.
//
// The registry is the single ordered, checksummed catalogue of product schema
// migrations. Version 1 mirrors the DATA-01 reviewed workspace-domain DDL so
// the machinery is validated against the real target shape; the canonical SQL
// file remains in prisma/migrations (single source of truth at integration).
// Any change to a released migration changes its checksum and is refused as
// drift — the registry never silently re-applies or rewrites applied history.
import { createHash } from 'node:crypto';
import type { RegisteredMigration } from './migration-types';

export function migrationChecksum(statements: readonly string[]): string {
  return createHash('sha256').update(statements.join('\n--- migration step ---\n')).digest('hex');
}

const DATA_01_PERSONS =
  'CREATE TABLE IF NOT EXISTS persons (uid TEXT NOT NULL, createdAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT persons_pkey PRIMARY KEY (uid));';
const DATA_01_WORKSPACES =
  'CREATE TABLE IF NOT EXISTS workspaces (id TEXT NOT NULL, uid TEXT NOT NULL, name TEXT NOT NULL, slug TEXT NOT NULL, description TEXT, isPersonal BOOLEAN NOT NULL DEFAULT FALSE, createdAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT workspaces_pkey PRIMARY KEY (id), CONSTRAINT workspaces_slug_key UNIQUE (slug));';
const DATA_01_MEMBERSHIPS =
  'CREATE TABLE IF NOT EXISTS workspace_memberships (id TEXT NOT NULL, uid TEXT NOT NULL, workspaceId TEXT NOT NULL, role TEXT NOT NULL DEFAULT \'MEMBER\', source TEXT NOT NULL, sourceVersion TEXT NOT NULL DEFAULT \'v1\', joinedAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT workspace_memberships_pkey PRIMARY KEY (id), CONSTRAINT workspace_memberships_uid_workspaceId_key UNIQUE (uid, workspaceId));';
const DATA_01_COMMAND_RESULTS =
  'CREATE TABLE IF NOT EXISTS command_results (id TEXT NOT NULL, uid TEXT NOT NULL, commandId TEXT NOT NULL, kind TEXT NOT NULL, payloadDigest TEXT NOT NULL, status TEXT NOT NULL DEFAULT \'PENDING\', CONSTRAINT command_results_pkey PRIMARY KEY (id), CONSTRAINT command_results_commandId_key UNIQUE (commandId));';
const DATA_01_OUTBOX =
  'CREATE TABLE IF NOT EXISTS outbox_events (id TEXT NOT NULL, uid TEXT NOT NULL, topic TEXT NOT NULL, payload JSONB NOT NULL, cursor TEXT NOT NULL, status TEXT NOT NULL DEFAULT \'PENDING\', createdAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT outbox_events_pkey PRIMARY KEY (id));';

const V1_STATEMENTS = [
  DATA_01_PERSONS,
  DATA_01_WORKSPACES,
  DATA_01_MEMBERSHIPS,
  DATA_01_COMMAND_RESULTS,
  DATA_01_OUTBOX,
];

const V2_STATEMENTS = [
  'ALTER TABLE command_results ADD COLUMN IF NOT EXISTS revision INTEGER NOT NULL DEFAULT 1;',
  'ALTER TABLE outbox_events ADD COLUMN IF NOT EXISTS dispatchedAt TIMESTAMP(3);',
];

// V2 is reversible (drops the two additive columns); V1 is not reversible
// because removing the domain tables would be an unreviewed destructive step.
export const MIGRATIONS: readonly RegisteredMigration[] = [
  {
    version: 1,
    name: 'data-01-workspace-domain',
    checksum: migrationChecksum(V1_STATEMENTS),
    requires: [],
    statements: V1_STATEMENTS,
    reversible: false,
  },
  {
    version: 2,
    name: 'data-02-command-integrity',
    checksum: migrationChecksum(V2_STATEMENTS),
    requires: [1],
    statements: V2_STATEMENTS,
    down: ['ALTER TABLE command_results DROP COLUMN IF EXISTS revision;', 'ALTER TABLE outbox_events DROP COLUMN IF EXISTS dispatchedAt;'],
    reversible: true,
  },
];

export function orderedMigrations(): RegisteredMigration[] {
  return [...MIGRATIONS].sort((a, b) => a.version - b.version);
}

export function byVersion(migrations: readonly RegisteredMigration[], version: number): RegisteredMigration | undefined {
  return migrations.find((m) => m.version === version);
}

export function missingPrerequisites(migrations: readonly RegisteredMigration[], version: number): number[] {
  const target = byVersion(migrations, version);
  if (!target) return [version];
  const known = new Set(migrations.map((m) => m.version));
  return target.requires.filter((r) => !known.has(r));
}

export function hasDuplicateVersions(migrations: readonly RegisteredMigration[]): boolean {
  const seen = new Set<number>();
  for (const m of migrations) {
    if (seen.has(m.version)) return true;
    seen.add(m.version);
  }
  return false;
}
