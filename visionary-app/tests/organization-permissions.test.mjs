import test,{beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import * as workspace from '../src/services/workspaceService.ts';
import {organizationPolicy,organizationPathAllowed} from '../src/services/organizationPolicy.js';
import {previewPolicy} from '../src/api/previewPermissions.js';
import {saveResourceEditorDraft,getResourceEditorDraft,clearResourceEditorDraft} from '../src/services/resourceEditorDraft.ts';
import {getOrganizationAggregate} from '../src/services/mentorStateService.ts';
import {organizationBilling,requestOrganizationSeats,changeOrganizationSeatRequest} from '../src/services/organizationBillingService.js';
const memory=new Map();globalThis.localStorage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,String(value)),removeItem:key=>memory.delete(key)};globalThis.window={dispatchEvent(){}};globalThis.CustomEvent??=class{constructor(type){this.type=type;}};
const org={personId:'demo-school-admin',workspaceId:'demo-school-admin:organization',role:'organization',locale:'en'};
const member={personId:'demo-company-admin',workspaceId:'demo-company-admin:organization',role:'organization',locale:'en'};
function grant(capability='analyst'){const invite=workspace.requestOrganizationInvite(org,'company-admin@visionary.test','organization','School',capability);workspace.changeOrganizationInvite(member,invite.id,'active');const user={id:member.personId,email:'company-admin@visionary.test',identity:'organization'};const space=workspace.bootstrapPerson(user).workspaces.find(row=>row.organizationId==='school-admin@visionary.test');workspace.selectWorkspace(member.personId,space.id);return {ctx:{...member,workspaceId:space.id},invite,user:{email:user.email,identity:'organization',organization_id:space.organizationId}};}
beforeEach(()=>{memory.clear();workspace.configureMock({now:()=>new Date(),latency:0,fault:'none'});workspace.seedDemo('school-admin');});

test('inherited or malformed administrative capability values fail closed',()=>{
 const user={email:'member@test.invalid',identity:'organization',organization_id:'owner@test.invalid'};
 for(const capability of ['__proto__','constructor','toString',['analyst'],{toString:()=> 'analyst'}]){
  const policy=organizationPolicy(user,[{email:user.email,organization_email:user.organization_id,role:'organization',status:'active',capability}]);
  assert.deepEqual(policy.permissions,[]);assert.equal(policy.profile,null);
  assert.equal(organizationPathAllowed(policy,'/dashboard/curriculum'),false);
 }
});

test('new organization editor backups are inaccessible after academic permission is removed and recover after restoration',()=>{
 const {ctx,invite}=grant('academic-admin');
 const key='new:organization-content';
 saveResourceEditorDraft(ctx,key,{title:'Private unfinished objective',body:'Retained editorial notes'});
 const before=localStorage.getItem('visionary_resource_editor_v1');
 for(const profile of ['analyst','billing-admin']){
  workspace.changeOrganizationCapability(org,invite.id,profile);
  assert.throws(()=>getResourceEditorDraft(ctx,key),/permission/);
  assert.throws(()=>saveResourceEditorDraft(ctx,key,{title:'Replacement',body:'Discarded'}),/permission/);
  assert.throws(()=>clearResourceEditorDraft(ctx,key),/permission/);
  assert.equal(localStorage.getItem('visionary_resource_editor_v1'),before);
 }
 workspace.changeOrganizationCapability(org,invite.id,'academic-admin');
 assert.equal(getResourceEditorDraft(ctx,key).draft.body,'Retained editorial notes');
});

test('administrative profiles separate owner permissions, academic work, aggregates and billing',()=>{
 const {ctx,invite,user}=grant();const classes=[{id:'school',organization_email:'school-admin@visionary.test'},{id:'other',organization_email:'elsewhere@visionary.test'}];
 const read=name=>name==='Classroom'?classes:name==='OrganizationInvite'?JSON.parse(localStorage.getItem('visionary_entity_OrganizationInvite')):[];
 for(const [profile,expected] of [['analyst',['analytics']],['billing-admin',['billing']],['academic-admin',['members','academic','analytics']],['organization-admin',['members','invite','academic','analytics','audit']]]){
  workspace.changeOrganizationCapability(org,invite.id,profile);const policy=workspace.organizationAccess(ctx);assert.equal(policy.profile,profile);assert.deepEqual(policy.permissions,expected);
  const entities=previewPolicy(user,read);assert.equal(entities.canRead('Classroom',classes[0]),expected.includes('academic'));assert.equal(entities.canRead('Classroom',classes[1]),false);
  assert.equal(entities.canRead('Submission',{class_id:'school',student_email:'private@visionary.test'}),false);
  assert.equal(organizationPathAllowed(policy,'/dashboard/subscription'),expected.includes('billing'));assert.equal(organizationPathAllowed(policy,'/dashboard/analytics'),expected.includes('analytics'));
 }
 assert.throws(()=>workspace.changeOrganizationCapability(ctx,invite.id,'owner'),/permission/);
 assert.throws(()=>workspace.changeOrganizationCapability(org,invite.id,'owner'),/available administrative/);
 assert.throws(()=>workspace.requestOrganizationInvite(ctx,'new@visionary.test','organization','School','analyst'),/permission/);
});

