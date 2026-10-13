import test,{beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {storage,fixture,reset} from './fixtures/classCurriculum.mjs';
import * as w from '../src/services/workspaceService.ts';
import {appClient} from '../src/api/appClient.js';
const parent={personId:'demo-parent',workspaceId:'demo-parent:parent',role:'parent',locale:'en'};
beforeEach(()=>{reset();w.configureMock({now:()=>new Date('2026-10-04T12:00:00Z')});});
async function setup(){const f=await fixture({learnerPersona:'minor-cbse'});await appClient.entities.Assignment.update(f.assignment.id,{due_date:'2026-10-06'});assert.equal(w.familyClassworkDigest(parent,f.learner.personId).upcoming.length,1);return f;}
for(const status of ['pending','revoked','expired','unreadable'])test('parent upcoming Work classwork excludes '+status+' learner membership without rewriting classwork',async()=>{
 const f=await setup(),assignments=storage.get('visionary_entity_Assignment'),enrollments=storage.get('visionary_entity_Enrollment');
 const rows=JSON.parse(storage.get('visionary_entity_OrganizationInvite')),member=rows.find(row=>row.email==='minor-cbse@visionary.test'&&row.role==='student');if(status==='expired')member.expiresAt='2000-01-01T00:00:00Z';else if(status==='unreadable')member.expiresAt='not-a-date';else member.status=status;storage.set('visionary_entity_OrganizationInvite',JSON.stringify(rows));
 assert.deepEqual(w.familyClassworkDigest(parent,f.learner.personId).upcoming,[]);assert.equal(storage.get('visionary_entity_Assignment'),assignments);assert.equal(storage.get('visionary_entity_Enrollment'),enrollments);
 member.status='active';delete member.expiresAt;storage.set('visionary_entity_OrganizationInvite',JSON.stringify(rows));assert.equal(w.familyClassworkDigest(parent,f.learner.personId).upcoming[0].id,f.assignment.id);
});
test('failed guardian stop preserves consent, notifications and child records; explicit retry stops only that child',async()=>{
 const f=await setup(),before=storage.get('visionary_workspace_v2'),set=localStorage.setItem,link='demo-parent:demo-minor-cbse';
 try{localStorage.setItem=(key,value)=>{if(key==='visionary_workspace_v2')throw Error('Fixture quota');set(key,value);};assert.throws(()=>w.changeRelationship(parent,link,'revoked'),/could not be saved/);}finally{localStorage.setItem=set;}
 assert.equal(storage.get('visionary_workspace_v2'),before);assert.equal(w.familyClassworkDigest(parent,f.learner.personId).upcoming.length,1);w.changeRelationship(parent,link,'revoked');assert.throws(()=>w.familyClassworkDigest(parent,f.learner.personId),/no longer shared/);assert.ok(w.familyReports(parent).some(row=>row.id==='demo-bengali'));
});
test('failed guardian renewal and acceptance preserve bytes and require an explicitly accepted new request',async()=>{
 const f=await setup(),link='demo-parent:demo-minor-cbse';w.changeRelationship(parent,link,'revoked');const set=localStorage.setItem;
 const fail=operation=>{const before=storage.get('visionary_workspace_v2');try{localStorage.setItem=(key,value)=>{if(key==='visionary_workspace_v2')throw Error('Fixture quota');set(key,value);};assert.throws(operation,/could not be saved/);}finally{localStorage.setItem=set;}assert.equal(storage.get('visionary_workspace_v2'),before);};
 fail(()=>w.renewGuardianRelationship(parent,link));w.renewGuardianRelationship(parent,link);const pending=w.visibleRelationships(parent).filter(row=>row.to===f.learner.personId&&row.status==='pending');assert.equal(pending.length,1);assert.throws(()=>w.familyClassworkDigest(parent,f.learner.personId),/no longer shared/);fail(()=>w.changeRelationship(f.learner,pending[0].id,'active'));assert.throws(()=>w.familyClassworkDigest(parent,f.learner.personId),/no longer shared/);w.changeRelationship(f.learner,pending[0].id,'active');assert.equal(w.familyClassworkDigest(parent,f.learner.personId).upcoming.length,1);assert.equal(w.visibleRelationships(parent).find(row=>row.id===link).status,'revoked');
});

test('orphaned active enrollment cannot offer an upcoming class without its source classroom',async()=>{
 const f=await setup(),assignments=storage.get('visionary_entity_Assignment'),before=storage.get('visionary_entity_Classroom');storage.set('visionary_entity_Classroom','[]');assert.deepEqual(w.familyClassworkDigest(parent,f.learner.personId).upcoming,[]);assert.equal(storage.get('visionary_entity_Assignment'),assignments);storage.set('visionary_entity_Classroom',before);assert.equal(w.familyClassworkDigest(parent,f.learner.personId).upcoming.length,1);
});
