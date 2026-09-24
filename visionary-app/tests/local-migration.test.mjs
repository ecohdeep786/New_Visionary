import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as workspace from '../src/services/workspaceService.ts';
import { inspectLocalMigration, planLocalMigrationMapping } from '../src/services/localMigrationService.ts';

const memory = new Map();
let writes = 0;
globalThis.localStorage = {
 getItem: key => memory.get(key) ?? null,
 setItem: (key, value) => { writes++; memory.set(key, String(value)); },
 removeItem: key => memory.delete(key),
};
globalThis.window = { dispatchEvent() {} };
globalThis.CustomEvent ??= class { constructor(type) { this.type = type; } };
const ctx = (personId = 'demo-adult', role = 'student', signal) => ({ personId, workspaceId: `${personId}:${role}`, role, locale: 'en', signal });
const edit = (key, change) => { const value = JSON.parse(memory.get(key)); change(value); memory.set(key, JSON.stringify(value)); };

beforeEach(() => { memory.clear(); writes = 0; workspace.configureMock({ latency: 0, fault: 'none' }); workspace.seedDemo('adult'); });

test('the preview includes only the current person’s owned roles and never writes or transfers data', () => {
 workspace.addRole('demo-adult', 'teacher');
 workspace.newConversation(ctx());
 workspace.newConversation(ctx('demo-adult', 'teacher'));
 workspace.newConversation(ctx('demo-teacher', 'teacher'));
 const before = new Map(memory); const priorWrites = writes;
 const preview = inspectLocalMigration(ctx());
 assert.deepEqual(preview.workspaces.map(item => item.role), ['student', 'teacher', 'parent', 'professional', 'organization']);
 assert.deepEqual(preview.workspaces.map(item => item.counts.conversations), [1, 1, 0, 0, 0]);
 assert.equal(preview.workspaces.some(item => item.sourceWorkspaceId === 'demo-teacher:teacher'), false);
 assert.equal(preview.transferPerformed, false);
 assert.equal(preview.readyForOwnerMapping, true);
 assert.equal(writes, priorWrites);
 assert.deepEqual(memory, before);
 assert.equal(JSON.stringify(preview).includes('visionary.test'), false);
});

test('scoped content, activity and evidence are counted while foreign data is excluded', () => {
 memory.set('visionary_content_v1', JSON.stringify({ version: 1, spaces: {
  'demo-adult:student': { graphs: [{ syllabus: { status: 'provisional' }, concepts: [{ status: 'provisional' }] }], aliases: { provisional: 'official' }, gaps: [{}] },
  'demo-teacher:teacher': { graphs: [{ syllabus: { status: 'official' }, concepts: [] }], aliases: {}, gaps: [] },
 } }));
 memory.set('visionary_learning_pipeline_v1', JSON.stringify({ version: 1, spaces: { 'demo-adult:student': { units: [{ id: 'unit-1' }] } } }));
 memory.set('visionary_mentor_v1', JSON.stringify({ version: 1, spaces: { 'demo-adult:student': { owner: 'demo-adult', role: 'student', evidence: [{}], events: [{}, {}], memory: [{}] } } }));
 const result = inspectLocalMigration(ctx()).workspaces[0].counts;
 assert.equal(result.contentGraphs, 1);
 assert.equal(result.provisionalConcepts, 1);
 assert.equal(result.conceptAliases, 1);
 assert.equal(result.dataGaps, 1);
 assert.equal(result.learningUnits, 1);
 assert.equal(result.evidence, 1);
 assert.equal(result.events, 2);
 assert.equal(result.memoryEntries, 1);
});

test('unowned records and connected organization spaces require review instead of automatic assignment', () => {
 memory.set('visionary_learning_pipeline_v1', JSON.stringify({ version: 1, spaces: { 'unknown-workspace': { units: [{}] } } }));
 edit('visionary_workspace_v2', db => {
  db.workspaces.push({ id: 'demo-adult:teacher:org:school', personId: 'demo-adult', role: 'teacher', organizationId: 'school', name: 'School', lastPath: '/dashboard/home' });
  db.data['demo-adult:teacher:org:school'] = structuredClone(db.data['demo-adult:student']);
  db.relationships.push({ id: 'r1', from: 'demo-adult', to: 'demo-teacher', type: 'teacher', scope: ['progress'], status: 'active' });
 });
 const preview = inspectLocalMigration(ctx());
 assert.equal(preview.unassignedStoreSpaces, 1);
 assert.equal(preview.connectedWorkspacesNeedingReview, 1);
 assert.equal(preview.relationshipsNeedingReconsent, 1);
 assert.equal(preview.readyForOwnerMapping, false);
 assert.equal(preview.workspaces.length, 5);
 assert.equal(preview.blockers.length, 2);
});

