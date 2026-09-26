import {appClient} from '../api/appClient.js';
import {snapshot,saveResource} from './workspaceService.ts';

async function teacherContext(ctx){
  const account=await appClient.auth.me();
  if(account.id!==ctx.personId||ctx.role!=='teacher')throw new Error('Open your teacher workspace first.');
  snapshot(ctx);
  return account;
}
function ownsClass(account,classroom){return Boolean(classroom&&(!account.organization_id||classroom.organization_email===account.organization_id)&&
  (classroom.teacher_id===account.id||classroom.teacher_email===account.email||classroom.created_by_id===account.id||classroom.created_by===account.email));}
export async function teacherClasses(ctx){const account=await teacherContext(ctx);return (await appClient.entities.Classroom.list()).filter(c=>ownsClass(account,c));}
export async function teacherLearners(ctx){
  const account=await teacherContext(ctx);
  const [allClasses,allEnrollments,allAssignments,allSubmissions]=await Promise.all(['Classroom','Enrollment','Assignment','Submission'].map(name=>appClient.entities[name].list()));
  const classes=allClasses.filter(c=>ownsClass(account,c));
  const ids=new Set(classes.map(c=>c.id));
  const roster=allEnrollments.filter(e=>ids.has(e.class_id)&&e.status==='active');
  const assignments=allAssignments.filter(a=>ids.has(a.class_id));
  const assignmentIds=new Set(assignments.map(a=>a.id));
  const submissions=allSubmissions.filter(s=>ids.has(s.class_id)&&assignmentIds.has(s.assignment_id));
  return [...new Set(roster.map(e=>e.student_email))].map(email=>{
    const entries=roster.filter(e=>e.student_email===email);const relevant=submissions.filter(s=>s.student_email===email);
    return {id:email,name:entries[0].student_name||email,classes:classes.filter(c=>entries.some(e=>e.class_id===c.id)).map(c=>({id:c.id,name:c.name})),
      submitted:relevant.length,pending:relevant.filter(s=>s.status==='submitted').length,
      evidence:relevant.map(s=>{const a=assignments.find(a=>a.id===s.assignment_id);return {id:s.id,title:a?.title||'Class activity',classId:s.class_id,status:s.status,grade:s.grade,total:a?.points||100,feedback:s.feedback||'',response:s.text||''};})};
  });
}
export async function assignReviewedLesson(ctx,{resourceId,classId,dueDate,points=10,expectedVersion}){
  const account=await teacherContext(ctx);const resource=snapshot(ctx).resources.find(r=>r.id===resourceId&&r.kind==='lesson');
  if(!resource||resource.status!=='reviewed')throw new Error('Review and save this lesson before assigning it.');
  if(expectedVersion&&resource.updatedAt!==expectedVersion)throw new Error('This lesson changed before assignment. Reopen it and review the saved version.');
  const classroom=await appClient.entities.Classroom.get(classId);if(!classroom)throw new Error('Class is not available.');
  if(!ownsClass(account,classroom))throw new Error('This class is not assigned to your teacher workspace.');
  if(!Number.isFinite(Number(points))||Number(points)<1||Number(points)>10000)throw new Error('Choose a point total between 1 and 10,000.');
  if(resource.checks!==undefined&&(!Array.isArray(resource.checks)||resource.checks.length>10||resource.checks.some(check=>!check||typeof check.id!=='string'||typeof check.prompt!=='string'||!check.prompt.trim())))throw new Error('Review the lesson questions before assigning.');
  const existing=await appClient.entities.Assignment.filter({class_id:classId,source_resource_id:resourceId,source_version:resource.updatedAt});
  if(existing.length)return existing[0];
  return appClient.entities.Assignment.create({class_id:classId,teacher_id:ctx.personId,teacher_email:classroom.teacher_email,title:resource.title,description:resource.body,
    points:Number(points),due_date:dueDate||undefined,subject:classroom.subject||'',topics:[],checks:(resource.checks||[]).map(check=>({id:check.id,prompt:check.prompt})),source_resource_id:resourceId,source_version:resource.updatedAt,status:'published'});
}
export async function submitClassworkResponses(ctx,{assignmentId,text='',responses=[]}){
 const account=await appClient.auth.me();
 if(!account||account.id!==ctx.personId||!['student','professional'].includes(ctx.role))throw new Error('Open your own learning workspace before submitting classwork.');
 snapshot(ctx);
 const assignment=await appClient.entities.Assignment.get(assignmentId);
 if(!assignment||['draft','archived'].includes(assignment.status))throw new Error('This assignment is not available in your class.');
 const enrollment=(await appClient.entities.Enrollment.filter({class_id:assignment.class_id,student_email:account.email})).find(item=>item.status==='active');
 if(!enrollment)throw new Error('Join this class before submitting work.');
 const checks=Array.isArray(assignment.checks)?assignment.checks:[];
 let content=String(text||'').trim();let answers=[];
 if(checks.length){
  if(!Array.isArray(responses)||responses.length!==checks.length||checks.some(check=>!responses.some(answer=>answer.questionId===check.id&&typeof answer.text==='string'&&answer.text.trim()&&answer.text.length<=5000)))throw new Error('Answer every class question before submitting.');
  answers=checks.map(check=>({questionId:check.id,text:responses.find(answer=>answer.questionId===check.id).text.trim()}));
  content=answers.map((answer,index)=>`${index+1}. ${checks[index].prompt}\n${answer.text}`).join('\n\n');
 }
 if(!content||content.length>50000)throw new Error('Add a response before submitting classwork.');
 const existing=await appClient.entities.Submission.filter({assignment_id:assignmentId,student_email:account.email});
 if(existing.length)return existing[0];
 return appClient.entities.Submission.create({assignment_id:assignment.id,class_id:assignment.class_id,teacher_id:assignment.teacher_id||assignment.created_by_id,teacher_email:assignment.teacher_email,
  student_id:account.id,student_name:account.full_name||account.email.split('@')[0],student_email:account.email,text:content,...(answers.length?{responses:answers}:{}),status:'submitted',submitted_date:new Date().toISOString().slice(0,10)});
}
export async function organizationRoster(ctx){
 const account=await appClient.auth.me();if(account.id!==ctx.personId||ctx.role!=='organization')throw new Error('Open your organization workspace first.');snapshot(ctx);
 const [members,classes]=await Promise.all([appClient.entities.OrganizationInvite.filter({organization_email:account.email,status:'active'}),appClient.entities.Classroom.filter({organization_email:account.email})]);
 return {members:members.map(m=>({id:m.id,email:m.email,role:m.role})),classes:classes.map(c=>({id:c.id,name:c.name,teacher:c.teacher_name||c.teacher_email}))};
}
export async function saveCohort(ctx,draft){
 const roster=await organizationRoster(ctx);
 if(draft.id&&!snapshot(ctx).resources.some(resource=>resource.id===draft.id&&resource.kind==='cohort'))throw new Error('This cohort is not available in your organization workspace.');
 if(!Array.isArray(draft.members||[])||!Array.isArray(draft.classIds||[])||
  (draft.members||[]).some(value=>typeof value!=='string')||(draft.classIds||[]).some(value=>typeof value!=='string'))throw new Error('Choose members and classes from the connected roster.');
 const members=[...new Set(draft.members||[])];const classIds=[...new Set(draft.classIds||[])];
 if(members.some(email=>!roster.members.some(m=>m.email===email)))throw new Error('A selected member is no longer connected. Refresh the roster.');
 if(classIds.some(id=>!roster.classes.some(c=>c.id===id)))throw new Error('A selected class is no longer linked to this organization.');
 return saveResource(ctx,{id:draft.id,title:draft.title,body:draft.body,kind:'cohort',status:draft.status||'draft',audience:'Organization',members,classIds});
}
