import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { vatsDelivery, vatsTrace } from '../vats-delivery.mjs';
import { deliveryDependencies } from '../launch-delivery-data.mjs';
const read = p => JSON.parse(fs.readFileSync(new URL('../../'+p,import.meta.url)));
const b=read('docs/architecture/tracking/jira-backlog.json'), map=read('docs/architecture/tracking/jira-issue-map.json'), registry=read('ml/vats/layers.json');
test('seven VATS layers have real source anchors, open exits and complete task coverage',()=>{
 const m=vatsDelivery(b,map,registry);assert.equal(m.tasks.length,b.issues.length);assert.equal(m.layers.length,7);
 for(const l of m.layers){assert.ok(l.current && l.exit && l.owner);for(const p of l.evidence)assert.ok(fs.existsSync(new URL('../../'+p,import.meta.url)),p);}
 for(const t of m.tasks){assert.ok(t.jiraKey && t.layers.length);for(const l of t.layers)assert.ok(m.layers.some(x=>x.id===l));assert.match(vatsTrace(t,m,map),/own-model training/);}
 const historical=m.tasks.filter(t=>t.kind==='historical-local');assert.equal(historical.length,12);assert.ok(historical.every(t=>/does not certify/.test(t.closure)));
});
test('all native task prerequisites precede dependents; later training is not confused with launch L7',()=>{
 const m=vatsDelivery(b,map,registry), positions=new Map(m.tasks.map(t=>[t.sourceId,t.planningOrder]));
 for(const e of deliveryDependencies)assert.ok(positions.get(e.blocks)<positions.get(e.blocked),e.blocks+'>'+e.blocked);
 assert.equal(m.tasks.filter(t=>t.kind!=='historical-local')[0].sourceId,'SCOPE-01');
 assert.ok(m.tasks.find(t=>t.sourceId==='AI-12').layers.includes('L7'));
 assert.equal(m.tasks.find(t=>t.sourceId==='LATER-04').kind,'later');
});
test('new task families, removed layer tasks or an eighth layer fail explicit mapping',()=>{
 assert.throws(()=>vatsDelivery({...b,issues:[...b.issues,{sourceId:'UNMAPPED-01',phase:'P07'}]},map,registry),/Unmapped/);
 assert.throws(()=>vatsDelivery(b,map,{...registry,layers:[...registry.layers,{id:'L8'}]}),/exactly the seven/);
 assert.throws(()=>vatsDelivery(b,map,{...registry,layers:registry.layers.map((l,i)=>i?l:{...l,tickets:['MISSING-01']})}),/Unknown/);
});
