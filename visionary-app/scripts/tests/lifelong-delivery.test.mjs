import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { educationLaunch } from '../education-launch.mjs';
import { vatsDelivery } from '../vats-delivery.mjs';
import { featureDelivery } from '../feature-delivery.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../../'+p,import.meta.url),'utf8'));
const b=read('docs/architecture/tracking/jira-backlog.json'),map=read('docs/architecture/tracking/jira-issue-map.json'),r=read('ml/vats/layers.json'),e=read('docs/architecture/tracking/education-launch.json');
const v=vatsDelivery(b,map,r),f=featureDelivery(b,map);
test('three lifelong deliverables have distinct owned scopes and complete layer/feature coverage',()=>{
 const specs={'SCOPE-09':['P00','Task','KAN-158'],'LEARN-14':['P05','Story','KAN-159'],'ROLE-10':['P08','Story','KAN-160']};
 for(const [id,[phase,type,key]] of Object.entries(specs)){
  const t=b.issues.find(t=>t.sourceId===id),layer=v.tasks.find(t=>t.sourceId===id),feature=f.tasks.find(t=>t.sourceId===id);assert.ok(t&&layer&&feature,id);assert.equal(t.phase,phase);assert.equal(t.issueType,type);assert.equal(t.localComplete,false);assert.equal(map.issues[id].key,key);assert.equal(map.issues[id].parent,map.epics[phase]);assert.equal(feature.layers.length,11);assert.ok(feature.scope==='product-wide'||feature.features.length>0);
 }
 for(const id of ['LEARN-14','ROLE-10'])for(const l of ['L2','L3','L6'])assert.ok(v.tasks.find(t=>t.sourceId===id).layers.includes(l));
 assert.equal(v.layers.length,7);assert.equal(v.tasks.filter(t=>t.kind==='historical-local').length,12);
});
test('stage, access and school/role gates precede acceptance without creating an inference-authority cycle',()=>{
 const edges=[['SCOPE-02','SCOPE-09'],['SCOPE-09','BILL-04'],['DATA-05','LEARN-14'],['CONTENT-08','LEARN-14'],['AI-15','LEARN-14'],['LEARN-14','ACCEPT-01'],['LEARN-14','ACCEPT-04'],['PRIV-01','ROLE-04'],['DATA-04','ROLE-04'],['ROLE-04','ACCEPT-02'],['ROLE-07','ACCEPT-02'],['LEARN-10','ROLE-10'],['ROLE-10','ACCEPT-08']];
 const pos=new Map(v.tasks.map(t=>[t.sourceId,t.planningOrder]));for(const [blocks,blocked] of edges)assert.ok(f.dependencies.some(d=>d.blocks===blocks&&d.blocked===blocked));for(const d of f.dependencies)assert.ok(pos.get(d.blocks)<pos.get(d.blocked));assert.equal(v.tasks.find(t=>t.kind!=='historical-local').sourceId,'SCOPE-01');
});
test('manifest refresh is idempotent and preserves earlier research refinements separately from lifecycle changes',()=>{
 const next=educationLaunch(b,map,v,f,e),twice=educationLaunch(b,map,v,f,next);assert.deepEqual(next,twice);assert.deepEqual(next,e);assert.equal(next.tasks.length,b.issues.length);
 const task=next.tasks.find(t=>t.sourceId==='AI-15');assert.ok(task.researchRefinement);assert.ok(task.lifelongRefinement);assert.equal(task.refinement,task.researchRefinement+'\n\n'+task.lifelongRefinement);
 const remove={...b,issues:b.issues.filter(t=>t.sourceId!=='AI-15')};assert.throws(()=>educationLaunch(remove,map,v,f,e),/Unknown lifelong/);
});
