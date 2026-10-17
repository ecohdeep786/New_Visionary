import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { launchBacklog } from '../../scripts/launch-backlog.mjs';
import { featureDelivery } from '../../scripts/feature-delivery.mjs';
import { vatsDelivery } from '../../scripts/vats-delivery.mjs';
import { educationLaunch } from '../../scripts/education-launch.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),qa='artifacts/qa/lifelong-delivery-2026-10-17',prefix='docs/architecture/tracking/';
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8')),write=(p,v)=>fs.writeFileSync(path.join(root,p),JSON.stringify(v,null,2)+'\n');
const norm=s=>(s||'').replace(/\\([\\`*_[\]{}()#+\-.!>|])/g,'$1').replace(/(^|\n)\s*[-*] /g,'$1- ').replace(/[*_]/g,'').replace(/\s+/g,' ').trim();
const b=read(prefix+'jira-backlog.json'),map=read(prefix+'jira-issue-map.json'),f=read(prefix+'feature-delivery.json'),v=read(prefix+'vats-delivery.json'),e=read(prefix+'education-launch.json'),registry=read('ml/vats/layers.json');
const before=read(qa+'/jira-seed.json'),after=read(qa+'/jira-readback.json'),updates=read(qa+'/jira-updates.json'),oldMap=read(qa+'/previous-jira-issue-map.json');
assert.equal(after.paginationComplete,true);assert.deepEqual(after.pageSizes,[100,60]);assert.equal(after.issues.length,160);assert.equal(new Set(after.issues.map(n=>n.key)).size,160);assert.equal(b.issues.length,145);assert.equal(updates.length,33);
const digest=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,b.source))).digest('hex');for(const m of [b,f,v,e])assert.equal(m.sourceSha256,digest);
assert.deepEqual(launchBacklog(fs.readFileSync(path.join(root,b.source),'utf8')),b);assert.deepEqual(featureDelivery(b,map),f);assert.deepEqual(vatsDelivery(b,map,registry),v);assert.deepEqual(educationLaunch(b,map,v,f,e),e);
const byKey=new Map(after.issues.map(n=>[n.key,n])),byUpdate=new Map(updates.map(u=>[u.key,u]));const status={};let epics=0,untouchedTasks=0;
const newKeys=new Set(Object.values(read(qa+'/new-keys.json')));
for(const n of after.issues){
 const old=before.issues.find(o=>o.key===n.key);assert.ok(old,n.key);assert.equal(n.fields.summary,old.fields.summary);assert.equal(n.fields.status.name,old.fields.status.name);assert.equal(n.fields.issuetype.name,old.fields.issuetype.name);if(!newKeys.has(n.key))assert.equal(n.fields.parent?.key,old.fields.parent?.key);status[n.fields.status.name]=(status[n.fields.status.name]||0)+1;
 const u=byUpdate.get(n.key);
 if(u){assert.equal(norm(n.fields.description),norm(u.description),n.key+'/complete text');assert.ok(norm(n.fields.description).startsWith(norm(u.originalDescription)),n.key+'/preserved original');assert.equal((n.fields.description.match(/## D-090 — Lifelong delivery reconciliation/g)||[]).length,1);assert.deepEqual([...n.fields.labels].sort(),[...u.labels].sort());}
 else {assert.equal(norm(n.fields.description),norm(old.fields.description));assert.deepEqual(n.fields.labels,old.fields.labels);if(n.fields.issuetype.name==='Epic')epics++;else untouchedTasks++;}
}
assert.equal(epics,15);assert.equal(untouchedTasks,112);assert.deepEqual(status,{Done:13,'To Do':137,Idea:7,Testing:1,'In Progress':2});
for(const task of b.issues){const key=map.issues[task.sourceId].key,n=byKey.get(key),vt=v.tasks.find(t=>t.sourceId===task.sourceId);assert.ok(n);assert.equal(n.fields.parent.key,map.epics[task.phase]);assert.equal(n.fields.issuetype.name,task.issueType);assert.equal(n.fields.labels.filter(l=>l.startsWith('visionary-id-')).length,1);assert.ok(n.fields.labels.includes('visionary-id-'+task.sourceId.toLowerCase()));for(const l of vt.layers)assert.ok(n.fields.labels.includes('vats-'+l.toLowerCase()),key+'/'+l);assert.ok(n.fields.labels.includes('vats-seven-layer'));}
const edges=rows=>rows.flatMap(n=>(n.fields.issuelinks||[]).filter(l=>l.type.name==='Blocks'&&l.outwardIssue).map(l=>({from:n.key,to:l.outwardIssue.key,id:l.id})));
const oldEdges=edges(before.issues),current=edges(after.issues),edgeSet=new Set(current.map(l=>l.from+'>'+l.to));assert.equal(oldEdges.length,137);assert.equal(current.length,163);assert.equal(edgeSet.size,163);
for(const l of oldEdges)assert.ok(current.some(n=>n.id===l.id&&n.from===l.from&&n.to===l.to));for(const l of current)assert.ok(byKey.get(l.to).fields.issuelinks.some(r=>r.id===l.id&&r.inwardIssue?.key===l.from));
assert.equal(f.dependencies.length,133);const order=new Map(v.tasks.map(t=>[t.sourceId,t.planningOrder]));for(const d of f.dependencies){assert.ok(edgeSet.has(map.issues[d.blocks].key+'>'+map.issues[d.blocked].key));assert.ok(order.get(d.blocks)<order.get(d.blocked));}
assert.equal(map.dependencies.length,30);for(const d of map.dependencies)assert.ok(edgeSet.has(d.blocks+'>'+d.blocked));assert.equal(v.layers.length,7);assert.equal(v.tasks.find(t=>t.kind!=='historical-local').sourceId,'SCOPE-01');
const journal=fs.readFileSync(path.join(root,prefix+'jira-sync-journal.jsonl'),'utf8').trim().split(/\r?\n/).map(JSON.parse).filter(x=>x.decision==='D-090');for(const [kind,count] of [['create',3],['status',3],['lifelong_trace',33],['task_dependency',26],['source_update',1]])assert.equal(journal.filter(r=>r.kind===kind).length,count,kind);
const now=after.issues.filter(n=>n.fields.labels.includes('visionary-now')&&n.fields.issuetype.name!=='Epic').map(n=>n.key);assert.deepEqual(now,oldMap.summary.nowTasks);
map.source={path:b.source,sha256:digest};map.verifiedAt=after.readAt;map.summary={total:160,tasks:145,epics:15,byStatus:status,dependencyLinks:163,phaseDependencyLinks:30,taskDependencyLinks:133,nowTasks:now,paginationComplete:true,errors:[]};
map.taskDependencies=f.dependencies.map(d=>({sourceId:d.blocks,blockedSourceId:d.blocked,blocks:map.issues[d.blocks].key,blocked:map.issues[d.blocked].key}));
map.deliveryReview={...map.deliveryReview,decision:'D-090',taskDescriptionsVerified:145,currentAddendaVerified:33,unchangedTaskDescriptionsVerified:112,noNewCompletion:true};
map.vatsReview={...map.vatsReview,decision:'D-090',taskDescriptionsVerified:145,labelsVerified:145,planningOrderVerified:true,jiraOrderMeaning:'Earlier numerical trace positions are dated snapshots; current dependency manifest governs order.'};
map.lifelongReview={decision:'D-090',contract:'integration/LIFELONG_EDUCATION_CONTRACT.md',tasksAdded:3,requirementsRefined:27,descriptionsUpdated:33,descriptionsRetained:112,newNativeDependencies:26,noRuntimeImplementation:true,noNewCompletion:true};delete map.syncPending;
write(prefix+'jira-issue-map.json',map);const report={decision:'D-090',readAt:after.readAt,sourceSha256:digest,...map.summary,originalDescriptionsPreserved:true,descriptionsUpdated:33,descriptionsRetained:112,requirementsRefined:27,taskDAGVerified:true,existingMetadataPreserved:true,noRuntimeImplementation:true};write(qa+'/verification.json',report);console.log(JSON.stringify(report,null,2));
