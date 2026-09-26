import test from 'node:test';
import assert from 'node:assert/strict';
import { appClient } from '../src/api/appClient.js';
import { bootstrapPerson, saveResource, snapshot } from '../src/services/workspaceService.ts';
import { organizationRoster, saveCohort } from '../src/services/classroomService.js';

const memory = new Map();
globalThis.localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, String(value)), removeItem: key => memory.delete(key) };
globalThis.window = { dispatchEvent() {}, location: { origin: 'http://localhost:5173', search: '' } };
globalThis.CustomEvent ??= class { constructor(type) { this.type = type; } };

test('organization cohorts accept only current own roster and classes, never private learner state', async () => {
 memory.clear();
 const email = 'cohort-admin@visionary.test';
 await appClient.auth.register({ email, password: 'Preview-test-123!' });
 await appClient.auth.verifyOtp({ email });
 const admin = await appClient.auth.updateMe({ identity: 'organization', onboarding_complete: true });
 const person = bootstrapPerson(admin);
 const ctx = { personId: admin.id, workspaceId: person.active, role: 'organization', locale: 'en' };
 const member = { id: 'accepted-teacher', organization_email: email, email: 'cohort-teacher@visionary.test', role: 'teacher', status: 'active' };
 const unrelated = { id: 'unrelated', organization_email: 'elsewhere@visionary.test', email: 'other@visionary.test', role: 'student', status: 'active' };
 localStorage.setItem('visionary_entity_OrganizationInvite', JSON.stringify([member, unrelated]));
 const classroom = { id: 'own-class', organization_email: email, name: 'Reasoning together', teacher_email: member.email };
 localStorage.setItem('visionary_entity_Classroom', JSON.stringify([classroom, { id: 'foreign-class', organization_email: unrelated.organization_email, name: 'Private' }]));
 const roster = await organizationRoster(ctx);
 assert.deepEqual(roster.members.map(item => item.email), [member.email]);
 assert.deepEqual(roster.classes.map(item => item.id), [classroom.id]);
 const cohort = await saveCohort(ctx, { title: 'Applied reasoning', body: 'Shared objective, not personal records.', members: [member.email], classIds: [classroom.id] });
 assert.equal(cohort.members.length, 1);
 assert.equal(cohort.classIds[0], classroom.id);
 assert.equal(JSON.stringify(snapshot(ctx)).includes('private conversation'), false);
 await assert.rejects(saveCohort(ctx, { title: 'Foreign', body: '', members: [unrelated.email], classIds: [] }), /no longer connected/);
 await assert.rejects(saveCohort(ctx, { title: 'Foreign class', body: '', members: [], classIds: ['foreign-class'] }), /no longer linked/);
 const lesson = saveResource(ctx, { title: 'Lesson', body: 'Preparation', kind: 'lesson' });
 await assert.rejects(saveCohort(ctx, { id: lesson.id, title: 'Convert', body: '', members: [], classIds: [] }), /not available/);
 localStorage.setItem('visionary_entity_OrganizationInvite', JSON.stringify([{ ...member, status: 'removed' }, unrelated]));
 await assert.rejects(saveCohort(ctx, { ...cohort }), /no longer connected/);
 assert.equal(snapshot(ctx).resources.find(item => item.id === cohort.id).members[0], member.email, 'prior saved cohort is preserved after revocation');
});
