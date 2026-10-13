import test,{beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {storage,fixture,reset} from './fixtures/classCurriculum.mjs';
import {appClient} from '../src/api/appClient.js';
import {saveResource,resourceRevision} from '../src/services/workspaceService.ts';
const {assignReviewedLesson,changeAssignmentState}=await import(process.env.VISIONARY_TEACHER_SERVICE||'../src/services/classroomService.js');
beforeEach(reset);
async function setup(){
 const f=await fixture();
 const resource=saveResource(f.teacher,{kind:'lesson',title:'Pending reviewed lesson',body:'Explain equal intervals.',status:'reviewed',audience:'Class',checks:[{id:'intervals',prompt:'Explain equal intervals'}]});
 return {...f,resource,args:{resourceId:resource.id,classId:f.classroom.id,expectedRevision:resourceRevision(resource)}};
}
async function during(method,change,run,after=false){
 const original=appClient.entities;let pending=true;
 appClient.entities=new Proxy(original,{get(target,name){const entity=target[name];return name==='Assignment'?{...entity,async [method](...args){if(!pending)return entity[method](...args);pending=false;if(after){const result=await entity[method](...args);await change(entity);return result;}await change(entity);return entity[method](...args);}}:entity;}});
 try{await run();}finally{appClient.entities=original;}
}
test('lesson changes during assignment lookup reject instead of publishing the earlier preview',async()=>{
 const f=await setup(),before=storage.get('visionary_entity_Assignment');
 await during('filter',()=>saveResource(f.teacher,{...f.resource,body:'Newer reviewed instructions.'}),async()=>assert.rejects(assignReviewedLesson(f.teacher,f.args),/lesson changed/),true);
 assert.equal(storage.get('visionary_entity_Assignment'),before);
});
test('lesson changes at assignment commit retain the newer source and original fixed class copies',async()=>{
 const f=await setup(),before=storage.get('visionary_entity_Assignment');let newer;
 await during('create',()=>{saveResource(f.teacher,{...f.resource,body:'Newer reviewed instructions.'});newer=storage.get('visionary_workspace_v2');},async()=>assert.rejects(assignReviewedLesson(f.teacher,f.args),/lesson changed/));
 assert.equal(storage.get('visionary_entity_Assignment'),before);assert.equal(storage.get('visionary_workspace_v2'),newer);
});
test('a pending assignment close cannot replace a newer archive or its state history',async()=>{
 const f=await setup();let newer;
 await during('update',async entity=>{await entity.update(f.assignment.id,{status:'archived',state_history:[...f.assignment.state_history,{from:'published',to:'archived',actor:'teacher@visionary.test',at:'2026-10-04T12:00:00Z'}]});newer=storage.get('visionary_entity_Assignment');},async()=>assert.rejects(changeAssignmentState(f.teacher,{assignmentId:f.assignment.id,expectedStatus:'published',nextStatus:'closed'}),/assignment state changed/));
 assert.equal(storage.get('visionary_entity_Assignment'),newer);
});
test('expired teacher membership at assignment commit denies publication',async()=>{
 const f=await setup(),before=storage.get('visionary_entity_Assignment');
 await during('create',()=>{const rows=JSON.parse(storage.get('visionary_entity_OrganizationInvite'));rows.find(row=>row.email==='teacher@visionary.test').expiresAt='2000-01-01T00:00:00Z';storage.set('visionary_entity_OrganizationInvite',JSON.stringify(rows));},async()=>assert.rejects(assignReviewedLesson(f.teacher,f.args),/not permitted|not available|workspace changed|no longer active/));
 assert.equal(storage.get('visionary_entity_Assignment'),before);
});
test('failed assignment storage keeps source and fixed copies and allows explicit retry',async()=>{
 const f=await setup(),before=storage.get('visionary_entity_Assignment'),source=storage.get('visionary_workspace_v2'),original=localStorage.setItem;
 try{localStorage.setItem=(key,value)=>{if(key==='visionary_entity_Assignment')throw Error('Fixture quota');original(key,value);};await assert.rejects(assignReviewedLesson(f.teacher,f.args),/could not be saved/);}finally{localStorage.setItem=original;}
 assert.equal(storage.get('visionary_entity_Assignment'),before);assert.equal(storage.get('visionary_workspace_v2'),source);
 const assigned=await assignReviewedLesson(f.teacher,f.args);assert.equal(assigned.description,f.resource.body);assert.equal((await assignReviewedLesson(f.teacher,f.args)).id,assigned.id);
});
