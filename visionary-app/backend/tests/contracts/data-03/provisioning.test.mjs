/**
 * DATA-03 — idempotent personal workspace provisioning with pending/recovery.
 *
 * Positive, failure/deny and recovery cases are exercised against the in-memory
 * synthetic store. Firestore account/profile/billing are emulated and asserted
 * untouched (provisioning never writes to them).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { WorkspaceProvisioner } = req('./dist/src/workspaces/workspace-provisioner.js');
const { InMemoryProvisionStore } = req('./dist/src/workspaces/provision-store.js');

test('DATA-03 provision: creates Person + personal workspace + OWNER membership once', async () => {
  const store = new InMemoryProvisionStore();
  const p = new WorkspaceProvisioner(store);
  const result = await p.provision('uid-1', { commandId: 'cmd-a', payload: { source: 'onboarding' } });
  assert.equal(result.replay, false);
  assert.equal(result.recovered, false);
  assert.ok(result.personalWorkspaceId);
  assert.ok(store.persons.has('uid-1'));
  assert.equal(store.byUid.size, 1);
  assert.equal(store.memberships.size, 1);
  assert.ok(store.memberships.has(`uid-1:${result.personalWorkspaceId}`));
  assert.equal((await store.readState('uid-1')).status, 'provisioned');
  assert.equal(store.firestore.size, 0);
});

test('DATA-03 provision is idempotent: same command key + payload replays, no duplicate workspace', async () => {
  const store = new InMemoryProvisionStore();
  const p = new WorkspaceProvisioner(store);
  const first = await p.provision('uid-1', { commandId: 'cmd-a', payload: { source: 'onboarding' } });
  const replay = await p.provision('uid-1', { commandId: 'cmd-a', payload: { source: 'onboarding' } });
  assert.equal(replay.replay, true);
  assert.equal(replay.personalWorkspaceId, first.personalWorkspaceId);
  assert.equal(store.workspaces.size, 1, 'no duplicate workspace');
  assert.equal(store.memberships.size, 1, 'no duplicate membership');
});

test('DATA-03 deny: same command key with a changed payload is rejected', async () => {
  const store = new InMemoryProvisionStore();
  const p = new WorkspaceProvisioner(store);
  await p.provision('uid-1', { commandId: 'cmd-a', payload: { source: 'onboarding' } });
  await assert.rejects(
    p.provision('uid-1', { commandId: 'cmd-a', payload: { source: 'changed' } }),
    /CONFLICT: same command key with a changed payload/,
  );
  assert.equal(store.workspaces.size, 1);
});

test('DATA-03 deny: a command belonging to another account cannot be replayed', async () => {
  const store = new InMemoryProvisionStore();
  const p = new WorkspaceProvisioner(store);
  await p.provision('uid-1', { commandId: 'cmd-a', payload: {} });
  await assert.rejects(p.provision('uid-2', { commandId: 'cmd-a', payload: {} }), /WRONG_OWNER/);
});

test('DATA-03 deny: client-supplied uid differing from the verified uid is rejected (server authority)', async () => {
  const store = new InMemoryProvisionStore();
  const p = new WorkspaceProvisioner(store);
  await assert.rejects(
    p.provision('verified-uid', { uid: 'forged-uid', commandId: 'cmd-a', payload: {} }),
    /WRONG_OWNER/,
  );
  assert.equal(store.byUid.size, 0);
  // matching hint is accepted
  const ok = await p.provision('verified-uid', { uid: 'verified-uid', commandId: 'cmd-b', payload: {} });
  assert.equal(ok.personalWorkspaceId.slice(0, 3), 'ws_');
});

test('DATA-03 recovery: an interrupted run (person only) resumes without duplicates', async () => {
  const store = new InMemoryProvisionStore();
  const p = new WorkspaceProvisioner(store);
  store.interruptAfter = 'person';
  await assert.rejects(p.provision('uid-1', { commandId: 'cmd-a', payload: {} }));
  // Provisioning was interrupted after Person, before workspace creation.
  assert.ok(store.persons.has('uid-1'));
  assert.equal(store.byUid.size, 0);
  assert.equal((await store.readState('uid-1')).status, 'rejected');

  // Recovery: a fresh provision call resumes and completes exactly once.
  const result = await p.provision('uid-1', { commandId: 'cmd-b', payload: {} });
  assert.equal(result.recovered, true);
  assert.ok(result.personalWorkspaceId);
  assert.equal(store.byUid.size, 1);
  assert.equal(store.workspaces.size, 1);
  assert.equal(store.memberships.size, 1);
});

test('DATA-03 recovery: an interrupted run (workspace without membership) is repaired', async () => {
  const store = new InMemoryProvisionStore();
  const p = new WorkspaceProvisioner(store);
  store.interruptAfter = 'workspace';
  await assert.rejects(p.provision('uid-1', { commandId: 'cmd-a', payload: {} }));
  assert.equal(store.byUid.size, 1, 'workspace exists but run failed before membership');
  assert.equal(store.memberships.size, 0);

  const result = await p.provision('uid-1', { commandId: 'cmd-b', payload: {} });
  assert.equal(result.recovered, true);
  assert.equal(store.workspaces.size, 1, 'no duplicate workspace during recovery');
  assert.equal(store.memberships.size, 1, 'membership repaired');
  assert.equal(store.memberships.has(`uid-1:${result.personalWorkspaceId}`), true);
  assert.equal((await store.readState('uid-1')).status, 'provisioned');
});

test('DATA-03 preserve: existing Firestore account/profile/billing records and IDs are untouched', async () => {
  const store = new InMemoryProvisionStore();
  store.firestore.set(`visionary_accounts/uid-1`, { uid: 'uid-1', profile: { full_name: 'Same name' }, onboarding: { status: 'complete' }, storageVersion: 2 });
  store.firestore.set(`visionary_billing_test_accounts/uid-1`, { uid: 'uid-1', basePlan: 'start', revision: 8 });
  const beforeAccounts = JSON.stringify(store.firestore.get(`visionary_accounts/uid-1`));
  const beforeBilling = JSON.stringify(store.firestore.get(`visionary_billing_test_accounts/uid-1`));

  const p = new WorkspaceProvisioner(store);
  await p.provision('uid-1', { commandId: 'cmd-a', payload: {} });
  // Provisioning never writes account/billing rows.
  assert.equal(JSON.stringify(store.firestore.get(`visionary_accounts/uid-1`)), beforeAccounts);
  assert.equal(JSON.stringify(store.firestore.get(`visionary_billing_test_accounts/uid-1`)), beforeBilling);
  assert.equal(store.firestore.size, 2);
});

test('DATA-03 invalid command: missing/blank command id is rejected and nothing is provisioned', async () => {
  const store = new InMemoryProvisionStore();
  const p = new WorkspaceProvisioner(store);
  await assert.rejects(p.provision('uid-1', { commandId: '', payload: {} }), /INVALID_COMMAND/);
  await assert.rejects(p.provision('uid-1', { commandId: 'bad id!!', payload: {} }), /INVALID_COMMAND/);
  assert.equal(store.byUid.size, 0);
});

test('DATA-03 wrong-owner: a client cannot provision a personal workspace for a foreign uid', async () => {
  const store = new InMemoryProvisionStore();
  const p = new WorkspaceProvisioner(store);
  await p.provision('owner-uid', { commandId: 'cmd-owner', payload: {} });
  // Another verified user tries to reference the owner workspace through a wrong-uid payload.
  await assert.rejects(
    p.provision('other-uid', { commandId: 'cmd-other', payload: { workspaceId: store.byUid.get('owner-uid'), uid: 'owner-uid' } }),
    /WRONG_OWNER/,
  );
  // owner's workspace still intact
  const ownerWs = await store.personalWorkspaceFor('owner-uid');
  assert.equal(ownerWs.id, store.byUid.get('owner-uid'));
  assert.equal(store.workspaces.size, 1);
});
