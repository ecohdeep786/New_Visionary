import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as workspace from '../src/services/workspaceService.ts';
import { previewPolicy } from '../src/api/previewPermissions.js';

const memory = new Map();
globalThis.localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, String(value)), removeItem: key => memory.delete(key) };
globalThis.window = { dispatchEvent() {} };
globalThis.CustomEvent ??= class { constructor(type) { this.type = type; } };
const ctx = (person, role, workspaceId = `demo-${person}:${role}`) => ({ personId: `demo-${person}`, workspaceId, role, locale: 'en' });
const rows = () => JSON.parse(localStorage.getItem('visionary_entity_OrganizationInvite') || '[]');
const at = date => workspace.configureMock({ latency: 0, fault: 'none', now: () => new Date(date) });

beforeEach(() => { memory.clear(); at('2026-09-30T12:00:00Z'); workspace.seedDemo('school-admin'); });

test('organization invitation is scoped, accepted only in the invited role and keeps action history', () => {
 const org = ctx('school-admin', 'organization'); const teacher = ctx('school-teacher', 'teacher');
 assert.throws(() => workspace.requestOrganizationInvite(teacher, 'employee@visionary.test', 'professional'), /organization admin/);
 assert.throws(() => workspace.requestOrganizationInvite(org, 'school-admin@visionary.test', 'teacher'), /another person/);
 const invite = workspace.requestOrganizationInvite(org, 'school-teacher@visionary.test', 'teacher');
 assert.equal(invite.status, 'pending'); assert.equal(invite.history.length, 1);
 assert.equal(workspace.organizationInvites(org).find(row => row.id === invite.id)?.history[0].action, 'requested');
 assert.equal(workspace.organizationInvites(ctx('company-admin', 'organization')).some(row => row.id === invite.id), false);
 assert.throws(() => workspace.requestOrganizationInvite(org, 'school-teacher@visionary.test', 'professional'), /already has an open/);
 assert.throws(() => workspace.changeOrganizationInvite(ctx('employee', 'professional'), invite.id, 'active'), /outside your workspace/);
 workspace.addRole('demo-school-teacher', 'professional');
 assert.throws(() => workspace.changeOrganizationInvite(ctx('school-teacher', 'professional'), invite.id, 'active'), /invited workspace role/);
 assert.throws(() => workspace.changeOrganizationInvite(org, invite.id, 'active'), /invited member/);
 workspace.changeOrganizationInvite(teacher, invite.id, 'active');
 const active = workspace.organizationInvites(teacher).find(row => row.id === invite.id);
 assert.equal(active.status, 'active'); assert.equal(active.expiresAt, undefined);
 assert.deepEqual(active.history.map(event => event.action), ['requested', 'accepted']);
 const available = workspace.bootstrapPerson({ id: 'demo-school-teacher', email: 'school-teacher@visionary.test', identity: 'teacher' }).workspaces;
 const work = available.find(row => row.organizationId === 'school-admin@visionary.test');
 assert.ok(work);
 workspace.changeOrganizationInvite(org, invite.id, 'revoked');
 assert.deepEqual(workspace.organizationInvites(org).find(row => row.id === invite.id).history.map(event => event.action), ['requested', 'accepted', 'revoked']);
 assert.throws(() => workspace.selectWorkspace('demo-school-teacher', work.id), /no longer active/);
 assert.ok(workspace.bootstrapPerson({ id: 'demo-school-teacher', email: 'school-teacher@visionary.test', identity: 'teacher' }).workspaces.some(row => row.id === 'demo-school-teacher:teacher'));
});

test('decline, cancel and expiration preserve closed requests and permit a new invitation', () => {
 const org = ctx('school-admin', 'organization'); const member = ctx('employee', 'professional');
 const declined = workspace.requestOrganizationInvite(org, 'employee@visionary.test', 'professional');
 workspace.changeOrganizationInvite(member, declined.id, 'declined');
 assert.deepEqual(workspace.organizationInvites(org).find(row => row.id === declined.id).history.map(event => event.action), ['requested', 'declined']);
 const cancelled = workspace.requestOrganizationInvite(org, 'employee@visionary.test', 'professional');
 assert.throws(() => workspace.changeOrganizationInvite(member, cancelled.id, 'cancelled'), /organization can cancel/);
 workspace.changeOrganizationInvite(org, cancelled.id, 'cancelled');
 const expired = workspace.requestOrganizationInvite(org, 'employee@visionary.test', 'professional');
 at('2026-10-08T12:00:00Z');
 assert.equal(workspace.organizationInvites(org).find(row => row.id === expired.id).status, 'expired');
 assert.throws(() => workspace.changeOrganizationInvite(member, expired.id, 'active'), /expired/);
 const renewed = workspace.requestOrganizationInvite(org, 'employee@visionary.test', 'professional');
 assert.notEqual(renewed.id, expired.id);
 assert.equal(workspace.organizationInvites(org).filter(row => row.email === 'employee@visionary.test').length, 4);
});

