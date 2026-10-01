import {appClient} from '../api/appClient.js';
import {snapshot,saveResource,stageProfileByEmail,organizationInvites,bootstrapPerson,requireOrganizationPermission,artifactRevision,resourceRevision} from './workspaceService.ts';
import {getContentRepository} from './contentRepository.ts';
import {assertLessonObjective} from './lessonObjective.ts';
import {validCriterionFeedback,classworkReviewRevision} from '../lib/classworkRubric.js';
import {classworkProjectText} from '../lib/classworkProject.js';
import {assignmentAcceptsResponses} from '../lib/assignmentAvailability.js';
import {tierForPerson} from './stagePresentation.ts';

async function teacherContext(ctx){
  const account=await appClient.auth.me();
  if(account.id!==ctx.personId||ctx.role!=='teacher')throw new Error('Open your teacher workspace first.');
  snapshot(ctx);
  const current=bootstrapPerson(account);const active=current.workspaces.find(workspace=>workspace.id===current.active);
  if(active?.id!==ctx.workspaceId)throw new Error('Your workspace changed. Reopen the class action in your active workspace.');
  return {...account,organization_id:active.organizationId};
}
function ownsClass(account,classroom){return Boolean(classroom&&(account.organization_id?classroom.organization_email===account.organization_id:!classroom.organization_email)&&
  (classroom.teacher_id===account.id||classroom.teacher_email===account.email||classroom.created_by_id===account.id||classroom.created_by===account.email));}
