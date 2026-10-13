import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as workspace from '../src/services/workspaceService.ts';

const storage = new Map();
globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: key => storage.delete(key) };
globalThis.window = { dispatchEvent() {} };
globalThis.CustomEvent ??= class { constructor(type) { this.type = type; } };
const ctx = (person, role) => ({ personId: `demo-${person}`, workspaceId: `demo-${person}:${role}`, role, locale: 'en' });
beforeEach(() => { storage.clear(); workspace.configureMock({ latency: 0, fault: 'none', now: () => new Date('2026-09-30T12:00:00Z') }); workspace.seedDemo('school-admin'); });

test('organization updates stay scoped and older notices point to current permission without private data', () => {
 const org = ctx('school-admin', 'organization'); const employee = ctx('employee', 'professional');
 const invitation = workspace.requestOrganizationInvite(org, 'employee@visionary.test', 'professional');
 workspace.changeOrganizationInvite(employee, invitation.id, 'active');
 workspace.saveResource(employee, { title: 'Private goal', body: 'PRIVATE_WORK_NOTES', kind: 'goal' });
 workspace.changeOrganizationInvite(org, invitation.id, 'revoked');
 workspace.requestOrganizationInvite(ctx('company-admin', 'organization'), 'teacher@visionary.test', 'teacher');
 const result = workspace.organizationUpdates(org);
 assert.equal(result.items.length, 3);
 assert.deepEqual(result.items.map(item => item.action).sort(), ['accepted', 'requested', 'revoked']);
 assert.ok(result.items.every(item => item.currentStatus === 'revoked' && item.path === `/dashboard/people#organization-invite-${invitation.id}`));
 assert.equal(JSON.stringify(result).includes('PRIVATE_WORK_NOTES'), false);
 assert.equal(JSON.stringify(result).includes('teacher@visionary.test'), false);
 workspace.updatePreferences(org, { notifications: 'off' });
 assert.equal(workspace.organizationUpdates(org).items.length, 3, 'off changes delivery preference, not recorded history');
 assert.throws(() => workspace.organizationUpdates(employee), /organization workspace/);
});

test('read acknowledgement survives refresh, is idempotent and a rejected write stays unread', () => {
 const org = ctx('school-admin', 'organization');
 const invitation = workspace.requestOrganizationInvite(org, 'employee@visionary.test', 'professional');
 const previous = localStorage.getItem('visionary_entity_OrganizationInvite'); const original = localStorage.setItem;
 localStorage.setItem = (key, value) => { if (key === 'visionary_entity_OrganizationInvite') throw Error('Storage full'); original(key, value); };
 try { assert.throws(() => workspace.markOrganizationUpdate(org, invitation.id, 0), /could not be saved/); }
 finally { localStorage.setItem = original; }
 assert.equal(localStorage.getItem('visionary_entity_OrganizationInvite'), previous);
 assert.equal(workspace.organizationUpdates(org).items[0].read, false);
 workspace.markOrganizationUpdate(org, invitation.id, 0);
 const acknowledged = localStorage.getItem('visionary_entity_OrganizationInvite');
 workspace.markOrganizationUpdate(org, invitation.id, 0);
 assert.equal(localStorage.getItem('visionary_entity_OrganizationInvite'), acknowledged);
 assert.equal(workspace.organizationUpdates(org).items[0].read, true);
 assert.equal(workspace.organizationAudit(org).entries.length, 1, 'read state does not invent membership actions');
 assert.equal(workspace.organizationInvites(org)[0].status, 'pending');
});

test('foreign and malformed acknowledgements fail; imported events stay honestly incomplete', () => {
 const org = ctx('school-admin', 'organization'); const invitation = workspace.requestOrganizationInvite(org, 'employee@visionary.test', 'professional');
 assert.throws(() => workspace.markOrganizationUpdate(ctx('company-admin', 'organization'), invitation.id, 0), /unavailable/);
 assert.throws(() => workspace.markOrganizationUpdate(ctx('employee', 'professional'), invitation.id, 0), /organization workspace/);
 assert.throws(() => workspace.markOrganizationUpdate(org, invitation.id, -1), /unavailable/);
 assert.throws(() => workspace.markOrganizationUpdate(org, invitation.id, 0.5), /unavailable/);
 const rows = JSON.parse(localStorage.getItem('visionary_entity_OrganizationInvite'));
 rows.push({ id: 'imported', organization_email: 'school-admin@visionary.test', email: 'teacher@visionary.test', role: 'teacher', status: 'active' });
 localStorage.setItem('visionary_entity_OrganizationInvite', JSON.stringify(rows));
 assert.equal(workspace.organizationUpdates(org).importedWithoutHistory, 1);
 assert.equal(workspace.organizationUpdates(org).items.length, 1);
});
