import fs from 'node:fs';const path='src/services/workspaceService.ts';let s=fs.readFileSync(path,'utf8');
const from=".map(row=>({...row,organizationEmail:space.organizationId!,importedResourceId:db.data[ctx.workspaceId]?.resources.find(resource=>resource.sourceSnapshot?.deliveryId===row.id)?.id}))";
const to=".map(row=>{if(row.curriculumTemplate)assertCurriculumTemplate(row.curriculumTemplate,true);return {...row,organizationEmail:space.organizationId!,importedResourceId:db.data[ctx.workspaceId]?.resources.find(resource=>resource.sourceSnapshot?.deliveryId===row.id)?.id};})";
if(!s.includes(from))throw Error('Missing delivery projection');s=s.replace(from,to);fs.writeFileSync(path,s);
