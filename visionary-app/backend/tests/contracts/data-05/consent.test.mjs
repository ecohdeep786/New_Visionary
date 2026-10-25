// DATA-05 — consent/share purpose, expiry/revocation and policy versions.
// Revocation must affect pending jobs, caches and newly requested downloads.
// A browser flag or elapsed cache never establishes or revives consent.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));
const { ConsentService } = req('./dist/src/consent/consent.service.js');
const { InMemoryConsentStore } = req('./dist/src/consent/consent-store.js');

const FIXED_NOW = () => new Date('2026-10-25T10:00:00Z');
function setup() {
  const s = new InMemoryConsentStore();
  const svc = new ConsentService(s, { now: FIXED_NOW });
  return { s, svc };
}

test('grant requires matching server-uid and an explicit policy version', async () => {
  const { svc } = setup();
  await assert.rejects(svc.grant('alice', { id: 'c1', uid: 'bob', purpose: 'downloads', consentVersion: '2026.1' }));
  await assert.rejects(svc.grant('alice', { id: 'c1', uid: 'alice', purpose: 'downloads', consentVersion: '' }));
  const view = await svc.grant('alice', { id: 'c1', uid: 'alice', purpose: 'downloads', consentVersion: '2026.1' });
  assert.equal(view.state, 'active');
  assert.equal(view.consentVersion, '2026.1');
});

test('unknown purpose is rejected; grant is idempotent for active subject', async () => {
  const { svc } = setup();
  await assert.rejects(svc.grant('alice', { id: 'c2', uid: 'alice', purpose: 'anything', consentVersion: '2026.1' }));
  await svc.grant('alice', { id: 'c3', uid: 'alice', purpose: 'downloads', consentVersion: '2026.1' });
  const again = await svc.grant('alice', { id: 'c4', uid: 'alice', purpose: 'downloads', consentVersion: '2026.1' });
  assert.equal(again.state, 'active');
  // check() reflects active consent
  assert.equal(await svc.check('alice', 'downloads'), true);
});

test('expiry is durable; time alone never revives consent', async () => {
  const { s } = setup();
  const svc = new ConsentService(s, { now: () => new Date('2026-10-25T10:00:00Z') });
  await svc.grant('alice', { id: 'e1', uid: 'alice', purpose: 'downloads', consentVersion: 'v1', expiresInSeconds: 60 });
  assert.equal(await svc.check('alice', 'downloads'), true);
  const late = new ConsentService(s, { now: () => new Date('2026-10-25T10:02:00Z') }); // after 60s
  assert.equal(await late.check('alice', 'downloads'), false);
  // Expired grant is not blocked accidentally by revocation but listed as expired.
  const views = await late.list('alice');
  assert.ok(views.some((v) => v.purpose === 'downloads' && v.state === 'expired'));
});

test('revocation blocks pending jobs, flushes caches and blocks newly requested downloads', async () => {
  const { s, svc } = setup();
  await svc.grant('alice', { id: 'r1', uid: 'alice', purpose: 'downloads', consentVersion: '2026.1' });
  const grant = (await svc.list('alice')).find((v) => v.purpose === 'downloads');
  s.seedJob('j1', 'alice', 'downloads', null);
  s.seedCache('k1', 'alice', 'downloads', null);
  s.seedDownload('d1', 'alice', 'downloads', null);
  const out = await svc.revoke('alice', grant.id);
  assert.equal(out.state, 'revoked');
  assert.equal(out.blockedPendingJobs, 1);
  assert.equal(out.flushedCaches, 1);
  assert.equal(out.blockedDownloads, 1);
  // post-revocation access to resources is denied: no downloads served
  assert.equal(await svc.check('alice', 'downloads'), false);
});

test('revocation by the data subject only; wrong uid or absent grant rejects', async () => {
  const { svc } = setup();
  await svc.grant('alice', { id: 'x1', uid: 'alice', purpose: 'document_sharing', consentVersion: '2026.1' });
  const grants = await svc.list('alice');
  const rid = grants[0].id;
  await assert.rejects(svc.revoke('bob', rid)); // not the subject
  await assert.rejects(svc.revoke('alice', 'nope'));
  await svc.revoke('alice', rid);
  await assert.rejects(svc.revoke('alice', rid)); // already revoked
});

