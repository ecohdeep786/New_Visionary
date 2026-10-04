import test,{beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {storage,fixture,reset} from './fixtures/classCurriculum.mjs';
import {appClient} from '../src/api/appClient.js';
import {submitClassworkResponses,reviewClasswork} from '../src/services/classroomService.js';
import {classworkReviewRevision} from '../src/lib/classworkRubric.js';
beforeEach(reset);

async function setup(){
 const f=await fixture();storage.set('visionary_session_token',f.learner.personId);
 const submission=await submitClassworkResponses(f.learner,{assignmentId:f.assignment.id,text:'One half divides the whole equally.',selfReview:{parts:'Two equal parts.'}});
 storage.set('visionary_session_token',f.teacher.personId);
 return {...f,submission};
}
async function duringCommit(change,run){
 const original=appClient.entities;let pending=true;
 appClient.entities=new Proxy(original,{get(target,name){const entity=target[name];return name==='Submission'?{...entity,async update(...args){if(pending){pending=false;await change(entity);}return entity.update(...args);}}:entity;}});
 try{await run();}finally{appClient.entities=original;}
}
const draft=f=>({submissionId:f.submission.id,status:'revision_requested',feedback:'My retained teacher draft.',expectedReviewRevision:classworkReviewRevision(f.submission)});
test('a competing teacher review at commit cannot be overwritten by an older draft',async()=>{
 const f=await setup();let saved;
 await duringCommit(async entity=>{await entity.update(f.submission.id,{status:'revision_requested',grade:null,feedback:'Newer teacher feedback.',criterion_feedback:{},graded_date:'2026-10-04T12:00:00Z'});saved=storage.get('visionary_entity_Submission');},async()=>assert.rejects(reviewClasswork(f.teacher,draft(f)),/review changed/));
 assert.equal(storage.get('visionary_entity_Submission'),saved);
});
test('a newer learner attempt at commit cannot receive feedback for the older attempt',async()=>{
 const f=await setup();let saved;
 await duringCommit(async entity=>{
  await entity.update(f.submission.id,{status:'revision_requested',grade:null,feedback:'Explain equal parts.',criterion_feedback:{},graded_date:'2026-10-04T12:00:00Z'});
  storage.set('visionary_session_token',f.learner.personId);
  await submitClassworkResponses(f.learner,{assignmentId:f.assignment.id,text:'Two equal intervals form the whole.',selfReview:{parts:'Both intervals have equal length.'}});
  storage.set('visionary_session_token',f.teacher.personId);saved=storage.get('visionary_entity_Submission');
 },async()=>assert.rejects(reviewClasswork(f.teacher,draft(f)),/review changed/));
 assert.equal(storage.get('visionary_entity_Submission'),saved);
 const rows=JSON.parse(saved);assert.equal(rows[0].attempt,2);assert.equal(rows[0].status,'submitted');assert.equal(rows[0].revision_history.length,1);
});
test('teacher membership revoked at commit denies the save and retains the learner response',async()=>{
 const f=await setup(),saved=storage.get('visionary_entity_Submission');
 await duringCommit(()=>{const rows=JSON.parse(storage.get('visionary_entity_OrganizationInvite'));const invite=rows.find(row=>row.email==='teacher@visionary.test'&&row.role==='teacher');assert.ok(invite);invite.status='revoked';storage.set('visionary_entity_OrganizationInvite',JSON.stringify(rows));},async()=>assert.rejects(reviewClasswork(f.teacher,draft(f)),/not available|not permitted/));
 assert.equal(storage.get('visionary_entity_Submission'),saved);
});