test('academic resources share the organization scope; analyst and billing cannot mutate or read them',()=>{
 const resource=workspace.saveResource(org,{title:'Shared objective',kind:'curriculum',body:'Organization plan',status:'draft'});
 const {ctx,invite}=grant('academic-admin');assert.ok(workspace.snapshot(ctx).resources.some(row=>row.id===resource.id));
 workspace.saveResource(ctx,{...resource,title:'Reviewed by academic administrator'});assert.equal(workspace.snapshot(org).resources.find(row=>row.id===resource.id).title,'Reviewed by academic administrator');
 workspace.changeOrganizationCapability(org,invite.id,'analyst');assert.deepEqual(workspace.snapshot(ctx).resources,[]);
 assert.throws(()=>workspace.saveResource(ctx,{title:'Forged',kind:'curriculum',body:'x'}),/permission/);assert.throws(()=>workspace.archiveResource(ctx,resource.id),/permission/);assert.throws(()=>workspace.organizationAudit(ctx),/permission/);
 assert.ok(getOrganizationAggregate(ctx));workspace.changeOrganizationCapability(org,invite.id,'billing-admin');assert.throws(()=>getOrganizationAggregate(ctx),/permission/);
});

test('failed permission changes preserve the previous profile and history; unknown imports fail closed',()=>{
 const {ctx,invite,user}=grant();const before=localStorage.getItem('visionary_entity_OrganizationInvite');const original=localStorage.setItem;
 localStorage.setItem=(key,value)=>{if(key==='visionary_entity_OrganizationInvite')throw Error('Full');original(key,value);};
 try{assert.throws(()=>workspace.changeOrganizationCapability(org,invite.id,'organization-admin'),/could not be saved/);}finally{localStorage.setItem=original;}
 assert.equal(localStorage.getItem('visionary_entity_OrganizationInvite'),before);assert.equal(workspace.organizationAccess(ctx).profile,'analyst');
 workspace.changeOrganizationCapability(org,invite.id,'academic-admin');assert.equal(workspace.organizationInvites(org).find(row=>row.id===invite.id).history.at(-1).capability,'academic-admin');
 assert.deepEqual(organizationPolicy(user,[{...invite,status:'active',capability:undefined}]).permissions,[]);
 workspace.changeOrganizationInvite(org,invite.id,'revoked');assert.throws(()=>workspace.organizationAccess(ctx),/no longer active/);
});

test('billing seat requests are scoped, retryable planning records and owner acknowledgement grants no membership',()=>{
 const {ctx,invite}=grant('billing-admin');const original=localStorage.setItem;
 localStorage.setItem=(key,value)=>{if(key==='visionary_organization_billing_v1')throw Error('Full');original(key,value);};
 try{assert.throws(()=>requestOrganizationSeats(ctx,25,'New term'),/could not be saved/);}finally{localStorage.setItem=original;}
 assert.deepEqual(organizationBilling(ctx).requests,[]);const row=requestOrganizationSeats(ctx,25,'New term');assert.equal(organizationBilling(org).requests[0].id,row.id);
 assert.throws(()=>requestOrganizationSeats(ctx,30,'Duplicate'),/pending/);assert.throws(()=>changeOrganizationSeatRequest(ctx,row.id,'acknowledged'),/Only the owner/);
 changeOrganizationSeatRequest(org,row.id,'acknowledged');assert.equal(organizationBilling(ctx).requests[0].status,'acknowledged');assert.equal(workspace.organizationInvites(org).length,1);
 workspace.changeOrganizationCapability(org,invite.id,'analyst');assert.throws(()=>organizationBilling(ctx),/permission/);
 assert.equal(organizationBilling(member).requests.length,0);
});
