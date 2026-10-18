import test,{beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import * as workspace from '../src/services/workspaceService.ts';
import {getSavedWorkspaceSearch} from '../src/services/workspaceSearchService.ts';
import {matchWorkspaceSearch} from '../src/lib/workspaceSearch.js';
import {openGuideLocation} from '../src/services/guideEntryService.ts';
import {workspaceSearchCopy} from '../src/lib/workspaceSearchCopy.js';

const storage=new Map();
globalThis.localStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,String(value)),removeItem:key=>storage.delete(key)};
globalThis.window={dispatchEvent(){}};
globalThis.CustomEvent??=class{constructor(type){this.type=type;}};
const ctx={personId:'demo-adult',workspaceId:'demo-adult:student',role:'student',locale:'en'};
beforeEach(()=>{storage.clear();workspace.configureMock({latency:0,fault:'none'});workspace.seedDemo('adult');});
function unit(id='original / unit',title='Cube volume') {
  storage.set('visionary_learning_pipeline_v1',JSON.stringify({version:1,spaces:{[ctx.workspaceId]:{units:[{id,conceptId:'cube',title,locale:'en',updatedAt:'2026-10-10T12:00:00Z',sourceContext:{selection:{board:'Fixture',classLevel:'7',subject:'Mathematics'},provenance:{provider:'Fixture',sourceId:'book',version:'3'}}}]}}}));
}
test('saved search resumes exact owned records without indexing private contents or changing storage',()=>{
  const project=workspace.saveArtifact(ctx,{title:'Storage box',body:'Secret blueprint body'});
  const conversation=workspace.newConversation(ctx,'Cube question');
  workspace.updateConversation(ctx,conversation.id,{draft:'Secret message draft'});
  unit();const before=new Map(storage),result=getSavedWorkspaceSearch(ctx);
  assert.deepEqual(result.unavailable,[]);assert.equal(result.items.length,3);
  assert.equal(result.items.find(row=>row.kind==='activity').to,'/dashboard/learn?unit=original%20%2F%20unit');
  assert.equal(result.items.find(row=>row.kind==='project').to,'/dashboard/build?artifact='+project.id);
  assert.equal(result.items.find(row=>row.kind==='conversation').to,'/dashboard/ask?conversation='+conversation.id);
  assert.equal(matchWorkspaceSearch(result.items,'Secret').length,0);
  assert.deepEqual(storage,before);
});
test('each role remains isolated, and forged contexts fail before exposing any titles',()=>{
  workspace.saveArtifact(ctx,{title:'Private student project',body:'private'});unit();
  for(const role of ['teacher','professional','parent','organization']) assert.equal(getSavedWorkspaceSearch({...ctx,workspaceId:'demo-adult:'+role,role}).items.length,0);
  assert.throws(()=>getSavedWorkspaceSearch({...ctx,personId:'foreign'}),/access|account/i);
  assert.throws(()=>getSavedWorkspaceSearch({...ctx,role:'teacher'}),/access/i);
});
test('unreadable learning preserves other titles and originals, while an unreadable workspace fails closed',()=>{
  const project=workspace.saveArtifact(ctx,{title:'Retained project',body:'private'});
  storage.set('visionary_learning_pipeline_v1','Unreadable original');const before=new Map(storage);
  const result=getSavedWorkspaceSearch(ctx);assert.deepEqual(result.unavailable,['activities']);assert.equal(result.items[0].id,project.id);assert.deepEqual(storage,before);
  storage.set('visionary_workspace_v2','Unreadable workspace');assert.throws(()=>getSavedWorkspaceSearch(ctx),/could not be read/i);
});
test('matching ranks exact titles, normalizes widths, accepts several words and deduplicates destinations',()=>{
  const items=[{label:'Cube volume exercise',detail:'Mathematics',to:'a'},{label:'Cube volume',to:'b'},{label:'Cube volume',to:'b'},{label:'Ｃｕｂｅ report',to:'c'},{label:'তাপমাত্রা',to:'d'}];
  assert.deepEqual(matchWorkspaceSearch(items,'cube volume').map(row=>row.to),['b','a']);
  assert.deepEqual(matchWorkspaceSearch(items,'math cube').map(row=>row.to),['a']);
  assert.deepEqual(matchWorkspaceSearch(items,'cube').map(row=>row.to),['a','b','c']);
  assert.equal(matchWorkspaceSearch(items,'তাপমাত্রা')[0].to,'d');
  assert.equal(matchWorkspaceSearch(items,'',2).length,2);
  assert.equal(matchWorkspaceSearch(items,'/dashboard').length,0);
});
test('conversation deep links select the exact saved draft and reject removed or foreign ids without writes',()=>{
  const first=workspace.newConversation(ctx,'First');workspace.updateConversation(ctx,first.id,{draft:'Retained first draft',canvasPath:'/dashboard/learn?unit=retained'});
  const latest=workspace.newConversation(ctx,'Latest');workspace.updateConversation(ctx,latest.id,{draft:'Latest draft'});
  const view=openGuideLocation(ctx,{conversationId:first.id});assert.equal(view.selected,first.id);assert.equal(view.input,'Retained first draft');assert.equal(view.canvasPath,'/dashboard/learn?unit=retained');assert.equal(view.pane,'activity');
  const before=new Map(storage);assert.throws(()=>openGuideLocation(ctx,{conversationId:'missing'}),/not found/);assert.throws(()=>openGuideLocation({...ctx,workspaceId:'demo-adult:teacher',role:'teacher'},{conversationId:first.id}),/not found/);assert.deepEqual(storage,before);
});
test('new search states have explicit English, Hindi and Bengali copy',()=>{
  for(const locale of ['en','hi','bn'])for(const key of ['input','scope','activity','project','conversation','pages','partial','retry','empty','clear','hint'])assert.notEqual(workspaceSearchCopy(locale)(key),key);
});
test('revoked company membership hides search titles and retains personal and company originals',()=>{
  const membership={id:'work-search',email:'adult@visionary.test',role:'professional',organization_email:'company-admin@visionary.test',organization_name:'Demo Company',status:'active'};
  storage.set('visionary_entity_OrganizationInvite',JSON.stringify([membership]));
  const profile=workspace.bootstrapPerson({id:ctx.personId,email:membership.email,identity:'student'});
  const work={...ctx,role:'professional',workspaceId:profile.workspaces.find(row=>row.organizationId).id};
  workspace.newConversation(work,'Confidential work title');workspace.saveArtifact({...ctx,role:'professional',workspaceId:'demo-adult:professional'},{title:'Personal work',body:'private'});
  assert.equal(getSavedWorkspaceSearch(work).items[0].label,'Confidential work title');
  storage.set('visionary_entity_OrganizationInvite',JSON.stringify([{...membership,status:'revoked'}]));const before=new Map(storage);
  assert.throws(()=>getSavedWorkspaceSearch(work),/no longer active/);
  assert.equal(getSavedWorkspaceSearch({...ctx,role:'professional',workspaceId:'demo-adult:professional'}).items[0].label,'Personal work');assert.deepEqual(storage,before);
});
