import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { scheduleWork, deliverySchedule, working } from '../delivery-schedule.mjs';
const cfg={startDate:'2026-10-17',agentHoursPerWorkday:8,founderHoursPerWorkday:4,contingency:0,workingWeekdays:[1,2,3,4,5,6],holidays:[],maxActiveTasks:2};
test('separate founder acceptance follows actual implementation and dependencies wait for acceptance',()=>{
 const r=scheduleWork([{sourceId:'A',agentHours:8,founderHours:4},{sourceId:'B',agentHours:8,founderHours:4}],[{blocks:'A',blocked:'B'}],cfg);
 const [a,b]=r.tasks;assert.equal(a.startDate,'2026-10-17');assert.equal(a.agentFinishedDate,'2026-10-17');assert.equal(a.dueDate,'2026-10-19');assert.equal(b.startDate,'2026-10-20');assert.equal(b.dueDate,'2026-10-21');
});
test('capacity, holiday and two-item WIP limits survive independent work and external observation delay',()=>{
 const c={...cfg,holidays:['2026-10-19']},tasks=[{sourceId:'A',agentHours:3,founderHours:5,waitCalendarDays:7},{sourceId:'B',agentHours:10,founderHours:3},{sourceId:'C',agentHours:6,founderHours:3}];const r=scheduleWork(tasks,[],c);
 for(const d of r.days){assert.ok(working(d.date,c));assert.ok(d.agentHours<=8);assert.ok(d.founderHours<=4);assert.ok(d.active.length<=2);}
 for(const t of r.tasks){assert.ok(t.founderAllocations.every(d=>d.date>t.agentFinishedDate));assert.equal(t.agentAllocations.reduce((n,d)=>n+d.hours,0),t.agentPlannedHours);assert.equal(t.founderAllocations.reduce((n,d)=>n+d.hours,0),t.founderPlannedHours);}
 assert.ok(r.tasks[0].founderAllocations.every(d=>d.date>=r.tasks[0].waitUntil));
});
test('cycles, unknown dependencies, impossible estimates and invalid calendars fail before producing dates',()=>{
 const tasks=[{sourceId:'A',agentHours:1,founderHours:1},{sourceId:'B',agentHours:1,founderHours:1}];
 assert.throws(()=>scheduleWork(tasks,[{blocks:'A',blocked:'B'},{blocks:'B',blocked:'A'}],cfg),/cycle/);
 assert.throws(()=>scheduleWork(tasks,[{blocks:'missing',blocked:'A'}],cfg),/Unknown/);
 assert.throws(()=>scheduleWork([{sourceId:'A',agentHours:NaN,founderHours:1}],[],cfg),/estimate/);
 assert.throws(()=>scheduleWork(tasks,[],{...cfg,workingWeekdays:[]}),/Assertion/);
 assert.throws(()=>scheduleWork(tasks,[],{...cfg,workingWeekdays:[8]}),/Assertion/);
 assert.throws(()=>scheduleWork(tasks,[],{...cfg,agentHoursPerWorkday:Infinity}),/Assertion/);
});
test('the real backlog calendar retains every task, all native gates, historical scope and conditional Later reviews',()=>{
 const read=p=>JSON.parse(fs.readFileSync(new URL('../../docs/architecture/tracking/'+p+'.json',import.meta.url))),b=read('jira-backlog'),map=read('jira-issue-map'),v=read('vats-delivery'),m=deliverySchedule(b,map,v),byId=new Map(m.tasks.map(t=>[t.sourceId,t]));
 assert.equal(m.tasks.length,b.issues.length);assert.equal(m.counts.historical,12);assert.equal(m.counts.launch,127);assert.equal(m.counts.laterReviews,6);assert.equal(m.counts.phaseRollups,14);
 for(const d of b.taskDependencies)assert.ok(byId.get(d.blocks).dueDate<byId.get(d.blocked).startDate,d.blocks+'>'+d.blocked);
 for(const t of m.tasks){if(t.kind==='historical-local'){assert.equal(t.startDate,null);continue;}assert.ok(t.key&&t.changes.backend&&t.changes.ml&&t.changes.frontend);for(const p of t.changes.paths)assert.ok(fs.existsSync(new URL('../../'+p,import.meta.url)),p);if(t.phase==='LATER'){assert.equal(t.kind,'conditional-review');assert.ok(t.startDate>byId.get('RELEASE-08').dueDate);}}
 for(const d of m.days){assert.ok(d.agentHours<=m.assumptions.agentHoursPerWorkday);assert.ok(d.founderHours<=m.assumptions.founderHoursPerWorkday);assert.ok(d.active.length<=2);}
});
