import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as workspace from '../src/services/workspaceService.ts';

const memory = new Map();
globalThis.localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, String(value)), removeItem: key => memory.delete(key) };
globalThis.window = { dispatchEvent() {} };
globalThis.CustomEvent ??= class { constructor(type) { this.type = type; } };
const parent = { personId: 'demo-parent', workspaceId: 'demo-parent:parent', role: 'parent', locale: 'en' };
const learner = { personId: 'demo-minor-cbse', workspaceId: 'demo-minor-cbse:student', role: 'student', locale: 'en' };
const other = { personId: 'demo-bengali', workspaceId: 'demo-bengali:student', role: 'student', locale: 'en' };

beforeEach(() => {
 memory.clear();
 workspace.configureMock({ latency: 0, fault: 'none', now: () => new Date('2026-09-23T12:00:00Z') });
 workspace.seedDemo('parent');
});

function project(ctx = learner) {
 return workspace.saveArtifact(ctx, { title: 'A model bridge', body: 'PRIVATE_DOCUMENT_TOKEN', milestones: [true, true, true], status: 'completed' });
}
const version = artifact => JSON.stringify([artifact.updatedAt, artifact.title, artifact.body, artifact.status]);

test('only the learner-approved fixed summary reaches its selected parent', () => {
 const saved = project();
 workspace.shareParentProjectSummary(learner, saved.id, parent.personId, 'I built a bridge model and would like help testing it.', version(saved));
 const received = workspace.familyProjectSummaries(parent, learner.personId);
 assert.equal(received.length, 1);
 assert.equal(received[0].summary, 'I built a bridge model and would like help testing it.');
 assert.equal(JSON.stringify(received).includes('PRIVATE_DOCUMENT_TOKEN'), false);
 assert.deepEqual(workspace.familyProjectSummaries(parent, other.personId), []);
 const originalVersion = version(saved);
 const edited = workspace.saveArtifact(learner, { ...saved, body: 'NEW_PRIVATE_DOCUMENT_TOKEN' });
 assert.throws(() => workspace.shareParentProjectSummary(learner, saved.id, parent.personId, 'Changed without review', originalVersion), /changed/);
 assert.equal(workspace.familyProjectSummaries(parent, learner.personId)[0].summary, received[0].summary);
 workspace.shareParentProjectSummary(learner, saved.id, parent.personId, 'Updated summary after review.', version(edited));
 assert.equal(workspace.familyProjectSummaries(parent, learner.personId)[0].summary, 'Updated summary after review.');
 assert.equal(workspace.familyProjectSummaries(parent, learner.personId).length, 1);
 workspace.stopParentProjectSummary(learner, saved.id, parent.personId);
 assert.deepEqual(workspace.familyProjectSummaries(parent, learner.personId), []);
 assert.equal(workspace.snapshot(learner).artifacts[0].body, 'NEW_PRIVATE_DOCUMENT_TOKEN');
});

test('role, completion, stale version, active permission and revocation are enforced at write and read', () => {
 const saved = project();
 assert.throws(() => workspace.shareParentProjectSummary(parent, saved.id, parent.personId, 'Hello', version(saved)), /learner workspace/);
 assert.throws(() => workspace.shareParentProjectSummary(other, saved.id, parent.personId, 'Hello', version(saved)), /Project not found/);
 assert.throws(() => workspace.shareParentProjectSummary(learner, saved.id, parent.personId, ' ', version(saved)), /summary/);
 assert.throws(() => workspace.shareParentProjectSummary(learner, saved.id, parent.personId, 'A'.repeat(501), version(saved)), /500/);
 assert.throws(() => workspace.shareParentProjectSummary(learner, saved.id, parent.personId, 'Hello', 'old-version'), /changed/);
 workspace.shareParentProjectSummary(learner, saved.id, parent.personId, 'Safe summary', version(saved));
 const relationship = workspace.visibleRelationships(parent).find(row => row.to === learner.personId && row.status === 'active');
 workspace.changeRelationship(parent, relationship.id, 'revoked');
 assert.throws(() => workspace.familyProjectSummaries(parent, learner.personId), /no longer shared/);
 assert.throws(() => workspace.shareParentProjectSummary(learner, saved.id, parent.personId, 'Another summary', version(saved)), /no longer active/);
 workspace.requestRelationship(parent, 'minor-cbse@visionary.test', 'guardian');
 const renewal = workspace.visibleRelationships(learner).find(row => row.from === parent.personId && row.status === 'pending');
 workspace.changeRelationship(learner, renewal.id, 'active');
 assert.deepEqual(workspace.familyProjectSummaries(parent, learner.personId), [], 'a new guardian consent must not revive an older project share');
 workspace.shareParentProjectSummary(learner, saved.id, parent.personId, 'Freshly approved summary', version(saved));
 assert.equal(workspace.familyProjectSummaries(parent, learner.personId)[0].summary, 'Freshly approved summary');
 workspace.stopParentProjectSummary(learner, saved.id, parent.personId);
 assert.equal(workspace.snapshot(learner).artifacts[0].parentSummaries.length, 0);
});

test('unfinished project cannot be summarized and no other parent can read a child', () => {
 const draft = workspace.saveArtifact(learner, { title: 'Draft project', body: 'work', status: 'draft' });
 assert.throws(() => workspace.shareParentProjectSummary(learner, draft.id, parent.personId, 'Almost there', version(draft)), /Complete the project/);
 const stranger = { personId: 'demo-teacher', workspaceId: 'demo-teacher:teacher', role: 'parent', locale: 'en' };
 assert.throws(() => workspace.familyProjectSummaries(stranger, learner.personId));
});

test('malformed fixed summaries cannot be read or replaced and keep original bytes', () => {
 const saved = project();
 workspace.shareParentProjectSummary(learner, saved.id, parent.personId, 'Original approved summary', version(saved));
 const original = memory.get('visionary_workspace_v2');
 const valid = workspace.snapshot(learner).artifacts[0].parentSummaries;
 for (const history of [null, 'broken', [null], [{...valid[0], summary: {private:'not text'}}], [{...valid[0], relationshipId: null}], [valid[0], valid[0]]]) {
  const db = JSON.parse(original);
  db.data[learner.workspaceId].artifacts[0].parentSummaries = history;
  const raw = JSON.stringify(db);memory.set('visionary_workspace_v2', raw);
  assert.throws(()=>workspace.familyProjectSummaries(parent,learner.personId),/Original records were kept/);
  assert.throws(()=>workspace.shareParentProjectSummary(learner,saved.id,parent.personId,'Replacement',version(saved)),/Original records were kept/);
  assert.throws(()=>workspace.stopParentProjectSummary(learner,saved.id,parent.personId),/Original records were kept/);
  assert.equal(memory.get('visionary_workspace_v2'),raw);
 }
 memory.set('visionary_workspace_v2',original);
 assert.equal(workspace.familyProjectSummaries(parent,learner.personId)[0].summary,'Original approved summary');
 workspace.stopParentProjectSummary(learner,saved.id,parent.personId);
 assert.deepEqual(workspace.familyProjectSummaries(parent,learner.personId),[]);
});
