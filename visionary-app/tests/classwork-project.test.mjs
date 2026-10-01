import test,{beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {appClient} from '../src/api/appClient.js';
import {bootstrapPerson,saveArtifact,snapshot,artifactRevision} from '../src/services/workspaceService.ts';
import {submitClassworkProject,reviewClasswork,changeAssignmentState} from '../src/services/classroomService.js';
import {assignmentAcceptsResponses} from '../src/lib/assignmentAvailability.js';
import {getClassworkActivity,submitClassworkActivity,classworkActivityRevision} from '../src/services/classworkPlayerService.js';
import {readClassworkDrafts,saveClassworkDraft,classworkDraftRevision} from '../src/services/classworkDraftService.js';
const memory=new Map();globalThis.localStorage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,String(value)),removeItem:key=>memory.delete(key)};globalThis.window={dispatchEvent(){},location:{origin:'http://localhost',search:''}};globalThis.CustomEvent??=class{constructor(type){this.type=type;}};
beforeEach(()=>memory.clear());
const password='Preview-project-123!';
async function account(email,role){await appClient.auth.register({email,password});await appClient.auth.verifyOtp({email});const user=await appClient.auth.updateMe({identity:role,onboarding_complete:true});const person=bootstrapPerson(user);return {user,ctx:{personId:user.id,workspaceId:person.active,role,locale:'en'}};}
async function fixture(){
 const teacher=await account('teacher@project.test','teacher');const classroom=await appClient.entities.Classroom.create({name:'Projects',teacher_email:teacher.user.email,teacher_id:teacher.user.id,join_code:'PROJECT-COPY'});
 const assignment=await appClient.entities.Assignment.create({class_id:classroom.id,teacher_email:teacher.user.email,teacher_id:teacher.user.id,title:'Explain your model',points:10});
 const learner=await account('learner@project.test','student');await appClient.entities.Enrollment.create({class_id:classroom.id,student_email:learner.user.email,status:'active',join_code:'PROJECT-COPY'});
 const artifact=saveArtifact(learner.ctx,{title:'My cube',body:'Three layers of nine unit cubes.',status:'completed',rubric:{criteria:[{id:'units',label:'Units',prompt:'Explain your units.'}],responses:{units:'27 cubic units.'},sourceProvider:'Fictional sample',sourceVersion:'2'}});
 return {teacher,learner,classroom,assignment,artifact};
}
test('explicit project copy stays fixed through private edits, teacher revision and resubmission',async()=>{
 const {teacher,learner,assignment,artifact}=await fixture();const original=snapshot(learner.ctx);
 const first=await submitClassworkProject(learner.ctx,{assignmentId:assignment.id,artifactId:artifact.id,expectedRevision:artifactRevision(artifact)});
 assert.match(first.text,/27 cubic units/);assert.match(first.text,/not verified or scored/);assert.match(first.text,/Fictional sample · version 2/);
 assert.deepEqual(snapshot(learner.ctx),original);assert.equal(first.grade,undefined);
 const edited=saveArtifact(learner.ctx,{...artifact,body:'Private revised cube explanation.'});assert.equal((await appClient.entities.Submission.get(first.id)).text,first.text);
 await assert.rejects(submitClassworkProject(learner.ctx,{assignmentId:assignment.id,artifactId:artifact.id,expectedRevision:artifactRevision(edited)}),/different response/);
 await appClient.auth.loginViaEmailPassword(teacher.user.email,password);await reviewClasswork(teacher.ctx,{submissionId:first.id,status:'revision_requested',feedback:'Show your layer calculation.'});
 await appClient.auth.loginViaEmailPassword(learner.user.email,password);const second=await submitClassworkProject(learner.ctx,{assignmentId:assignment.id,artifactId:artifact.id,expectedRevision:artifactRevision(edited)});
 assert.equal(second.attempt,2);assert.match(second.text,/Private revised cube/);assert.equal(second.revision_history[0].text,first.text);assert.equal(second.revision_history[0].feedback,'Show your layer calculation.');
 await appClient.auth.loginViaEmailPassword(teacher.user.email,password);await reviewClasswork(teacher.ctx,{submissionId:first.id,attempt:2,status:'graded',grade:9,feedback:'Clear cubic units.'});
 await appClient.auth.loginViaEmailPassword(learner.user.email,password);assert.equal((await appClient.entities.Submission.get(first.id)).feedback,'Clear cubic units.');assert.equal(snapshot(learner.ctx).artifacts[0].visibility,'private');assert.equal(snapshot(learner.ctx).sessions.length,0);
});
test('stale, incomplete, foreign and question-assignment project copies reject before writes',async()=>{
 const {learner,assignment,artifact}=await fixture();const args={assignmentId:assignment.id,artifactId:artifact.id,expectedRevision:artifactRevision(artifact)};
 await assert.rejects(submitClassworkProject(learner.ctx,{...args,expectedRevision:'old'}),/changed/);await assert.rejects(submitClassworkProject(learner.ctx,{...args,artifactId:'foreign'}),/active workspace/);
 const draft=saveArtifact(learner.ctx,{...artifact,status:'draft'});await assert.rejects(submitClassworkProject(learner.ctx,{...args,expectedRevision:artifactRevision(draft)}),/Complete and save/);
 const incomplete=saveArtifact(learner.ctx,{...draft,status:'completed',rubric:{...artifact.rubric,responses:{}}});await assert.rejects(submitClassworkProject(learner.ctx,{...args,expectedRevision:artifactRevision(incomplete)}),/every project criterion/);
 const assignments=JSON.parse(memory.get('visionary_entity_Assignment'));assignments[0].checks=[{id:'q',prompt:'Answer this question'}];memory.set('visionary_entity_Assignment',JSON.stringify(assignments));
 await assert.rejects(submitClassworkProject(learner.ctx,args),/assigned questions/);assert.equal((await appClient.entities.Submission.list()).length,0);
});
test('failed classroom save preserves the completed project and permits explicit retry',async()=>{
 const {learner,assignment,artifact}=await fixture();const before=memory.get('visionary_workspace_v2');const original=localStorage.setItem;const args={assignmentId:assignment.id,artifactId:artifact.id,expectedRevision:artifactRevision(artifact)};
 try{localStorage.setItem=(key,value)=>{if(key==='visionary_entity_Submission')throw Error('Storage full');original(key,value);};await assert.rejects(submitClassworkProject(learner.ctx,args),/could not be saved/);}finally{localStorage.setItem=original;}
 assert.equal(memory.get('visionary_workspace_v2'),before);assert.equal((await appClient.entities.Submission.list()).length,0);assert.ok((await submitClassworkProject(learner.ctx,args)).id);
});
test('concurrent project submissions create one fixed response and bulk duplicates preserve originals',async()=>{
 const {learner,assignment,artifact}=await fixture();const args={assignmentId:assignment.id,artifactId:artifact.id,expectedRevision:artifactRevision(artifact)};
 const [first,second]=await Promise.all([submitClassworkProject(learner.ctx,args),submitClassworkProject(learner.ctx,args)]);assert.equal(first.id,second.id);assert.equal((await appClient.entities.Submission.list()).length,1);
 const before=memory.get('visionary_entity_Submission');await assert.rejects(appClient.entities.Submission.create({...first,text:'Conflicting direct copy'}),/already saved/);await assert.rejects(appClient.entities.Submission.bulkCreate([first]),/No bulk submissions/);assert.equal(memory.get('visionary_entity_Submission'),before);
 memory.delete('visionary_entity_Submission');await assert.rejects(appClient.entities.Submission.bulkCreate([first,first]),/No bulk submissions/);assert.equal(memory.has('visionary_entity_Submission'),false);
});
test('assignment close, archive and restore preserve submitted copies and deny new writes until reopened',async()=>{
 const {teacher,learner,assignment,artifact}=await fixture();const args={assignmentId:assignment.id,artifactId:artifact.id,expectedRevision:artifactRevision(artifact)};const first=await submitClassworkProject(learner.ctx,args);
 await appClient.auth.loginViaEmailPassword(teacher.user.email,password);await changeAssignmentState(teacher.ctx,{assignmentId:assignment.id,expectedStatus:'published',nextStatus:'closed'});
 await assert.rejects(changeAssignmentState(teacher.ctx,{assignmentId:assignment.id,expectedStatus:'published',nextStatus:'archived'}),/state changed/);await reviewClasswork(teacher.ctx,{submissionId:first.id,status:'revision_requested',feedback:'Add a calculation.'});
 await appClient.auth.loginViaEmailPassword(learner.user.email,password);assert.equal((await appClient.entities.Assignment.get(assignment.id)).status,'closed');await assert.rejects(submitClassworkProject(learner.ctx,args),/not open/);await assert.rejects(appClient.entities.Submission.create({...first,id:undefined}),/not permitted/);
 await appClient.auth.loginViaEmailPassword(teacher.user.email,password);await changeAssignmentState(teacher.ctx,{assignmentId:assignment.id,expectedStatus:'closed',nextStatus:'archived'});await assert.rejects(changeAssignmentState(teacher.ctx,{assignmentId:assignment.id,expectedStatus:'archived',nextStatus:'published'}),/available assignment action/);
 await appClient.auth.loginViaEmailPassword(learner.user.email,password);assert.equal((await appClient.entities.Assignment.get(assignment.id)).status,'archived');assert.equal((await appClient.entities.Submission.get(first.id)).text,first.text);
 await appClient.auth.loginViaEmailPassword(teacher.user.email,password);await changeAssignmentState(teacher.ctx,{assignmentId:assignment.id,expectedStatus:'archived',nextStatus:'closed'});const reopened=await changeAssignmentState(teacher.ctx,{assignmentId:assignment.id,expectedStatus:'closed',nextStatus:'published'});assert.equal(reopened.state_history.length,4);assert.ok(reopened.state_history.every(entry=>entry.actor===teacher.user.email));
 await appClient.auth.loginViaEmailPassword(learner.user.email,password);const second=await submitClassworkProject(learner.ctx,args);assert.equal(second.attempt,2);
});
test('drafts stay teacher-only and a failed publish retains the draft and its history',async()=>{
 const {teacher,learner,classroom}=await fixture();await appClient.auth.loginViaEmailPassword(teacher.user.email,password);const draft=await appClient.entities.Assignment.create({class_id:classroom.id,title:'Private preparation',teacher_email:teacher.user.email,status:'draft',points:10});
 await appClient.auth.loginViaEmailPassword(learner.user.email,password);assert.equal(await appClient.entities.Assignment.get(draft.id),null);await assert.rejects(changeAssignmentState(learner.ctx,{assignmentId:draft.id,expectedStatus:'draft',nextStatus:'published'}),/teacher workspace/);
 await appClient.auth.loginViaEmailPassword(teacher.user.email,password);const before=memory.get('visionary_entity_Assignment');const original=localStorage.setItem;try{localStorage.setItem=(key,value)=>{if(key==='visionary_entity_Assignment')throw Error('Full');original(key,value);};await assert.rejects(changeAssignmentState(teacher.ctx,{assignmentId:draft.id,expectedStatus:'draft',nextStatus:'published'}),/could not be saved/);}finally{localStorage.setItem=original;}assert.equal(memory.get('visionary_entity_Assignment'),before);
 const published=await changeAssignmentState(teacher.ctx,{assignmentId:draft.id,expectedStatus:'draft',nextStatus:'published'});assert.equal(published.state_history[0].from,'draft');await appClient.auth.loginViaEmailPassword(learner.user.email,password);assert.equal((await appClient.entities.Assignment.get(draft.id)).status,'published');
});
test('scheduled access uses the saved instant, rejects early writes and supports cancellation or publish now',async()=>{
 const {teacher,learner,classroom}=await fixture();await appClient.auth.loginViaEmailPassword(teacher.user.email,password);const scheduled=await appClient.entities.Assignment.create({class_id:classroom.id,title:'Later activity',teacher_email:teacher.user.email,status:'scheduled',publish_at:new Date(Date.now()+86400000).toISOString(),points:10});
 assert.equal(assignmentAcceptsResponses(scheduled,Date.parse(scheduled.publish_at)-1),false);assert.equal(assignmentAcceptsResponses(scheduled,Date.parse(scheduled.publish_at)),true);assert.equal(assignmentAcceptsResponses({...scheduled,publish_at:'invalid'}),false);assert.equal(assignmentAcceptsResponses({...scheduled,status:'unknown'}),false);
 await appClient.auth.loginViaEmailPassword(learner.user.email,password);assert.equal(await appClient.entities.Assignment.get(scheduled.id),null);await assert.rejects(appClient.entities.Submission.create({assignment_id:scheduled.id,class_id:classroom.id,student_email:learner.user.email,text:'Early response',status:'submitted'}),/not permitted/);
 await appClient.auth.loginViaEmailPassword(teacher.user.email,password);const cancelled=await changeAssignmentState(teacher.ctx,{assignmentId:scheduled.id,expectedStatus:'scheduled',nextStatus:'draft'});assert.equal(cancelled.state_history[0].to,'draft');
 const another=await appClient.entities.Assignment.create({...scheduled,title:'Published early'});await changeAssignmentState(teacher.ctx,{assignmentId:another.id,expectedStatus:'scheduled',nextStatus:'published'});await appClient.auth.loginViaEmailPassword(learner.user.email,password);assert.equal((await appClient.entities.Assignment.get(another.id)).status,'published');
 const rows=JSON.parse(memory.get('visionary_entity_Assignment'));rows.find(row=>row.id===scheduled.id).status='scheduled';rows.find(row=>row.id===scheduled.id).publish_at=new Date(Date.now()-1000).toISOString();memory.set('visionary_entity_Assignment',JSON.stringify(rows));const submission=await appClient.entities.Submission.create({assignment_id:scheduled.id,class_id:classroom.id,student_email:learner.user.email,text:'After publication',status:'submitted'});assert.equal(submission.assignment_id,scheduled.id);
});
test('class player resumes the assigned copy, refuses a changed source and closes after enrollment removal',async()=>{
 const {teacher,learner,assignment}=await fixture();const view=await getClassworkActivity(learner.ctx,assignment.id);assert.equal(view.assignment.id,assignment.id);assert.equal(view.submission,null);const revision=classworkActivityRevision(view.assignment);
 const rows=JSON.parse(memory.get('visionary_entity_Assignment'));rows[0].description='Changed instructions';memory.set('visionary_entity_Assignment',JSON.stringify(rows));await assert.rejects(submitClassworkActivity(learner.ctx,{assignmentId:assignment.id,expectedRevision:revision,text:'Own answer',responses:[]}),/assigned content changed/);assert.equal((await appClient.entities.Submission.list()).length,0);
 const latest=await getClassworkActivity(learner.ctx,assignment.id);const saved=await submitClassworkActivity(learner.ctx,{assignmentId:assignment.id,expectedRevision:classworkActivityRevision(latest.assignment),text:'Own answer',responses:[]});assert.equal((await getClassworkActivity(learner.ctx,assignment.id)).submission.id,saved.id);
 await appClient.auth.loginViaEmailPassword(teacher.user.email,password);await assert.rejects(getClassworkActivity(teacher.ctx,assignment.id),/own learning workspace/);await appClient.auth.loginViaEmailPassword(learner.user.email,password);const enrollments=JSON.parse(memory.get('visionary_entity_Enrollment'));enrollments[0].status='left';memory.set('visionary_entity_Enrollment',JSON.stringify(enrollments));await assert.rejects(getClassworkActivity(learner.ctx,assignment.id),/unavailable/);assert.equal(JSON.parse(memory.get('visionary_entity_Submission'))[0].text,'Own answer');
});
test('shared class drafts reject stale same-assignment writes and merge unrelated assignments',async()=>{
 const {learner,assignment}=await fixture();saveClassworkDraft(learner.ctx,assignment.id,{text:'First draft',playerStage:'respond'},'null');const first=readClassworkDrafts(learner.ctx)[assignment.id];saveClassworkDraft(learner.ctx,'other',{text:'Other draft'},'null');saveClassworkDraft(learner.ctx,assignment.id,{text:'Newer other-screen draft'},classworkDraftRevision(first));const before=memory.get(`visionary_classwork_drafts_v1:${learner.user.id}`);assert.throws(()=>saveClassworkDraft(learner.ctx,assignment.id,{text:'Stale local edits'},classworkDraftRevision(first)),/changed in another screen/);assert.equal(memory.get(`visionary_classwork_drafts_v1:${learner.user.id}`),before);assert.equal(readClassworkDrafts(learner.ctx).other.text,'Other draft');assert.throws(()=>saveClassworkDraft(learner.ctx,assignment.id,null,classworkDraftRevision(first)),/changed in another screen/);assert.equal(memory.get(`visionary_classwork_drafts_v1:${learner.user.id}`),before);
});
test('shared draft read and save failures preserve original bytes and reject malformed answer maps',async()=>{
 const {learner,assignment}=await fixture();const key=`visionary_classwork_drafts_v1:${learner.user.id}`;
 for(const raw of ['{broken','[]','{"own":{"answers":{"q":3}}}']){memory.set(key,raw);assert.throws(()=>readClassworkDrafts(learner.ctx),/Older records/);assert.throws(()=>saveClassworkDraft(learner.ctx,assignment.id,{text:'Own edit'}),/Older records/);assert.equal(memory.get(key),raw);}
 memory.set(key,'{}');const original=localStorage.setItem;try{localStorage.setItem=(name,value)=>{if(name===key)throw Error('Full');original(name,value);};assert.throws(()=>saveClassworkDraft(learner.ctx,assignment.id,{text:'Own edit'},'null'),/could not be saved/);}finally{localStorage.setItem=original;}assert.equal(memory.get(key),'{}');
});
