/**
 * DATA-01 — SQL DDL review and index verification.
 *
 * These tests verify the workspace-domain SQL schema without needing a running
 * Postgres instance. They validate:
 *   1. The migration SQL creates all expected tables and indexes.
 *   2. UID linkage is present on every domain table (persons, workspaces,
 *      workspace_memberships, consent_grants, command_results, outbox_events,
 *      audit_events, deletion_tombstones).
 *   3. Unique constraints exist for idempotency (workspace.slug, commandId,
 *      workspace_memberships.uid+workspaceId, consent_grants key, etc.).
 *   4. Indexes exist for common lookup patterns.
 *   5. No auth/identity/billing columns are present in SQL domain tables
 *      (those live in Firestore).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { fileURLToPath } from 'node:url';
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const migrationPath = resolve(
  __dirname,
  '../../../upstream/backend/prisma/migrations/20261024000001_data_01_workspaces/migration.sql'
);
const migration = readFileSync(migrationPath, 'utf-8');

// Parse out table names and check constraints
const tableRegex = /CREATE TABLE IF NOT EXISTS "([^"]+)"/g;
const tables = [...migration.matchAll(tableRegex)].map((m) => m[1]);

test('DATA-01 migration creates all expected domain tables', () => {
  const expected = [
    'persons',
    'workspaces',
    'workspace_memberships',
    'invitations',
    'consent_grants',
    'share_grants',
    'command_results',
    'outbox_events',
    'audit_events',
    'deletion_tombstones',
  ];
  for (const name of expected) {
    assert.ok(tables.includes(name), `Missing table: ${name}`);
  }
});

test('DATA-01 Person table links to Firestore UID as primary key', () => {
  assert.match(migration, /"uid"\s+TEXT\s+NOT NULL/);
  assert.match(migration, /CONSTRAINT "persons_pkey" PRIMARY KEY \("uid"\)/);
  // Persons table should not contain auth fields (Firestore owns identity)
  const personsSection = migration.match(/CREATE TABLE[^;]*"persons"[^;]*;/);
  assert.ok(personsSection, 'persons table section found');
  assert.doesNotMatch(personsSection[0], /passwordHash|password_hash|googleId|isVerified|otp|plan/i,
    'SQL persons table must not store auth/identity fields (Firestore owns these)');
});

test('DATA-01 workspace table has UID foreign key to persons', () => {
  assert.match(migration, /"workspaces_uid_fkey".*"uid".*REFERENCES.*"persons".*"uid"/);
});

test('DATA-01 workspace table has unique slug constraint', () => {
  assert.match(migration, /"workspaces_slug_key" UNIQUE \("slug"\)/);
});

test('DATA-01 workspace_memberships has unique (uid, workspaceId) constraint', () => {
  assert.match(migration, /"workspace_memberships_uid_workspaceId_key" UNIQUE \("uid", "workspaceId"\)/);
});

test('DATA-01 workspace_memberships links to persons via FK', () => {
  assert.match(migration, /"workspace_memberships_uid_fkey".*"uid".*REFERENCES.*"persons".*"uid"/);
});

test('DATA-01 workspace_memberships links to workspaces via FK', () => {
  assert.match(migration, /"workspace_memberships_workspaceId_fkey".*"workspaceId".*REFERENCES.*"workspaces".*"id"/);
});

test('DATA-01 invitations links to workspaces via FK', () => {
  assert.match(migration, /"invitations_workspaceId_fkey".*"workspaceId".*REFERENCES.*"workspaces".*"id"/);
});

test('DATA-01 invitations has unique (workspaceId, email) constraint', () => {
  assert.match(migration, /"invitations_workspaceId_email_key" UNIQUE \("workspaceId", "email"\)/);
});

test('DATA-01 consent_grants links to persons via FK', () => {
  assert.match(migration, /"consent_grants_uid_fkey".*"uid".*REFERENCES.*"persons".*"uid"/);
});

test('DATA-01 consent_grants has unique (uid, purpose, resourceId, consentVersion) constraint', () => {
  assert.match(migration, /"consent_grants_uid_purpose_resourceId_consentVersion_key" UNIQUE \("uid", "purpose", "resourceId", "consentVersion"\)/);
});

test('DATA-01 share_grants links to persons via FK', () => {
  assert.match(migration, /"share_grants_uid_fkey".*"uid".*REFERENCES.*"persons".*"uid"/);
});

test('DATA-01 command_results has unique commandId for idempotency', () => {
  assert.match(migration, /"command_results_commandId_key" UNIQUE \("commandId"\)/);
});

test('DATA-01 command_results links to persons via FK', () => {
  assert.match(migration, /"command_results_uid_fkey".*"uid".*REFERENCES.*"persons".*"uid"/);
});

test('DATA-01 command_results has payloadDigest for duplicate-command detection', () => {
  assert.match(migration, /"payloadDigest".*NOT NULL/);
});

test('DATA-01 outbox_events has uid+cursor index for replay/refetch', () => {
  assert.match(migration, /"outbox_events_uid_cursor_idx"/);
});

test('DATA-01 outbox_events links to persons and workspaces via FK', () => {
  assert.match(migration, /"outbox_events_uid_fkey".*"uid".*REFERENCES.*"persons".*"uid"/);
  assert.match(migration, /"outbox_events_workspaceId_fkey".*"workspaceId".*REFERENCES.*"workspaces".*"id"/);
});

test('DATA-01 audit_events has uid+createdAt and operation indexes', () => {
  assert.match(migration, /"audit_events_uid_createdAt_idx"/);
  assert.match(migration, /"audit_events_operation_createdAt_idx"/);
});

test('DATA-01 deletion_tombstones has unique (uid, resourceType, resourceId) constraint', () => {
  assert.match(migration, /"deletion_tombstones_uid_resourceType_resourceId_key" UNIQUE \("uid", "resourceType", "resourceId"\)/);
});

test('DATA-01 no auth/identity/billing columns in domain command tables', () => {
  // Firestore owns: passwordHash, googleId, isVerified, otp, plan, subscription, etc.
  // SQL domain tables must not duplicate auth/payment fields as their own authority.
  // (invitations.email is legitimate — needed to send invites — but persons must not store it)
  assert.doesNotMatch(migration, /"password_hash|"passwordHash|"google_id|"googleId|"plan"|subscription|payment_method|stripe/i,
    'Domain SQL tables must not store auth/payment fields that Firestore owns');
  // Verify the persons table specifically has no auth fields
  const personsSection = migration.match(/CREATE TABLE[^;]*"persons"[^;]*;/);
  assert.ok(personsSection, 'persons table section found');
  assert.doesNotMatch(personsSection[0], /password|hash|googleId|isVerified|otp|plan|subscription/i,
    'Persons table must not store any auth/identity fields');
});

test('DATA-01 all domain tables reference persons (uid linkage)', () => {
  // Every table that stores domain state must link back to Person.uid
  const domainTables = ['workspaces', 'command_results', 'consent_grants', 'share_grants', 'outbox_events', 'audit_events', 'deletion_tombstones'];
  for (const table of domainTables) {
    assert.match(migration, new RegExp(`"${table}_uid_fkey"|FOREIGN KEY \\("uid"\\) REFERENCES "persons"`),
      `Table ${table} must have uid FK to persons`);
  }
});

test('DATA-01 workspace_memberships has role column with valid enum values', () => {
  assert.match(migration, /"role".*DEFAULT 'MEMBER'/);
});

test('DATA-01 consent_grants tracks consentVersion for policy revocation', () => {
  assert.match(migration, /"consentVersion" .*NOT NULL/);
});

test('DATA-01 outbox_events stores ordered cursor for replay/refetch', () => {
  assert.match(migration, /"cursor" .*NOT NULL/);
});

test('DATA-01 audit_events records actorType for non-self operations', () => {
  assert.match(migration, /"actorType".*NOT NULL/);
});

test('DATA-01 deletion tombstone prevents revive of erased records', () => {
  assert.match(migration, /"deletion_tombstones_uid_resourceType_resourceId_key"/);
  assert.match(migration, /"deletion_tombstones_expiresAt_idx"/);
});
