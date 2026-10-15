import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as workspace from '../src/services/workspaceService.ts';
import {careerTargetRevision, getCareerPath, saveCareerTarget} from '../src/services/roleMentorService.ts';
import {getResourceEditorDraft, saveResourceEditorDraft, clearResourceEditorDraft} from '../src/services/resourceEditorDraft.ts';
const memory=new Map(), session=new Map(); let failed='';
globalThis.localStorage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>{if(key===failed)throw Error('quota');memory.set(key,String(value));},removeItem:key=>memory.delete(key)};
globalThis.sessionStorage={getItem:key=>session.get(key)??null,setItem:(key,value)=>session.set(key,String(value))};
globalThis.window={dispatchEvent(){}};globalThis.CustomEvent??=class{constructor(type){this.type=type;}};
const ctx={personId:'demo-professional',workspaceId:'demo-professional:professional',role:'professional',locale:'en'};
beforeEach(()=>{memory.clear();session.clear();failed='';workspace.configureMock({latency:0,fault:'none',now:()=>new Date('2026-10-01T12:00:00Z')});workspace.seedDemo('professional');});
test('career creation rejects concurrent target and does not create a second goal',()=>{
 const base=careerTargetRevision(getCareerPath(ctx).goal);
 saveCareerTarget(ctx,{title:'Latest',body:''},base);
 const original=memory.get('visionary_workspace_v2');
 assert.throws(()=>saveCareerTarget(ctx,{title:'Stale',body:''},base),/another tab/);
 assert.equal(memory.get('visionary_workspace_v2'),original);
});
test('career revision protects capability and same-clock edits',()=>{
 const goal=saveCareerTarget(ctx,{title:'Initial',body:''});const base=careerTargetRevision(goal);
 saveCareerTarget(ctx,{id:goal.id,title:'Newest',body:'Other edits'},base);
 assert.throws(()=>saveCareerTarget(ctx,{id:goal.id,title:'Old tab',body:''},base),/another tab/);
 assert.equal(getCareerPath(ctx).goal.title,'Newest');
 assert.notEqual(careerTargetRevision({...goal,conceptId:'a'}),careerTargetRevision({...goal,conceptId:'b'}));
});
test('career edits recover in their tab and stay separate from saved goals',()=>{
 const key='new:career-direction';const draft={title:'Unsaved',body:'PRIVATE',conceptId:''};
 session.set('visionary_resource_editor_tab','tab-a');saveResourceEditorDraft(ctx,key,draft,'null');
 assert.equal(getCareerPath(ctx).goal,null);assert.deepEqual(getResourceEditorDraft(ctx,key).draft,draft);
 session.set('visionary_resource_editor_tab','tab-b');assert.equal(getResourceEditorDraft(ctx,key),null);
 saveResourceEditorDraft(ctx,key,{...draft,title:'Tab B'},'null');
 session.set('visionary_resource_editor_tab','tab-a');clearResourceEditorDraft(ctx,key);
 session.set('visionary_resource_editor_tab','tab-b');assert.equal(getResourceEditorDraft(ctx,key).draft.title,'Tab B');
});
test('failed career save retains saved target and editor recovery for retry',()=>{
 const goal=saveCareerTarget(ctx,{title:'Saved',body:''});const base=careerTargetRevision(goal);
 const draft={id:goal.id,title:'Retry me',body:'Retain',conceptId:''};saveResourceEditorDraft(ctx,'new:career-direction',draft,base);
 const original=memory.get('visionary_workspace_v2');failed='visionary_workspace_v2';
 assert.throws(()=>saveCareerTarget(ctx,draft,base));assert.equal(memory.get('visionary_workspace_v2'),original);
 assert.equal(getResourceEditorDraft(ctx,'new:career-direction').draft.title,'Retry me');
 failed='';assert.equal(saveCareerTarget(ctx,draft,base).title,'Retry me');
});
test('unsupported capability and nonprofessional actor do not change target',()=>{
 const original=memory.get('visionary_workspace_v2');
 assert.throws(()=>saveCareerTarget(ctx,{title:'Unknown',body:'',conceptId:'unsupported'},'null'),/own learning outline/);
 assert.throws(()=>saveCareerTarget({...ctx,role:'student'},{title:'Wrong role',body:''}),/workspace/);
 assert.equal(memory.get('visionary_workspace_v2'),original);
});
