import fs from 'node:fs';
function edit(path, changes) { let source=fs.readFileSync(path,'utf8'); for(const [from,to] of changes){if(!source.includes(from))throw Error('Missing target '+from);source=source.replace(from,to);}fs.writeFileSync(path,source);}
edit('src/services/workspaceService.ts',[
 ["import {assignmentAcceptsResponses}","import {connectionStatus} from '../lib/connectionAvailability.js';\nimport {assignmentAcceptsResponses}"],
 ["status:['pending','active'].includes(r.status)&&r.expiresAt&&new Date(r.expiresAt)<=clock()?'expired':r.status","status:connectionStatus(r,clock().getTime())"],
 ["return ['pending','active'].includes(row.status)&&row.expiresAt&&new Date(row.expiresAt).getTime()<=clock().getTime()?'expired':row.status;","return connectionStatus(row,clock().getTime());"],
 ["if(current==='expired')throw", "if(current==='unavailable')throw new Error('This invitation has an unreadable expiry. Close it and request a new invitation.');\n  if(current==='expired')throw"],
 ["if(!organizer||current!=='pending')", "if(!organizer||(current!=='pending'&&!(current==='unavailable'&&row.status==='pending')))"],
 ["}else if(current!=='active')", "}else if(current!=='active'&&!(current==='unavailable'&&row.status==='active'))"],
 ["if(r.expiresAt&&new Date(r.expiresAt)<=clock()&&status==='active')", "if(status==='active'&&connectionStatus(r,clock().getTime())==='unavailable')throw new Error('This invitation has an unreadable expiry. Close it and request a new invitation.');\n if(connectionStatus(r,clock().getTime())==='expired'&&status==='active')"]
]);
edit('src/api/previewPermissions.js',[
 ["import {organizationPolicy}","import {connectionStatus} from '../lib/connectionAvailability.js';\nimport {organizationPolicy}"],
 ["r[to]===email&&r.status==='pending':", "r[to]===email&&r.status==='pending'&&(patch.status!=='active'||connectionStatus(r)==='pending'):"]
]);
edit('src/pages/dashboard/Connections.jsx',[
 ["const field =", "import { connectionStatus } from '@/lib/connectionAvailability';\n\nconst field ="],
 ['const statusOf = record => ["pending", "active"].includes(record.status) && record.expiresAt && new Date(record.expiresAt).getTime() <= Date.now() ? "expired" : record.status;', 'const statusOf = record => connectionStatus(record);'],
 ['status === "expired" ? "Expired" : "Closed · " + status', 'status === "expired" ? "Expired" : status === "unavailable" ? "Unavailable · unreadable expiry" : "Closed · " + status'],
 ['{r.expiresAt && <p', '{status === "unavailable" && <p className="mt-2 text-xs leading-5 text-[#b3261e]">The saved expiry cannot be verified. Acceptance is unavailable. Close this record and request a new connection; the original date is retained.</p>}{r.expiresAt && Number.isFinite(Date.parse(r.expiresAt)) && <p'],
 ['(status === "pending" || status === "active") &&', '(status === "pending" || status === "active" || status === "unavailable") &&'],
 ['status === "active" ? "revoked" : r.incoming', '(status === "active" || status === "unavailable" && r.status === "active") ? "revoked" : r.incoming'],
 ['status === "active" ? "Disconnect" : r.incoming', '(status === "active" || status === "unavailable" && r.status === "active") ? "Disconnect" : r.incoming']
]);
