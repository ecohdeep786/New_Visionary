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
const version = goal => JSON.stringify([goal.updatedAt, goal.title, goal.body, goal.status]);

test('goal edit conflicts and malformed parent copies preserve originals until explicit recovery', () => {
 const goal = workspace.saveLearnerGoal(learner,{title:'Goal',body:'Private original'});
 const base = workspace.resourceRevision(goal);
 const changed = workspace.saveLearnerGoal(learner,{id:goal.id,title:'New goal',body:'New private note'},base);
 const afterChange = memory.get('visionary_workspace_v2');
 assert.throws(()=>workspace.saveLearnerGoal(learner,{id:goal.id,title:'Stale goal',body:'Keep editor text'},base),/changed since/);
 assert.equal(memory.get('visionary_workspace_v2'),afterChange);
 workspace.shareParentGoalSummary(learner,goal.id,parent.personId,'Approved copy',version(changed));
 const original=memory.get('visionary_workspace_v2');const valid=workspace.snapshot(learner).resources.find(row=>row.id===goal.id).parentSummaries;
 for(const history of [null,'broken',[null],[{...valid[0],title:{}}],[{...valid[0],summary:[]}],[valid[0],valid[0]]]){
  const db=JSON.parse(original);db.data[learner.workspaceId].resources.find(row=>row.id===goal.id).parentSummaries=history;
  const raw=JSON.stringify(db);memory.set('visionary_workspace_v2',raw);
  assert.throws(()=>workspace.familyGoalSummaries(parent,learner.personId),/Original records were kept/);
  assert.throws(()=>workspace.shareParentGoalSummary(learner,goal.id,parent.personId,'Replacement',version(changed)),/Original records were kept/);
  assert.throws(()=>workspace.stopParentGoalSummary(learner,goal.id,parent.personId),/Original records were kept/);
  assert.equal(memory.get('visionary_workspace_v2'),raw);
 }
 memory.set('visionary_workspace_v2',original);assert.equal(workspace.familyGoalSummaries(parent,learner.personId)[0].summary,'Approved copy');
 workspace.stopParentGoalSummary(learner,goal.id,parent.personId);assert.deepEqual(workspace.familyGoalSummaries(parent,learner.personId),[]);
});

test('Work goal and project sharing cannot report success outside the personal parent projection', () => {
 localStorage.setItem('visionary_entity_OrganizationInvite',JSON.stringify([{id:'work-student',email:'minor-cbse@visionary.test',organization_email:'school-admin@visionary.test',organization_name:'Example School',role:'student',status:'active'}]));
 const identity=workspace.bootstrapPerson({id:learner.personId,email:'minor-cbse@visionary.test',identity:'student',age_band:'minor'});
 const space=identity.workspaces.find(row=>row.organizationId);assert.ok(space);
 const work={...learner,workspaceId:space.id};
 const goal=workspace.saveLearnerGoal(work,{title:'Work goal',body:'WORK_PRIVATE_NOTES'});
 const artifact=workspace.saveArtifact(work,{title:'Work project',body:'WORK_PRIVATE_DOCUMENT',status:'completed'});
 const original=memory.get('visionary_workspace_v2');
 assert.throws(()=>workspace.shareParentGoalSummary(work,goal.id,parent.personId,'Work summary',version(goal)),/personal learner workspace/);
 assert.throws(()=>workspace.shareParentProjectSummary(work,artifact.id,parent.personId,'Work project summary',version(artifact)),/personal learner workspace/);
 assert.equal(memory.get('visionary_workspace_v2'),original);
 assert.deepEqual(workspace.familyGoalSummaries(parent,learner.personId),[]);
 assert.deepEqual(workspace.familyProjectSummaries(parent,learner.personId),[]);
 assert.equal(workspace.snapshot(work).resources[0].body,'WORK_PRIVATE_NOTES');
 assert.equal(workspace.snapshot(work).artifacts[0].body,'WORK_PRIVATE_DOCUMENT');
});

beforeEach(() => {
 memory.clear();
 workspace.configureMock({ latency: 0, fault: 'none', now: () => new Date('2026-09-23T12:00:00Z') });
 workspace.seedDemo('parent');
});

