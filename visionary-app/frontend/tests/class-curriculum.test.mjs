import test,{beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import * as w from '../src/services/workspaceService.ts';
import {appClient} from '../src/api/appClient.js';
import {getClassCurriculum,publishClassCurriculum,changeClassCurriculumPublication} from '../src/services/classCurriculumService.js';
import {curriculumPublicationRevision} from '../src/lib/curriculumPublication.js';
import {storage,org,template,fixture,reset} from './fixtures/classCurriculum.mjs';
beforeEach(reset);
const publish=(f,revision='[]')=>publishClassCurriculum(f.teacher,{classId:f.classroom.id,deliveryId:f.delivery.id,expectedRevision:revision});

test('full publication exposes unassigned chapters without keys, editorial notes, submissions or mastery',async()=>{
 const f=await fixture();const before=storage.get('visionary_workspace_v2');const saved=await publish(f);assert.equal((await publish(f)).id,saved.id);
 storage.set('visionary_session_token',f.learner.personId);const view=await getClassCurriculum(f.learner,f.classroom.id);
 assert.equal(view.publications[0].chapters[0].objectives.length,2);assert.equal(view.publications[0].chapters[0].objectives[0].assignments[0].id,f.assignment.id);assert.equal(view.publications[0].chapters[0].objectives[1].assignments.length,0);
 assert.doesNotMatch(JSON.stringify(view),/answerIndex|PRIVATE_|practice|grade|student_email/);assert.equal(storage.get('visionary_workspace_v2'),before);assert.equal(storage.get('visionary_entity_Submission'),undefined);assert.equal(storage.get('visionary_mentor_v1'),undefined);
});

test('new delivery appends a separate fixed copy and never rewrites the earlier source or assignment',async()=>{
 const f=await fixture();const first=await publish(f);const firstBytes=JSON.stringify(first);const assignmentBytes=storage.get('visionary_entity_Assignment');
 w.changeOrganizationContent(org,f.content.id,f.content.contentReview.revision,'revise');const value=template();value.provenance.version='2';value.chapters[0].objectives[0].explanation='A revised explanation.';
 const changed=w.saveOrganizationContent(org,{...f.input,id:f.content.id,curriculumTemplate:value},f.content.contentReview.revision);w.changeOrganizationContent(org,changed.id,changed.contentReview.revision,'submit');w.changeOrganizationContent(f.reviewer,changed.id,changed.contentReview.revision,'approve','Checked',{source:true,accuracy:true,language:true});const delivery=w.deliverOrganizationContent(f.reviewer,changed.id,changed.contentReview.revision,'teacher@visionary.test');
 await assert.rejects(publishClassCurriculum(f.teacher,{classId:f.classroom.id,deliveryId:delivery.id,expectedRevision:'[]'}),/changed/);
 await publishClassCurriculum(f.teacher,{classId:f.classroom.id,deliveryId:delivery.id,expectedRevision:curriculumPublicationRevision([first])});
 const rows=JSON.parse(storage.get('visionary_entity_Classroom'))[0].curriculum_publications;assert.equal(JSON.stringify(rows[0]),firstBytes);assert.equal(rows[1].chapters[0].objectives[0].provenance.version,'2');assert.equal(storage.get('visionary_entity_Assignment'),assignmentBytes);
 storage.set('visionary_session_token',f.learner.personId);const view=await getClassCurriculum(f.learner,f.classroom.id);assert.equal(view.publications[1].chapters[0].objectives[0].assignments.length,0);
});

test('failed publication preserves class bytes and retries once; direct overwrites and stale writes are refused',async()=>{
 const f=await fixture();const before=storage.get('visionary_entity_Classroom'),set=localStorage.setItem;
 localStorage.setItem=(key,value)=>{if(key==='visionary_entity_Classroom')throw Error('Storage unavailable');set(key,value);};
 try{await assert.rejects(publish(f),/could not be saved/);assert.equal(storage.get('visionary_entity_Classroom'),before);}finally{localStorage.setItem=set;}
 const first=await publish(f);const current=storage.get('visionary_entity_Classroom');
 await assert.rejects(appClient.entities.Classroom.update(f.classroom.id,{curriculum_publications:[]},{expectedCurriculumRevision:curriculumPublicationRevision([first])}),/not permitted/);
 await assert.rejects(appClient.entities.Classroom.update(f.classroom.id,{curriculum_publications:[first]}),/changed/);assert.equal(storage.get('visionary_entity_Classroom'),current);assert.equal((await publish(f)).id,first.id);
});

test('invited or closed learners, foreign roles, stale workspaces and revoked teachers cannot receive or publish curriculum',async()=>{
 const f=await fixture();await publish(f);storage.set('visionary_session_token',f.learner.personId);
 const enrollments=JSON.parse(storage.get('visionary_entity_Enrollment'));enrollments[0].status='invited';storage.set('visionary_entity_Enrollment',JSON.stringify(enrollments));
 assert.equal((await appClient.entities.Classroom.get(f.classroom.id)).curriculum_publications,undefined);await assert.rejects(getClassCurriculum(f.learner,f.classroom.id),/no longer connected/);
 enrollments[0].status='left';storage.set('visionary_entity_Enrollment',JSON.stringify(enrollments));await assert.rejects(getClassCurriculum(f.learner,f.classroom.id),/unavailable/);await assert.rejects(getClassCurriculum({...f.learner,role:'parent'},f.classroom.id),/access|workspace/);
 storage.set('visionary_session_token',f.teacher.personId);w.selectWorkspace(f.teacher.personId,'demo-teacher:teacher');await assert.rejects(publish(f),/active/);
 w.selectWorkspace(f.teacher.personId,f.teacher.workspaceId);const invite=w.organizationInvites(org).find(row=>row.email==='teacher@visionary.test');w.changeOrganizationInvite(org,invite.id,'revoked');await assert.rejects(publish(f),/active/);
});

test('unreadable publication and cyclic prerequisites are rejected without byte repair or partial publication',async()=>{
 const f=await fixture();const first=await publish(f);const rows=JSON.parse(storage.get('visionary_entity_Classroom'));rows[0].curriculum_publications[0].chapters[0].objectives[0].prerequisites=[{id:'second',title:'Locate a fraction'}];storage.set('visionary_entity_Classroom',JSON.stringify(rows));const original=storage.get('visionary_entity_Classroom');await assert.rejects(getClassCurriculum(f.teacher,f.classroom.id),/read safely/);await assert.rejects(publish(f),/read safely/);assert.equal(storage.get('visionary_entity_Classroom'),original);
 rows[0].curriculum_publications=[first];rows[0].curriculum_publications[0].chapters[0].objectives[0].answerIndex=0;storage.set('visionary_entity_Classroom',JSON.stringify(rows));await assert.rejects(getClassCurriculum(f.teacher,f.classroom.id),/read safely/);
 rows[0].curriculum_publications=null;storage.set('visionary_entity_Classroom',JSON.stringify(rows));const nullBytes=storage.get('visionary_entity_Classroom');await assert.rejects(getClassCurriculum(f.teacher,f.classroom.id),/read safely/);await assert.rejects(publish(f),/read safely/);assert.equal(storage.get('visionary_entity_Classroom'),nullBytes);
});

test('membership or workspace changes during asynchronous reads cancel the curriculum projection',async()=>{
 const f=await fixture();await publish(f);storage.set('visionary_session_token',f.learner.personId);const original=appClient.entities;let intercepted=false;
 appClient.entities=new Proxy(original,{get(target,name){const entity=target[name];if(name!=='Assignment')return entity;return {...entity,async filter(...args){const rows=await entity.filter(...args);if(!intercepted){intercepted=true;w.selectWorkspace(f.learner.personId,'demo-adult:student');}return rows;}};}});
 try{await assert.rejects(getClassCurriculum(f.learner,f.classroom.id),/active/);}finally{appClient.entities=original;}
});

test('withdrawal and restore retain fixed copies and assigned work while removing learner exploration',async()=>{
 const f=await fixture();const first=await publish(f);const assignments=storage.get('visionary_entity_Assignment');const chapters=JSON.stringify(first.chapters);
 const withdrawn=await changeClassCurriculumPublication(f.teacher,{classId:f.classroom.id,publicationId:first.id,expectedRevision:curriculumPublicationRevision([first]),nextStatus:'withdrawn'});assert.equal(withdrawn.stateHistory[0].actor,f.teacher.personId);
 assert.equal(JSON.stringify(withdrawn.chapters),chapters);assert.equal(storage.get('visionary_entity_Assignment'),assignments);
 storage.set('visionary_session_token',f.learner.personId);assert.equal((await getClassCurriculum(f.learner,f.classroom.id)).publications.length,0);assert.equal((await appClient.entities.Classroom.get(f.classroom.id)).curriculum_publications.length,0);assert.equal((await appClient.entities.Assignment.get(f.assignment.id)).id,f.assignment.id);
 storage.set('visionary_session_token',f.teacher.personId);assert.equal((await getClassCurriculum(f.teacher,f.classroom.id)).publications[0].status,'withdrawn');await assert.rejects(changeClassCurriculumPublication(f.teacher,{classId:f.classroom.id,publicationId:first.id,expectedRevision:curriculumPublicationRevision([first]),nextStatus:'published'}),/changed/);
 const restored=await changeClassCurriculumPublication(f.teacher,{classId:f.classroom.id,publicationId:first.id,expectedRevision:curriculumPublicationRevision([withdrawn]),nextStatus:'published'});assert.equal(restored.stateHistory.length,2);assert.equal(JSON.stringify(restored.chapters),chapters);
 storage.set('visionary_session_token',f.learner.personId);assert.equal((await getClassCurriculum(f.learner,f.classroom.id)).publications[0].id,first.id);
});

test('availability changes reject forged actors or altered source content and preserve bytes on storage failure',async()=>{
 const f=await fixture();const first=await publish(f);const revision=curriculumPublicationRevision([first]),before=storage.get('visionary_entity_Classroom');
 const changed={...first,status:'withdrawn',stateHistory:[{from:'published',to:'withdrawn',at:new Date().toISOString(),actor:'foreign-author'}]};
 await assert.rejects(appClient.entities.Classroom.update(f.classroom.id,{curriculum_publications:[changed]},{expectedCurriculumRevision:revision}),/not permitted/);
 changed.stateHistory[0].actor=f.teacher.personId;changed.chapters=structuredClone(first.chapters);changed.chapters[0].objectives[0].explanation='Replaced source explanation';await assert.rejects(appClient.entities.Classroom.update(f.classroom.id,{curriculum_publications:[changed]},{expectedCurriculumRevision:revision}),/not permitted/);
 const set=localStorage.setItem;localStorage.setItem=(key,value)=>{if(key==='visionary_entity_Classroom')throw Error('Storage unavailable');set(key,value);};
 try{await assert.rejects(changeClassCurriculumPublication(f.teacher,{classId:f.classroom.id,publicationId:first.id,expectedRevision:revision,nextStatus:'withdrawn'}),/could not be saved/);}finally{localStorage.setItem=set;}
 assert.equal(storage.get('visionary_entity_Classroom'),before);
});

test('a copy withdrawn during an asynchronous read never returns stale source content',async()=>{
 const f=await fixture();await publish(f);storage.set('visionary_session_token',f.learner.personId);const original=appClient.entities;
 appClient.entities=new Proxy(original,{get(target,name){const entity=target[name];if(name!=='Assignment')return entity;return {...entity,async filter(...args){const assignments=await entity.filter(...args);const rows=JSON.parse(storage.get('visionary_entity_Classroom'));const copy=rows[0].curriculum_publications[0];copy.status='withdrawn';copy.stateHistory.push({from:'published',to:'withdrawn',at:new Date().toISOString(),actor:f.teacher.personId});storage.set('visionary_entity_Classroom',JSON.stringify(rows));return assignments;}};}});
 try{await assert.rejects(getClassCurriculum(f.learner,f.classroom.id),/changed while reading/);}finally{appClient.entities=original;}
});
