import test,{beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {storage,fixture,reset} from './fixtures/classCurriculum.mjs';
import {appClient} from '../src/api/appClient.js';
import {submitClassworkResponses,reviewClasswork} from '../src/services/classroomService.js';
import {classworkActivityRevision} from '../src/services/classworkPlayerService.js';
beforeEach(reset);
async function setup(revision=false){
 const f=await fixture();storage.set('visionary_session_token',f.learner.personId);
 const args={assignmentId:f.assignment.id,text:'Two equal parts.',selfReview:{parts:'Both parts have equal size.'},expectedRevision:classworkActivityRevision(f.assignment)};
 if(revision){const first=await submitClassworkResponses(f.learner,args);storage.set('visionary_session_token',f.teacher.personId);await reviewClasswork(f.teacher,{submissionId:first.id,status:'revision_requested',feedback:'Explain the intervals.'});storage.set('visionary_session_token',f.learner.personId);args.text='Two equal intervals make one whole.';}
 return {...f,args};
}
async function during(method,change,run){
 const original=appClient.entities;let pending=true;
 appClient.entities=new Proxy(original,{get(target,name){const entity=target[name];return name==='Submission'?{...entity,async [method](...args){if(pending){pending=false;await change();}return entity[method](...args);}}:entity;}});
 try{await run();}finally{appClient.entities=original;}
}
function changeInstructions(){const rows=JSON.parse(storage.get('visionary_entity_Assignment'));rows[0].description='Newer instructions for a different explanation.';storage.set('visionary_entity_Assignment',JSON.stringify(rows));}
for(const revision of [false,true])test(`${revision?'revised':'first'} submission rejects assignment content changed at commit`,async()=>{
 const f=await setup(revision),before=storage.get('visionary_entity_Submission');
 await during(revision?'update':'create',changeInstructions,async()=>assert.rejects(submitClassworkResponses(f.learner,f.args),/assigned content changed/));
 assert.equal(storage.get('visionary_entity_Submission'),before);
});
test('assignment content changed during response lookup cannot be submitted from the older displayed source',async()=>{
 const f=await setup();
 await during('filter',changeInstructions,async()=>assert.rejects(submitClassworkResponses(f.learner,f.args),/assigned content changed/));
 assert.equal(storage.get('visionary_entity_Submission'),undefined);
});
test('pending learner revision cannot discard newer teacher revision feedback',async()=>{
 const f=await setup(true);let newer;
 await during('update',async()=>{storage.set('visionary_session_token',f.teacher.personId);await reviewClasswork(f.teacher,{submissionId:JSON.parse(storage.get('visionary_entity_Submission'))[0].id,status:'revision_requested',feedback:'Newer feedback to preserve.'});storage.set('visionary_session_token',f.learner.personId);newer=storage.get('visionary_entity_Submission');},async()=>assert.rejects(submitClassworkResponses(f.learner,f.args),/review changed/));
 assert.equal(storage.get('visionary_entity_Submission'),newer);
});
test('withdrawn enrollment at submission commit denies the write',async()=>{
 const f=await setup();
 await during('create',()=>{const rows=JSON.parse(storage.get('visionary_entity_Enrollment'));rows[0].status='left';storage.set('visionary_entity_Enrollment',JSON.stringify(rows));},async()=>assert.rejects(submitClassworkResponses(f.learner,f.args),/not permitted|unavailable/));
 assert.equal(storage.get('visionary_entity_Submission'),undefined);
});
test('a failed submission write retains original revision history and supports an explicit retry',async()=>{
 const f=await setup(true),before=storage.get('visionary_entity_Submission'),original=localStorage.setItem;
 try{localStorage.setItem=(key,value)=>{if(key==='visionary_entity_Submission')throw Error('Storage full');original(key,value);};await assert.rejects(submitClassworkResponses(f.learner,f.args),/could not be saved/);}finally{localStorage.setItem=original;}
 assert.equal(storage.get('visionary_entity_Submission'),before);
 const saved=await submitClassworkResponses(f.learner,f.args);assert.equal(saved.attempt,2);assert.equal(saved.revision_history.length,1);assert.equal(saved.revision_history[0].feedback,'Explain the intervals.');
});