test('learner owns a goal and a parent receives only its explicitly approved fixed summary', () => {
 const goal = workspace.saveLearnerGoal(learner, { title: 'Test my bridge', body: 'PRIVATE_GOAL_NOTES' });
 assert.equal(workspace.snapshot(learner).resources[0].title, 'Test my bridge');
 assert.deepEqual(workspace.familyGoalSummaries(parent, learner.personId), []);
 workspace.shareParentGoalSummary(learner, goal.id, parent.personId, 'Please help me test one design each weekend.', version(goal));
 const received = workspace.familyGoalSummaries(parent, learner.personId);
 assert.equal(received[0].summary, 'Please help me test one design each weekend.');
 assert.equal(JSON.stringify(received).includes('PRIVATE_GOAL_NOTES'), false);
 assert.deepEqual(workspace.familyGoalSummaries(parent, other.personId), []);
 const edited = workspace.saveLearnerGoal(learner, { id: goal.id, title: 'Test two bridges', body: 'NEW_PRIVATE_NOTES' });
 assert.equal(workspace.familyGoalSummaries(parent, learner.personId)[0].title, 'Test my bridge');
 assert.throws(() => workspace.shareParentGoalSummary(learner, goal.id, parent.personId, 'Stale', version(goal)), /changed/);
 workspace.shareParentGoalSummary(learner, goal.id, parent.personId, 'I am comparing two models.', version(edited));
 assert.equal(workspace.familyGoalSummaries(parent, learner.personId)[0].title, 'Test two bridges');
 workspace.stopParentGoalSummary(learner, goal.id, parent.personId);
 assert.deepEqual(workspace.familyGoalSummaries(parent, learner.personId), []);
 assert.equal(workspace.snapshot(learner).resources[0].body, 'NEW_PRIVATE_NOTES');
});

test('guardian renewal does not revive a prior goal share', () => {
 const goal = workspace.saveLearnerGoal(learner, { title: 'Improve fractions', body: 'Private uncertainty' });
 workspace.shareParentGoalSummary(learner, goal.id, parent.personId, 'Please give me practice time.', version(goal));
 const relationship = workspace.visibleRelationships(parent).find(row => row.to === learner.personId && row.status === 'active');
 workspace.changeRelationship(parent, relationship.id, 'revoked');
 assert.throws(() => workspace.familyGoalSummaries(parent, learner.personId), /no longer shared/);
 assert.throws(() => workspace.shareParentGoalSummary(learner, goal.id, parent.personId, 'More', version(goal)), /no longer active/);
 workspace.requestRelationship(parent, 'minor-cbse@visionary.test', 'guardian');
 const renewal = workspace.visibleRelationships(learner).find(row => row.from === parent.personId && row.status === 'pending');
 workspace.changeRelationship(learner, renewal.id, 'active');
 assert.deepEqual(workspace.familyGoalSummaries(parent, learner.personId), []);
 workspace.shareParentGoalSummary(learner, goal.id, parent.personId, 'New approval for this parent.', version(goal));
 assert.equal(workspace.familyGoalSummaries(parent, learner.personId)[0].summary, 'New approval for this parent.');
});

test('goal writes require the learner role, an owned goal and a bounded explicit summary', () => {
 assert.throws(() => workspace.saveLearnerGoal(parent, { title: 'Forged', body: '' }), /learner workspace/);
 assert.throws(() => workspace.saveLearnerGoal(learner, { id: 'missing', title: 'Forged', body: '' }), /not in your workspace/);
 const goal = workspace.saveLearnerGoal(learner, { title: 'My goal', body: '' });
 assert.throws(() => workspace.shareParentGoalSummary(parent, goal.id, parent.personId, 'Forged', version(goal)), /learner workspace/);
 assert.throws(() => workspace.shareParentGoalSummary(other, goal.id, parent.personId, 'Forged', version(goal)), /unavailable/);
 assert.throws(() => workspace.shareParentGoalSummary(learner, goal.id, parent.personId, ' ', version(goal)), /summary/);
 assert.throws(() => workspace.shareParentGoalSummary(learner, goal.id, parent.personId, 'A'.repeat(501), version(goal)), /500/);
});
