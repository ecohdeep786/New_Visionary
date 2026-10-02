import test,{beforeEach} from 'node:test';import assert from 'node:assert/strict';import * as w from '../src/services/workspaceService.ts';
const memory=new Map();let failed=false;globalThis.localStorage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>{if(failed&&key==='visionary_workspace_v2')throw Error('quota');memory.set(key,String(value));},removeItem:key=>memory.delete(key)};globalThis.window={dispatchEvent(){}};globalThis.CustomEvent??=class{constructor(type){this.type=type;}};
const org={personId:'demo-school-admin',workspaceId:'demo-school-admin:organization',role:'organization',locale:'en'};
const member={personId:'demo-company-admin',workspaceId:'demo-company-admin:organization',role:'organization',locale:'en'};
function grant(capability='academic-admin'){const invite=w.requestOrganizationInvite(org,'company-admin@visionary.test','organization','School',capability);w.changeOrganizationInvite(member,invite.id,'active');const space=w.bootstrapPerson({id:member.personId,email:'company-admin@visionary.test',identity:'organization'}).workspaces.find(row=>row.organizationId==='school-admin@visionary.test');return {ctx:{...member,workspaceId:space.id},invite};}
beforeEach(()=>{memory.clear();failed=false;w.configureMock({latency:0,fault:'none',now:()=>new Date('2026-10-02T12:00:00Z')});w.seedDemo('school-admin');});
test('owner settings are versioned, audited, idempotent and fail without partial changes',()=>{
 const initial=w.getOrganizationSettings(org);assert.equal(initial.revision,0);const input={kind:'company',contentLanguage:'hi',teacherDeliveryEnabled:false};
 failed=true;const original=memory.get('visionary_workspace_v2');assert.throws(()=>w.saveOrganizationSettings(org,input,0));assert.equal(memory.get('visionary_workspace_v2'),original);failed=false;
 const saved=w.saveOrganizationSettings(org,input,0);assert.equal(saved.revision,1);const after=memory.get('visionary_workspace_v2');assert.throws(()=>w.saveOrganizationSettings(org,{...input,kind:'ngo'},0),/changed/);assert.equal(memory.get('visionary_workspace_v2'),after);assert.equal(w.saveOrganizationSettings(org,input,1).revision,1);
 const audit=w.organizationAudit(org).entries.find(row=>row.action==='Organization settings saved');assert.equal(audit.actor,org.personId);assert.match(audit.target,/before/);
});
test('academic members read owner defaults but cannot alter them; analysts and revoked members are refused',()=>{
 const {ctx,invite}=grant();w.saveOrganizationSettings(org,{kind:'school',contentLanguage:'bn',teacherDeliveryEnabled:false},0);assert.equal(w.getOrganizationSettings(ctx).contentLanguage,'bn');assert.throws(()=>w.saveOrganizationSettings(ctx,{kind:'company',contentLanguage:'en',teacherDeliveryEnabled:true},1),/permission/);
 w.changeOrganizationCapability(org,invite.id,'analyst');assert.throws(()=>w.getOrganizationSettings(ctx),/permission/);w.changeOrganizationInvite(org,invite.id,'revoked');assert.throws(()=>w.getOrganizationSettings(ctx),/active|permission/);
});
test('malformed settings are retained and unsupported fields do not write',()=>{
 assert.throws(()=>w.saveOrganizationSettings(org,{kind:'invalid',contentLanguage:'en',teacherDeliveryEnabled:true},0),/supported/);
 const db=JSON.parse(memory.get('visionary_workspace_v2'));db.data[org.workspaceId].organizationSettings={revision:1,kind:'school',contentLanguage:'xx',teacherDeliveryEnabled:true};memory.set('visionary_workspace_v2',JSON.stringify(db));const original=memory.get('visionary_workspace_v2');assert.throws(()=>w.getOrganizationSettings(org),/could not be read/);assert.throws(()=>w.saveOrganizationSettings(org,{kind:'school',contentLanguage:'en',teacherDeliveryEnabled:true},1),/could not be read/);assert.equal(memory.get('visionary_workspace_v2'),original);
});

test('organization promotion audit excludes private profiles, foreign and unscoped transitions and reports unreadable history',()=>{
 const at=new Date().toISOString();const scoped={id:'one',personId:'PRIVATE_LEARNER',trigger:'teacher-promotion',eventId:'event',actor:'assigned-teacher',classScope:{classId:'class-one',organizationEmail:'school-admin@visionary.test'},from:{institution:'PRIVATE_SOURCE'},to:{classLevel:'7',institution:'PRIVATE_NEW_SOURCE'},state:'applied',notifiedAt:at};
 memory.set('visionary_stage_transitions_v1',JSON.stringify({version:1,transitions:[scoped,{...scoped,id:'two',personId:'PRIVATE_SECOND',state:'undone'},{...scoped,id:'foreign',classScope:{classId:'secret-class',organizationEmail:'elsewhere@visionary.test'}},{...scoped,id:'legacy',classScope:undefined}]}));
 const result=w.organizationAudit(org);const rows=result.entries.filter(row=>row.source==='transition');assert.equal(rows.length,1);assert.equal(rows[0].actor,'assigned-teacher');assert.match(rows[0].outcome,/applied: 1, undone: 1/);assert.doesNotMatch(JSON.stringify(result),/PRIVATE|secret-class|elsewhere/);
 memory.set('visionary_stage_transitions_v1','unreadable');assert.ok(w.organizationAudit(org).unavailableSources.includes('Scoped promotion history'));assert.equal(memory.get('visionary_stage_transitions_v1'),'unreadable');
});