export async function teacherClasses(ctx){const account=await teacherContext(ctx);return (await appClient.entities.Classroom.list()).filter(c=>ownsClass(account,c));}
export async function createTeacherClass(ctx,draft){
 const account=await teacherContext(ctx);
 const fields=['name','section','subject','room','color'];const values={};
 for(const field of fields){const value=draft[field]??'';if(typeof value!=='string'||value.trim().length>100)throw new Error('Keep class details within 100 characters.');values[field]=value.trim();}
 if(!values.name)throw new Error('Give your class a name.');
 if(account.organization_id&&!organizationInvites(ctx).some(invite=>invite.organization_email===account.organization_id&&invite.role==='teacher'&&invite.status==='active'))throw new Error('This organization connection is no longer active. Switch to your personal workspace.');
 const classes=await appClient.entities.Classroom.list();let joinCode;
 do{joinCode=`VISION-${crypto.randomUUID().replaceAll('-','').slice(0,8).toUpperCase()}`;}while(classes.some(classroom=>classroom.join_code===joinCode));
 return appClient.entities.Classroom.create({...values,teacher_email:account.email,teacher_id:account.id,teacher_name:account.full_name||account.email,join_code:joinCode,student_count:0,...(account.organization_id?{organization_email:account.organization_id}:{})});
}
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
    const profile = stageProfileByEmail(email);
    const tier = tierForPerson(profile || {});
    return {id:email,name:entries[0].student_name||email,tier,tierLabel:{foundational:'Foundational',developing:'Developing',secondary:'Secondary',higher:'Higher education'}[tier],classes:classes.filter(c=>entries.some(e=>e.class_id===c.id)).map(c=>({id:c.id,name:c.name})),
      submitted:relevant.length,pending:relevant.filter(s=>s.status==='submitted').length,
      evidence:relevant.map(s=>{const a=assignments.find(a=>a.id===s.assignment_id);return {id:s.id,title:a?.title||'Class activity',classId:s.class_id,status:s.status,grade:s.grade,total:a?.points||100,feedback:s.feedback||'',response:s.text||''};})};
  });
}
export async function teacherObjectiveChoices(ctx,selection){
 await teacherContext(ctx);const repo=getContentRepository(ctx);const syllabus=await repo.getSyllabus(selection.board,selection.classLevel,selection.subject);
 if(!['sample','official'].includes(syllabus.status))throw Error('No sourced curriculum is available for this selection. Your lesson has not changed.');
 const chapters=await repo.getChapters(syllabus.id);const topics=(await Promise.all(chapters.map(chapter=>repo.getTopics(chapter.id)))).flat();
 const concepts=(await Promise.all(topics.map(topic=>repo.getConcepts(topic.id)))).flat();await teacherContext(ctx);
 return {syllabus,choices:concepts.filter(concept=>['sample','official'].includes(concept.status)).map(concept=>({id:concept.id,title:concept.title,chapter:chapters.find(chapter=>chapter.id===topics.find(topic=>topic.id===concept.topicId)?.chapterId)?.title||''}))};
}
export async function prepareTeacherObjective(ctx,{selection,conceptId,expectedSource}){
 const {syllabus,choices}=await teacherObjectiveChoices(ctx,selection);if(!choices.some(choice=>choice.id===conceptId))throw Error('Choose an objective from the loaded curriculum.');
 if(JSON.stringify(syllabus.provenance)!==expectedSource)throw Error('The curriculum source changed. Reload the objectives before attaching.');
 const concept=await getContentRepository(ctx).getConcept(conceptId);await teacherContext(ctx);
 if(!concept||concept.languageUnavailable||concept.locale!==ctx.locale||JSON.stringify(concept.provenance)!==JSON.stringify(syllabus.provenance))throw Error('This objective is unavailable in the selected language or source version. Your lesson has not changed.');
 const objective={conceptId:concept.id,title:concept.title,status:concept.status,locale:concept.locale,selection:{board:syllabus.board,classLevel:syllabus.classLevel,subject:syllabus.subject},provenance:concept.provenance,explanation:concept.explanation,representations:concept.representations.map(item=>({id:item.id,kind:item.kind,alternative:item.alternative,...(item.assetId?{assetId:item.assetId}:{}),...(item.numberLine?{numberLine:item.numberLine}:{}),...(item.series?{series:item.series}:{})}))};
 if(concept.project?.criteria?.length)objective.criteria=concept.project.criteria.map(item=>({id:item.id,label:item.label,prompt:item.prompt}));assertLessonObjective(objective);return structuredClone(objective);
}
export async function assignReviewedLesson(ctx,{resourceId,classId,dueDate,points=10,expectedVersion,expectedRevision}){
  const account=await teacherContext(ctx);const resource=snapshot(ctx).resources.find(r=>r.id===resourceId&&r.kind==='lesson');
  if(!resource||resource.status!=='reviewed')throw new Error('Review and save this lesson before assigning it.');
  if(expectedVersion&&resource.updatedAt!==expectedVersion)throw new Error('This lesson changed before assignment. Reopen it and review the saved version.');
  const revision=resourceRevision(resource);if(expectedRevision!==undefined&&revision!==expectedRevision)throw new Error('This lesson changed before assignment. Reopen it and review the saved version.');
  if(resource.objectiveSnapshot)assertLessonObjective(resource.objectiveSnapshot);
  const classroom=await appClient.entities.Classroom.get(classId);if(!classroom)throw new Error('Class is not available.');
  if(!ownsClass(account,classroom))throw new Error('This class is not assigned to your teacher workspace.');
  if(!Number.isFinite(Number(points))||Number(points)<1||Number(points)>10000)throw new Error('Choose a point total between 1 and 10,000.');
  if(resource.checks!==undefined&&(!Array.isArray(resource.checks)||resource.checks.length>10||resource.checks.some(check=>!check||typeof check.id!=='string'||typeof check.prompt!=='string'||!check.prompt.trim())))throw new Error('Review the lesson questions before assigning.');
  const existing=await appClient.entities.Assignment.filter({class_id:classId,source_resource_id:resourceId,source_version:resource.updatedAt});
  const assignedRevision=JSON.stringify([resource.updatedAt,resource.title,resource.body,resource.checks||[],resource.objectiveSnapshot||null,resource.sourceSnapshot||null]);
  const replay=existing.find(item=>item.source_revision===assignedRevision||!item.source_revision&&JSON.stringify([item.title,item.description,item.checks||[],item.objective_snapshot||null,item.source_provenance||null])===JSON.stringify([resource.title,resource.body,resource.checks||[],resource.objectiveSnapshot||null,resource.sourceSnapshot||null]));if(replay)return replay;
  return appClient.entities.Assignment.create({class_id:classId,teacher_id:ctx.personId,teacher_email:classroom.teacher_email,title:resource.title,description:resource.body,
    points:Number(points),due_date:dueDate||undefined,subject:classroom.subject||'',topics:[],checks:(resource.checks||[]).map(check=>({id:check.id,prompt:check.prompt})),source_resource_id:resourceId,source_version:resource.updatedAt,source_revision:assignedRevision,...(resource.objectiveSnapshot?{objective_snapshot:structuredClone(resource.objectiveSnapshot)}:{}),...(resource.sourceSnapshot?{source_provenance:{...resource.sourceSnapshot}}:{}),status:'published',state_history:[{from:'new',to:'published',actor:account.email,at:new Date().toISOString()}]});
}
export function classworkCriterionText(criteria,selfReview){if(!criteria.length)return '';if(!selfReview||typeof selfReview!=='object'||Array.isArray(selfReview)||criteria.some(item=>typeof selfReview[item.id]!=='string'||!selfReview[item.id].trim()||selfReview[item.id].length>2000)||Object.keys(selfReview).some(key=>!criteria.some(item=>item.id===key)))throw Error('Complete each assigned criterion review in Learn before submitting.');return `\n\nAssigned criterion self-review\n${criteria.map(item=>`${item.label}: ${item.prompt}\n${selfReview[item.id].trim()}`).join('\n\n')}`;}
export function classworkResponseText(assignment,submission){const text=submission?.text||'';try{const suffix=classworkCriterionText(assignment.objective_snapshot?.criteria||[],submission?.self_review||{});return suffix&&text.endsWith(suffix)?text.slice(0,-suffix.length):text;}catch{return text;}}
export async function submitClassworkResponses(ctx,{assignmentId,text='',responses=[],selfReview={}}){
 const account=await appClient.auth.me();
 if(!account||account.id!==ctx.personId||!['student','professional'].includes(ctx.role))throw new Error('Open your own learning workspace before submitting classwork.');
 snapshot(ctx);
 const assignment=await appClient.entities.Assignment.get(assignmentId);
 if(!assignmentAcceptsResponses(assignment))throw new Error('This assignment is not open for submissions in your class.');
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
 const criteria=assignment.objective_snapshot?.criteria||[];
 const review=Object.fromEntries(criteria.map(item=>[item.id,typeof selfReview?.[item.id]==='string'?selfReview[item.id].trim():'']));
 if(assignment.objective_snapshot)assertLessonObjective(assignment.objective_snapshot);
 content+=classworkCriterionText(criteria,selfReview);if(content.length>50000)throw Error('Keep the response and criterion review within 50,000 characters.');
 const existing=await appClient.entities.Submission.filter({assignment_id:assignmentId,student_email:account.email});
 if(existing.length){
  const previous=existing[0];
  if(previous.status!=='revision_requested'){if(previous.text!==content||JSON.stringify(previous.responses||[])!==JSON.stringify(answers))throw new Error('A different response is already submitted. Your current draft was not submitted or used to replace it. Review the saved response or export these edits.');return previous;}
  return appClient.entities.Submission.update(previous.id,{text:content,responses:answers,self_review:review,criterion_feedback:{},status:'submitted',grade:null,feedback:'',graded_date:null,
   submitted_date:new Date().toISOString(),attempt:(previous.attempt||1)+1,
   revision_history:[...(previous.revision_history||[]),{text:previous.text,responses:previous.responses||[],self_review:previous.self_review||{},criterion_feedback:previous.criterion_feedback||{},feedback:previous.feedback||'',submitted_date:previous.submitted_date,graded_date:previous.graded_date,attempt:previous.attempt||1}]});
 }
 return appClient.entities.Submission.create({assignment_id:assignment.id,class_id:assignment.class_id,teacher_id:assignment.teacher_id||assignment.created_by_id,teacher_email:assignment.teacher_email,
  student_id:account.id,student_name:account.full_name||account.email.split('@')[0],student_email:account.email,text:content,self_review:review,...(answers.length?{responses:answers}:{}),status:'submitted',submitted_date:new Date().toISOString().slice(0,10)});
}
export async function submitClassworkProject(ctx,{assignmentId,artifactId,expectedRevision,expectedObjectiveRevision}){
 const account=await appClient.auth.me();
 if(account.id!==ctx.personId||!['student','professional'].includes(ctx.role))throw new Error('Open your own learning workspace before submitting a project.');
 const assignment=await appClient.entities.Assignment.get(assignmentId);
 if(!assignment)throw new Error('This assignment is no longer available.');
 if(expectedObjectiveRevision!==undefined&&JSON.stringify(assignment.objective_snapshot||null)!==expectedObjectiveRevision)throw Error('The assigned objective or rubric changed. Preview the current classroom copy before submitting.');
 if(assignment.checks?.length)throw new Error('Answer the assigned questions for this activity. Project copies are available for written-response assignments.');
 const artifact=snapshot(ctx).artifacts.find(item=>item.id===artifactId);
 if(!artifact)throw new Error('This saved project is not in your active workspace.');
 if(!expectedRevision||artifactRevision(artifact)!==expectedRevision)throw new Error('This project changed. Preview the current saved copy before submitting.');
 const criteria=assignment.objective_snapshot?.criteria||[];
 if(criteria.length&&(artifact.conceptId!==assignment.objective_snapshot.conceptId||artifact.rubric?.sourceVersion!==assignment.objective_snapshot.provenance.version||artifact.rubric?.sourceProvider!==assignment.objective_snapshot.provenance.provider))throw Error('This project does not match the assigned objective and rubric source. Respond and review the assigned criteria in Learn.');
 return submitClassworkResponses(ctx,{assignmentId,text:classworkProjectText(artifact),selfReview:Object.fromEntries(criteria.map(item=>[item.id,artifact.rubric?.responses?.[item.id]]))});
}
export async function changeAssignmentState(ctx,{assignmentId,expectedStatus,nextStatus}){
 const account=await teacherContext(ctx);const assignment=await appClient.entities.Assignment.get(assignmentId);
 if(!assignment)throw new Error('This assignment is no longer available.');
 const current=assignment.status||'published';
 if(current!==expectedStatus)throw new Error('The assignment state changed. Reload classwork before trying again.');
 const allowed={draft:['published','archived'],scheduled:['published','draft','closed','archived'],published:['closed','archived'],closed:['published','archived'],archived:['closed']};
 if(!allowed[current]?.includes(nextStatus))throw new Error('Choose an available assignment action.');
 if(nextStatus==='published'&&(!assignment.title?.trim()||!Number.isFinite(Number(assignment.points))||Number(assignment.points)<1))throw new Error('Review the assignment title and point total before publishing.');
 return appClient.entities.Assignment.update(assignmentId,{status:nextStatus,state_history:[...(assignment.state_history||[]),{from:current,to:nextStatus,actor:account.email,at:new Date().toISOString()}]});
}
export async function reviewClasswork(ctx,{submissionId,attempt=1,status,grade,feedback='',criterionFeedback={},expectedReviewRevision}){
 await teacherContext(ctx);
 const submission=await appClient.entities.Submission.get(submissionId);
 if(!submission)throw new Error('This submission is no longer available.');
 if((submission.attempt||1)!==attempt)throw new Error('A newer response arrived. Reopen the review before returning feedback.');
 if(expectedReviewRevision!==undefined&&expectedReviewRevision!==classworkReviewRevision(submission))throw Error('This review changed in another tab. Export your edits, then load the latest review before returning feedback.');
 if(!['graded','revision_requested'].includes(status))throw new Error('Choose Return or Request revision.');
 if(typeof feedback!=='string'||feedback.length>5000)throw new Error('Keep feedback within 5,000 characters.');
 if(status==='revision_requested'&&!feedback.trim())throw new Error('Explain what the learner should revise.');
 const assignment=await appClient.entities.Assignment.get(submission.assignment_id);
 const criteria=assignment?.objective_snapshot?.criteria||[];
 if(!validCriterionFeedback(criteria,criterionFeedback,status==='graded'))throw Error('Review each assigned criterion with a rating and feedback note before returning. Revision requests may include selected criteria.');
 if(status==='graded'&&(grade===''||grade==null||!Number.isFinite(Number(grade))||Number(grade)<0||Number(grade)>(assignment?.points||100)))throw new Error('Enter a grade within the assignment point range.');
 const latest=await appClient.entities.Submission.get(submissionId);
 if(!latest||classworkReviewRevision(latest)!==classworkReviewRevision(submission))throw Error('This review changed while saving. Export your edits, then load the latest review.');
 return appClient.entities.Submission.update(submissionId,{status,grade:status==='graded'?Number(grade):null,feedback:feedback.trim(),criterion_feedback:structuredClone(criterionFeedback),graded_date:new Date().toISOString()});
}
export async function organizationRoster(ctx){
 const account=await appClient.auth.me();if(account.id!==ctx.personId||ctx.role!=='organization')throw new Error('Open your organization workspace first.');snapshot(ctx);
 const policy=requireOrganizationPermission(ctx,'academic');
 const members=organizationInvites(ctx).filter(invite=>invite.status==='active');
 const classes=await appClient.entities.Classroom.filter({organization_email:policy.organizationEmail});
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
