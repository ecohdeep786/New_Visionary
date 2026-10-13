import {getClassworkActivity,classworkActivityRevision} from './classworkPlayerService.js';
import {getContentRepository} from './contentRepository.ts';
import {getTeachingInterface,hasSafetyConcern} from './teachingInterface.ts';
import {workspaceIdentity} from './workspaceService.ts';
import {getAssignedCurriculumPracticeSource} from './curriculumPracticeSource.js';

const record=value=>value&&typeof value==='object'&&!Array.isArray(value);
const questionShape=q=>record(q)&&typeof q.id==='string'&&typeof q.prompt==='string'&&Array.isArray(q.options)&&q.options.length>=2&&q.options.every(option=>typeof option==='string');
function validStudy(row){return record(row)&&typeof row.sourceRevision==='string'&&typeof row.questionDraft==='string'&&row.questionDraft.length<=2000&&Number.isInteger(row.round)&&row.round>=0&&Number.isInteger(row.position)&&row.position>=0&&Array.isArray(row.attempts)&&row.attempts.length<=500&&row.attempts.every(item=>record(item)&&questionShape(item.question)&&typeof item.questionRevision==='string'&&Number.isInteger(item.round)&&item.round>=0&&Number.isInteger(item.index)&&item.index>=0&&item.index<item.question.options.length&&typeof item.correct==='boolean'&&typeof item.at==='string');}
export function classworkStudyKey(ctx){workspaceIdentity(ctx);if(!['student','professional'].includes(ctx.role))throw Error('Open your learning workspace for private classroom study.');return `visionary_classwork_study_v1:${ctx.personId}`;}
function read(ctx){try{const saved=JSON.parse(localStorage.getItem(classworkStudyKey(ctx))||'{}');if(!record(saved)||Object.values(saved).some(space=>!record(space)||Object.values(space).some(row=>!validStudy(row))))throw Error();return saved;}catch{throw Error('Private classroom study could not be read. Saved records have not been replaced. Export the backup before leaving.');}}
const revision=row=>JSON.stringify(row||null);
const blank=assignment=>({sourceRevision:classworkActivityRevision(assignment),questionDraft:'',position:0,round:0,attempts:[]});
function state(ctx,assignment){const row=read(ctx)[ctx.workspaceId]?.[assignment.id];if(row&&row.sourceRevision!==classworkActivityRevision(assignment))throw Error('Your private study belongs to an earlier assigned source. The original is retained. Export it and ask your teacher for the correct assignment.');return {study:row||blank(assignment),revision:revision(row)};}
function write(ctx,assignment,next,expectedRevision){const db=read(ctx);const space=db[ctx.workspaceId]||{};if(revision(space[assignment.id])!==expectedRevision)throw Error('Private study changed in another screen. Export your current question or reload the saved study before continuing.');if(!validStudy(next))throw Error('This private study record is incomplete or has reached its 500-attempt limit.');db[ctx.workspaceId]={...space,[assignment.id]:next};try{localStorage.setItem(classworkStudyKey(ctx),JSON.stringify(db));}catch{throw Error('Private study could not be saved. Keep this page open and export your question.');}return {study:structuredClone(next),revision:revision(next)};}
export async function getClassworkStudy(ctx,assignmentId){const activity=await getClassworkActivity(ctx,assignmentId);return {...activity,...state(ctx,activity.assignment)};}
export async function saveClassworkStudyQuestion(ctx,{assignmentId,expectedRevision,question}){if(typeof question!=='string'||question.length>2000)throw Error('Keep the question within 2,000 characters.');const view=await getClassworkStudy(ctx,assignmentId);return write(ctx,view.assignment,{...view.study,questionDraft:question},expectedRevision);}
export async function askClassworkQuestion(ctx,{assignmentId,question,topic='question'}){
 const view=await getClassworkActivity(ctx,assignmentId);if(typeof question!=='string'||!question.trim()||question.length>2000)throw Error('Enter a question within 2,000 characters.');if(!['question','explanation','instructions'].includes(topic))throw Error('Choose an available source topic.');
 const objective=view.assignment.objective_snapshot;const locale=objective?.locale||ctx.locale;
 const context={assignmentId,sourceVersion:objective?.provenance.version,sourceId:objective?.provenance.sourceId,explanation:objective?.explanation||'',instructions:view.assignment.description||''};
 const assignedText=topic==='explanation'?objective?.explanation:topic==='instructions'?view.assignment.description:null;
 const response=assignedText&&!hasSafetyConcern(question)&&!hasSafetyConcern(JSON.stringify(context))?{status:'source',source:'assigned-copy',locale,text:assignedText}:await getTeachingInterface(ctx).requestExplanation({input:question,language:locale,conceptId:objective?.conceptId,intent:'understand',context});
 const latest=await getClassworkActivity(ctx,assignmentId);if(classworkActivityRevision(latest.assignment)!==classworkActivityRevision(view.assignment))throw Error('The assigned source changed while opening guidance. Reopen the current activity.');
 if(ctx.signal?.aborted)throw new DOMException('Cancelled','AbortError');
 if(response.status==='not_connected'&&topic!=='question'){const text=topic==='explanation'?objective?.explanation:view.assignment.description;if(text)return {status:'source',source:'assigned-copy',locale,text};}
 return response;
}
async function sourcePractice(ctx,assignmentId){
 const view=await getClassworkActivity(ctx,assignmentId);const objective=view.assignment.objective_snapshot;if(!objective)throw Error('This activity has no attached objective or authored practice. Ask your teacher for a reviewed source.');
 if(objective.status==='reviewed'){const source=await getAssignedCurriculumPracticeSource(ctx,assignmentId);return {...source.activity,...state(ctx,source.activity.assignment),questions:source.questions};}
 const repo=getContentRepository({...ctx,locale:objective.locale});const selection=objective.selection;const syllabus=await repo.getSyllabus(selection.board,selection.classLevel,selection.subject);const concept=await repo.getConcept(objective.conceptId);
 if(!concept||concept.languageUnavailable||concept.locale!==objective.locale||JSON.stringify(syllabus.provenance)!==JSON.stringify(objective.provenance)||JSON.stringify(concept.provenance)!==JSON.stringify(objective.provenance)||(objective.criteria&&JSON.stringify(concept.project?.criteria)!==JSON.stringify(objective.criteria))||concept.explanation!==objective.explanation||JSON.stringify(concept.representations)!==JSON.stringify(objective.representations))throw Error('Practice for the exact assigned source and language is unavailable. The assigned copy and your study remain intact.');
 const questions=concept.practice||[];if(!questions.length)throw Error('No authored practice questions are available for this objective. No questions have been generated.');
 const latest=await getClassworkActivity(ctx,assignmentId);if(classworkActivityRevision(latest.assignment)!==classworkActivityRevision(view.assignment))throw Error('The assigned source changed. Reopen this activity.');
 return {...latest,...state(ctx,latest.assignment),questions};
}
const publicQuestion=q=>({id:q.id,prompt:q.prompt,options:[...q.options]});
async function questionRevision(question){const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(question)));return Array.from(new Uint8Array(hash),byte=>byte.toString(16).padStart(2,'0')).join('');}
async function checkedPracticeSource(ctx,assignmentId){try{return await sourcePractice(ctx,assignmentId);}catch(failure){if(failure.name!=='AbortError')failure.name='ClassworkPracticeSourceConflictError';throw failure;}}
function practiceConflict(message){const failure=Error(message);failure.name='ClassworkPracticeSourceConflictError';return failure;}
async function recheckPractice(ctx,assignmentId,view){
 try{
  const latest=await sourcePractice(ctx,assignmentId);
  if(classworkActivityRevision(latest.assignment)!==classworkActivityRevision(view.assignment)||JSON.stringify(latest.questions)!==JSON.stringify(view.questions))throw Error('The assigned practice source changed. Reopen the latest activity; your saved study is retained.');
  if(latest.study.position!==view.study.position||latest.study.round!==view.study.round)throw Error('Private practice changed in another screen. Reload your saved study before continuing.');
  return latest;
 }catch(failure){if(failure.name!=='AbortError')failure.name='ClassworkPracticeSourceConflictError';throw failure;}
}
export async function getClassworkPractice(ctx,assignmentId){
 const view=await checkedPracticeSource(ctx,assignmentId);const position=Math.min(view.study.position,view.questions.length-1);const question=view.questions[position];
 const token=await questionRevision(question);
 // Hashing yields to other tabs, navigation and access changes. Recheck the
 // authorized source and saved round before exposing a prepared question.
 const latest=await recheckPractice(ctx,assignmentId,view);
 return {assignment:latest.assignment,classroom:latest.classroom,study:latest.study,revision:latest.revision,question:publicQuestion(question),questionRevision:token,position,total:latest.questions.length};
}
export async function answerClassworkPractice(ctx,{assignmentId,expectedRevision,expectedQuestionRevision,expectedRound,index}){
 const view=await checkedPracticeSource(ctx,assignmentId);const question=view.questions[Math.min(view.study.position,view.questions.length-1)];const token=await questionRevision(question);if(expectedRound!==view.study.round)throw practiceConflict('This rehearsal round changed. Reload your saved study.');if(token!==expectedQuestionRevision)throw practiceConflict('This practice question changed. Your earlier attempts remain saved. Reload the current question.');if(!Number.isInteger(index)||!question.options[index])throw Error('Choose an available answer.');
 const latest=await recheckPractice(ctx,assignmentId,view);
 const duplicate=latest.study.attempts.at(-1);if(duplicate?.questionRevision===token&&duplicate.round===latest.study.round){if(duplicate.index!==index)throw Error('Review the saved result and start a new retry before answering again.');return {...state(ctx,latest.assignment),correct:duplicate.correct};}
 const attempt={question:publicQuestion(question),questionRevision:token,round:latest.study.round,index,correct:index===question.answerIndex,at:new Date().toISOString()};return {...write(ctx,latest.assignment,{...latest.study,attempts:[...latest.study.attempts,attempt]},expectedRevision),correct:attempt.correct};
}
export async function moveClassworkPractice(ctx,{assignmentId,expectedRevision,next}){const view=await checkedPracticeSource(ctx,assignmentId);if(!Number.isInteger(next)||next<0||next>=view.questions.length)throw Error('Choose an available practice question.');return write(ctx,view.assignment,{...view.study,position:next,round:view.study.round+1},expectedRevision);}
