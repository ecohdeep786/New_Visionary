import test,{beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import * as workspace from '../src/services/workspaceService.ts';
const store=new Map();globalThis.localStorage={getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,String(value)),removeItem:key=>store.delete(key)};globalThis.window={dispatchEvent(){}};globalThis.CustomEvent??=class{constructor(type){this.type=type;}};
const owner={personId:'demo-school-admin',workspaceId:'demo-school-admin:organization',role:'organization',locale:'en'};
let reviewer,invite;
beforeEach(()=>{store.clear();workspace.configureMock({latency:0,fault:'none'});workspace.seedDemo('school-admin');const personal={personId:'demo-company-admin',workspaceId:'demo-company-admin:organization',role:'organization',locale:'en'};invite=workspace.requestOrganizationInvite(owner,'company-admin@visionary.test','organization','School','academic-admin');workspace.changeOrganizationInvite(personal,invite.id,'active');const space=workspace.bootstrapPerson({id:personal.personId,email:'company-admin@visionary.test',identity:'organization'}).workspaces.find(row=>row.organizationId==='school-admin@visionary.test');reviewer={...personal,workspaceId:space.id};});
const draft=()=>workspace.saveOrganizationContent(owner,{title:'Fraction objective',body:'Authored example',source:'Fictional fixture, version 1',language:'en'});
const approved={source:true,accuracy:true,language:true};
function acceptedTeacher(){const person={personId:'demo-teacher',workspaceId:'demo-teacher:teacher',role:'teacher',locale:'en'};const membership=workspace.requestOrganizationInvite(owner,'teacher@visionary.test','teacher','School');workspace.changeOrganizationInvite(person,membership.id,'active');const space=workspace.bootstrapPerson({id:person.personId,email:'teacher@visionary.test',identity:'teacher'}).workspaces.find(row=>row.role==='teacher'&&row.organizationId==='school-admin@visionary.test');return {ctx:{...person,workspaceId:space.id},personal:person,membership};}

test('organization source review requires a different author and retains versioned changes and review notes',()=>{
 const item=draft();workspace.changeOrganizationContent(owner,item.id,1,'submit');
 assert.throws(()=>workspace.changeOrganizationContent(owner,item.id,1,'approve','Checked',approved),/different academic/);
 assert.throws(()=>workspace.changeOrganizationContent(reviewer,item.id,1,'approve','Checked',{source:true,accuracy:false,language:true}),/Review source/);
 assert.throws(()=>workspace.changeOrganizationContent(reviewer,item.id,1,'request-changes'),/Explain/);
 workspace.changeOrganizationContent(reviewer,item.id,1,'request-changes','Explain equal parts.');
 const next=workspace.saveOrganizationContent(owner,{...item,body:'Equal parts example',source:item.contentReview.source,language:'en'},1);
 assert.equal(next.contentReview.revision,2);assert.equal(next.contentReview.versions[0].body,'Authored example');
 assert.equal(next.contentReview.history.find(row=>row.action==='request-changes').note,'Explain equal parts.');
 workspace.changeOrganizationContent(owner,item.id,2,'submit');workspace.changeOrganizationContent(reviewer,item.id,2,'approve','Source, objective and language checked.',approved);
 assert.equal(workspace.snapshot(owner).resources.find(row=>row.id===item.id).status,'approved');
 assert.throws(()=>workspace.saveOrganizationContent(owner,{...item,source:'changed',language:'en'},2),/new draft revision/);
 workspace.changeOrganizationContent(owner,item.id,2,'revise');workspace.saveOrganizationContent(owner,{...item,body:'Third version',source:'Fictional version 3',language:'en'},2);
 assert.equal(workspace.snapshot(reviewer).resources.find(row=>row.id===item.id).contentReview.versions[0].body,'Equal parts example');
});

test('content actions reject forged permission, bypasses and stale versions; archival retains content',()=>{
 const item=draft();const changed=workspace.saveOrganizationContent(owner,{...item,body:'Newer draft',source:'Version 2',language:'en'},1);
 assert.throws(()=>workspace.saveOrganizationContent(owner,{...item,source:'Old',language:'en'},1),/version changed/);
 assert.throws(()=>workspace.changeOrganizationContent(owner,item.id,1,'submit'),/changed/);
 assert.throws(()=>workspace.saveResource(owner,changed),/review workflow/);assert.throws(()=>workspace.archiveResource(owner,item.id),/review workflow/);
 workspace.changeOrganizationCapability(owner,invite.id,'analyst');assert.throws(()=>workspace.changeOrganizationContent(reviewer,item.id,2,'submit'),/permission/);
 workspace.changeOrganizationContent(owner,item.id,2,'archive');workspace.changeOrganizationContent(owner,item.id,2,'restore');assert.equal(workspace.snapshot(owner).resources.find(row=>row.id===item.id).body,'Newer draft');
 assert.throws(()=>workspace.changeOrganizationContent(owner,item.id,2,'approve','Forged',approved),/unavailable/);
});

