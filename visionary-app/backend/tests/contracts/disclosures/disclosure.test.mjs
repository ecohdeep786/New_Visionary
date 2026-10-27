/**
 * PRIV-07 (KAN-116) — launch privacy/commercial disclosures and
 * content/model/provider rights review with accountable owners; approvals
 * recorded separately.
 *
 * Proven here:
 *   1. disclosure drafts require an ACCOUNTABLE OWNER (missing owner refuses),
 *   2. approvals are SEPARATE records binding the EXACT version — approving v1
 *      does not approve v2; the disclosure never self-approves,
 *   3. publishing requires a matching approval for the exact version — an
 *      unapproved disclosure refuses,
 *   4. RIGHTS REVIEW: every launch content/model/provider needs a review with
 *      an accountable owner; a missing review reports honestly,
 *   5. the launch checklist reports approved vs pending per item — never a
 *      blanket claim.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { DisclosureRegistry } = req('./dist/src/disclosures/disclosure-registry.js');
const { InMemoryDisclosureStore } = req('./dist/src/disclosures/disclosure-lookups.js');

const OWNER = { ownerId: 'founder_1', role: 'accountable_executive' };

async function makeRegistry() {
  const store = new InMemoryDisclosureStore();
  const registry = new DisclosureRegistry(store);
  const privacy = await registry.recordDisclosure({
    disclosureId: 'disc_privacy', kind: 'privacy', version: 1,
    title: 'Privacy disclosures', body: 'What we collect and why…', accountableOwner: OWNER,
  });
  return { store, registry, privacy };
}

// ---------------------------------------------------------------------------

test('disclosure drafts require an ACCOUNTABLE OWNER (missing owner refuses)', async () => {
  const { registry } = await makeRegistry();
  await assert.rejects(
    () => registry.recordDisclosure({
      disclosureId: 'disc_commercial', kind: 'commercial', version: 1,
      title: 'Commercial terms', body: '…', accountableOwner: { ownerId: '', role: '' },
    }),
    (e) => e.code === 'owner_required',
  );
});

test('approvals are SEPARATE records binding the EXACT version — approving v1 does not approve v2; the disclosure never self-approves', async () => {
  const { registry, privacy } = await makeRegistry();
  // The disclosure object carries NO approved flag.
  const serialized = JSON.stringify(privacy);
  assert.equal(serialized.includes('approved'), false, 'the disclosure never self-approves');

  // Approve v1 only.
  await registry.approve({ disclosureId: 'disc_privacy', version: 1, approver: OWNER, approvedAt: new Date().toISOString() });

  // Record v2 (an update): it is NOT approved by the v1 approval.
  await registry.recordDisclosure({ disclosureId: 'disc_privacy', kind: 'privacy', version: 2, title: 'Privacy disclosures', body: 'Updated…', accountableOwner: OWNER });
  await assert.rejects(
    () => registry.publish('disc_privacy', 2),
    (e) => e.code === 'not_approved',
    'approving v1 does not approve v2 (version-bound approvals)',
  );
  // v1 still publishes.
  const published = await registry.publish('disc_privacy', 1);
  assert.equal(published.approvedBy, 'founder_1');
});

test('publishing requires a matching approval for the exact version — an unapproved disclosure refuses', async () => {
  const { registry } = await makeRegistry();
  await registry.recordDisclosure({ disclosureId: 'disc_unapproved', kind: 'commercial', version: 1, title: 'x', body: 'y', accountableOwner: OWNER });
  await assert.rejects(
    () => registry.publish('disc_unapproved', 1),
    (e) => e.code === 'not_approved',
  );
  await assert.rejects(
    () => registry.publish('disc_ghost', 1),
    (e) => e.code === 'unknown_disclosure',
  );
});

test('RIGHTS REVIEW: every launch content/model/provider needs a review with an accountable owner; a missing review reports honestly', async () => {
  const { registry } = await makeRegistry();
  await registry.recordRightsReview({ reviewId: 'rr1', subjectKind: 'provider', subjectId: 'providerA', accountableOwner: OWNER, rightsScope: 'Teaching use, session retention, region in-south' });
  await registry.recordRightsReview({ reviewId: 'rr2', subjectKind: 'model', subjectId: 'model-tutor', accountableOwner: OWNER, rightsScope: 'Prompted inference only, no training' });

  const checklist = await registry.launchChecklist({
    disclosures: [{ disclosureId: 'disc_privacy', version: 1 }],
    rightsSubjects: [
      { subjectKind: 'provider', subjectId: 'providerA' },
      { subjectKind: 'model', subjectId: 'model-tutor' },
      { subjectKind: 'content_source', subjectId: 'src_unreviewed' },
    ],
  });
  const bySubject = new Map(checklist.rights.map((r) => [`${r.subjectKind}|${r.subjectId}`, r.state]));
  assert.equal(bySubject.get('provider|providerA'), 'reviewed');
  assert.equal(bySubject.get('model|model-tutor'), 'reviewed');
  assert.equal(bySubject.get('content_source|src_unreviewed'), 'missing', 'missing reviews report honestly');
});

test('the launch checklist reports approved vs pending per item — never a blanket claim', async () => {
  const { registry, privacy } = await makeRegistry();
  await registry.approve({ disclosureId: 'disc_privacy', version: 1, approver: OWNER, approvedAt: new Date().toISOString() });
  await registry.recordDisclosure({ disclosureId: 'disc_commercial', kind: 'commercial', version: 1, title: 'Commercial', body: '…', accountableOwner: OWNER });

  const checklist = await registry.launchChecklist({
    disclosures: [
      { disclosureId: 'disc_privacy', version: privacy.version },
      { disclosureId: 'disc_commercial', version: 1 },
    ],
    rightsSubjects: [],
  });
  const byId = new Map(checklist.disclosures.map((d) => [d.disclosureId, d.state]));
  assert.equal(byId.get('disc_privacy'), 'approved');
  assert.equal(byId.get('disc_commercial'), 'pending', 'the unapproved one stays pending — no blanket claim');
});