test('failed local write leaves invitation and audit unchanged for retry', () => {
 const org = ctx('school-admin', 'organization'); const member = ctx('employee', 'professional');
 const invite = workspace.requestOrganizationInvite(org, 'employee@visionary.test', 'professional');
 const before = localStorage.getItem('visionary_entity_OrganizationInvite'); const original = localStorage.setItem;
 localStorage.setItem = (key, value) => { if (key === 'visionary_entity_OrganizationInvite') throw Error('Storage full'); original(key, value); };
 try { assert.throws(() => workspace.changeOrganizationInvite(member, invite.id, 'active'), /could not be saved/); }
 finally { localStorage.setItem = original; }
 assert.equal(localStorage.getItem('visionary_entity_OrganizationInvite'), before);
 assert.equal(rows().find(row => row.id === invite.id).history.length, 1);
 workspace.changeOrganizationInvite(member, invite.id, 'active');
 assert.equal(rows().find(row => row.id === invite.id).history.length, 2);
});

test('linked classes require the active work role and generic entity writes cannot bypass invitation history', () => {
 const org = ctx('school-admin', 'organization'); const member = ctx('school-teacher', 'teacher');
 const invite = workspace.requestOrganizationInvite(org, 'school-teacher@visionary.test', 'teacher');
 workspace.changeOrganizationInvite(member, invite.id, 'active');
 const linked = { id: 'linked-class', organization_email: 'school-admin@visionary.test', teacher_email: 'school-teacher@visionary.test' };
 const independent = { id: 'private-class', teacher_email: 'school-teacher@visionary.test' };
 const read = name => name === 'Classroom' ? [linked, independent] : name === 'OrganizationInvite' ? rows() : [];
 const personal = previewPolicy({ email: member.personId.replace('demo-', '') + '@visionary.test', id: member.personId, identity: 'teacher' }, read);
 const work = previewPolicy({ email: 'school-teacher@visionary.test', id: member.personId, identity: 'teacher', organization_id: 'school-admin@visionary.test' }, read);
 assert.equal(personal.canRead('Classroom', linked), false);
 assert.equal(personal.canRead('Classroom', independent), true);
 assert.equal(work.canRead('Classroom', linked), true);
 assert.equal(work.canRead('Classroom', independent), false);
 assert.throws(() => work.assertWrite('OrganizationInvite', rows()[0], 'update', { status: 'revoked' }), /not permitted/);
 workspace.changeOrganizationInvite(org, invite.id, 'revoked');
 assert.equal(work.canRead('Classroom', linked), false);
});

test('an expired active imported membership closes its work workspace and linked class view', () => {
 const org = ctx('school-admin', 'organization'); const member = ctx('school-teacher', 'teacher');
 const invite = workspace.requestOrganizationInvite(org, 'school-teacher@visionary.test', 'teacher');
 workspace.changeOrganizationInvite(member, invite.id, 'active');
 const work = workspace.bootstrapPerson({ id: 'demo-school-teacher', email: 'school-teacher@visionary.test', identity: 'teacher' }).workspaces.find(row => row.organizationId === 'school-admin@visionary.test');
 assert.ok(work);
 const saved = rows(); saved.find(row => row.id === invite.id).expiresAt = '2026-09-29T12:00:00Z';
 localStorage.setItem('visionary_entity_OrganizationInvite', JSON.stringify(saved));
 assert.equal(workspace.organizationInvites(org).find(row => row.id === invite.id).status, 'expired');
 assert.throws(() => workspace.selectWorkspace('demo-school-teacher', work.id), /no longer active/);
 const linked = { id: 'linked-class', organization_email: 'school-admin@visionary.test', teacher_email: 'school-teacher@visionary.test' };
 const policy = previewPolicy({ email: 'school-teacher@visionary.test', id: member.personId, identity: 'teacher', organization_id: 'school-admin@visionary.test' }, name => name === 'Classroom' ? [linked] : name === 'OrganizationInvite' ? rows() : []);
 assert.equal(policy.canRead('Classroom', linked), false);
 assert.equal(workspace.bootstrapPerson({ id: 'demo-school-teacher', email: 'school-teacher@visionary.test', identity: 'teacher' }).workspaces.some(row => row.id === work.id), false);
});
