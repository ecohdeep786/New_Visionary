import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as workspace from '../src/services/workspaceService.ts';
import { getCareerPath, saveCareerTarget } from '../src/services/roleMentorService.ts';

const memory = new Map();
globalThis.localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, String(value)), removeItem: key => memory.delete(key) };
globalThis.window = { dispatchEvent() {} };
globalThis.CustomEvent ??= class { constructor(type) { this.type = type; } };
const personal = { personId: 'demo-employee', workspaceId: 'demo-employee:professional', role: 'professional', locale: 'en' };
const company = { personId: 'demo-company-admin', workspaceId: 'demo-company-admin:organization', role: 'organization', locale: 'en' };
const invitation = { id: 'sponsor', organization_email: 'company-admin@visionary.test', organization_name: 'Example Company', email: 'employee@visionary.test', role: 'professional', status: 'pending' };

beforeEach(() => {
 memory.clear();
 workspace.configureMock({ latency: 0, fault: 'none', now: () => new Date('2026-09-30T12:00:00Z') });
 workspace.seedDemo('employee');
 localStorage.setItem('visionary_entity_OrganizationInvite', JSON.stringify([invitation]));
});

test('accepted professional invitation creates a separate work space and revocation returns to intact personal work', () => {
 const personalGoal = saveCareerTarget(personal, { title: 'Personal career target', body: 'PRIVATE_PERSONAL_NOTES' });
 const personalProject = workspace.saveArtifact(personal, { title: 'Personal portfolio', body: 'PRIVATE_PERSONAL_PROJECT', status: 'draft' });
 assert.equal(workspace.bootstrapPerson({ id: personal.personId, email: invitation.email, identity: 'professional' }).workspaces.some(row => row.organizationId === invitation.organization_email), false);
 workspace.addRole(personal.personId, 'student');
 assert.throws(() => workspace.changeRelationship({ ...personal, workspaceId: 'demo-employee:student', role: 'student' }, 'legacy:OrganizationInvite:sponsor', 'active'), /invited workspace role/);
 workspace.changeRelationship(personal, 'legacy:OrganizationInvite:sponsor', 'active');
 const accepted = workspace.bootstrapPerson({ id: personal.personId, email: invitation.email, identity: 'professional' });
 const sponsored = accepted.workspaces.find(row => row.organizationId === invitation.organization_email && row.role === 'professional');
 assert.ok(sponsored);
 assert.match(sponsored.name, /Example Company/);
 const work = { ...personal, workspaceId: sponsored.id };
 assert.equal(getCareerPath(work).goal, null);
 assert.deepEqual(workspace.snapshot(work).artifacts, []);
 saveCareerTarget(work, { title: 'Company learning target', body: 'WORK_ONLY_NOTES' });
 workspace.saveArtifact(work, { title: 'Company project', body: 'WORK_ONLY_PROJECT', status: 'draft' });
 assert.equal(getCareerPath(personal).goal.id, personalGoal.id);
 assert.equal(workspace.snapshot(personal).artifacts[0].id, personalProject.id);
 assert.equal(JSON.stringify(getCareerPath(work)).includes('PRIVATE_PERSONAL'), false);
 workspace.selectWorkspace(personal.personId, sponsored.id);
 workspace.changeRelationship(company, 'legacy:OrganizationInvite:sponsor', 'revoked');
 const after = workspace.bootstrapPerson({ id: personal.personId, email: invitation.email, identity: 'professional' });
 assert.equal(after.active, personal.workspaceId);
 assert.equal(after.workspaces.some(row => row.id === sponsored.id), false);
 assert.throws(() => workspace.snapshot(work), /no longer active/);
 assert.equal(getCareerPath(personal).goal.id, personalGoal.id);
 assert.equal(workspace.snapshot(personal).artifacts[0].body, 'PRIVATE_PERSONAL_PROJECT');
});
