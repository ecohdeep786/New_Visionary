import test,{beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {configureMock,seedDemo,saveArtifact,snapshot,artifactRevision} from '../src/services/workspaceService.ts';
import {saveArtifactEditorDraft,getArtifactEditorDraft,recoverArtifactEditorDraft,clearArtifactEditorDraft} from '../src/services/artifactEditorDraft.ts';
const memory=new Map();globalThis.localStorage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,String(value)),removeItem:key=>memory.delete(key)};globalThis.window={dispatchEvent(){}};globalThis.CustomEvent??=class{constructor(type){this.type=type;}};
const ctx={personId:'demo-adult',workspaceId:'demo-adult:student',role:'student',locale:'en'};
beforeEach(()=>{memory.clear();configureMock({latency:0,fault:'none',now:()=>new Date('2026-09-30T12:00:00Z')});seedDemo('adult');});
test('same-clock project edits cannot silently overwrite another saved version',()=>{
 const first=saveArtifact(ctx,{title:'Reasoning',body:'First version'});const base=artifactRevision(first);
 const second=saveArtifact(ctx,{...first,body:'Saved in another tab'},base);assert.equal(second.updatedAt,first.updatedAt);
 const before=localStorage.getItem('visionary_workspace_v2');assert.throws(()=>saveArtifact(ctx,{...first,body:'Stale editor'},base),error=>error.name==='ArtifactConflictError');assert.equal(localStorage.getItem('visionary_workspace_v2'),before);
 const saved=saveArtifact(ctx,{...second,body:'Reviewed latest'},artifactRevision(second));assert.equal(saved.body,'Reviewed latest');
});
test('recovered drafts retain their original revision so a refresh cannot hide a conflict',()=>{
 const first=saveArtifact(ctx,{title:'Reasoning',body:'First version'});saveArtifactEditorDraft(ctx,{...first,body:'Unsaved edits'},artifactRevision(first));
 const second=saveArtifact(ctx,{...first,body:'Other saved version'},artifactRevision(first));const draft=getArtifactEditorDraft(ctx,first.id);const recovered=recoverArtifactEditorDraft(second,draft);
 assert.equal(recovered.body,'Unsaved edits');assert.equal(draft.baseRevision,artifactRevision(first));assert.throws(()=>saveArtifact(ctx,recovered,draft.baseRevision),/changed since/);
 saveArtifactEditorDraft(ctx,recovered,draft.baseRevision);assert.equal(getArtifactEditorDraft(ctx,first.id).baseRevision,artifactRevision(first));
});
test('failed conflict-copy saves preserve the original and unsaved backup; successful copies start private',()=>{
 const first=saveArtifact(ctx,{title:'Reasoning',body:'Latest original'});saveArtifactEditorDraft(ctx,{...first,body:'My copy'},artifactRevision(first));const original=localStorage.setItem;
 localStorage.setItem=(key,value)=>{if(key==='visionary_workspace_v2')throw Error('Full');original(key,value);};
 try{assert.throws(()=>saveArtifact(ctx,{title:'Copy',body:'My copy',status:'in-progress'}),/could not be saved/);}finally{localStorage.setItem=original;}
 assert.equal(snapshot(ctx).artifacts.length,1);assert.equal(getArtifactEditorDraft(ctx,first.id).body,'My copy');
 const copy=saveArtifact(ctx,{title:'Copy',body:'My copy',status:'in-progress'});assert.equal(copy.visibility,'private');assert.deepEqual(copy.sharedWith,[]);assert.equal(copy.learningSessionId,undefined);assert.equal(snapshot(ctx).artifacts.find(item=>item.id===first.id).body,'Latest original');
});

test('saving and clearing one tab draft cannot remove another tab unsaved work',()=>{
 const first=saveArtifact(ctx,{title:'Shared editor',body:'Saved'});let tab='tab-a';globalThis.sessionStorage={getItem:()=>tab,setItem(){}};
 try{saveArtifactEditorDraft(ctx,{...first,body:'Tab A edits'},artifactRevision(first));tab='tab-b';saveArtifactEditorDraft(ctx,{...first,body:'Tab B edits'},artifactRevision(first));clearArtifactEditorDraft(ctx,first.id);assert.equal(getArtifactEditorDraft(ctx,first.id),null);tab='tab-a';assert.equal(getArtifactEditorDraft(ctx,first.id).body,'Tab A edits');}finally{delete globalThis.sessionStorage;}
});
