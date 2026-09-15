import type {Database,Relationship} from '../domain/workspace.ts';

const sources={FamilyLink:{from:'parent_email',to:'child_email',type:'guardian',scope:['progress-summary']},Connection:{from:'requester_email',to:'recipient_email',type:'teacher',scope:['shared-resources']},OrganizationInvite:{from:'organization_email',to:'email',type:'organization',scope:['shared-resources']}} as const;
type Row=Record<string,unknown>;
export function legacyRelationships(db:Database):Relationship[]{
 const users:Row[]=JSON.parse(localStorage.getItem('visionary_users')||'[]');
 const personId=(email:unknown)=>db.people.find(p=>p.email===email)?.id||String(users.find(p=>p.email===email)?.id||`email:${email}`);
 return Object.entries(sources).flatMap(([name,schema])=>{
  const rows:Row[]=JSON.parse(localStorage.getItem(`visionary_entity_${name}`)||'[]');
  return rows.filter(r=>r[schema.from]&&r[schema.to]).map(r=>({id:`legacy:${name}:${r.id}`,from:personId(r[schema.from]),to:personId(r[schema.to]),type:schema.type,scope:[...schema.scope],status:(['pending','active','declined','expired','revoked'].includes(String(r.status))?r.status:'revoked') as Relationship['status'],expiresAt:r.expiresAt?String(r.expiresAt):undefined}));
 });
}
export function saveLegacyRelationship(id:string,status:Relationship['status']){
 const [,name,recordId]=id.split(':');if(!name||!(name in sources))throw new Error('Connection is unavailable.');
 const key=`visionary_entity_${name}`;const rows:Row[]=JSON.parse(localStorage.getItem(key)||'[]');const row=rows.find(r=>r.id===recordId);if(!row)throw new Error('Connection is unavailable.');
 row.status=status;if(status==='active')delete row.expiresAt;
 try{localStorage.setItem(key,JSON.stringify(rows));}catch{throw new Error('The sharing change could not be saved. Try again.');}
 if(typeof window!=='undefined'){window.dispatchEvent(new CustomEvent('visionary:workspace-change'));window.dispatchEvent(new CustomEvent('visionary:v2-change'));}
}
export function legacyProgressSummary(email:string,since:number){
 const submissions:Row[]=JSON.parse(localStorage.getItem('visionary_entity_Submission')||'[]');
 return {returnedClasswork:submissions.filter(s=>s.student_email===email&&s.status==='graded'&&new Date(String(s.graded_date||0)).getTime()>=since).length};
}
