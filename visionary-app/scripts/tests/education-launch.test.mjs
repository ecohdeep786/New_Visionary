import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(new URL('../../'+p,import.meta.url),'utf8'));
const b=read('docs/architecture/tracking/jira-backlog.json'),f=read('docs/architecture/tracking/feature-delivery.json'),v=read('docs/architecture/tracking/vats-delivery.json'),e=read('docs/architecture/tracking/education-launch.json');
test('India education additions are scoped launch work with real Jira parents and no false completion',()=>{
 const expected={'LEARN-13':['P05','Story','KAN-153'],'BUILD-09':['P06','Story','KAN-154'],'AI-17':['P07','Story','KAN-155'],'AI-18':['P07','Task','KAN-156'],'ACCEPT-08':['P11','Task','KAN-157']};
 for(const [id,[phase,type,key]] of Object.entries(expected)){
  const t=b.issues.find(t=>t.sourceId===id),r=e.tasks.find(t=>t.sourceId===id);assert.ok(t);assert.equal(t.phase,phase);assert.equal(t.issueType,type);assert.equal(t.localComplete,false);assert.equal(r.jiraKey,key);assert.equal(r.workItem.status,'To Do');assert.equal(r.deliveryLayers.length,11);assert.ok(r.layers.length);assert.ok(t.description.length>200);
 }
 assert.equal(e.tasks.length,b.issues.length);assert.equal(e.firstOpen,'SCOPE-01');assert.match(e.parallelGate,/before concurrent/);assert.match(e.claim,/not deployed capability or AGI certification/);
});
test('separate Build roadmap retains document, assistance, activity and later containment boundaries',()=>{
 assert.equal(e.buildStages.length,5);assert.ok(e.buildStages[2].ids.includes('BUILD-09'));
 for(let i=1;i<=9;i++)assert.ok(e.tasks.some(t=>t.sourceId==='BUILD-'+String(i).padStart(2,'0')));
 for(const id of ['LATER-01','LATER-02','LATER-03'])assert.equal(v.tasks.find(t=>t.sourceId===id).kind,'later');
 const activity=b.issues.find(t=>t.sourceId==='BUILD-09').description;assert.match(activity,/schema|allowlist/);assert.match(activity,/arbitrary|generated code/);
 for(const id of ['learn','ask','guide','practice','build','classroom'])assert.ok(f.features.find(t=>t.id===id).tickets.includes('AI-17'),id);
});
test('speech qualification and education outcomes gate release through an acyclic task order',()=>{
 const required=[['AI-18','AI-17'],['BUILD-09','BUILD-08'],['AI-17','ACCEPT-08'],['LEARN-13','ACCEPT-08'],['ACCEPT-08','RELEASE-07']];
 for(const [blocks,blocked] of required)assert.ok(f.dependencies.some(d=>d.blocks===blocks&&d.blocked===blocked),blocks+'>'+blocked);
 const pos=new Map(v.tasks.map(t=>[t.sourceId,t.planningOrder]));for(const d of f.dependencies)assert.ok(pos.get(d.blocks)<pos.get(d.blocked));
 const pilot=b.issues.find(t=>t.sourceId==='ACCEPT-08').description;assert.match(pilot,/unassisted/);assert.match(pilot,/retention/);assert.match(pilot,/before general launch/);
 const speech=b.issues.find(t=>t.sourceId==='AI-18').description;assert.match(speech,/meaning/);assert.match(speech,/held-out/);
});