test('mismatched learning-state owner and malformed store versions fail closed without changing saved data', () => {
 memory.set('visionary_mentor_v1', JSON.stringify({ version: 1, spaces: { 'demo-adult:student': { owner: 'demo-teacher', role: 'student', evidence: [], events: [], memory: [] } } }));
 const mismatch = inspectLocalMigration(ctx());
 assert.equal(mismatch.readyForOwnerMapping, false);
 assert.equal(mismatch.workspaces.length, 4);
 memory.set('visionary_content_v1', JSON.stringify({ version: 9, spaces: {} }));
 const before = new Map(memory); const priorWrites = writes;
 assert.throws(() => inspectLocalMigration(ctx()), /need review/);
 assert.equal(writes, priorWrites);
 assert.deepEqual(memory, before);
});

test('duplicate workspace identifiers cannot be assigned to the current owner by guesswork', () => {
 edit('visionary_workspace_v2', db => db.workspaces.push({ ...db.workspaces.find(item => item.id === 'demo-adult:student'), personId: 'demo-teacher' }));
 const preview = inspectLocalMigration(ctx());
 assert.equal(preview.readyForOwnerMapping, false);
 assert.equal(preview.workspaces.some(item => item.sourceWorkspaceId === 'demo-adult:student'), false);
 assert.match(preview.blockers.join(' '), /conflicting owners/);
});

test('a forged workspace or cancelled preview cannot inspect another person’s migration', () => {
 assert.throws(() => inspectLocalMigration({ ...ctx(), personId: 'demo-teacher' }), /access/);
 const controller = new AbortController(); controller.abort();
 assert.throws(() => inspectLocalMigration(ctx('demo-adult', 'student', controller.signal)), error => error.name === 'AbortError');
});

test('a proposed target map requires every role once and never becomes a transfer', () => {
 const source = inspectLocalMigration(ctx()).workspaces;
 const target = source.map((item, index) => ({ sourceWorkspaceId: item.sourceWorkspaceId, targetWorkspaceId: `server-workspace-${index}`, role: item.role }));
 const before = new Map(memory); const priorWrites = writes;
 const plan = planLocalMigrationMapping(ctx(), 'server-person-1', target);
 assert.equal(plan.workspaces.length, 5);
 assert.equal(plan.requiresServerVerification, true);
 assert.equal(plan.requiresUserConfirmation, true);
 assert.equal(plan.transferPerformed, false);
 assert.equal(writes, priorWrites);
 assert.deepEqual(memory, before);
 assert.throws(() => planLocalMigrationMapping(ctx(), 'server-person-1', target.slice(1)), /Map every owned/);
 assert.throws(() => planLocalMigrationMapping(ctx(), 'server-person-1', target.map((item, index) => index === 1 ? { ...item, targetWorkspaceId: target[0].targetWorkspaceId } : item)), /duplicate/);
 assert.throws(() => planLocalMigrationMapping(ctx(), 'server-person-1', target.map((item, index) => index === 1 ? { ...item, role: 'student' } : item)), /cross-role/);
});

test('unassigned records block a proposed mapping even when all personal roles have target IDs', () => {
 const source = inspectLocalMigration(ctx()).workspaces;
 memory.set('visionary_learning_pipeline_v1', JSON.stringify({ version: 1, spaces: { unassigned: { units: [{}] } } }));
 assert.throws(() => planLocalMigrationMapping(ctx(), 'server-person-1', source.map((item, index) => ({ sourceWorkspaceId: item.sourceWorkspaceId, targetWorkspaceId: `server-${index}`, role: item.role }))), /unresolved local records/);
});
