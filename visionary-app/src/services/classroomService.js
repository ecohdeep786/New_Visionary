import {appClient} from '../api/appClient.js';
import {snapshot,saveResource} from './workspaceService.ts';

async function teacherContext(ctx){
  const account=await appClient.auth.me();
  if(account.id!==ctx.personId||ctx.role!=='teacher')throw new Error('Open your teacher workspace first.');
  snapshot(ctx);
}
export async function teacherLearners(ctx){
  await teacherContext(ctx);
  const [classes,enrollments,assignments,submissions]=await Promise.all(['Classroom','Enrollment','Assignment','Submission'].map(name=>appClient.entities[name].list()));
  const ids=new Set(classes.map(c=>c.id));
  const roster=enrollments.filter(e=>ids.has(e.class_id)&&e.status==='active');
  return [...new Set(roster.map(e=>e.student_email))].map(email=>{
    const entries=roster.filter(e=>e.student_email===email);const relevant=submissions.filter(s=>s.student_email===email);
    return {id:email,name:entries[0].student_name||email,classes:classes.filter(c=>entries.some(e=>e.class_id===c.id)).map(c=>({id:c.id,name:c.name})),
      submitted:relevant.length,pending:relevant.filter(s=>s.status==='submitted').length,
      evidence:relevant.map(s=>{const a=assignments.find(a=>a.id===s.assignment_id);return {id:s.id,title:a?.title||'Class activity',classId:s.class_id,status:s.status,grade:s.grade,total:a?.points||100,feedback:s.feedback||'',response:s.text||''};})};
  });
}
export async function assignReviewedLesson(ctx,{resourceId,classId,dueDate,points=10}){
  await teacherContext(ctx);const resource=snapshot(ctx).resources.find(r=>r.id===resourceId&&r.kind==='lesson');
  if(!resource||resource.status!=='reviewed')throw new Error('Review and save this lesson before assigning it.');
  const classroom=await appClient.entities.Classroom.get(classId);if(!classroom)throw new Error('Class is not available.');
  if(!Number.isFinite(Number(points))||Number(points)<1||Number(points)>10000)throw new Error('Choose a point total between 1 and 10,000.');
  const existing=await appClient.entities.Assignment.filter({class_id:classId,source_resource_id:resourceId,source_version:resource.updatedAt});
  if(existing.length)return existing[0];
  return appClient.entities.Assignment.create({class_id:classId,teacher_id:ctx.personId,teacher_email:classroom.teacher_email,title:resource.title,description:resource.body,
    points:Number(points),due_date:dueDate||undefined,subject:classroom.subject||'',topics:[],source_resource_id:resourceId,source_version:resource.updatedAt,status:'published'});
}
export async function organizationRoster(ctx){
 const account=await appClient.auth.me();if(account.id!==ctx.personId||ctx.role!=='organization')throw new Error('Open your organization workspace first.');snapshot(ctx);
 const [members,classes]=await Promise.all([appClient.entities.OrganizationInvite.filter({organization_email:account.email,status:'active'}),appClient.entities.Classroom.filter({organization_email:account.email})]);
 return {members:members.map(m=>({id:m.id,email:m.email,role:m.role})),classes:classes.map(c=>({id:c.id,name:c.name,teacher:c.teacher_name||c.teacher_email}))};
}
export async function saveCohort(ctx,draft){
 const roster=await organizationRoster(ctx);const members=[...new Set(draft.members||[])];const classIds=[...new Set(draft.classIds||[])];
 if(members.some(email=>!roster.members.some(m=>m.email===email)))throw new Error('A selected member is no longer connected. Refresh the roster.');
 if(classIds.some(id=>!roster.classes.some(c=>c.id===id)))throw new Error('A selected class is no longer linked to this organization.');
 return saveResource(ctx,{id:draft.id,title:draft.title,body:draft.body,kind:'cohort',status:draft.status||'draft',audience:'Organization',members,classIds});
}
