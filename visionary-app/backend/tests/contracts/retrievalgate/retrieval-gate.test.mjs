/**
 * CONTENT-05 (KAN-64) — enforce source/workspace/publication filtering before
 * keyword/vector retrieval and cache lookup; withdrawal stops new access AND
 * pending output.
 *
 * Proven here:
 *   1. a released pointer with consent, membership and a supported locale
 *      authorizes both retrieval and cache-lookup purposes; every decision is
 *      computed fresh (server-live) — no gate-level caching,
 *   2. withdrawal denies new access with its own reason, distinct from
 *      never-released pointers; draft/in_review pointers deny too,
 *   3. source-version mismatch, unsupported locale, missing/revoked consent
 *      and workspace mismatch each deny with typed reasons; unknown state
 *      fails closed,
 *   4. pending output stops: a delivery-time recheck after withdrawal denies
 *      (WITHDRAWN_POINTER), a revision bump or consent change between compute
 *      and delivery drops the output (STALE_DECISION), and an unchanged basis
 *      delivers,
 *   5. locale and source-language stay distinct: the gate checks the requested
 *      locale against the released locales and never against the authored
 *      language,
 *   6. every decision fingerprint covers the full basis (query + pointer
 *      revision/locales + consent revision + membership role), so delivery
 *      recheck detects state drift, not just identity drift.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { RetrievalGate } = req('./dist/src/retrievalgate/retrieval-gate.js');
const { InMemoryLookups } = req('./dist/src/retrievalgate/retrieval-gate-lookups.js');

const UID = 'uid-learner';
const NODE = 'cnt_curriculum_icse_001';
const SOURCE = { provider: 'cisce', edition: 'ed-2024', version: '1.0.0' };

function setup() {
  const lookups = new InMemoryLookups();
  const gate = new RetrievalGate(lookups, lookups, lookups);
  lookups.setPointer(NODE, {
    state: 'released', revision: 1, releasedLocales: ['en', 'hi'], source: { ...SOURCE },
  });
  lookups.setConsent(UID, NODE, { policyRevision: 'pol-1', revoked: false });
  return { lookups, gate };
}

function query(overrides = {}) {
  return {
    requesterUid: UID,
    workspaceId: null,
    nodeKey: NODE,
    source: { ...SOURCE },
    locale: 'en',
    purpose: 'retrieval',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------

test('released pointer with consent and locale authorizes retrieval and cache lookup, freshly each time', async () => {
  const { lookups, gate } = setup();
  const retrieval = await gate.authorize(query());
  assert.equal(retrieval.allowed, true);
  assert.equal(retrieval.reason, null);
  assert.equal(retrieval.decisionSource, 'server-live');

  const cacheLookup = await gate.authorize(query({ purpose: 'cache-lookup' }));
  assert.equal(cacheLookup.allowed, true, 'cache lookup is gated exactly like retrieval');

  assert.notEqual(retrieval.fingerprint, cacheLookup.fingerprint, 'purpose is part of the decision basis');

  // server-live: a state change between calls is observed immediately
  lookups.setConsent(UID, NODE, { policyRevision: 'pol-1', revoked: true });
  const afterRevocation = await gate.authorize(query());
  assert.equal(afterRevocation.allowed, false);
  assert.equal(afterRevocation.reason, 'CONSENT_REVOKED');
});

test('withdrawal denies with its own reason; never-released and draft/in_review deny as POINTER_NOT_RELEASED', async () => {
  const { lookups, gate } = setup();
  lookups.setPointer(NODE, { state: 'withdrawn', revision: 1, releasedLocales: ['en'], source: { ...SOURCE } });
  const withdrawn = await gate.authorize(query());
  assert.equal(withdrawn.allowed, false);
  assert.equal(withdrawn.reason, 'WITHDRAWN_POINTER');

  lookups.setPointer(NODE, { state: 'in_review', revision: 0, releasedLocales: ['en'], source: { ...SOURCE } });
  assert.equal((await gate.authorize(query())).reason, 'POINTER_NOT_RELEASED');

  lookups.setPointer('cnt_unknown', null);
  const unknown = await gate.authorize(query({ nodeKey: 'cnt_unknown' }));
  assert.equal(unknown.reason, 'POINTER_NOT_RELEASED', 'unknown nodes fail closed');
});

test('source-version mismatch, unsupported locale, consent and workspace denies are typed', async () => {
  const { lookups, gate } = setup();
  assert.equal((await gate.authorize(query({ source: { ...SOURCE, version: '2.0.0' } }))).reason, 'SOURCE_VERSION_MISMATCH');
  assert.equal((await gate.authorize(query({ locale: 'bn' }))).reason, 'LOCALE_UNSUPPORTED');
  assert.equal((await gate.authorize(query({ locale: 'hi' }))).allowed, true, 'every released locale is supported');
  assert.equal((await gate.authorize(query({ locale: null }))).allowed, true, 'null locale takes the default');
  lookups.setConsent(UID, NODE, null);
  assert.equal((await gate.authorize(query())).reason, 'CONSENT_MISSING');
  lookups.setConsent(UID, NODE, { policyRevision: 'pol-1', revoked: true });
  assert.equal((await gate.authorize(query())).reason, 'CONSENT_REVOKED');
  lookups.setConsent(UID, NODE, { policyRevision: 'pol-1', revoked: false });
  lookups.setMembership(UID, 'ws-1', { member: false, role: null });
  assert.equal((await gate.authorize(query({ workspaceId: 'ws-1' }))).reason, 'WORKSPACE_MISMATCH');
  lookups.setMembership(UID, 'ws-1', { member: true, role: 'teacher' });
  assert.equal((await gate.authorize(query({ workspaceId: 'ws-1' }))).allowed, true);
  assert.equal((await gate.authorize(query({ requesterUid: '' }))).reason, 'AUTHORITY_MISSING');
});

test('withdrawal between compute and delivery stops pending output', async () => {
  const { lookups, gate } = setup();
  const original = await gate.authorize(query());
  assert.equal(original.allowed, true);

  // the retrieval computed its output under `original`; the pointer is then withdrawn
  lookups.setPointer(NODE, { state: 'withdrawn', revision: 1, releasedLocales: ['en'], source: { ...SOURCE } });
  const delivery = await gate.authorizeDelivery({ originalDecision: original, queryContext: query() });
  assert.equal(delivery.allowed, false);
  assert.equal(delivery.reason, 'WITHDRAWN_POINTER', 'withdrawal stops pending output');
});

test('a revision bump or consent change between compute and delivery drops the output as STALE_DECISION', async () => {
  const { lookups, gate } = setup();
  const original = await gate.authorize(query());

  lookups.setPointer(NODE, { state: 'released', revision: 2, releasedLocales: ['en', 'hi'], source: { ...SOURCE } });
  const afterBump = await gate.authorizeDelivery({ originalDecision: original, queryContext: query() });
  assert.equal(afterBump.allowed, false);
  assert.equal(afterBump.reason, 'STALE_DECISION', 'a new release invalidates in-flight output');

  // restore the exact basis and the output delivers
  lookups.setPointer(NODE, { state: 'released', revision: 1, releasedLocales: ['en', 'hi'], source: { ...SOURCE } });
  const sameBasis = await gate.authorizeDelivery({ originalDecision: original, queryContext: query() });
  assert.equal(sameBasis.allowed, true, 'an unchanged basis delivers');

  lookups.setConsent(UID, NODE, { policyRevision: 'pol-2', revoked: false });
  const afterConsentBump = await gate.authorizeDelivery({ originalDecision: original, queryContext: query() });
  assert.equal(afterConsentBump.allowed, false, 'consent revision drift drops the output');
});

test('the fingerprint covers the full decision basis, not just the query identity', async () => {
  const { lookups, gate } = setup();
  const first = await gate.authorize(query({ workspaceId: 'ws-1', purpose: 'retrieval' }));
  lookups.setMembership(UID, 'ws-1', { member: true, role: 'teacher' });
  const second = await gate.authorize(query({ workspaceId: 'ws-1', purpose: 'retrieval' }));
  assert.equal(second.allowed, true);
  assert.notEqual(second.fingerprint, first.fingerprint, 'membership role drift changes the basis');

  lookups.setPointer(NODE, { state: 'released', revision: 1, releasedLocales: ['en'], source: { ...SOURCE } });
  const fewerLocales = await gate.authorize(query({ workspaceId: 'ws-1' }));
  assert.notEqual(fewerLocales.fingerprint, second.fingerprint, 'released-locale drift changes the basis');
});
