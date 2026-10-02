import fs from 'node:fs';
function edit(path,changes){let s=fs.readFileSync(path,'utf8');for(const [from,to] of changes){if(!s.includes(from))throw Error('Missing '+from);s=s.replaceAll(from,to);}fs.writeFileSync(path,s);}
edit('src/domain/workspace.ts',[
 ["import type {LessonObjectiveSnapshot}","import type {CurriculumTemplate} from './curriculumTemplate.ts';\nimport type {LessonObjectiveSnapshot}"],
 ['sharedBy:string }','sharedBy:string;curriculumTemplate?:CurriculumTemplate }'],
 ['versions:{revision:number;title:string;body:string;source:string;language:Locale}[]','versions:{revision:number;title:string;body:string;source:string;language:Locale;curriculumTemplate?:CurriculumTemplate}[]'],
 ['conceptId?:string; objectiveSnapshot?', 'conceptId?:string; curriculumTemplate?:CurriculumTemplate; objectiveSnapshot?'],
 ['sharedAt:string} }','sharedAt:string;curriculumObjectiveId?:string} }']
]);
edit('src/services/workspaceService.ts',[
 ["import {connectionStatus}","import type {CurriculumTemplate} from '../domain/curriculumTemplate.ts';\nimport {assertCurriculumTemplate,curriculumObjectiveSnapshot} from './curriculumTemplate.ts';\nimport {connectionStatus}"],
 ["if(patch.contentReview||", "if(Object.hasOwn(patch,'curriculumTemplate'))throw new Error('Use the curriculum review workflow to change structured curriculum.');\n if(patch.contentReview||"],
 ["kind?:'lesson'|'curriculum'},expectedRevision", "kind?:'lesson'|'curriculum';curriculumTemplate?:CurriculumTemplate},expectedRevision"],
 ["if(input.id&&(!item?.contentReview", "if(input.curriculumTemplate!==undefined){if(kind!=='curriculum')throw Error('Structured objectives belong to a curriculum template.');assertCurriculumTemplate(input.curriculumTemplate);}\n if(item?.curriculumTemplate&&input.curriculumTemplate===undefined)throw Error('Retain the structured curriculum when saving this revision.');\n if(input.id&&(!item?.contentReview"],
 ["language:review.language});review.revision++", "language:review.language,...(item.curriculumTemplate?{curriculumTemplate:structuredClone(item.curriculumTemplate)}:{})});review.revision++"],
 ["item.updatedAt=now();item.contentReview!.history", "if(input.curriculumTemplate!==undefined)item.curriculumTemplate=structuredClone(input.curriculumTemplate);\n item.updatedAt=now();item.contentReview!.history"],
 ["if(action==='submit'&&", "if(['submit','approve'].includes(action)&&item.curriculumTemplate)assertCurriculumTemplate(item.curriculumTemplate,true);\n if(action==='submit'&&"],
 ["if(!membership)throw new Error('Choose an active accepted teacher in this organization.');", "if(!membership)throw new Error('Choose an active accepted teacher in this organization.');\n if(item.curriculumTemplate)assertCurriculumTemplate(item.curriculumTemplate,true);"],
 ["sharedAt:now(),sharedBy:ctx.personId};deliveries", "sharedAt:now(),sharedBy:ctx.personId,...(item.curriculumTemplate?{curriculumTemplate:structuredClone(item.curriculumTemplate)}:{})};deliveries"],
 ["export function importOrganizationContent(ctx:RequestContext,deliveryId:string){", "export function importOrganizationContent(ctx:RequestContext,deliveryId:string,objectiveId?:string){"],
 ["const db=read();const data=access(db,ctx);const existing=data.resources.find(row=>row.sourceSnapshot?.deliveryId===delivery.id);if(existing)return existing;", "const objective=delivery.curriculumTemplate?curriculumObjectiveSnapshot(delivery.curriculumTemplate,objectiveId||'',delivery.language):undefined;\n if(objectiveId&&!objective)throw Error('This delivery has no structured curriculum objective.');\n const db=read();const data=access(db,ctx);const existing=data.resources.find(row=>row.sourceSnapshot?.deliveryId===delivery.id&&row.sourceSnapshot?.curriculumObjectiveId===objectiveId);if(existing)return existing;"],
 ["title:delivery.title,body:delivery.body,kind:'lesson'", "title:objective?delivery.title+' · '+objective.title:delivery.title,body:delivery.body,kind:'lesson'"],
 ["sharedAt:delivery.sharedAt}};", "sharedAt:delivery.sharedAt,...(objectiveId?{curriculumObjectiveId:objectiveId}:{})},...(objective?{objectiveSnapshot:objective}:{})};"]
]);
edit('src/components/dashboard/LessonObjectivePreview.jsx',[["objective.status==='sample'?'Authored sample':'Sourced curriculum'", "objective.status==='sample'?'Authored sample':objective.status==='reviewed'?'Organization-reviewed objective · local copy':'Sourced curriculum'"]]);
