import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateMapping, verifyMapping } from '../authority-audit.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const mapping = JSON.parse(read('integration/contracts/operation-authority.v1.json'));
const expected = generateMapping();
const route = name => mapping.registered.find(row => row.route === name);
const mutation = change => { const value = structuredClone(mapping); change(value); return value; };

test('committed source inventory is complete and reproducible', () => {
  assert.deepEqual(verifyMapping(mapping), { registered:37, infrastructure:6, proposed:12, future:16, productGroups:32 });
  assert.deepEqual(mapping, expected);
  assert.equal(mapping.runtimeEnforcementChanged, false);
  assert.equal(mapping.proposedAuthorityImplemented, false);
  for (const rows of [mapping.registered, mapping.infrastructure, mapping.proposed, mapping.future, mapping.productGroups]) {
    for (const row of rows) {
      const profile = mapping.profiles[row.profile];
      assert.ok(profile);
      for (const field of ['actor','workspace','object','source','consent']) assert.ok(profile[field].length>10);
      for (const id of profile.stores) assert.ok(mapping.stores[id]);
    }
  }
});
test('public configuration and CSRF bootstrap cannot be classified as identity', () => {
  for (const name of ['GET /api/auth/methods','GET /api/billing/catalog']) assert.equal(route(name).profile,'public');
  assert.equal(route('GET /api/auth/csrf').profile,'csrf');
  assert.match(mapping.profiles.csrf.actor,/not identity/);
  assert.equal(route('GET /api/auth/me').profile,'sessionRead');
  assert.match(mapping.profiles.sessionRead.actor,/does not require expected-account/);
});
test('local signout is separate from current browser authentication and global revocation', () => {
  assert.equal(route('POST /api/auth/logout').profile,'logout');
  assert.equal(route('POST /api/auth/logout-all').profile,'logoutAll');
  assert.match(mapping.profiles.logout.actor,/expected UID OR matching cookie hash/);
  assert.match(mapping.profiles.logout.object,/not ordinary full-session authentication/);
  assert.match(mapping.profiles.logoutAll.object,/epoch\/cutoff/);
});
test('billing browser, job credential and raw provider signature authorities stay distinct', () => {
  assert.equal(route('POST /api/billing/jobs/reconcile').profile,'billingJob');
  assert.equal(route('POST /api/billing/webhooks/razorpay').profile,'billingWebhook');
  assert.equal(route('POST /api/billing/verify').profile,'billingWrite');
  assert.match(mapping.profiles.billingJob.actor,/browser cookies are insufficient/);
  assert.match(mapping.profiles.billingWebhook.actor,/exact raw bytes/);
  assert.match(mapping.profiles.billingWebhook.object,/unmapped event grants nothing/);
  assert.match(mapping.profiles.billingRead.consent,/not guardian/);
});
test('list and object reads remain owner-bound without broad staff or workspace authority', () => {
  for (const name of ['GET /api/account/overview','GET /api/account/devices','GET /api/account/invoices']) assert.equal(route(name).profile,'ownerRead');
  assert.equal(route('GET /api/account/feedback').profile,'feedbackRead');
  assert.equal(route('GET /api/billing/invoices/:id').profile,'billingRead');
  assert.match(mapping.profiles.ownerRead.object,/owner collection/);
  assert.match(mapping.profiles.feedbackRead.consent,/not training consent/);
});
test('learning workspace/source/rubric limitations remain explicit rather than false grants', () => {
  assert.equal(route('POST /api/account/learning/sessions').profile,'learningWrite');
  assert.match(mapping.profiles.learningRead.workspace,/not a verified membership/);
  assert.match(mapping.profiles.learningWrite.source,/bounded client input/);
  assert.match(mapping.gaps.find(x=>x.id==='criteria-provenance').detail,/answerIndex/);
  assert.match(mapping.profiles.knowledgeRead.object,/not assessed mastery/);
  assert.equal(route('POST /api/account/learning/knowledge/project').profile,'knowledgeWrite');
});
test('future list/download/export/job/support operations have non-public required boundaries', () => {
  const cases = ['project.list-and-revision-read','private.asset-upload-finalize-download','export.request-status','export.worker-execute','export.download','queue.execute-reconcile-deliver','support.case-read-or-triage'];
  for(const name of cases) {
    const row=mapping.future.find(x=>x.operation===name);
    assert.equal(row.exposure,'unregistered-required-boundary');
    assert.equal(mapping.profiles[row.profile].state,'proposed');
    assert.match(mapping.profiles[row.profile].actor,/REQUIRED/);
    assert.notEqual(row.profile,'public');
  }
  assert.match(mapping.profiles.support.actor,/step-up/);
  assert.match(mapping.profiles.privateJob.workspace,/never authorize by queue payload/);
  assert.match(mapping.profiles.privateFile.consent,/residual-access/);
  assert.equal(mapping.future.find(x=>x.operation==='export.request-status').profile,'domain');
  assert.equal(mapping.future.find(x=>x.operation==='export.worker-execute').profile,'privateJob');
  assert.equal(mapping.future.find(x=>x.operation==='export.download').profile,'privateFile');
  assert.equal(mapping.future.find(x=>x.operation==='run.status-events-cancel').profile,'domain');
});
test('guardian, institution, coaching and stage grants are separate, with one future profile owner', () => {
  assert.match(mapping.profiles.guardian.actor,/not a payer/);
  assert.match(mapping.profiles.guardian.object,/no raw private doubts/);
  assert.match(mapping.profiles.institution.object,/no personal\/private-learning dump/);
  assert.match(mapping.profiles.privateCoaching.workspace,/does not expose private coaching/);
  assert.match(mapping.stores.profileTarget.authority,/do not create dual mutable authority/);
  assert.equal(mapping.proposed.find(x=>x.operationId==='SummaryRequest').profile,'domain','self-summary cannot require guardian status');
  assert.equal(mapping.proposed.find(x=>x.operationId==='CoachingGoal').profile,'privateCoaching');
});
test('dated UI group state never certifies current permission or provider availability', () => {
  for(const group of mapping.productGroups) assert.equal(group.currentAuthorityNotEstablishedByCheckpoint,true);
  assert.equal(mapping.productGroups.find(x=>x.id==='workspace-role-switching').profile,'domain');
  assert.equal(mapping.productGroups.find(x=>x.id==='phone-organization-sso-qualification').registeredRoutes.length,0);
});
for(const [name,change] of [
  ['missing registered operation', x=>x.registered.pop()],
  ['duplicate operation', x=>x.registered.push(x.registered[0])],
  ['public downgrade of protected reader', x=>x.registered.find(r=>r.route==='GET /api/account/devices').profile='public'],
  ['browser credential substituted for worker', x=>x.registered.find(r=>r.profile==='billingJob').profile='billingWrite'],
  ['client workspace promoted to membership', x=>x.profiles.learningWrite.workspace='Client workspace is trusted membership'],
  ['missing source/consent gap', x=>x.gaps=[]],
  ['invented implemented authority', x=>x.proposedAuthorityImplemented=true],
  ['invented SQL owner for current learning', x=>x.stores.learning.authority='SQL is already deployed owner'],
]) test(`drift rejects ${name}`,()=>assert.throws(()=>verifyMapping(mutation(change),expected),/drift/));

test('new/removed routes and unsupported HTTP decorator syntax fail closed',()=>{
  const file='backend/upstream/backend/src/auth/firebase-product/firebase-product.controller.ts';
  for(const added of ["\n@Get('extra')",'\n@Get("extra")',"\n@Head('extra')"])
    assert.throws(()=>generateMapping(name=>read(name)+(name===file?added:'')),/Unmapped|Unsupported/);
  assert.throws(()=>generateMapping(name=>name===file?read(name).replace("@Get('me')",''):read(name)),/missing/);
});
test('authority helper semantic source edits invalidate recorded review evidence',()=>{
  const file='backend/upstream/backend/src/auth/firebase-product/request-authority.ts';
  const changed=generateMapping(name=>name===file?read(name).replace("req.get('Origin') !== settings.origin",'false'):read(name));
  assert.notDeepEqual(changed.sourceEvidence,mapping.sourceEvidence);
  assert.throws(()=>verifyMapping(mapping,changed),/drift/);
});
