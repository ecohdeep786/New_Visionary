import fs from'node:fs';const p='src/pages/dashboard/StudentClasses.jsx';let s=fs.readFileSync(p,'utf8').replaceAll('\r\n','\n');const helper=`
function assertClassView(classes,assignments,submissions,announcements){
 const record=v=>v&&typeof v==='object'&&!Array.isArray(v);
 const textFields=(row,keys)=>keys.every(key=>row[key]==null||typeof row[key]==='string');
 const valid=classes.every(c=>typeof c.id==='string'&&typeof c.name==='string'&&textFields(c,['section','subject','room','teacher_name']))
 && assignments.every(a=>typeof a.id==='string'&&typeof a.title==='string'&&textFields(a,['description','due_date'])&&(a.topics==null||Array.isArray(a.topics)&&a.topics.every(t=>typeof t==='string'))&&(a.checks==null||Array.isArray(a.checks)&&a.checks.every(c=>record(c)&&typeof c.id==='string'&&typeof c.prompt==='string'))&&(a.objective_snapshot?.criteria==null||Array.isArray(a.objective_snapshot.criteria)&&a.objective_snapshot.criteria.every(c=>record(c)&&typeof c.id==='string'&&typeof c.label==='string')))
 && submissions.every(s=>textFields(s,['text','feedback'])&&(s.revision_history==null||Array.isArray(s.revision_history)&&s.revision_history.every(h=>record(h)&&textFields(h,['text','feedback'])&&(h.attempt==null||Number.isInteger(h.attempt)&&h.attempt>0))))
 && announcements.every(a=>typeof a.text==='string'&&textFields(a,['author_name']));
 if(!valid)throw Error('Saved class records are incomplete. Original responses and drafts have not been changed.');
}
`;
s=s.replace('export default function StudentClasses()',helper+'\nexport default function StudentClasses()');s=s.replace('const classIds = new Set((enr || []).map(e => e.class_id));','const classIds = new Set((enr || []).map(e => e.class_id));\n      assertClassView(allClasses.filter(c=>classIds.has(c.id)),allAssignments.filter(a=>classIds.has(a.class_id)),mySubs,allAnnouncements.filter(a=>classIds.has(a.class_id)));');fs.writeFileSync(p,s);
const root='C:/Users/Administrator/AppData/Local/Temp/visionary-internal-frozen-20261004';fs.copyFileSync(p,root+'/'+p);
