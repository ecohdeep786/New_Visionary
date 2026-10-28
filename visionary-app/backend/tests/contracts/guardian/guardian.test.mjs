/**
 * ROLE-04 (KAN-96) — verified guardian relationships, granular purpose/expiry
 * and explicit fixed summaries/goals/classwork digests. Revocation/reconsent
 * never revives old shares.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));
const { GuardianService } = req('./dist/src/guardian/guardian-service.js');
const { InMemoryGuardianStore } = req('./dist/src/guardian/guardian-lookups.js');

const LEARNER = { uid: 'uid_learner_1', workspaceId: 'ws_personal' };
const GUARDIAN = 'uid_guardian_1';
const OTHER_GUARDIAN = 'uid_guardian_2';

async function makeService(now) {
  const store = new InMemoryGuardianStore();
  const service = new GuardianService(store, now);
  await service.verifyGuardianLink(LEARNER, GUARDIAN, 'verifier_guardian_admin');
  return { store, service };
}

// ---------------------------------------------------------------------------

test('VERIFIED guardian relationship: self-claimed guardianship never grants; server verification records the verifier', async () => {
  const { service } = await makeService();
  await assert.rejects(
    () => service.grantAccess(LEARNER, OTHER_GUARDIAN, 'progress_summary', 60_000),
    (e) => e.code === 'guardian_unverified',
  );
  const link = await service.verifyGuardianLink(LEARNER, OTHER_GUARDIAN, 'verifier_guardian_admin');
  assert.equal(link.verified, true);
  await assert.rejects(
    () => service.verifyGuardianLink(LEARNER, 'uid_guardian_3', '  '),
    (e) => e.code === 'guardian_unverified',
  );
});

test('GRANULAR purpose: access granted for progress_summary refuses a goals digest', async () => {
  const { service } = await makeService();
  const grant = await service.grantAccess(LEARNER, GUARDIAN, 'progress_summary', 60_000);
  const digest = await service.generateDigest(LEARNER, 'goals', { weekly_focus: 'orbits' });
  await assert.rejects(
    () => service.shareDigest(LEARNER, digest.digestId, grant.grantId),
    (e) => e.code === 'purpose_not_granted',
  );
  // The matching purpose shares fine.
  const summary = await service.generateDigest(LEARNER, 'progress_summary', { streak_days: '12' });
  const share = await service.shareDigest(LEARNER, summary.digestId, grant.grantId);
  assert.equal(share.status, 'shared');
});

test('EXPIRY: an expired grant refuses (injected clock)', async () => {
  let clock = Date.now();
  const { service } = await makeService(() => new Date(clock));
  const grant = await service.grantAccess(LEARNER, GUARDIAN, 'goals', 1000);
  const digest = await service.generateDigest(LEARNER, 'goals', { weekly_focus: 'vectors' });
  clock += 2000;
  await assert.rejects(
    () => service.shareDigest(LEARNER, digest.digestId, grant.grantId),
    (e) => e.code === 'grant_expired',
  );
  // The guardian's read path refuses expired grants too.
  clock = Date.now();
  const fresh = await service.grantAccess(LEARNER, GUARDIAN, 'goals', 1000);
  const shared = await service.shareDigest(LEARNER, digest.digestId, fresh.grantId);
  await assert.rejects(
    () => service.readDigest(GUARDIAN, shared.shareId, clock + 5000),
    (e) => e.code === 'grant_expired',
  );
});

test('FIXED digests: immutable byte-stable snapshots; private chat/draft content refuses at generation', async () => {
  const { store, service } = await makeService();
  await assert.rejects(
    () => service.generateDigest(LEARNER, 'progress_summary', { learner_chat_log: 'raw conversation' }),
    (e) => e.code === 'private_content_forbidden',
  );
  await assert.rejects(
    () => service.generateDigest(LEARNER, 'classwork_digest', { draft_text: 'draft essay' }),
    (e) => e.code === 'private_content_forbidden',
  );
  const digest = await service.generateDigest(LEARNER, 'progress_summary', { streak_days: '12' });
  const stored = await store.digest(digest.digestId);
  assert.equal(stored.contentHash, digest.contentHash);
  // Byte-stable: the hash is deterministic for the same content.
  const twin = await service.generateDigest(LEARNER, 'progress_summary', { streak_days: '12' });
  assert.equal(twin.contentHash, digest.contentHash);
});

test('REVOCATION/RECONSENT never revives old shares: the revoked share stays revoked; re-consent creates NEW records', async () => {
  const { store, service } = await makeService();
  const grant1 = await service.grantAccess(LEARNER, GUARDIAN, 'progress_summary', 60_000);
  const digest = await service.generateDigest(LEARNER, 'progress_summary', { streak_days: '12' });
  const share = await service.shareDigest(LEARNER, digest.digestId, grant1.grantId);
  await service.readDigest(GUARDIAN, share.shareId);
  // Revoking the grant ends access permanently.
  await service.revokeGrant(LEARNER, grant1.grantId);
  await assert.rejects(
    () => service.readDigest(GUARDIAN, share.shareId),
    (e) => e.code === 'grant_revoked',
  );
  // Re-consent: a NEW grant shares the digest via a NEW share — the OLD share
  // record stays revoked in history (never revived).
  const grant2 = await service.grantAccess(LEARNER, GUARDIAN, 'progress_summary', 60_000);
  const share2 = await service.shareDigest(LEARNER, digest.digestId, grant2.grantId);
  assert.notEqual(share2.shareId, share.shareId);
  assert.notEqual(share2.grantId, grant1.grantId);
  await service.readDigest(GUARDIAN, share2.shareId);
  // The old share record is still revoked.
  assert.equal((await store.share(share.shareId)).status, 'revoked');
  assert.equal((await store.grant(grant1.grantId)).status, 'revoked');
});

test('owner authority: only the learner grants/revokes/shares; strangers deny uniformly', async () => {
  const { service } = await makeService();
  const grant = await service.grantAccess(LEARNER, GUARDIAN, 'goals', 60_000);
  const stranger = { uid: 'uid_stranger', workspaceId: 'ws_personal' };
  await assert.rejects(() => service.revokeGrant(stranger, grant.grantId), (e) => e.code === 'not_owner');
  await assert.rejects(
    () => service.readDigest(OTHER_GUARDIAN, 'shr_unknown'),
    (e) => e.code === 'not_owner',
  );
});
