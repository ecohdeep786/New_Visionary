import test from 'node:test';
import assert from 'node:assert/strict';
import { appClient } from '../src/api/appClient.js';
import { bootstrapPerson, saveResource, snapshot, resourceRevision, archiveResource } from '../src/services/workspaceService.ts';
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

test('cohort save rechecks membership after an asynchronous roster read', async () => {
 memory.clear();const email='cohort-pending@visionary.test';
 await appClient.auth.register({email,password:'Preview-test-123!'});await appClient.auth.verifyOtp({email});
 const admin=await appClient.auth.updateMe({identity:'organization',onboarding_complete:true});const person=bootstrapPerson(admin);
 const ctx={personId:admin.id,workspaceId:person.active,role:'organization',locale:'en'};
 const member={id:'pending-member',organization_email:email,email:'teacher@pending.test',role:'teacher',status:'active'};
 localStorage.setItem('visionary_entity_OrganizationInvite',JSON.stringify([member]));
 const original=appClient.entities;
 let release;let started;const entered=new Promise(resolve=>started=resolve);
 appClient.entities=new Proxy(original,{get(target,name){const api=Reflect.get(target,name);return name==='Classroom'?{...api,filter:async(...args)=>{const rows=await api.filter(...args);started();await new Promise(resolve=>release=resolve);return rows;}}:api;}});
 try{const pending=saveCohort(ctx,{title:'Pending cohort',body:'Retained local edit',members:[member.email],classIds:[]});await entered;
  localStorage.setItem('visionary_entity_OrganizationInvite',JSON.stringify([{...member,status:'removed'}]));const before=localStorage.getItem('visionary_workspace_v2');release();
  await assert.rejects(pending,/no longer connected/);assert.equal(localStorage.getItem('visionary_workspace_v2'),before);
 }finally{appClient.entities=original;}
});

test('cohort concurrent changes and archive reject a stale editor without overwriting either record', async () => {
 memory.clear();
 const email='cohort-conflict@visionary.test';
 await appClient.auth.register({email,password:'Preview-test-123!'});
 await appClient.auth.verifyOtp({email});
 const admin=await appClient.auth.updateMe({identity:'organization',onboarding_complete:true});
 const person=bootstrapPerson(admin);
 const ctx={personId:admin.id,workspaceId:person.active,role:'organization',locale:'en'};
 const original=await saveCohort(ctx,{title:'Initial team',body:'Initial purpose',members:[],classIds:[]});
 const base=resourceRevision(original);
 const latest=await saveCohort(ctx,{...original,title:'Other tab team'},base);
 const before=localStorage.getItem('visionary_workspace_v2');
 await assert.rejects(saveCohort(ctx,{...original,body:'Retained unsaved purpose'},base),error=>error.name==='ResourceConflictError');
 assert.equal(localStorage.getItem('visionary_workspace_v2'),before);
 assert.equal(snapshot(ctx).resources.find(row=>row.id===original.id).title,'Other tab team');
 archiveResource(ctx,original.id);
 const archived=localStorage.getItem('visionary_workspace_v2');
 await assert.rejects(saveCohort(ctx,{...latest,body:'Stale attempt after archive'},resourceRevision(latest)),error=>error.name==='ResourceConflictError');
 assert.equal(localStorage.getItem('visionary_workspace_v2'),archived);
 assert.equal(snapshot(ctx).resources.find(row=>row.id===original.id).status,'archived');
});