test('failed content saves or review writes preserve the prior record and history for retry',()=>{
 const item=draft();const before=store.get('visionary_workspace_v2');const set=localStorage.setItem;localStorage.setItem=()=>{throw Error('Full');};
 try{assert.throws(()=>workspace.changeOrganizationContent(owner,item.id,1,'submit'),/saved/);assert.throws(()=>workspace.saveOrganizationContent(owner,{...item,body:'Unsaved',source:'Version 2',language:'en'},1),/saved/);assert.equal(store.get('visionary_workspace_v2'),before);}finally{localStorage.setItem=set;}
 workspace.changeOrganizationContent(owner,item.id,1,'submit');assert.equal(workspace.snapshot(owner).resources.find(row=>row.id===item.id).contentReview.history.filter(row=>row.action==='submit').length,1);
 const missing=workspace.saveOrganizationContent(owner,{title:'Incomplete',body:'',source:'',language:'en'});assert.throws(()=>workspace.changeOrganizationContent(owner,missing.id,1,'submit'),/content and an exact source/);
});

test('approved deliveries are fixed, explicit, idempotent and become teacher-controlled unreviewed drafts',()=>{
 const teacher=acceptedTeacher();const item=draft();assert.throws(()=>workspace.deliverOrganizationContent(owner,item.id,1,'teacher@visionary.test'),/approved/);
 workspace.changeOrganizationContent(owner,item.id,1,'submit');workspace.changeOrganizationContent(reviewer,item.id,1,'approve','Checked',approved);
 assert.throws(()=>workspace.deliverOrganizationContent(owner,item.id,1,'unknown@visionary.test'),/active accepted teacher/);
 const delivery=workspace.deliverOrganizationContent(owner,item.id,1,'teacher@visionary.test');assert.equal(workspace.deliverOrganizationContent(owner,item.id,1,'teacher@visionary.test').id,delivery.id);
 assert.deepEqual(workspace.teacherOrganizationContent(teacher.personal),[]);assert.equal(workspace.teacherOrganizationContent(teacher.ctx)[0].body,'Authored example');
 const copy=workspace.importOrganizationContent(teacher.ctx,delivery.id);assert.equal(copy.status,'draft');assert.equal(copy.sourceSnapshot.revision,1);assert.equal(copy.contentReview,undefined);assert.equal(workspace.importOrganizationContent(teacher.ctx,delivery.id).id,copy.id);
 workspace.saveResource(teacher.ctx,{...copy,body:'Teacher adaptation',status:'reviewed'});workspace.changeOrganizationContent(owner,item.id,1,'revise');workspace.saveOrganizationContent(owner,{...item,body:'Organization later edits',source:'Version 2',language:'en'},1);
 assert.equal(workspace.teacherOrganizationContent(teacher.ctx)[0].body,'Authored example');assert.equal(workspace.snapshot(teacher.ctx).resources.find(row=>row.id===copy.id).body,'Teacher adaptation');
 assert.throws(()=>workspace.saveResource(teacher.ctx,{...copy,sourceSnapshot:{...copy.sourceSnapshot,revision:999}}),/cannot be replaced/);
 assert.equal(workspace.organizationAudit(owner).entries.find(row=>row.action==='Approved content delivered').actor,owner.personId);
});

test('owner delivery pause blocks new copies by academic members and retains earlier copies and retries',()=>{
 const teacher=acceptedTeacher();const item=draft();workspace.changeOrganizationContent(owner,item.id,1,'submit');workspace.changeOrganizationContent(reviewer,item.id,1,'approve','Checked',approved);
 const settings={kind:'school',contentLanguage:'bn',teacherDeliveryEnabled:false};workspace.saveOrganizationSettings(owner,settings,0);
 const original=store.get('visionary_workspace_v2');assert.throws(()=>workspace.deliverOrganizationContent(reviewer,item.id,1,'teacher@visionary.test'),/paused/);assert.equal(store.get('visionary_workspace_v2'),original);assert.deepEqual(workspace.teacherOrganizationContent(teacher.ctx),[]);
 workspace.saveOrganizationSettings(owner,{...settings,teacherDeliveryEnabled:true},1);const delivery=workspace.deliverOrganizationContent(reviewer,item.id,1,'teacher@visionary.test');const copy=workspace.importOrganizationContent(teacher.ctx,delivery.id);
 workspace.saveOrganizationSettings(owner,settings,2);assert.equal(workspace.deliverOrganizationContent(reviewer,item.id,1,'teacher@visionary.test').id,delivery.id);assert.equal(workspace.teacherOrganizationContent(teacher.ctx)[0].id,delivery.id);assert.equal(workspace.snapshot(teacher.ctx).resources.find(row=>row.id===copy.id).body,'Authored example');
});

