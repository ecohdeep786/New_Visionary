import test,{beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import * as workspace from '../src/services/workspaceService.ts';
import {getPortfolioReviewDraft,savePortfolioReviewDraft,clearPortfolioReviewDraft} from '../src/services/portfolioReviewDraft.ts';
const memory=new Map(),session=new Map();let failed='';
globalThis.localStorage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>{if(key===failed)throw Error('quota');memory.set(key,String(value));},removeItem:key=>memory.delete(key)};
globalThis.sessionStorage={getItem:key=>session.get(key)??null,setItem:(key,value)=>session.set(key,String(value))};
globalThis.window={dispatchEvent(){}};globalThis.CustomEvent??=class{constructor(type){this.type=type;}};
const ctx={personId:'demo-professional',workspaceId:'demo-professional:professional',role:'professional',locale:'en'};
let project;
const ratings=()=>Object.fromEntries(workspace.portfolioReviewCriteria.map(rule=>[rule.id,{id:rule.id,rating:'explained',note:'Evidence in document'}]));
const draft=()=>({title:project.title,body:'Next step',projectVersion:workspace.portfolioProjectVersion(project),reviewRevision:workspace.portfolioReviewRevision(project),ratings:ratings()});
beforeEach(()=>{memory.clear();session.clear();failed='';workspace.configureMock({latency:0,fault:'none',now:()=>new Date('2026-10-02T12:00:00Z')});workspace.seedDemo('professional');project=workspace.saveArtifact(ctx,{title:'Report',body:'Fictional source comparison',status:'completed'});});
test('review drafts recover per tab without creating evidence or a saved review',()=>{
 session.set('visionary_resource_editor_tab','a');savePortfolioReviewDraft(ctx,project.id,draft());assert.deepEqual(getPortfolioReviewDraft(ctx,project.id),draft());
 assert.equal(workspace.snapshot(ctx).artifacts[0].portfolioReviews,undefined);
 session.set('visionary_resource_editor_tab','b');assert.equal(getPortfolioReviewDraft(ctx,project.id),null);savePortfolioReviewDraft(ctx,project.id,{...draft(),body:'Second tab'});
 session.set('visionary_resource_editor_tab','a');clearPortfolioReviewDraft(ctx,project.id);
 session.set('visionary_resource_editor_tab','b');assert.equal(getPortfolioReviewDraft(ctx,project.id).body,'Second tab');
});
test('same-project concurrent reviews reject stale history and preserve latest review',()=>{
 const first=draft();workspace.savePortfolioSelfReview(ctx,project.id,first.projectVersion,Object.values(first.ratings),'First',first.reviewRevision);
 const original=memory.get('visionary_workspace_v2');
 assert.throws(()=>workspace.savePortfolioSelfReview(ctx,project.id,first.projectVersion,Object.values(first.ratings),'Stale',first.reviewRevision),{name:'PortfolioReviewConflictError'});
 assert.equal(memory.get('visionary_workspace_v2'),original);
});
test('project edits reject recovered review without removing its draft',()=>{
 const old=draft();savePortfolioReviewDraft(ctx,project.id,old);workspace.saveArtifact(ctx,{...project,body:'Changed method'});
 assert.throws(()=>workspace.savePortfolioSelfReview(ctx,project.id,old.projectVersion,Object.values(old.ratings),old.body,old.reviewRevision),{name:'PortfolioReviewConflictError'});
 assert.deepEqual(getPortfolioReviewDraft(ctx,project.id),old);
});
test('failed saves keep draft and history for retry; cleanup failure leaves saved review',()=>{
 const value=draft();savePortfolioReviewDraft(ctx,project.id,value);failed='visionary_workspace_v2';
 assert.throws(()=>workspace.savePortfolioSelfReview(ctx,project.id,value.projectVersion,Object.values(value.ratings),value.body,value.reviewRevision));assert.deepEqual(getPortfolioReviewDraft(ctx,project.id),value);
 failed='';workspace.savePortfolioSelfReview(ctx,project.id,value.projectVersion,Object.values(value.ratings),value.body,value.reviewRevision);
 failed='visionary_resource_editor_v1';assert.throws(()=>clearPortfolioReviewDraft(ctx,project.id));assert.equal(workspace.snapshot(ctx).artifacts[0].portfolioReviews.length,1);
});
test('malformed backups and unauthorized recovery retain original bytes',()=>{
 savePortfolioReviewDraft(ctx,project.id,draft());const store=JSON.parse(memory.get('visionary_resource_editor_v1'));const row=Object.values(store.spaces[ctx.workspaceId])[0];row.draft.ratings.purpose.rating='invented';memory.set('visionary_resource_editor_v1',JSON.stringify(store));const original=memory.get('visionary_resource_editor_v1');
 assert.throws(()=>getPortfolioReviewDraft(ctx,project.id),/incomplete/);assert.equal(memory.get('visionary_resource_editor_v1'),original);
 assert.throws(()=>savePortfolioReviewDraft(ctx,project.id,draft()),/incomplete/);assert.equal(memory.get('visionary_resource_editor_v1'),original);
 assert.throws(()=>getPortfolioReviewDraft({...ctx,role:'parent'},project.id),/workspace/);
 assert.throws(()=>getPortfolioReviewDraft(ctx,'foreign-project'),/unavailable/);assert.equal(memory.get('visionary_resource_editor_v1'),original);
});
