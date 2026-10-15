import test,{beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {storage,fixture,reset} from './fixtures/classCurriculum.mjs';
import {appClient} from '../src/api/appClient.js';
import {getClassworkPractice,saveClassworkStudyQuestion,answerClassworkPractice} from '../src/services/classworkStudyService.js';

beforeEach(reset);
async function duringQuestionHash(change,run){
 const digest=crypto.subtle.digest.bind(crypto.subtle);
 const original=crypto.subtle.digest;
 let changed=false;
 crypto.subtle.digest=async(...args)=>{const hash=await digest(...args);if(!changed){changed=true;await change();}return hash;};
 try{await run();}finally{crypto.subtle.digest=original;}
 assert.equal(changed,true);
}
for(const boundary of ['withdrawn enrollment','changed source','cancelled navigation'])test(`practice preparation rejects ${boundary} during question hashing`,async()=>{
 const f=await fixture();storage.set('visionary_session_token',f.learner.personId);
 const controller=new AbortController();
 const initial=await getClassworkPractice(f.learner,f.assignment.id);
 assert.equal(initial.question.prompt,'Which is the midpoint?');
 await duringQuestionHash(()=>{
  if(boundary==='withdrawn enrollment'){
   const rows=JSON.parse(storage.get('visionary_entity_Enrollment'));rows[0].status='left';storage.set('visionary_entity_Enrollment',JSON.stringify(rows));
  }else if(boundary==='changed source'){
   const rows=JSON.parse(storage.get('visionary_entity_Assignment'));rows[0].description='New fixed instructions';storage.set('visionary_entity_Assignment',JSON.stringify(rows));
  }else controller.abort();
 },async()=>{
  const original=new Map(storage);
  await assert.rejects(getClassworkPractice({...f.learner,signal:controller.signal},f.assignment.id),/unavailable|changed|Cancelled/);
  // Only the controlled boundary mutation may differ, never study or classwork.
  for(const key of ['visionary_entity_Submission','visionary_mentor_v1',`visionary_classwork_study_v1:${f.learner.personId}`])assert.equal(storage.get(key),original.get(key));
 });
});

test('a question prepared during a newer private-question save returns the latest study revision',async()=>{
 const f=await fixture();storage.set('visionary_session_token',f.learner.personId);
 const initial=await getClassworkPractice(f.learner,f.assignment.id);
 await duringQuestionHash(()=>saveClassworkStudyQuestion(f.learner,{assignmentId:f.assignment.id,expectedRevision:initial.revision,question:'Newer private question'}),async()=>{
  const prepared=await getClassworkPractice(f.learner,f.assignment.id);
  assert.equal(prepared.study.questionDraft,'Newer private question');
  assert.notEqual(prepared.revision,initial.revision);
 });
});

test('a question prepared for an older rehearsal round cannot return after a competing retry',async()=>{
 const f=await fixture();storage.set('visionary_session_token',f.learner.personId);
 const initial=await getClassworkPractice(f.learner,f.assignment.id);
 const key=`visionary_classwork_study_v1:${f.learner.personId}`;
 await duringQuestionHash(()=>storage.set(key,JSON.stringify({[f.learner.workspaceId]:{[f.assignment.id]:{...initial.study,round:1}}})),async()=>{
  await assert.rejects(getClassworkPractice(f.learner,f.assignment.id),/changed in another screen/);
  assert.equal(JSON.parse(storage.get(key))[f.learner.workspaceId][f.assignment.id].round,1);
 });
});

for(const change of ['answer key','question options','removed delivery'])test(`practice answer rejects ${change} changed during grading hash`,async()=>{
 const f=await fixture();storage.set('visionary_session_token',f.learner.personId);
 const initial=await getClassworkPractice(f.learner,f.assignment.id);
 await duringQuestionHash(()=>{
  const db=JSON.parse(storage.get('visionary_workspace_v2')),resource=db.data['demo-school-admin:organization'].resources.find(row=>row.id===f.content.id);
  const delivery=resource.contentReview.deliveries.find(row=>row.id===f.delivery.id);
  if(change==='removed delivery')resource.contentReview.deliveries=[];
  else{const question=delivery.curriculumTemplate.chapters[0].objectives[0].practice[0];if(change==='answer key')question.answerIndex=1;else question.options=['Changed first option','Changed second option'];}
  storage.set('visionary_workspace_v2',JSON.stringify(db));
 },async()=>{
  const before=new Map(storage);
  await assert.rejects(answerClassworkPractice(f.learner,{assignmentId:f.assignment.id,expectedRevision:initial.revision,expectedQuestionRevision:initial.questionRevision,expectedRound:initial.study.round,index:0}),/source changed|practice.*changed|unavailable/i);
  for(const key of ['visionary_entity_Submission','visionary_mentor_v1',`visionary_classwork_study_v1:${f.learner.personId}`])assert.equal(storage.get(key),before.get(key));
 });
});

for(const boundary of ['withdrawn enrollment','cancelled navigation','competing round'])test(`practice answer rejects ${boundary} during grading hash`,async()=>{
 const f=await fixture();storage.set('visionary_session_token',f.learner.personId);const initial=await getClassworkPractice(f.learner,f.assignment.id),controller=new AbortController(),key=`visionary_classwork_study_v1:${f.learner.personId}`;
 let retained;
 await duringQuestionHash(()=>{
  if(boundary==='withdrawn enrollment'){const rows=JSON.parse(storage.get('visionary_entity_Enrollment'));rows[0].status='left';storage.set('visionary_entity_Enrollment',JSON.stringify(rows));}
  else if(boundary==='cancelled navigation')controller.abort();
  else storage.set(key,JSON.stringify({[f.learner.workspaceId]:{[f.assignment.id]:{...initial.study,round:1}}}));
  retained=storage.get(key);
 },async()=>{
  await assert.rejects(answerClassworkPractice({...f.learner,signal:controller.signal},{assignmentId:f.assignment.id,expectedRevision:initial.revision,expectedQuestionRevision:initial.questionRevision,expectedRound:initial.study.round,index:0}),/unavailable|changed|Cancelled/);
  assert.equal(storage.get(key),retained);assert.equal(storage.get('visionary_entity_Submission'),undefined);assert.equal(storage.get('visionary_mentor_v1'),undefined);
 });
});

test('a bank changed before grading removes the obsolete view through a source conflict',async()=>{
 const f=await fixture();storage.set('visionary_session_token',f.learner.personId);const initial=await getClassworkPractice(f.learner,f.assignment.id);
 const db=JSON.parse(storage.get('visionary_workspace_v2'));db.data['demo-school-admin:organization'].resources.find(row=>row.id===f.content.id).contentReview.deliveries[0].curriculumTemplate.chapters[0].objectives[0].practice[0].answerIndex=1;storage.set('visionary_workspace_v2',JSON.stringify(db));
 await assert.rejects(answerClassworkPractice(f.learner,{assignmentId:f.assignment.id,expectedRevision:initial.revision,expectedQuestionRevision:initial.questionRevision,expectedRound:initial.study.round,index:0}),{name:'ClassworkPracticeSourceConflictError'});
 assert.equal(storage.get(`visionary_classwork_study_v1:${f.learner.personId}`),undefined);
});

test('same-answer replay after a competing grading hash returns the retained attempt exactly once',async()=>{
 const f=await fixture();storage.set('visionary_session_token',f.learner.personId);const initial=await getClassworkPractice(f.learner,f.assignment.id),input={assignmentId:f.assignment.id,expectedRevision:initial.revision,expectedQuestionRevision:initial.questionRevision,expectedRound:initial.study.round,index:0};
 let retained;
 await duringQuestionHash(async()=>{await answerClassworkPractice(f.learner,input);retained=storage.get(`visionary_classwork_study_v1:${f.learner.personId}`);},async()=>{
  const replay=await answerClassworkPractice(f.learner,input);assert.equal(replay.correct,true);assert.equal(replay.study.attempts.length,1);assert.equal(storage.get(`visionary_classwork_study_v1:${f.learner.personId}`),retained);
 });
});

test('bank removal during the final asynchronous source authorization cannot grade an earlier bank snapshot',async()=>{
 const f=await fixture();storage.set('visionary_session_token',f.learner.personId);const initial=await getClassworkPractice(f.learner,f.assignment.id),original=appClient.entities;let reads=0;
 appClient.entities=new Proxy(original,{get(target,name){const entity=target[name];if(name!=='Assignment')return entity;return {...entity,async get(...args){const result=await entity.get(...args);if(++reads===12){const db=JSON.parse(storage.get('visionary_workspace_v2'));db.data['demo-school-admin:organization'].resources.find(row=>row.id===f.content.id).contentReview.deliveries=[];storage.set('visionary_workspace_v2',JSON.stringify(db));}return result;}};}});
 try{
  await assert.rejects(answerClassworkPractice(f.learner,{assignmentId:f.assignment.id,expectedRevision:initial.revision,expectedQuestionRevision:initial.questionRevision,expectedRound:initial.study.round,index:0}),/unavailable|source changed/i);
  assert.equal(reads,12);assert.equal(storage.get(`visionary_classwork_study_v1:${f.learner.personId}`),undefined);
 }finally{appClient.entities=original;}
});
