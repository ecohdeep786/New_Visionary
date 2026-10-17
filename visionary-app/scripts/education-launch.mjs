import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lifelongRefinements, lifelongContract } from './lifelong-delivery-data.mjs';
export function educationLaunch(backlog,map,vats,features,previous){
 const known=new Set(backlog.issues.map(t=>t.sourceId));
 for(const id of Object.keys(lifelongRefinements))if(!known.has(id))throw Error('Unknown lifelong source ID '+id);
 const prior=new Map(previous.tasks.map(t=>[t.sourceId,t]));
 return {...previous,decision:'D-090',sourceSha256:backlog.sourceSha256,lifelongContract,visionReview:'docs/architecture/VISION_ALIGNMENT_REVIEW.md',
  tasks:vats.tasks.map(t=>{
   const old=prior.get(t.sourceId),researchRefinement=old?(Object.hasOwn(old,'researchRefinement')?old.researchRefinement:old.refinement||null):null;
   const lifelongRefinement=lifelongRefinements[t.sourceId]||null,feature=features.tasks.find(f=>f.sourceId===t.sourceId),issue=backlog.issues.find(i=>i.sourceId===t.sourceId);
   if(!map.issues[t.sourceId]||!feature)throw Error('Missing education delivery map '+t.sourceId);
   return {...t,workItem:map.issues[t.sourceId],featureFamilies:feature.features,deliveryLayers:feature.layers,implementationRequirement:issue.description,researchRefinement,lifelongRefinement,refinement:[researchRefinement,lifelongRefinement].filter(Boolean).join('\n\n')||null};
  })};
}
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8')),prefix='docs/architecture/tracking/';
 const b=read(prefix+'jira-backlog.json'),map=read(prefix+'jira-issue-map.json'),v=read(prefix+'vats-delivery.json'),f=read(prefix+'feature-delivery.json'),old=read(prefix+'education-launch.json');
 const m=educationLaunch(b,map,v,f,old);if(process.argv.includes('--write'))fs.writeFileSync(path.join(root,prefix+'education-launch.json'),JSON.stringify(m,null,2)+'\n');
 console.log(JSON.stringify({tasks:m.tasks.length,decision:m.decision,lifelongRefinements:Object.keys(lifelongRefinements).length,sourceSha256:m.sourceSha256}));
}