test('closed or renewed teacher membership does not recover old deliveries; failed writes do not fabricate delivery or import',()=>{
 const teacher=acceptedTeacher();const item=draft();workspace.changeOrganizationContent(owner,item.id,1,'submit');workspace.changeOrganizationContent(reviewer,item.id,1,'approve','Checked',approved);
 const before=store.get('visionary_workspace_v2');const set=localStorage.setItem;localStorage.setItem=()=>{throw Error('Full');};
 try{assert.throws(()=>workspace.deliverOrganizationContent(owner,item.id,1,'teacher@visionary.test'),/saved/);assert.equal(store.get('visionary_workspace_v2'),before);}finally{localStorage.setItem=set;}
 const delivery=workspace.deliverOrganizationContent(owner,item.id,1,'teacher@visionary.test');const delivered=store.get('visionary_workspace_v2');localStorage.setItem=()=>{throw Error('Full');};
 try{assert.throws(()=>workspace.importOrganizationContent(teacher.ctx,delivery.id),/saved/);assert.equal(store.get('visionary_workspace_v2'),delivered);}finally{localStorage.setItem=set;}
 workspace.changeOrganizationInvite(owner,teacher.membership.id,'revoked');assert.throws(()=>workspace.teacherOrganizationContent(teacher.ctx),/no longer active/);assert.throws(()=>workspace.deliverOrganizationContent(owner,item.id,1,'teacher@visionary.test'),/active accepted teacher/);
 const renewed=acceptedTeacher();assert.deepEqual(workspace.teacherOrganizationContent(renewed.ctx),[]);assert.throws(()=>workspace.importOrganizationContent(renewed.ctx,delivery.id),/unavailable/);
});

test('curriculum templates keep separate category and review/distribution lifecycle with old versions retained',()=>{
 const teacher=acceptedTeacher();const item=workspace.saveOrganizationContent(owner,{kind:'curriculum',title:'Mathematics scope template',body:'Group: Class 6\nObjective fraction-1: compare equal parts.\nPrerequisite: identify a whole.\nSource section: page 12.',source:'Fictional curriculum source v1',language:'bn'});
 assert.equal(item.kind,'curriculum');assert.throws(()=>workspace.saveOrganizationContent(owner,{...item,kind:'lesson',source:'Different',language:'en'},1),/category/);
 workspace.changeOrganizationContent(owner,item.id,1,'submit');assert.throws(()=>workspace.changeOrganizationContent(owner,item.id,1,'approve','Checked',approved),/different academic/);workspace.changeOrganizationContent(reviewer,item.id,1,'approve','Mapped objectives and source sections checked.',approved);
 const delivery=workspace.deliverOrganizationContent(owner,item.id,1,'teacher@visionary.test');const imported=workspace.importOrganizationContent(teacher.ctx,delivery.id);assert.equal(imported.status,'draft');assert.equal(imported.kind,'lesson');assert.equal(imported.sourceSnapshot.revision,1);assert.match(imported.body,/fraction-1/);
 workspace.changeOrganizationContent(owner,item.id,1,'revise');workspace.saveOrganizationContent(owner,{...item,kind:'curriculum',body:'Changed objectives, draft v2',source:'Fictional curriculum source v2',language:'en'},1);
 const newest=workspace.snapshot(owner).resources.find(row=>row.id===item.id);assert.equal(newest.kind,'curriculum');assert.match(newest.contentReview.versions[0].body,/fraction-1/);assert.equal(workspace.teacherOrganizationContent(teacher.ctx)[0].body,delivery.body);assert.equal(workspace.snapshot(teacher.ctx).resources.find(row=>row.id===imported.id).sourceSnapshot.language,'bn');
});

test('ambiguous imported editorial metadata cannot be saved, reviewed or delivered and keeps original bytes',()=>{
 const item=draft();const original=store.get('visionary_workspace_v2');
 for(const patch of [{title:null},{body:{}},{contentReview:{...item.contentReview,history:null}},{contentReview:{...item.contentReview,versions:[{revision:1,title:'Earlier',body:'Body',source:'Source',language:'en'}]}},{contentReview:{...item.contentReview,revision:0}},{contentReview:{...item.contentReview,author:''}},{contentReview:{...item.contentReview,language:'unknown'}}]){
  const db=JSON.parse(original);const row=db.data[owner.workspaceId].resources.find(row=>row.id===item.id);Object.assign(row,patch);const malformed=JSON.stringify(db);store.set('visionary_workspace_v2',malformed);
  assert.throws(()=>workspace.saveOrganizationContent(owner,{id:item.id,title:'Edited',body:'Edited',source:'Source',language:'en'},1),/incomplete or ambiguous/);
  assert.throws(()=>workspace.changeOrganizationContent(reviewer,item.id,1,'approve','Review',approved),/incomplete or ambiguous/);
  assert.throws(()=>workspace.deliverOrganizationContent(owner,item.id,1,'teacher@visionary.test'),/incomplete or ambiguous/);
  assert.equal(store.get('visionary_workspace_v2'),malformed);
 }
 store.set('visionary_workspace_v2',original);workspace.changeOrganizationContent(owner,item.id,1,'submit');assert.equal(workspace.snapshot(owner).resources.find(row=>row.id===item.id).status,'submitted');
});
