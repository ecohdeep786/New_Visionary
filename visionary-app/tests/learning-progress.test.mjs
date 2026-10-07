import test,{beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import * as workspace from '../src/services/workspaceService.ts';
import * as mentor from '../src/services/mentorStateService.ts';
import {getLearningProgress} from '../src/services/learningProgressService.ts';
const storage=new Map();globalThis.localStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,String(value))};globalThis.window={dispatchEvent(){}};globalThis.CustomEvent??=class{constructor(type){this.type=type;}};
let now;const ctx={personId:'demo-adult',workspaceId:'demo-adult:student',role:'student',locale:'en'};
beforeEach(()=>{storage.clear();now=new Date('2026-10-02T12:00:00Z');workspace.configureMock({latency:0,fault:'none',now:()=>now});mentor.configureMentorClock(()=>now);workspace.seedDemo('adult');});
function evidence(id,at,extra={}){now=new Date(at);mentor.recordLearningOutcome(ctx,{id,conceptId:'objective',sessionId:'original-unit',kind:'practice',correct:1,total:1,verified:true,...extra});now=new Date('2026-10-02T12:00:00Z');}
function seedUnit(){storage.set('visionary_learning_pipeline_v1',JSON.stringify({version:1,spaces:{[ctx.workspaceId]:{units:[{id:'original-unit',conceptId:'objective',title:'Original sourced objective',sourceContext:{selection:{board:'Fixture',classLevel:'7',subject:'History'},provenance:{provider:'Synthetic source',sourceId:'fictional-book',version:'3'}}}]}}}));}
test('period history excludes drafts and unverified application from accuracy and keeps exact original activity',()=>{
 seedUnit();evidence('old','2026-09-10T12:00:00Z');evidence('recent','2026-10-01T12:00:00Z');evidence('work','2026-10-01T13:00:00Z',{kind:'application',verified:false,correct:0,total:0});evidence('unverified','2026-10-01T14:00:00Z',{verified:false});
 const before=new Map(storage);let report=getLearningProgress(ctx,7);assert.equal(report.objectives.length,1);const row=report.objectives[0];assert.equal(row.total,1);assert.equal(row.correct,1);assert.equal(row.applications,1);assert.equal(row.events.length,3);assert.equal(row.events[0].resumePath,'/dashboard/learn?unit=original-unit');assert.equal(row.events[0].sourceVersion,'fictional-book · version 3');assert.equal(getLearningProgress(ctx,30).objectives[0].total,2);assert.deepEqual(storage,before);
});
test('multiple earlier sessions group a stable objective once but each timeline link resumes its own session',()=>{
 const db=JSON.parse(storage.get('visionary_workspace_v2'));db.data[ctx.workspaceId].sessions=['first','second'].map(id=>({id,journeyId:'cube',evidence:[{id:id+'-check',objectiveId:'cube',kind:'check',correct:1,total:1,at:'2026-10-01T12:00:00Z',delayed:false}],stage:'checking'}));storage.set('visionary_workspace_v2',JSON.stringify(db));
 evidence('guided','2026-10-01T12:00:00Z',{conceptId:'cube'});const report=getLearningProgress(ctx,'all');assert.equal(report.objectives.length,2);const earlier=report.objectives.find(row=>row.source==='journey');assert.equal(earlier.total,2);assert.equal(earlier.events.length,2);assert.deepEqual(earlier.events.map(row=>row.resumePath).sort(),['/dashboard/home?session=first','/dashboard/home?session=second']);
});
test('a period with no evidence distinguishes retained history from an entirely new workspace',()=>{
 assert.equal(getLearningProgress(ctx,7).hasSavedEvidence,false);evidence('old','2026-09-10T12:00:00Z');const recent=getLearningProgress(ctx,7);assert.equal(recent.hasSavedEvidence,true);assert.equal(recent.objectives.length,0);assert.equal(getLearningProgress(ctx,'all').objectives.length,1);assert.throws(()=>getLearningProgress(ctx,14),/available evidence period/);
});

