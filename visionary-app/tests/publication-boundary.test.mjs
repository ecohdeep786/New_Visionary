import test,{beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {storage,org,fixture,reset} from './fixtures/classCurriculum.mjs';
import {appClient} from '../src/api/appClient.js';
import * as w from '../src/services/workspaceService.ts';
import {curriculumPublicationRevision} from '../src/lib/curriculumPublication.js';
const {publishClassCurriculum,changeClassCurriculumPublication}=await import(process.env.VISIONARY_PUBLICATION_SERVICE||'../src/services/classCurriculumService.js');
beforeEach(reset);
const publish=f=>publishClassCurriculum(f.teacher,{classId:f.classroom.id,deliveryId:f.delivery.id,expectedRevision:'[]'});
async function during(method,change,run,after=false){
 const original=appClient.entities;let once=true;
 appClient.entities=new Proxy(original,{get(target,name){const entity=target[name];return name==='Classroom'?{...entity,async [method](...args){if(!once)return entity[method](...args);once=false;if(after){const result=await entity[method](...args);await change(entity);return result;}await change(entity);return entity[method](...args);}}:entity;}});
 try{await run();}finally{appClient.entities=original;}
}
test('published-copy replay rejects an account handoff during class lookup',async()=>{
 const f=await fixture();await publish(f);const before=storage.get('visionary_entity_Classroom');
 await during('get',()=>storage.set('visionary_session_token',f.learner.personId),async()=>assert.rejects(publish(f),/active.*workspace|teaching workspace/),true);
 assert.equal(storage.get('visionary_entity_Classroom'),before);
});
test('same-state publication replay rejects teacher membership revoked during class lookup',async()=>{
 const f=await fixture(),copy=await publish(f),before=storage.get('visionary_entity_Classroom');
 await during('get',()=>{const rows=JSON.parse(storage.get('visionary_entity_OrganizationInvite'));rows.find(row=>row.email==='teacher@visionary.test').status='revoked';storage.set('visionary_entity_OrganizationInvite',JSON.stringify(rows));},async()=>assert.rejects(changeClassCurriculumPublication(f.teacher,{classId:f.classroom.id,publicationId:copy.id,expectedRevision:curriculumPublicationRevision([copy]),nextStatus:'published'}),/active|access|workspace/),true);
 assert.equal(storage.get('visionary_entity_Classroom'),before);
});
test('publication commit rejects a delivered source removed after the final service read',async()=>{
 const f=await fixture(),before=storage.get('visionary_entity_Classroom'),assignments=storage.get('visionary_entity_Assignment');let changed;
 await during('update',()=>{const db=JSON.parse(storage.get('visionary_workspace_v2'));const item=db.data[org.workspaceId].resources.find(row=>row.id===f.content.id);item.contentReview.deliveries=[];storage.set('visionary_workspace_v2',JSON.stringify(db));changed=storage.get('visionary_workspace_v2');},async()=>assert.rejects(publish(f),/reviewed source changed/));
 assert.equal(storage.get('visionary_entity_Classroom'),before);assert.equal(storage.get('visionary_entity_Assignment'),assignments);assert.equal(storage.get('visionary_workspace_v2'),changed);
});
for(const status of ['pending','revoked','expired'])test(status+' teacher membership denies a pending curriculum publication',async()=>{
 const f=await fixture(),before=storage.get('visionary_entity_Classroom');
 await during('update',()=>{const rows=JSON.parse(storage.get('visionary_entity_OrganizationInvite')),member=rows.find(row=>row.email==='teacher@visionary.test');if(status==='expired')member.expiresAt='2000-01-01T00:00:00Z';else member.status=status;storage.set('visionary_entity_OrganizationInvite',JSON.stringify(rows));},async()=>assert.rejects(publish(f),/active|permitted|workspace|available/));
 assert.equal(storage.get('visionary_entity_Classroom'),before);
});
test('failed organization delivery retains prior fixed copies and retries exactly once',async()=>{
 const f=await fixture();w.changeOrganizationContent(org,f.content.id,1,'revise');const updated=w.saveOrganizationContent(org,{...f.input,id:f.content.id,body:'Reviewed revision two.'},1);w.changeOrganizationContent(org,updated.id,2,'submit');w.changeOrganizationContent(f.reviewer,updated.id,2,'approve','Checked revision two',{source:true,accuracy:true,language:true});
 const before=storage.get('visionary_workspace_v2'),set=localStorage.setItem;
 try{localStorage.setItem=(key,value)=>{if(key==='visionary_workspace_v2')throw Error('Fixture quota');set(key,value);};assert.throws(()=>w.deliverOrganizationContent(f.reviewer,f.content.id,2,'teacher@visionary.test'),/could not be saved/);}finally{localStorage.setItem=set;}
 assert.equal(storage.get('visionary_workspace_v2'),before);const delivered=w.deliverOrganizationContent(f.reviewer,f.content.id,2,'teacher@visionary.test');assert.equal(w.deliverOrganizationContent(f.reviewer,f.content.id,2,'teacher@visionary.test').id,delivered.id);
 const deliveries=w.teacherOrganizationContent(f.teacher);assert.equal(deliveries.length,2);assert.equal(deliveries.find(row=>row.id===f.delivery.id).body,f.delivery.body);assert.equal(deliveries.find(row=>row.id===delivered.id).body,'Reviewed revision two.');
});
