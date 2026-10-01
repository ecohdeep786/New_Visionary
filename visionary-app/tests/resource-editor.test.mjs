import test,{beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import * as workspace from '../src/services/workspaceService.ts';
import {saveResourceEditorDraft,getResourceEditorDraft,clearResourceEditorDraft} from '../src/services/resourceEditorDraft.ts';
const memory=new Map(),tabs=new Map();globalThis.localStorage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,String(value)),removeItem:key=>memory.delete(key)};globalThis.sessionStorage={getItem:key=>tabs.get(key)??null,setItem:(key,value)=>tabs.set(key,String(value))};globalThis.window={dispatchEvent(){}};globalThis.CustomEvent??=class{constructor(type){this.type=type;}};
const ctx={personId:'demo-teacher',workspaceId:'demo-teacher:teacher',role:'teacher',locale:'en'};
beforeEach(()=>{memory.clear();tabs.clear();workspace.configureMock({latency:0,fault:'none',now:()=>new Date('2026-09-30T12:00:00Z')});workspace.seedDemo('teacher');});
const resource=()=>workspace.saveResource(ctx,{title:'Lesson',body:'Saved',kind:'lesson',status:'draft'});
test('resource edits recover their original revision, reject a stale same-clock save and preserve latest content',()=>{
 const row=resource();const basis=workspace.resourceRevision(row);saveResourceEditorDraft(ctx,row.id,{...row,body:'Unsaved'},basis);
 workspace.saveResource(ctx,{...row,body:'Newer saved'},basis);const backup=getResourceEditorDraft(ctx,row.id);assert.equal(backup.draft.body,'Unsaved');assert.equal(backup.baseRevision,basis);
 const before=memory.get('visionary_workspace_v2');assert.throws(()=>workspace.saveResource(ctx,backup.draft,backup.baseRevision),error=>error.name==='ResourceConflictError');assert.equal(memory.get('visionary_workspace_v2'),before);
 const latest=workspace.snapshot(ctx).resources.find(item=>item.id===row.id);workspace.saveResource(ctx,{...latest,body:'Reviewed merge'},workspace.resourceRevision(latest));clearResourceEditorDraft(ctx,row.id);assert.equal(getResourceEditorDraft(ctx,row.id),null);
});
test('new resource drafts and simultaneous editor tabs remain isolated from other owners and each other',()=>{
 const row=resource();tabs.set('visionary_resource_editor_tab','one');saveResourceEditorDraft(ctx,row.id,{...row,body:'Tab one'},workspace.resourceRevision(row));saveResourceEditorDraft(ctx,'new:lesson',{title:'New unsaved lesson',body:'Outline',kind:'lesson'});
 tabs.set('visionary_resource_editor_tab','two');assert.equal(getResourceEditorDraft(ctx,row.id),null);saveResourceEditorDraft(ctx,row.id,{...row,body:'Tab two'},workspace.resourceRevision(row));clearResourceEditorDraft(ctx,row.id);
 tabs.set('visionary_resource_editor_tab','one');assert.equal(getResourceEditorDraft(ctx,row.id).draft.body,'Tab one');assert.equal(getResourceEditorDraft(ctx,'new:lesson').draft.title,'New unsaved lesson');
 assert.throws(()=>getResourceEditorDraft({...ctx,personId:'demo-adult'},row.id),/access/);assert.throws(()=>getResourceEditorDraft({...ctx,workspaceId:'demo-school-teacher:teacher'},row.id),/access/);
});
test('failed backup, cleanup and resource saves retain existing edits and originals',()=>{
 const row=resource();saveResourceEditorDraft(ctx,row.id,{...row,body:'Retained'},workspace.resourceRevision(row));const before=new Map(memory);const set=localStorage.setItem;localStorage.setItem=()=>{throw Error('Full');};
 try{assert.throws(()=>saveResourceEditorDraft(ctx,row.id,{...row,body:'Not saved'}),/backed up/);assert.throws(()=>clearResourceEditorDraft(ctx,row.id),/backed up/);assert.throws(()=>workspace.saveResource(ctx,{...row,body:'Not committed'},workspace.resourceRevision(row)),/saved/);assert.deepEqual(memory,before);}finally{localStorage.setItem=set;}
 assert.equal(getResourceEditorDraft(ctx,row.id).draft.body,'Retained');
});
