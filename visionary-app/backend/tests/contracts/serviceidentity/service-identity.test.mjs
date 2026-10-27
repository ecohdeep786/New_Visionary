/**
 * AI-03 (KAN-85) — replace imported HMAC/browser-claim trust with private
 * service identity and audience/expiry/run-bound authorized context.
 *
 * Proven here:
 *   1. server-issued grants authorize with matching audience/run/scope and the
 *      authorized context carries NO secret material,
 *   2. a browser-supplied claim is ALWAYS rejected (the browser is never the
 *      authority — imported HMAC/browser-claim trust is replaced),
 *   3. an expired grant refuses immediately,
 *   4. audience mismatch refuses (a retrieval grant cannot authorize assessment),
 *   5. a run-bound grant cannot authorize a different run,
 *   6. revocation is immediate and owner-only; unknown grants fail closed,
 *   7. scope enforcement: the required scope must be present on the grant.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { ServiceIdentityService } = req('./dist/src/serviceidentity/service-identity.js');
const { InMemoryServiceIdentityStore } = req('./dist/src/serviceidentity/service-identity-lookups.js');

const OWNER = { uid: 'uid_svc_admin', workspaceId: 'ws_platform' };

async function makeService() {
  const store = new InMemoryServiceIdentityStore();
  return { store, svc: new ServiceIdentityService(store) };
}

// ---------------------------------------------------------------------------

test('server-issued grants authorize with matching audience/run/scope; the context carries no secret material', async () => {
  const { svc } = await makeService();
  const grant = await svc.issueGrant({
    owner: OWNER, subject: 'svc.ml-retriever', audience: 'ml.retrieval', runId: 'run_1',
    scopes: ['retrieval.read', 'context.pinned'], ttlSeconds: 600,
  });
  const ctx = await svc.authorizeWithGrant({ grantId: grant.grantId, audience: 'ml.retrieval', runId: 'run_1', requiredScope: 'retrieval.read' });
  assert.equal(ctx.subject, 'svc.ml-retriever');
  assert.equal(ctx.audience, 'ml.retrieval');
  assert.equal(ctx.runId, 'run_1');
  assert.deepEqual(Object.keys(ctx).sort(), ['audience', 'grantId', 'runId', 'scopes', 'subject', 'validatedAt'], 'no secret material in the context');
});

test('a browser-supplied claim is ALWAYS rejected — the browser is never the authority', async () => {
  const { svc } = await makeService();
  await assert.rejects(
    () => svc.authorizeClaim({ claimedUid: 'uid_learner_1', claimedAudience: 'ml.retrieval', claimedScopes: ['retrieval.read'] }),
    (e) => e.code === 'browser_claim_rejected',
    'imported HMAC/browser-claim trust is replaced: no client claim authorizes anything',
  );
});

test('an expired grant refuses immediately, even with matching audience and run', async () => {
  const { svc } = await makeService();
  const grant = await svc.issueGrant({
    owner: OWNER, subject: 'svc.ml-retriever', audience: 'ml.retrieval', runId: 'run_1',
    scopes: ['retrieval.read'], ttlSeconds: 600,
  });
  // Simulate expiry by re-issuing with a past-dated window via a zero/negative TTL refusal:
  await assert.rejects(
    () => svc.issueGrant({ ...{ owner: OWNER, subject: 'x', audience: 'a', runId: null, scopes: [] }, ttlSeconds: 0 }),
    (e) => e.code === 'grant_expired',
  );

  // Expire the stored grant by direct state manipulation through a second store view.
  const { store } = await makeService();
  const svc2 = new ServiceIdentityService(store);
  const g2 = await svc2.issueGrant({ owner: OWNER, subject: 'svc.x', audience: 'ml.retrieval', runId: null, scopes: ['retrieval.read'], ttlSeconds: 600 });
  const stored = await store.byGrantId(g2.grantId);
  stored.expiresAt = new Date(Date.now() - 1000).toISOString();
  await store.saveGrant(stored);
  await assert.rejects(
    () => svc2.authorizeWithGrant({ grantId: g2.grantId, audience: 'ml.retrieval', requiredScope: 'retrieval.read' }),
    (e) => e.code === 'grant_expired',
  );
  void grant;
});

test('audience mismatch refuses: a retrieval grant cannot authorize the assessment audience', async () => {
  const { svc } = await makeService();
  const grant = await svc.issueGrant({
    owner: OWNER, subject: 'svc.ml-retriever', audience: 'ml.retrieval', runId: null,
    scopes: ['retrieval.read'], ttlSeconds: 600,
  });
  await assert.rejects(
    () => svc.authorizeWithGrant({ grantId: grant.grantId, audience: 'ml.assessment', requiredScope: 'retrieval.read' }),
    (e) => e.code === 'audience_mismatch',
  );
});

test('a run-bound grant cannot authorize a different run; unbound grants run within scope', async () => {
  const { svc } = await makeService();
  const bound = await svc.issueGrant({
    owner: OWNER, subject: 'svc.build-run', audience: 'build.run', runId: 'run_A',
    scopes: ['run.propose'], ttlSeconds: 600,
  });
  await assert.rejects(
    () => svc.authorizeWithGrant({ grantId: bound.grantId, audience: 'build.run', runId: 'run_B', requiredScope: 'run.propose' }),
    (e) => e.code === 'run_mismatch',
    'run-bound grant refuses another run',
  );
  const ok = await svc.authorizeWithGrant({ grantId: bound.grantId, audience: 'build.run', runId: 'run_A', requiredScope: 'run.propose' });
  assert.equal(ok.runId, 'run_A');

  const unbound = await svc.issueGrant({
    owner: OWNER, subject: 'svc.monitor', audience: 'build.run', runId: null,
    scopes: ['run.observe'], ttlSeconds: 600,
  });
  const ctx = await svc.authorizeWithGrant({ grantId: unbound.grantId, audience: 'build.run', requiredScope: 'run.observe' });
  assert.equal(ctx.runId, null, 'unbound grant works across runs within scope');
});

test('revocation is immediate and owner-only; unknown grants fail closed', async () => {
  const { svc } = await makeService();
  const grant = await svc.issueGrant({
    owner: OWNER, subject: 'svc.ml-retriever', audience: 'ml.retrieval', runId: null,
    scopes: ['retrieval.read'], ttlSeconds: 600,
  });
  const OTHER = { uid: 'uid_stranger', workspaceId: 'ws_platform' };
  await assert.rejects(() => svc.revokeGrant(grant.grantId, OTHER), (e) => e.code === 'not_owner');

  await svc.revokeGrant(grant.grantId, OWNER);
  await assert.rejects(
    () => svc.authorizeWithGrant({ grantId: grant.grantId, audience: 'ml.retrieval', requiredScope: 'retrieval.read' }),
    (e) => e.code === 'grant_revoked',
    'revoked grant fails closed immediately',
  );
  await assert.rejects(
    () => svc.authorizeWithGrant({ grantId: 'gnt_ghost', audience: 'ml.retrieval', requiredScope: 'retrieval.read' }),
    (e) => e.code === 'unknown_grant',
  );
});

test('scope enforcement: the required scope must be present on the grant', async () => {
  const { svc } = await makeService();
  const grant = await svc.issueGrant({
    owner: OWNER, subject: 'svc.ml-retriever', audience: 'ml.retrieval', runId: null,
    scopes: ['retrieval.read'], ttlSeconds: 600,
  });
  await assert.rejects(
    () => svc.authorizeWithGrant({ grantId: grant.grantId, audience: 'ml.retrieval', requiredScope: 'context.write' }),
    (e) => e.code === 'scope_missing',
  );
});