test('incomplete activity source retains measured history but exposes no misleading resume link',()=>{
 seedUnit();const db=JSON.parse(storage.get('visionary_learning_pipeline_v1'));delete db.spaces[ctx.workspaceId].units[0].sourceContext.selection;
 storage.set('visionary_learning_pipeline_v1',JSON.stringify(db));evidence('recorded','2026-10-01T12:00:00Z');const before=new Map(storage);
 const report=getLearningProgress(ctx);assert.equal(report.objectives[0].total,1);assert.equal(report.objectives[0].events[0].resumePath,undefined);
 assert.deepEqual(report.unavailable.map(row=>row.source),['Activity resume links']);assert.deepEqual(storage,before);
});
test('unreadable source is partial, available earlier evidence remains visible and originals are preserved',()=>{
 const db=JSON.parse(storage.get('visionary_workspace_v2'));db.data[ctx.workspaceId].sessions=[{id:'prior',journeyId:'cube',evidence:[{id:'earlier',objectiveId:'cube',kind:'check',correct:0,total:1,at:'2026-10-01T12:00:00Z',delayed:false}]}];storage.set('visionary_workspace_v2',JSON.stringify(db));storage.set('visionary_mentor_v1','unreadable original');const before=new Map(storage);
 const report=getLearningProgress(ctx);assert.equal(report.objectives.length,1);assert.equal(report.objectives[0].source,'journey');assert.match(report.unavailable[0].source,/Guided learning/);assert.deepEqual(storage,before);
});
test('duplicate or malformed evidence never becomes inflated or partially counted results',()=>{
 evidence('same','2026-10-01T12:00:00Z');const db=JSON.parse(storage.get('visionary_mentor_v1'));db.spaces[ctx.workspaceId].evidence.push({...db.spaces[ctx.workspaceId].evidence[0]});storage.set('visionary_mentor_v1',JSON.stringify(db));const before=storage.get('visionary_mentor_v1');assert.equal(getLearningProgress(ctx).objectives.length,0);assert.equal(getLearningProgress(ctx).unavailable.length,1);assert.equal(storage.get('visionary_mentor_v1'),before);
});
test('owner/workspace authorization and cancellation apply before exposing any timeline',()=>{
 evidence('private','2026-10-01T12:00:00Z');assert.throws(()=>getLearningProgress({...ctx,personId:'foreign'}),/access|workspace|account/i);const controller=new AbortController();controller.abort();assert.throws(()=>getLearningProgress({...ctx,signal:controller.signal}),/Cancel/i);const parent={personId:'demo-parent',workspaceId:'demo-parent:parent',role:'parent',locale:'en'};workspace.seedDemo('parent');assert.throws(()=>getLearningProgress(parent),/own learning/);assert.throws(()=>mentor.getLearningEvidenceHistory(parent),/own learning/);
});
test('same objective across source versions groups counts but preserves both original activity links and versions',()=>{
 seedUnit();const units=JSON.parse(storage.get('visionary_learning_pipeline_v1'));units.spaces[ctx.workspaceId].units.push({id:'later-unit',conceptId:'objective',title:'Later sourced objective',locale:'bn',sourceContext:{selection:{board:'Fixture',classLevel:'7',subject:'History'},provenance:{provider:'Synthetic source',sourceId:'fictional-book',version:'4'}}});storage.set('visionary_learning_pipeline_v1',JSON.stringify(units));evidence('original','2026-10-01T12:00:00Z');evidence('later','2026-10-01T13:00:00Z',{sessionId:'later-unit'});
 const report=getLearningProgress(ctx);assert.equal(report.objectives.length,1);assert.equal(report.objectives[0].titleLocale,'bn');assert.equal(report.objectives[0].total,2);assert.deepEqual(report.objectives[0].events.map(row=>[row.resumePath,row.sourceVersion]),[['/dashboard/learn?unit=later-unit','fictional-book · version 4'],['/dashboard/learn?unit=original-unit','fictional-book · version 3']]);
});
test('malformed earlier sessions cannot leave partial counts, and missing units do not remove readable evidence',()=>{
 evidence('valid','2026-10-01T12:00:00Z');const db=JSON.parse(storage.get('visionary_workspace_v2'));db.data[ctx.workspaceId].sessions=[{id:'broken',journeyId:'cube',evidence:[{id:'invalid',kind:'check',correct:1,total:0,objectiveId:'cube',at:'2026-10-01T12:00:00Z'}]}];storage.set('visionary_workspace_v2',JSON.stringify(db));storage.set('visionary_learning_pipeline_v1','Unreadable original units');const before=new Map(storage);const report=getLearningProgress(ctx);assert.equal(report.objectives.length,1);assert.equal(report.objectives[0].total,1);assert.equal(report.objectives[0].events[0].resumePath,undefined);assert.deepEqual(report.unavailable.map(row=>row.source),['Activity resume links','Earlier guided journeys']);assert.deepEqual(storage,before);
});
