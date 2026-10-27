/**
 * AI-02 (KAN-84) — reviewed provider purpose/region/retention/tools and
 * contract settings; minimize sent data; fallback requires explicit approval.
 *
 * Proven here:
 *   1. requests run only against the ACTIVE reviewed contract version (purpose/
 *      region/retention recorded on the minimized output); revoked/unknown
 *      contracts refuse,
 *   2. sent data is MINIMIZED: only permitted fields are forwarded; a request
 *      needing a non-permitted field is refused (never silently widened),
 *   3. only permitted tools are allowed,
 *   4. fallback to another provider/region requires an explicit pre-approved
 *      entry; unapproved fallbacks refuse,
 *   5. the minimized request carries the contract version + region + retention.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { ProviderScopeGate } = req('./dist/src/providerscope/provider-scope.js');
const { InMemoryProviderContractStore } = req('./dist/src/providerscope/provider-scope-lookups.js');

const CALLER = { uid: 'uid_learner_1', workspaceId: 'ws_personal' };

function contract(overrides = {}) {
  return {
    contractId: 'ctc_1',
    provider: 'providerA',
    version: 3,
    purpose: 'teaching',
    region: 'in-south',
    retention: 'session',
    permittedTools: ['tutor_turn'],
    permittedFields: ['conceptId', 'question'],
    approvedFallbacks: [],
    status: 'active',
    ...overrides,
  };
}

async function makeGate(contracts) {
  const store = new InMemoryProviderContractStore();
  for (const c of contracts) store.setContract(c);
  return { store, gate: new ProviderScopeGate(store) };
}

const REQUEST = {
  caller: CALLER,
  purpose: 'teaching',
  tool: 'tutor_turn',
  fields: { conceptId: 'c_orbits', question: 'Why do seasons occur?' },
};

// ---------------------------------------------------------------------------

test('requests run only against the ACTIVE reviewed contract; minimized output records version/region/retention', async () => {
  const { gate } = await makeGate([contract()]);
  const out = await gate.authorize('providerA', REQUEST);
  assert.equal(out.provider, 'providerA');
  assert.equal(out.contractVersion, 3);
  assert.equal(out.region, 'in-south');
  assert.equal(out.retention, 'session');
  assert.deepEqual(out.fields, REQUEST.fields, 'permitted fields pass through');

  // Revoked contract refuses.
  const { gate: revokedGate } = await makeGate([contract({ status: 'revoked' })]);
  await assert.rejects(
    () => revokedGate.authorize('providerA', REQUEST),
    (e) => e.code === 'contract_not_active',
  );
  // Unknown provider/purpose refuses.
  await assert.rejects(
    () => gate.authorize('providerB', REQUEST),
    (e) => e.code === 'contract_not_active',
  );
});

test('sent data is MINIMIZED: a request needing a non-permitted field is refused, never silently widened', async () => {
  const { gate } = await makeGate([contract()]);
  // The request carries an extra non-permitted field: refused fail-closed.
  await assert.rejects(
    () => gate.authorize('providerA', { ...REQUEST, fields: { ...REQUEST.fields, fullTranscript: 'everything the learner said' } }),
    (e) => e.code === 'field_not_permitted',
    'non-permitted fields refuse — data minimization enforced',
  );
  // The same request without the extra field is fine.
  const out = await gate.authorize('providerA', REQUEST);
  assert.deepEqual(Object.keys(out.fields), ['conceptId', 'question']);
});

test('only contract-permitted tools are allowed', async () => {
  const { gate } = await makeGate([contract()]);
  await assert.rejects(
    () => gate.authorize('providerA', { ...REQUEST, tool: 'raw_chat' }),
    (e) => e.code === 'tool_not_permitted',
  );
});

test('fallback to another provider/region requires an explicit pre-approved entry; unapproved fallbacks refuse', async () => {
  const fallbackContract = contract({
    contractId: 'ctc_2',
    provider: 'providerB',
    version: 1,
    region: 'eu-west',
  });
  // Without a pre-approved fallback entry: refused even though providerB has a
  // reviewed contract.
  const { gate: unapproved } = await makeGate([contract(), fallbackContract]);
  await assert.rejects(
    () => unapproved.authorizeFallback('providerA', 'providerB', REQUEST),
    (e) => e.code === 'fallback_not_approved',
  );

  // With the pre-approved entry: the fallback binds to providerB's contract.
  const { gate: approved } = await makeGate([
    contract({ approvedFallbacks: [{ provider: 'providerB', region: 'eu-west' }] }),
    fallbackContract,
  ]);
  const out = await approved.authorizeFallback('providerA', 'providerB', REQUEST);
  assert.equal(out.provider, 'providerB');
  assert.equal(out.region, 'eu-west');
  assert.equal(out.contractVersion, 1);
});