test('share targets a verified recipient UID, not an email or guessed id', async () => {
  const { svc } = setup();
  await assert.rejects(svc.share('alice', { id: 's1', uid: 'alice', resourceType: 'document', resourceId: 'doc-1',
    grantedToUid: 'bob@x.org', purpose: 'document_sharing', scope: 'share to bob', consentVersion: '2026.1' }));
  const share = await svc.share('alice', { id: 's2', uid: 'alice', resourceType: 'document', resourceId: 'doc-1',
    grantedToUid: 'bob', purpose: 'document_sharing', scope: 'chapter notes', consentVersion: '2026.1' });
  assert.equal(share.state, 'active');
  const received = await svc.sharesFor('bob');
  assert.equal(received.length, 1);
  assert.equal(received[0].resourceId, 'doc-1');
});

test('share requires owner uid and cannot be to self; expiry bounded', async () => {
  const { svc } = setup();
  await assert.rejects(svc.share('alice', { id: 's3', uid: 'carol', resourceType: 'document', resourceId: 'doc-2',
    grantedToUid: 'bob', purpose: 'document_sharing', scope: 'x', consentVersion: '2026.1' }));
  await assert.rejects(svc.share('alice', { id: 's4', uid: 'alice', resourceType: 'document', resourceId: 'doc-3',
    grantedToUid: 'alice', purpose: 'document_sharing', scope: 'x', consentVersion: '2026.1' }));
  await assert.rejects(svc.share('alice', { id: 's5', uid: 'alice', resourceType: 'document', resourceId: 'doc-4',
    grantedToUid: 'bob', purpose: 'document_sharing', scope: 'x', consentVersion: '2026.1', expiresInSeconds: 0 }));
});

test('share revocation is owner-only; recipient cannot revoke; revoked shares invisible to recipient', async () => {
  const { svc } = setup();
  const gift = await svc.share('alice', { id: 'q1', uid: 'alice', resourceType: 'summary', resourceId: 'sum-1',
    grantedToUid: 'bob', purpose: 'document_sharing', scope: 'weekly summary', consentVersion: '2026.1' });
  await assert.rejects(svc.revokeShare('bob', gift.id));
  const revoked = await svc.revokeShare('alice', gift.id);
  assert.equal(revoked.state, 'revoked');
  const received = await svc.sharesFor('bob');
  assert.equal(received.length, 0);
});

test('checks on pending jobs/downloads deny once consent is missing (missing grants, expired, foreign purpose)', async () => {
  const { s } = setup();
  const svc = new ConsentService(s, { now: FIXED_NOW });
  assert.equal(await svc.check('nobody', 'downloads'), false); // no grant at all
  await svc.grant('carol', { id: 'p1', uid: 'carol', purpose: 'learning_sessions', consentVersion: '2026.1' });
  assert.equal(await svc.check('carol', 'downloads'), false); // different purpose
  assert.equal(await svc.check('carol', 'telemetry_optional'), false); // unknown grant for this purpose
});

test('revocation lifecycle history is append-only and complete', async () => {
  const { s, svc } = setup();
  await svc.grant('alice', { id: 't1', uid: 'alice', purpose: 'model_context', consentVersion: '2026.1' });
  const grants = await svc.list('alice');
  const rid = grants.find((g) => g.purpose === 'model_context').id;
  await svc.revoke('alice', rid);
  const events = await svc.track('alice');
  const grantEvents = events.filter((e) => e.grantId === rid).sort((a, b) => a.happenedAt.localeCompare(b.happenedAt));
  assert.equal(grantEvents.length, 2);
  assert.equal(grantEvents[0].to, 'active');      // grant
  assert.equal(grantEvents[1].to, 'revoked');     // revocation
  assert.equal(grantEvents[1].reason, 'revocation');
  // History is readable by the subject only (store scoping).
  assert.equal((await svc.track('bob')).length, 0);
});

test('share expiry hides the share from the recipient', async () => {
  const { s } = setup();
  const svc = new ConsentService(s, { now: FIXED_NOW });
  await svc.share('alice', { id: 'v1', uid: 'alice', resourceType: 'report', resourceId: 'rep-1',
    grantedToUid: 'bob', purpose: 'document_sharing', scope: 'term report', consentVersion: '2026.1', expiresInSeconds: 60 });
  assert.equal((await svc.sharesFor('bob')).length, 1);
  const late = new ConsentService(s, { now: () => new Date('2026-10-25T10:02:00Z') });
  assert.equal((await late.sharesFor('bob')).length, 0);
});
