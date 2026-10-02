import fs from 'node:fs';
function edit(path,changes){let s=fs.readFileSync(path,'utf8');for(const [from,to] of changes){if(!s.includes(from))throw Error('Missing '+from);s=s.replaceAll(from,to);}fs.writeFileSync(path,s);}
edit('src/services/workspaceService.ts',[
 ["r.status==='active'&&r.scope.includes('shared-resources')&&(!r.expiresAt||new Date(r.expiresAt)>clock())", "connectionStatus(r,clock().getTime())==='active'&&r.scope.includes('shared-resources')"],
 ["r.status==='active'&&r.scope.includes('progress-summary')&&(!r.expiresAt||new Date(r.expiresAt).getTime()>clock().getTime())", "connectionStatus(r,clock().getTime())==='active'&&r.scope.includes('progress-summary')"],
 ["['active','pending'].includes(r.status)&&(!r.expiresAt||new Date(r.expiresAt)>clock())", "['active','pending'].includes(connectionStatus(r,clock().getTime()))"],
 ["const expired=relationship.expiresAt&&new Date(relationship.expiresAt)<=clock();", "const expired=connectionStatus(relationship,clock().getTime())==='expired';"]
]);
edit('src/services/legacyConnections.ts',[["expiresAt:r.expiresAt?String(r.expiresAt):undefined", "expiresAt:r.expiresAt as string|undefined"]]);
edit('src/services/organizationPolicy.js',[["const membership=", "const membership="],["row.status==='active'&&(!row.expiresAt||new Date(row.expiresAt).getTime()>now)", "connectionStatus(row,now)==='active'"]]);
let policy=fs.readFileSync('src/services/organizationPolicy.js','utf8');fs.writeFileSync('src/services/organizationPolicy.js',"import {connectionStatus} from '../lib/connectionAvailability.js';\n"+policy);
edit('src/api/previewPermissions.js',[["i.status==='active'&&(!i.expiresAt||new Date(i.expiresAt).getTime()>Date.now())", "connectionStatus(i)==='active'"]]);
for(const path of ['src/services/mentorStateService.ts','src/services/communityService.ts']){
 edit(path,[["row.status === 'active' && (!row.expiresAt || new Date(String(row.expiresAt)).getTime() > clock().getTime())", "connectionStatus({status:row.status,expiresAt:row.expiresAt},clock().getTime()) === 'active'"]]);let s=fs.readFileSync(path,'utf8');fs.writeFileSync(path,"import {connectionStatus} from '../lib/connectionAvailability.js';\n"+s);
}
edit('src/pages/dashboard/Connections.jsx',[["r.expiresAt && Number.isFinite(Date.parse(r.expiresAt))", "typeof r.expiresAt === 'string' && r.expiresAt.trim() && Number.isFinite(Date.parse(r.expiresAt))"]]);
