import test, {beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {appClient} from '../src/api/appClient.js';
import * as workspace from '../src/services/workspaceService.ts';
import {createTeacherClass,teacherClasses,organizationRoster,saveCohort} from '../src/services/classroomService.js';
import {getAssignedClasses,getStudentClasswork,getStudentClassLearningContext,recordLearningOutcome} from '../src/services/mentorStateService.ts';

const memory=new Map();
globalThis.localStorage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,String(value)),removeItem:key=>memory.delete(key)};
globalThis.window={dispatchEvent(){},location:{origin:'http://localhost',search:''}};
globalThis.CustomEvent??=class {constructor(type){this.type=type;}};
const ctx=(name,role,id=`demo-${name}:${role}`)=>({personId:`demo-${name}`,workspaceId:id,role,locale:'en'});
const org=ctx('school-admin','organization');const teacher=ctx('school-teacher','teacher');
function signIn(name,role){const user={id:`demo-${name}`,email:`${name}@visionary.test`,identity:role,full_name:name,onboarding_complete:true};localStorage.setItem('visionary_users',JSON.stringify([user]));localStorage.setItem('visionary_sessions',JSON.stringify([{token:'scope',userId:user.id,email:user.email,expiresAt:Date.now()+86400000}]));localStorage.setItem('visionary_session_token','scope');return user;}
function connect(){const invite=workspace.requestOrganizationInvite(org,'school-teacher@visionary.test','teacher');workspace.changeOrganizationInvite(teacher,invite.id,'active');const user=signIn('school-teacher','teacher');return workspace.bootstrapPerson(user).workspaces.find(row=>row.organizationId==='school-admin@visionary.test');}
beforeEach(()=>{memory.clear();workspace.configureMock({latency:0,fault:'none',now:()=>new Date()});workspace.seedDemo('school-admin');});

test('class creation derives ownership from active space, rejects stale context and preserves personal classes after revocation',async()=>{
 const work=connect();
 const personal=await createTeacherClass(teacher,{name:'Independent reasoning',organization_email:'forged@visionary.test',teacher_email:'forged@visionary.test'});
 assert.equal(personal.organization_email,undefined);assert.equal(personal.teacher_email,'school-teacher@visionary.test');
 workspace.selectWorkspace(teacher.personId,work.id);const workCtx={...teacher,workspaceId:work.id};
 await assert.rejects(createTeacherClass(teacher,{name:'Stale'}),/workspace changed/);
 const linked=await createTeacherClass(workCtx,{name:'School reasoning'});
 assert.equal(linked.organization_email,'school-admin@visionary.test');
 assert.deepEqual(getAssignedClasses(teacher).map(row=>row.id),[personal.id]);assert.deepEqual(getAssignedClasses(workCtx).map(row=>row.id),[linked.id]);
 assert.deepEqual((await teacherClasses(workCtx)).map(row=>row.id),[linked.id]);
 signIn('school-admin','organization');assert.deepEqual((await organizationRoster(org)).classes.map(row=>row.id),[linked.id]);
 workspace.changeOrganizationInvite(org,workspace.organizationInvites(org).find(row=>row.email==='school-teacher@visionary.test').id,'revoked');
 signIn('school-teacher','teacher');await assert.rejects(createTeacherClass(workCtx,{name:'Closed'}),/no longer active/);
 workspace.bootstrapPerson(await appClient.auth.me());assert.deepEqual((await teacherClasses(teacher)).map(row=>row.id),[personal.id]);
});

test('join-code discovery and direct enrollment require matching active organization membership',async()=>{
 const learner=signIn('learner','student');workspace.bootstrapPerson(learner);
 const classes=[{id:'linked',name:'School',organization_email:'school-admin@visionary.test',join_code:'SCHOOL'},{id:'personal',name:'Independent',join_code:'PERSONAL'}];
 localStorage.setItem('visionary_entity_Classroom',JSON.stringify(classes));
 assert.equal(await appClient.entities.Classroom.findByJoinCode('SCHOOL'),null);
 await assert.rejects(appClient.entities.Enrollment.create({class_id:'linked',student_email:learner.email,status:'active',join_code:'SCHOOL'}),/not permitted/);
 assert.ok(await appClient.entities.Classroom.findByJoinCode('PERSONAL'));
 const invite=workspace.requestOrganizationInvite(org,learner.email,'student');const learnerCtx=ctx('learner','student');workspace.changeOrganizationInvite(learnerCtx,invite.id,'active');
 const work=workspace.bootstrapPerson(learner).workspaces.find(row=>row.organizationId);workspace.selectWorkspace(learner.id,work.id);
 assert.equal(await appClient.entities.Classroom.findByJoinCode('PERSONAL'),null);assert.ok(await appClient.entities.Classroom.findByJoinCode('SCHOOL'));
 const enrollment=await appClient.entities.Enrollment.create({class_id:'linked',student_email:learner.email,status:'active',join_code:'SCHOOL'});
 const workCtx={...learnerCtx,workspaceId:work.id};localStorage.setItem('visionary_entity_Assignment',JSON.stringify([{id:'scope-work',class_id:'linked',status:'published',title:'School work'}]));
 assert.deepEqual(getStudentClasswork(learnerCtx),[]);assert.equal(getStudentClasswork(workCtx)[0].id,'scope-work');
 assert.throws(()=>getStudentClassLearningContext(learnerCtx,'linked'),/not connected/);assert.equal(getStudentClassLearningContext(workCtx,'linked').id,'linked');
 const outcome={id:'scope-evidence',sessionId:'scope-session',conceptId:'sample:cube:concept',classId:'linked',kind:'check',correct:1,total:1,verified:true};
 assert.throws(()=>recordLearningOutcome(learnerCtx,outcome),/not active/);recordLearningOutcome(workCtx,outcome);
 workspace.changeOrganizationInvite(org,invite.id,'revoked');
 assert.equal(await appClient.entities.Classroom.findByJoinCode('SCHOOL'),null);
 assert.deepEqual(await appClient.entities.Enrollment.list(),[]);
 await assert.rejects(appClient.entities.Enrollment.update(enrollment.id,{status:'active',join_code:'SCHOOL'}),/not available/);
});

test('failed class save is retryable and expired imported members cannot enter a cohort',async()=>{
 signIn('school-teacher','teacher');const original=localStorage.setItem;
 localStorage.setItem=(key,value)=>{if(key==='visionary_entity_Classroom')throw Error('Full');original(key,value);};
 try{await assert.rejects(createTeacherClass(teacher,{name:'Retry'}),/could not be saved/);}finally{localStorage.setItem=original;}
 assert.deepEqual(await teacherClasses(teacher),[]);await createTeacherClass(teacher,{name:'Retry'});assert.equal((await teacherClasses(teacher)).length,1);
 signIn('school-admin','organization');localStorage.setItem('visionary_entity_OrganizationInvite',JSON.stringify([{id:'old',email:'old@visionary.test',organization_email:'school-admin@visionary.test',role:'teacher',status:'active',expiresAt:'2020-01-01'}]));
 assert.deepEqual((await organizationRoster(org)).members,[]);
 await assert.rejects(saveCohort(org,{title:'Expired',members:['old@visionary.test'],classIds:[]}),/no longer connected/);
});
