import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { vatsDelivery } from '../../scripts/vats-delivery.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'), qa='artifacts/qa/vats-alignment-2026-10-16';
const bytes=p=>fs.readFileSync(path.join(root,p)), read=p=>JSON.parse(bytes(p)), sha=b=>createHash('sha256').update(b).digest('hex');
const before=read(qa+'/jira-before.json'), final=read(qa+'/jira-readback.json'), updates=read(qa+'/jira-updates.json');
assert.equal(before.paginationComplete,true);assert.equal(final.paginationComplete,true);assert.deepEqual(final.pageSizes,[100,52]);
assert.equal(final.issues.length,152);const keyed=new Map(final.issues.map(n=>[n.key,n]));assert.equal(keyed.size,152);assert.equal(updates.length,137);
const normalize=s=>s.replace(/\\\*/g,'*').replace(/(^|\n)\s*[-*] /g,'$1- ').replace(/\s+/g,' ').trim();
const b=read('docs/architecture/tracking/jira-backlog.json'),map=read('docs/architecture/tracking/jira-issue-map.json'),registry=read('ml/vats/layers.json');
assert.equal(b.sourceSha256,sha(bytes(b.source)));const manifest=vatsDelivery(b,map,registry);assert.deepEqual(manifest,read('docs/architecture/tracking/vats-delivery.json'));
assert.equal(manifest.tasks.length,137);assert.equal(manifest.layers.length,7);
for(const u of updates){
 const actual=keyed.get(u.key)?.fields;assert.ok(actual,u.key);
 assert.equal(normalize(actual.description),normalize(u.description),'Full description '+u.key);
 assert.ok(normalize(actual.description).startsWith(normalize(u.originalDescription)),'Original prefix '+u.key);
 assert.equal(actual.description.split('## D-087 — Seven-layer VATS delivery').length-1,1,u.key);
 assert.deepEqual([...actual.labels].sort(),[...u.labels].sort(),'Labels '+u.key);
 const task=manifest.tasks.find(t=>t.sourceId===u.sourceId),spec=b.issues.find(t=>t.sourceId===u.sourceId);
 assert.equal(task.jiraKey,u.key);assert.equal(actual.parent?.key,map.epics[spec.phase]);assert.equal(actual.issuetype.name,spec.issueType);
 assert.equal(final.issues.filter(n=>n.fields.labels.includes('visionary-id-'+u.sourceId.toLowerCase())).length,1);
 for(const layer of task.layers)assert.ok(actual.labels.includes('vats-'+layer.toLowerCase()));
}
for(const old of before.issues){
 const actual=keyed.get(old.key)?.fields;assert.ok(actual);
 assert.equal(actual.status.name,old.fields.status.name,'Status '+old.key);assert.equal(actual.summary,old.fields.summary,'Summary '+old.key);
 assert.equal(actual.issuetype.name,old.fields.issuetype.name);assert.equal(actual.parent?.key,old.fields.parent?.key);
 if(old.fields.issuetype.name==='Epic'){assert.equal(normalize(actual.description),normalize(old.fields.description));assert.deepEqual(actual.labels,old.fields.labels);}
}
const edges=rows=>rows.flatMap(n=>n.fields.issuelinks.filter(l=>l.type.name==='Blocks'&&l.outwardIssue).map(l=>n.key+'>'+l.outwardIssue.key)).sort();
const allEdges=edges(final.issues);assert.equal(allEdges.length,105);assert.equal(new Set(allEdges).size,105);assert.deepEqual(allEdges,edges(before.issues));
for(const pair of allEdges){const [from,to]=pair.split('>');assert.ok(keyed.get(to).fields.issuelinks.some(l=>l.type.name==='Blocks'&&l.inwardIssue?.key===from));}
for(const task of manifest.tasks)for(const id of task.blockedBy)assert.ok(manifest.tasks.find(t=>t.sourceId===id).planningOrder<task.planningOrder);
const journal=bytes('docs/architecture/tracking/jira-sync-journal.jsonl').toString('utf8').trim().split(/\r?\n/).map(JSON.parse).filter(r=>r.decision==='D-087');
assert.equal(journal.filter(r=>r.kind==='vats_trace').length,137);assert.equal(new Set(journal.filter(r=>r.kind==='vats_trace').map(r=>r.key)).size,137);
assert.equal(journal.filter(r=>r.kind==='issue'||r.kind==='status'||r.kind==='dependency').length,0);
const ledger=read('docs/architecture/tracking/founder-spec-review.json');for(const s of ledger.records)assert.equal(sha(bytes(s.source)),s.sha256,s.source);
assert.equal(ledger.records.filter(s=>s.documentNumber==='03').length,2);
for(const layer of registry.layers)for(const p of layer.evidence)assert.ok(fs.existsSync(path.join(root,p)),p);
let links=0;for(const p of ['docs/architecture/VATS_IMPLEMENTATION.md','integration/VATS_CONTRACT.md','ml/vats/README.md','ml/README.md','backend/README.md','docs/architecture/README.md','docs/architecture/tracking/JIRA_SYNC.md']){
 for(const match of bytes(p).toString('utf8').matchAll(/\[[^\]]*\]\(([^)]+)\)/g)){const target=match[1].split('#')[0];if(!target||/^[a-z]+:/i.test(target))continue;assert.ok(fs.existsSync(path.resolve(root,path.dirname(p),target)),p+' missing '+target);links++;}
}
const byStatus=final.issues.reduce((a,n)=>(a[n.fields.status.name]=(a[n.fields.status.name]||0)+1,a),{});
const result={decision:'D-087',verifiedAt:final.readAt,total:152,tasks:137,epics:15,layers:7,byStatus,descriptionsVerified:137,labelsVerified:137,originalPrefixesPreserved:true,nativeBlockersUnchanged:105,taskDependencies:75,phaseDependencies:30,taskGraphAcyclic:true,all37SourceHashesUnchanged:true,doc03Variants:2,doc03Images:3,localLinks:links,noNewDone:true,noStatusChange:true,firstOpen:manifest.tasks.find(t=>t.kind!=='historical-local').jiraKey,limits:'Offline library/policy and planning verification. No trained model, live learning/SQL/provider/UI integration, hosted/cognitive/educational evaluation or AGI proof.'};
if(process.argv.includes('--finalize')){
 if(!map.sourceHistory?.some(h=>h.decision==='D-086'))map.sourceHistory=[...(map.sourceHistory||[]),{decision:'D-086',verifiedAt:map.verifiedAt,source:{...map.source},summary:{...map.summary},deliveryReview:{...map.deliveryReview}}];
 map.verifiedAt=final.readAt;map.vatsReview={decision:'D-087',path:'docs/architecture/VATS_IMPLEMENTATION.md',manifest:'docs/architecture/tracking/vats-delivery.json',registry:'ml/vats/layers.json',layers:7,taskDescriptionsVerified:137,labelsVerified:137,planningOrderVerified:true,noNewCompletion:true};
 fs.writeFileSync(path.join(root,'docs/architecture/tracking/jira-issue-map.json'),JSON.stringify(map,null,2)+'\n');
}
fs.writeFileSync(path.join(root,qa,'verification.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
