import test,{beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import * as w from '../src/services/workspaceService.ts';
import {connectionStatus} from '../src/lib/connectionAvailability.js';
import {previewPolicy} from '../src/api/previewPermissions.js';
import {organizationPolicy} from '../src/services/organizationPolicy.js';
import {appClient} from '../src/api/appClient.js';
const memory=new Map();globalThis.localStorage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,String(value))};globalThis.window={dispatchEvent(){}};globalThis.CustomEvent??=class{constructor(type){this.type=type;}};
const org={personId:'demo-school-admin',workspaceId:'demo-school-admin:organization',role:'organization',locale:'en'};
const teacher={personId:'demo-teacher',workspaceId:'demo-teacher:teacher',role:'teacher',locale:'en'};
beforeEach(()=>{memory.clear();w.configureMock({latency:0,fault:'none',now:()=>new Date('2026-10-02T12:00:00Z')});w.seedDemo('school-admin');});
test('expiry projection distinguishes unreadable, expired and closed records without repairs',()=>{
 for(const expiresAt of ['bad','',{},123])assert.equal(connectionStatus({status:'pending',expiresAt}),'unavailable');
 assert.equal(connectionStatus({status:'active',expiresAt:'2020-01-01'}),'expired');assert.equal(connectionStatus({status:'active'}),'active');assert.equal(connectionStatus({status:'revoked',expiresAt:'bad'}),'revoked');
});
test('unreadable organization requests cannot grant membership; decline/cancel retain original expiry and record actions',()=>{
 const invite=w.requestOrganizationInvite(org,'teacher@visionary.test','teacher');const key='visionary_entity_OrganizationInvite';const rows=JSON.parse(memory.get(key));rows.find(r=>r.id===invite.id).expiresAt='ORIGINAL_BAD_DATE';memory.set(key,JSON.stringify(rows));const before=memory.get(key);
 assert.equal(w.organizationInvites(teacher).find(r=>r.id===invite.id).status,'unavailable');assert.throws(()=>w.changeOrganizationInvite(teacher,invite.id,'active'),/unreadable/);assert.equal(memory.get(key),before);
 w.changeOrganizationInvite(teacher,invite.id,'declined');const saved=JSON.parse(memory.get(key)).find(r=>r.id===invite.id);assert.equal(saved.expiresAt,'ORIGINAL_BAD_DATE');assert.equal(saved.history.at(-1).action,'declined');
 const next=w.requestOrganizationInvite(org,'teacher@visionary.test','teacher');const nextRows=JSON.parse(memory.get(key));nextRows.find(r=>r.id===next.id).expiresAt='bad';memory.set(key,JSON.stringify(nextRows));w.changeOrganizationInvite(org,next.id,'cancelled');assert.equal(JSON.parse(memory.get(key)).find(r=>r.id===next.id).expiresAt,'bad');
});
test('personal and legacy acceptance reject unreadable dates while explicit revocation remains available',()=>{
 const student={personId:'demo-adult',workspaceId:'demo-adult:student',role:'student',locale:'en'};w.requestRelationship(teacher,'adult@visionary.test','teacher');const db=JSON.parse(memory.get('visionary_workspace_v2'));const r=db.relationships.at(-1);r.expiresAt='bad';memory.set('visionary_workspace_v2',JSON.stringify(db));const before=memory.get('visionary_workspace_v2');assert.equal(w.visibleRelationships(student).find(row=>row.id===r.id).status,'unavailable');assert.throws(()=>w.changeRelationship(student,r.id,'active'),/unreadable/);assert.equal(memory.get('visionary_workspace_v2'),before);w.changeRelationship(student,r.id,'revoked');assert.equal(JSON.parse(memory.get('visionary_workspace_v2')).relationships.find(row=>row.id===r.id).expiresAt,'bad');
 const policy=previewPolicy({email:'learner@test.test',identity:'student'},()=>[]);for(const expiresAt of ['bad','2020-01-01']){const row={parent_email:'parent@test.test',child_email:'learner@test.test',status:'pending',expiresAt};assert.throws(()=>policy.assertWrite('FamilyLink',row,'update',{status:'active'}),/permitted/);policy.assertWrite('FamilyLink',row,'update',{status:'declined'});}
});
test('blank and non-string imported dates cannot expose child summaries or organization permissions',()=>{
 const parent={personId:'demo-parent',workspaceId:'demo-parent:parent',role:'parent',locale:'en'};
 for(const expiresAt of ['',false,0,{},'bad']){
  memory.set('visionary_entity_FamilyLink',JSON.stringify([{id:'unreadable',parent_email:'parent@visionary.test',child_email:'adult@visionary.test',status:'active',expiresAt}]));assert.equal(w.visibleRelationships(parent).find(r=>r.id==='legacy:FamilyLink:unreadable').status,'unavailable');assert.equal(w.familyReports(parent).some(r=>r.id==='demo-adult'),false);
  const user={email:'member@test.test',identity:'organization',organization_id:'owner@test.test'};assert.deepEqual(organizationPolicy(user,[{email:user.email,organization_email:user.organization_id,role:'organization',status:'active',capability:'organization-admin',expiresAt}]).permissions,[]);
 }
});
test('malformed billing request deadlines cannot activate a plan; explicit removal retains original bytes',()=>{
 const owner={personId:'demo-parent',workspaceId:'demo-parent:parent',role:'parent',locale:'en'};const member={personId:'demo-adult',workspaceId:'demo-adult:student',role:'student',locale:'en'};
 const db=JSON.parse(memory.get('visionary_workspace_v2'));db.data[owner.workspaceId].subscription.plan='Family';db.familyInvitations=[{id:'bad-billing',owner:owner.personId,member:member.personId,status:'pending',expiresAt:'bad'}];memory.set('visionary_workspace_v2',JSON.stringify(db));const before=memory.get('visionary_workspace_v2');assert.equal(w.familyInvitations(member)[0].unavailable,true);assert.throws(()=>w.changeFamilyInvitation(member,'bad-billing','active'),/expiry/);assert.equal(memory.get('visionary_workspace_v2'),before);w.changeFamilyInvitation(member,'bad-billing','revoked');assert.equal(JSON.parse(memory.get('visionary_workspace_v2')).familyInvitations[0].expiresAt,'bad');
});
test('legacy personal summary reads honor expiry even when the stored relationship says active',async()=>{
 const user={id:'demo-parent',email:'parent@visionary.test',identity:'parent'};memory.set('visionary_users',JSON.stringify([user]));memory.set('visionary_sessions',JSON.stringify([{token:'integrity',userId:user.id,email:user.email,expiresAt:Date.now()+86400000}]));memory.set('visionary_session_token','integrity');memory.set('visionary_entity_StudyLog',JSON.stringify([{id:'private-log',owner_email:'adult@visionary.test'}]));
 for(const expiresAt of ['',false,0,{},'bad','2020-01-01']){const raw=JSON.stringify([{id:'summary',parent_email:user.email,child_email:'adult@visionary.test',status:'active',expiresAt}]);memory.set('visionary_entity_FamilyLink',raw);assert.deepEqual(await appClient.entities.StudyLog.filter({owner_email:'adult@visionary.test'}),[]);assert.equal(memory.get('visionary_entity_FamilyLink'),raw);}
 memory.set('visionary_entity_FamilyLink',JSON.stringify([{id:'summary',parent_email:user.email,child_email:'adult@visionary.test',status:'active',expiresAt:new Date(Date.now()+86400000).toISOString()}]));assert.equal((await appClient.entities.StudyLog.filter({owner_email:'adult@visionary.test'})).length,1);
});
