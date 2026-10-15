

import * as w from '../../src/services/workspaceService.ts';
import {appClient} from '../../src/api/appClient.js';
import {assignReviewedLesson} from '../../src/services/classroomService.js';



export const storage=new Map();
globalThis.localStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,String(value)),removeItem:key=>storage.delete(key)};
globalThis.window={dispatchEvent(){},location:{origin:'http://localhost',search:''}};
globalThis.CustomEvent??=class{constructor(type){this.type=type;}};
export const org={personId:'demo-school-admin',workspaceId:'demo-school-admin:organization',role:'organization',locale:'en'};
export const template=()=>({schemaVersion:1,selection:{board:'Fictional framework',classLevel:'6',subject:'Mathematics'},provenance:{provider:'Fictional provider',sourceId:'book-fixture',version:'1'},chapters:[{id:'chapter',title:'Fractions',sourceSection:'Pages 1–4',objectives:[{id:'first',title:'Equal intervals',explanation:'Divide the whole into equal intervals.',prerequisiteIds:[],representations:[{id:'line',kind:'number-line',alternative:'One half lies halfway from zero to one.',numberLine:{minimum:0,maximum:1,divisions:8,initial:4}}],criteria:[{id:'parts',label:'Equal parts',prompt:'Explain equal parts.'}],practice:[{id:'question',prompt:'Which is the midpoint?',options:['One half','One quarter'],answerIndex:0}]},{id:'second',title:'Locate a fraction',explanation:'Four of eight equal intervals reach one half.',prerequisiteIds:['first'],representations:[],criteria:[{id:'locate',label:'Locate',prompt:'Explain the location.'}]}]}]});
export function reset(){storage.clear();w.configureMock({latency:0,fault:'none'});w.seedDemo('school-admin');}
function grant(personId,email,role){
 const personal={personId,workspaceId:personId+':'+role,role,locale:'en'};
 const invite=w.requestOrganizationInvite(org,email,role,'Fictional school',role==='organization'?'academic-admin':undefined);w.changeOrganizationInvite(personal,invite.id,'active');
 const space=w.bootstrapPerson({id:personId,email,identity:role}).workspaces.find(row=>row.organizationId==='school-admin@visionary.test');
 const db=JSON.parse(storage.get('visionary_workspace_v2'));db.active[personId]=space.id;storage.set('visionary_workspace_v2',JSON.stringify(db));return {...personal,workspaceId:space.id};
}
export async function fixture({learnerPersona='adult',...overrides}={}){
 const learnerRole=['professional','employee'].includes(learnerPersona)?'professional':'student',learnerEmail=learnerPersona+'@visionary.test';
 const reviewer=grant('demo-company-admin','company-admin@visionary.test','organization'),teacher=grant('demo-teacher','teacher@visionary.test','teacher'),learner=grant('demo-'+learnerPersona,learnerEmail,learnerRole);
 const users=[{id:teacher.personId,email:'teacher@visionary.test',identity:'teacher'},{id:learner.personId,email:learnerEmail,identity:learnerRole}].map(user=>({...user,roles:[user.identity],age_band:w.bootstrapPerson(user).person.ageBand,onboarding_complete:true}));
 storage.set('visionary_users',JSON.stringify(users));storage.set('visionary_sessions',JSON.stringify(users.map(user=>({token:user.id,userId:user.id,email:user.email,expiresAt:Date.now()+86400000}))));storage.set('visionary_session_token',teacher.personId);
 const input={title:'Reviewed fractions',body:'PRIVATE_EDITORIAL_NOTES',source:'Fictional book version 1',language:'en',kind:'curriculum',curriculumTemplate:template(),...overrides};
 const content=w.saveOrganizationContent(org,input);w.changeOrganizationContent(org,content.id,content.contentReview.revision,'submit');w.changeOrganizationContent(reviewer,content.id,content.contentReview.revision,'approve','PRIVATE_REVIEW_NOTES',{source:true,accuracy:true,language:true});
 const delivery=w.deliverOrganizationContent(reviewer,content.id,content.contentReview.revision,'teacher@visionary.test');
 const imported=w.importOrganizationContent(teacher,delivery.id,'first');const reviewed=w.saveResource(teacher,{...imported,status:'reviewed'});
 const classroom=await appClient.entities.Classroom.create({name:'Fractions class',teacher_email:'teacher@visionary.test',teacher_id:teacher.personId,organization_email:'school-admin@visionary.test',join_code:'CURRICULUM'});
 const assignment=await assignReviewedLesson(teacher,{resourceId:reviewed.id,classId:classroom.id});
 storage.set('visionary_session_token',learner.personId);await appClient.entities.Enrollment.create({class_id:classroom.id,student_email:learnerEmail,student_id:learner.personId,status:'active',join_code:'CURRICULUM'});storage.set('visionary_session_token',teacher.personId);
 return {reviewer,teacher,learner,content,delivery,classroom,assignment,input};
}
