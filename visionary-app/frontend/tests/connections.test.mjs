import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as workspace from '../src/services/workspaceService.ts';

const memory = new Map();
globalThis.localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, String(value)), removeItem: key => memory.delete(key) };
globalThis.window = { dispatchEvent() {} };
globalThis.CustomEvent ??= class { constructor(type) { this.type = type; } };
const ctx = (person, role) => ({ personId: `demo-${person}`, workspaceId: `demo-${person}:${role}`, role, locale: 'en' });
const clockAt = iso => workspace.configureMock({ latency: 0, fault: 'none', now: () => new Date(iso) });

beforeEach(() => { memory.clear(); clockAt('2026-09-27T12:00:00Z'); workspace.seedDemo('adult'); });

test('guardian consent is visible to both sides, scoped, accepted by learner, and closed on revocation', () => {
 const parent = ctx('adult', 'parent'); const learner = ctx('minor-cbse', 'student');
 assert.throws(() => workspace.requestRelationship(ctx('teacher', 'teacher'), 'minor-cbse@visionary.test', 'guardian'), /parent workspace/);
 workspace.requestRelationship(parent, 'minor-cbse@visionary.test', 'guardian');
 const requested = workspace.visibleRelationships(parent).find(r => r.from === parent.personId && r.to === learner.personId);
 assert.equal(requested.status, 'pending'); assert.deepEqual(requested.scope, ['progress-summary']);
 assert.equal(workspace.visibleRelationships(learner).find(r => r.id === requested.id)?.status, 'pending');
 assert.throws(() => workspace.changeRelationship(parent, requested.id, 'active'), /recipient/);
 workspace.changeRelationship(learner, requested.id, 'active');
 assert.equal(workspace.familyReports(parent).some(r => r.id === learner.personId), true);
 workspace.changeRelationship(learner, requested.id, 'revoked');
 assert.equal(workspace.familyReports(parent).some(r => r.id === learner.personId), false);
 assert.equal(workspace.visibleRelationships(parent).find(r => r.id === requested.id)?.status, 'revoked');
});

test('expired request cannot be accepted, remains in history, and a new request can be saved', () => {
 const parent = ctx('adult', 'parent'); const learner = ctx('bengali', 'student');
 workspace.requestRelationship(parent, 'bengali@visionary.test', 'guardian');
 const first = workspace.visibleRelationships(parent).find(r => r.from === parent.personId && r.to === learner.personId);
 clockAt('2026-10-05T12:00:00Z');
 assert.equal(workspace.visibleRelationships(parent).find(r => r.id === first.id)?.status, 'expired');
 assert.throws(() => workspace.changeRelationship(learner, first.id, 'active'), /expired/);
 workspace.requestRelationship(parent, 'bengali@visionary.test', 'guardian');
 const rows = workspace.visibleRelationships(parent).filter(r => r.from === parent.personId && r.to === learner.personId);
 assert.deepEqual(rows.map(r => r.status), ['expired', 'pending']);
});

test('an expired active guardian permission closes reports and can be renewed only with fresh learner acceptance', () => {
 const parent = ctx('adult', 'parent'); const learner = ctx('bengali', 'student');
 workspace.requestRelationship(parent, 'bengali@visionary.test', 'guardian');
 const first = workspace.visibleRelationships(parent).find(row => row.to === learner.personId);
 workspace.changeRelationship(learner, first.id, 'active');
 assert.equal(workspace.familyReports(parent).some(row => row.id === learner.personId), true);
 const db = JSON.parse(localStorage.getItem('visionary_workspace_v2'));
 db.relationships.find(row => row.id === first.id).expiresAt = '2026-09-28T12:00:00Z';
 localStorage.setItem('visionary_workspace_v2', JSON.stringify(db));
 clockAt('2026-09-29T12:00:00Z');
 assert.equal(workspace.visibleRelationships(parent).find(row => row.id === first.id).status, 'expired');
 assert.equal(workspace.familyReports(parent).some(row => row.id === learner.personId), false);
 workspace.renewGuardianRelationship(parent, first.id);
 const rows = workspace.visibleRelationships(parent).filter(row => row.to === learner.personId);
 assert.deepEqual(rows.map(row => row.status), ['expired', 'pending']);
 assert.throws(() => workspace.renewGuardianRelationship(parent, first.id), /already exists/);
 assert.equal(workspace.familyReports(parent).some(row => row.id === learner.personId), false);
 workspace.changeRelationship(learner, rows[1].id, 'active');
 assert.equal(workspace.familyReports(parent).some(row => row.id === learner.personId), true);
});

test('declined guardian request remains history and a parent may request again', () => {
 const parent = ctx('adult', 'parent'); const learner = ctx('minor-cbse', 'student');
 workspace.requestRelationship(parent, 'minor-cbse@visionary.test', 'guardian');
 const first = workspace.visibleRelationships(parent).find(row => row.to === learner.personId);
 workspace.changeRelationship(learner, first.id, 'declined');
 assert.equal(workspace.familyReports(parent).some(row => row.id === learner.personId), false);
 assert.throws(() => workspace.renewGuardianRelationship(learner, first.id), /parent workspace/);
 workspace.renewGuardianRelationship(parent, first.id);
 assert.deepEqual(workspace.visibleRelationships(parent).filter(row => row.to === learner.personId).map(row => row.status), ['declined', 'pending']);
});

test('a failed connection write leaves no phantom request and an organization invite needs its intended role', () => {
 const parent = ctx('adult', 'parent');
 const previous = localStorage.getItem('visionary_workspace_v2'); const setItem = localStorage.setItem;
 localStorage.setItem = (key, value) => { if (key === 'visionary_workspace_v2') throw new Error('Storage full'); setItem(key, value); };
 try { assert.throws(() => workspace.requestRelationship(parent, 'bengali@visionary.test', 'guardian'), /could not be saved/); }
 finally { localStorage.setItem = setItem; }
 assert.equal(localStorage.getItem('visionary_workspace_v2'), previous);
 workspace.requestRelationship(parent, 'bengali@visionary.test', 'guardian');
 assert.equal(workspace.visibleRelationships(parent).filter(r => r.from === parent.personId && r.to === 'demo-bengali').length, 1);
 localStorage.setItem('visionary_entity_OrganizationInvite', JSON.stringify([{ id: 'role-invite', organization_email: 'school-admin@visionary.test', email: 'adult@visionary.test', role: 'teacher', status: 'pending' }]));
 assert.throws(() => workspace.changeRelationship(ctx('adult', 'student'), 'legacy:OrganizationInvite:role-invite', 'active'), /invited workspace role/);
 workspace.changeRelationship(ctx('adult', 'teacher'), 'legacy:OrganizationInvite:role-invite', 'active');
 assert.equal(workspace.visibleRelationships(ctx('adult', 'teacher')).find(r => r.id === 'legacy:OrganizationInvite:role-invite')?.status, 'active');
});
