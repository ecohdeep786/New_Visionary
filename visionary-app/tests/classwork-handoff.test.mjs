import test,{beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {storage,fixture,reset} from './fixtures/classCurriculum.mjs';
import {appClient} from '../src/api/appClient.js';
import {addRole,selectWorkspace} from '../src/services/workspaceService.ts';
import {submitClassworkResponses,reviewClasswork} from '../src/services/classroomService.js';
beforeEach(reset);
async function personalFixture(revised=false){
 const f=await fixture(),teacher={...f.teacher,workspaceId:f.teacher.personId+':teacher'},learner={...f.learner,workspaceId:f.learner.personId+':student'};
 selectWorkspace(teacher.personId,teacher.workspaceId);
 const classroom=await appClient.entities.Classroom.create({name:'Personal handoff class',teacher_id:teacher.personId,teacher_email:'teacher@visionary.test',join_code:'HANDOFF'});
 const assignment=await appClient.entities.Assignment.create({class_id:classroom.id,title:'Explain equal parts',description:'Describe equal intervals.',points:10,status:'published'});
 storage.set('visionary_session_token',learner.personId);selectWorkspace(learner.personId,learner.workspaceId);
 await appClient.entities.Enrollment.create({class_id:classroom.id,student_email:'adult@visionary.test',student_id:learner.personId,status:'active',join_code:'HANDOFF'});
 const alternative=addRole(learner.personId,'professional'),args={assignmentId:assignment.id,text:'Two equal intervals.'};
 if(revised){const first=await submitClassworkResponses(learner,args);storage.set('visionary_session_token',teacher.personId);await reviewClasswork(teacher,{submissionId:first.id,status:'revision_requested',feedback:'Describe the lengths.'});storage.set('visionary_session_token',learner.personId);args.text='Both intervals have equal length.';}
 return {teacher,learner,alternative,classroom,assignment,args};
}
async function during(method,change,run,after=false){
 const original=appClient.entities;let pending=true;
 appClient.entities=new Proxy(original,{get(target,name){const entity=target[name];return name==='Submission'?{...entity,async [method](...args){if(!pending)return entity[method](...args);pending=false;if(after){const value=await entity[method](...args);await change();return value;}await change();return entity[method](...args);}}:entity;}});
 try{await run();}finally{appClient.entities=original;}
}
for(const revised of [false,true])test(`pending ${revised?'revision':'first response'} cannot save after a switch to another permitted learner role`,async()=>{
 const f=await personalFixture(revised),before=storage.get('visionary_entity_Submission');
 await during(revised?'update':'create',()=>selectWorkspace(f.learner.personId,f.alternative.id),async()=>assert.rejects(submitClassworkResponses(f.learner,f.args),/workspace changed/));
 assert.equal(storage.get('visionary_entity_Submission'),before);
 selectWorkspace(f.learner.personId,f.learner.workspaceId);assert.ok((await submitClassworkResponses(f.learner,f.args)).id);
});
test('a request from an inactive learner workspace rejects before saving',async()=>{
 const f=await personalFixture();selectWorkspace(f.learner.personId,f.alternative.id);
 await assert.rejects(submitClassworkResponses(f.learner,f.args),/workspace changed/);
 assert.equal(storage.get('visionary_entity_Submission'),undefined);
});
test('idempotent replay cannot return the previous learner response after account handoff',async()=>{
 const f=await personalFixture();await submitClassworkResponses(f.learner,f.args);
 const users=JSON.parse(storage.get('visionary_users')),sessions=JSON.parse(storage.get('visionary_sessions'));
 users.push({id:'demo-professional',email:'professional@visionary.test',identity:'professional',roles:['professional'],age_band:'adult',onboarding_complete:true});sessions.push({token:'other-learner',userId:'demo-professional',email:'professional@visionary.test',expiresAt:Date.now()+86400000});storage.set('visionary_users',JSON.stringify(users));storage.set('visionary_sessions',JSON.stringify(sessions));storage.set('visionary_session_token','other-learner');
 await appClient.entities.Enrollment.create({class_id:f.classroom.id,student_email:'professional@visionary.test',student_id:'demo-professional',status:'active',join_code:'HANDOFF'});
 storage.set('visionary_session_token',f.learner.personId);const before=storage.get('visionary_entity_Submission');
 await during('filter',()=>storage.set('visionary_session_token','other-learner'),async()=>assert.rejects(submitClassworkResponses(f.learner,f.args),/own learning workspace|workspace changed/),true);
 assert.equal(storage.get('visionary_entity_Submission'),before);
});
for(const state of ['pending','expired','revoked'])test(`${state} Work membership at commit denies a learner submission`,async()=>{
 const f=await fixture();storage.set('visionary_session_token',f.learner.personId);
 await during('create',()=>{const rows=JSON.parse(storage.get('visionary_entity_OrganizationInvite'));const member=rows.find(row=>row.email==='adult@visionary.test'&&row.role==='student');assert.ok(member);if(state==='expired')member.expiresAt='2000-01-01T00:00:00Z';else member.status=state;storage.set('visionary_entity_OrganizationInvite',JSON.stringify(rows));},async()=>assert.rejects(submitClassworkResponses(f.learner,{assignmentId:f.assignment.id,text:'Two equal intervals.',selfReview:{parts:'Equal lengths.'}}),/not permitted|not available|no longer active/));
 assert.equal(storage.get('visionary_entity_Submission'),undefined);
});
