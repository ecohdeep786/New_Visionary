import test,{beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {storage,fixture,reset} from './fixtures/classCurriculum.mjs';
import {appClient} from '../src/api/appClient.js';
import {getClassworkActivity} from '../src/services/classworkPlayerService.js';
beforeEach(reset);

async function duringRead(change,run) {
 const original=appClient.entities;
 appClient.entities=new Proxy(original,{get(target,name){const entity=target[name];if(name!=='Submission')return entity;return {...entity,async filter(...args){const result=await entity.filter(...args);change();return result;}};}});
 try {await run();} finally {appClient.entities=original;}
}
test('revocation during classwork reads cannot return the old source',async()=>{
 const f=await fixture();storage.set('visionary_session_token',f.learner.personId);
 await duringRead(()=>{const rows=JSON.parse(storage.get('visionary_entity_Enrollment'));rows[0].status='left';storage.set('visionary_entity_Enrollment',JSON.stringify(rows));},async()=>assert.rejects(getClassworkActivity(f.learner,f.assignment.id),/unavailable|connection changed/));
});
test('workspace switch during classwork reads cancels the old source projection',async()=>{
 const f=await fixture();storage.set('visionary_session_token',f.learner.personId);
 await duringRead(()=>{const db=JSON.parse(storage.get('visionary_workspace_v2'));db.active[f.learner.personId]=f.learner.personId+':student';storage.set('visionary_workspace_v2',JSON.stringify(db));},async()=>assert.rejects(getClassworkActivity(f.learner,f.assignment.id),/workspace changed|unavailable/));
});
test('changed content during classwork reads requires reopening; original draft is retained',async()=>{
 const f=await fixture();storage.set('visionary_session_token',f.learner.personId);const draftKey='visionary_classwork_drafts_v1:'+f.learner.personId;storage.set(draftKey,'retained draft canary');
 await duringRead(()=>{const rows=JSON.parse(storage.get('visionary_entity_Assignment'));rows[0].description='Changed teacher instructions';storage.set('visionary_entity_Assignment',JSON.stringify(rows));},async()=>assert.rejects(getClassworkActivity(f.learner,f.assignment.id),/content changed/));
 assert.equal(storage.get(draftKey),'retained draft canary');
});
test('aborted classwork reads do not expose content or create responses',async()=>{
 const f=await fixture();storage.set('visionary_session_token',f.learner.personId);const controller=new AbortController();
 await duringRead(()=>controller.abort(),async()=>assert.rejects(getClassworkActivity({...f.learner,signal:controller.signal},f.assignment.id),{name:'AbortError'}));
 assert.equal(storage.get('visionary_entity_Submission'),undefined);
});
