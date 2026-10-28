/**
 * ROLE-05 (KAN-97) — separate professional personal/company records,
 * sponsored membership and explicit portfolio/project shares; employer access
 * does not include private personal learning.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { ProfessionalService } = req('./dist/src/professional/professional-service.js');
const { InMemoryProfessionalStore } = req('./dist/src/professional/professional-lookups.js');

const MEMBER = { uid: 'uid_member_1', workspaceId: 'ws_personal' };
const COMPANY_PRINCIPAL = { uid: 'company_acme', workspaceId: 'ws_company_acme' };
const STRANGER = { uid: 'uid_stranger', workspaceId: 'ws_personal' };

async function makeService() {
  const store = new InMemoryProfessionalStore();
  const service = new ProfessionalService(store);
  return { store, service };
}

// ---------------------------------------------------------------------------

test('SEPARATE scopes: personal and company records live in separate stores; reading is owner-only', async () => {
  const { store, service } = await makeService();
  const personal = await service.addPersonalRecord(MEMBER, 'goal', 'become a data engineer');
  const company = await service.addCompanyRecord(MEMBER, 'company_acme', 'certification', 'AWS SAA 2026');
  assert.equal(personal.scope, 'personal');
  assert.equal(company.scope, 'company');
  assert.equal((await store.records(MEMBER.uid, 'personal')).length, 1);
  assert.equal((await store.records(MEMBER.uid, 'company')).length, 1);
  // Owner-only reads; a stranger denies uniformly.
  await service.readRecord(MEMBER, personal.recordId);
  await assert.rejects(
    () => service.readRecord(STRANGER, personal.recordId),
    (e) => e.code === 'not_owner',
  );
});

test('SEPARATION enforced: a company record carrying a personal-learning reference refuses', async () => {
  const { service } = await makeService();
  await assert.rejects(
    () => service.addCompanyRecord(MEMBER, 'company_acme', 'note', 'learning goal: orbits mastery'),
    (e) => e.code === 'personal_learning_forbidden',
  );
  await assert.rejects(
    () => service.addCompanyRecord(MEMBER, 'company_acme', 'learner_profile', 'session_ref/conv_1'),
    (e) => e.code === 'personal_learning_forbidden',
  );
});

test('SPONSORED membership: only a company-side principal sponsors; the sponsorship grants company benefits ONLY', async () => {
  const { service } = await makeService();
  await assert.rejects(
    () => service.sponsorMembership(MEMBER, 'company_acme', MEMBER.uid, 'pro'),
    (e) => e.code === 'sponsor_only',
  );
  const sponsorship = await service.sponsorMembership(COMPANY_PRINCIPAL, 'company_acme', MEMBER.uid, 'pro');
  assert.equal(sponsorship.grantsPersonalLearningAccess, false);
  assert.equal(sponsorship.memberUid, MEMBER.uid);
});

test('EXPLICIT shares: visibility exists ONLY through an owner-granted, purpose-bound, revocable grant', async () => {
  const { service } = await makeService();
  // The member adds personal learning AND a portfolio item.
  await service.addPersonalRecord(MEMBER, 'goal', 'private learning goal');
  const share = await service.shareToCompany(MEMBER, 'company_acme', 'portfolio', 'portfolio_orbits_v3', 'role application review');
  assert.equal(share.purpose, 'role application review');
  // The company view shows only the explicitly granted item.
  const view = await service.companyView(COMPANY_PRINCIPAL, 'company_acme', MEMBER.uid);
  assert.deepEqual(view.sharedItems, [{ itemType: 'portfolio', itemRef: 'portfolio_orbits_v3', purpose: 'role application review' }]);
  // Revocation removes the visibility immediately.
  await service.revokeShare(MEMBER, share.shareId);
  const after = await service.companyView(COMPANY_PRINCIPAL, 'company_acme', MEMBER.uid);
  assert.deepEqual(after.sharedItems, []);
  // Only the owner revokes.
  const share2 = await service.shareToCompany(MEMBER, 'company_acme', 'project', 'proj_build_1', 'code review');
  await assert.rejects(
    () => service.revokeShare(STRANGER, share2.shareId),
    (e) => e.code === 'not_owner',
  );
});

test('EMPLOYER ACCESS BOUNDARY: the company view never includes personal learning, even with an active sponsorship', async () => {
  const { service } = await makeService();
  await service.addPersonalRecord(MEMBER, 'goal', 'private learning goal');
  await service.addCompanyRecord(MEMBER, 'company_acme', 'certification', 'AWS SAA 2026');
  await service.sponsorMembership(COMPANY_PRINCIPAL, 'company_acme', MEMBER.uid, 'pro');
  const view = await service.companyView(COMPANY_PRINCIPAL, 'company_acme', MEMBER.uid);
  // Company record visible; personal learning structurally absent.
  assert.equal(view.companyRecords.length, 1);
  assert.equal(view.companyRecords[0].kind, 'certification');
  assert.equal(view.personalLearningCount, 0);
  assert.equal(JSON.stringify(view).includes('private learning goal'), false);
  // A company-side personal-learning read ALWAYS refuses.
  await assert.rejects(
    () => service.readPersonalLearningAsCompany(),
    (e) => e.code === 'share_grant_required',
  );
  // A non-company principal cannot even open the company view.
  await assert.rejects(
    () => service.companyView(MEMBER, 'company_acme', MEMBER.uid),
    (e) => e.code === 'sponsor_only',
  );
});

test('invalid definitions refuse; foreign-workspace reads deny uniformly', async () => {
  const { service } = await makeService();
  await assert.rejects(
    () => service.addPersonalRecord(MEMBER, '', ''),
    (e) => e.code === 'profile_definition_invalid',
  );
  await assert.rejects(
    () => service.addCompanyRecord(MEMBER, '', 'cert', 'x'),
    (e) => e.code === 'profile_definition_invalid',
  );
  await assert.rejects(
    () => service.shareToCompany(MEMBER, '', 'portfolio', 'ref', 'purpose'),
    (e) => e.code === 'profile_definition_invalid',
  );
  // Uniform not_owner for an unknown record.
  await assert.rejects(
    () => service.readRecord(MEMBER, 'rec_unknown'),
    (e) => e.code === 'not_owner',
  );
});
