import type { RequestContext, Locale, Artifact } from '../domain/workspace.ts';
import { workspaceIdentity, workspaceNow, snapshot, saveArtifact, newConversation, updateConversation, appendTeachingTurn } from './workspaceService.ts';
import { getContentRepository, type ContentSelection, type ContentQuestion } from './contentRepository.ts';
import { getTeachingInterface, type TeachingResponse, type TeachingMode } from './teachingInterface.ts';
import { emitInteractionEvent, recordLearningOutcome, getStudentState, getStudentClassLearningContext } from './mentorStateService.ts';

export interface LearningUnit {
 id:string; conceptId:string; title:string; locale:Locale; classId?:string; stage:'explain'|'check'|'practice'|'build'|'completed';
 checkPassed:boolean; practicePassed?:boolean; difficulty:number; practiceRound:number; question?:ContentQuestion;
 answer?:{index:number;correct:boolean;id:string}; response?:TeachingResponse; explanation?:string;
 conversationId?:string; artifactId?:string; updatedAt:string; pending?:LearningOutcome;
}
interface LearningOutcome {id:string;conceptId:string;kind:'check'|'practice'|'application';correct?:number;total?:number;verified:boolean;sessionId:string;language:Locale;board?:string;classLevel?:string;classId?:string}
interface LearningSpace {selection?:ContentSelection;syllabusId?:string;units:LearningUnit[]}
interface Store {version:1;spaces:Record<string,LearningSpace>}
const KEY='visionary_learning_pipeline_v1';
const now=()=>workspaceNow().toISOString();
function guard(ctx:RequestContext){const identity=workspaceIdentity(ctx);if(ctx.role==='professional'&&identity.person.ageBand!=='adult')throw Error('Professional journeys are available only to adult profiles. Use a general learning workspace.');if(ctx.signal?.aborted)throw new DOMException('Cancelled','AbortError');}
function read():Store{const raw=localStorage.getItem(KEY);if(!raw)return{version:1,spaces:{}};try{const value=JSON.parse(raw);if(value.version!==1||!value.spaces)throw Error();return value;}catch{throw Error('Your saved learning could not be read. No records were removed.');}}
function own(db:Store,ctx:RequestContext){guard(ctx);return db.spaces[ctx.workspaceId]??={units:[]};}
function write(db:Store,ctx:RequestContext){guard(ctx);try{localStorage.setItem(KEY,JSON.stringify(db));}catch{throw Error('Learning changes could not be saved. Keep this page open and retry.');}if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('visionary:learning-change'));}
function save(ctx:RequestContext,unit:LearningUnit){const db=read();const data=own(db,ctx);const index=data.units.findIndex(u=>u.id===unit.id);unit.updatedAt=now();if(index<0)data.units.push(unit);else data.units[index]=unit;write(db,ctx);return structuredClone(unit);}
export function getLearningWorkspace(ctx:RequestContext){return structuredClone(own(read(),ctx));}
export function getLearningUnit(ctx:RequestContext,id:string){const unit=getLearningWorkspace(ctx).units.find(u=>u.id===id);if(!unit)throw Error('This learning activity is unavailable in this workspace.');return unit;}
export function getLearningForConversation(ctx:RequestContext,id:string){return getLearningWorkspace(ctx).units.find(u=>u.conversationId===id);}
function curriculumFields(ctx:RequestContext){const selected=getLearningWorkspace(ctx).selection;return selected?{board:selected.board,classLevel:selected.classLevel}:{};}
export async function selectLearningSyllabus(ctx:RequestContext,selection:ContentSelection){const syllabus=await getContentRepository(ctx).getSyllabus(selection.board,selection.classLevel,selection.subject);const db=read();Object.assign(own(db,ctx),{selection,syllabusId:syllabus.id});write(db,ctx);emitInteractionEvent(ctx,{app:'LEARN',action:'view',sessionId:syllabus.id,language:ctx.locale,board:selection.board,classLevel:selection.classLevel});return syllabus;}
export async function startLearningUnit(ctx:RequestContext,conceptId:string,classId?:string){
 const classContext=classId?getStudentClassLearningContext(ctx,classId):null;
 const selection=getLearningWorkspace(ctx).selection;
 if(classContext&&(!classContext.subject||selection?.subject!==classContext.subject))throw Error('Select this connected class subject before linking learning evidence.');
 const repository=getContentRepository(ctx);const progressId=await repository.resolveProgressId(conceptId);
 const concept=await repository.getConcept(progressId);if(!concept)throw Error('This concept is unavailable. Return to your learning outline.');
 if(classContext&&selection){const outline=await repository.getSyllabus(selection.board,selection.classLevel,selection.subject);if(!outline.chapters.some(chapter=>chapter.topicIds.includes(concept.topicId)))throw Error('This concept is not in the connected class subject. Open its own learning outline instead.');}
 const existing=getLearningWorkspace(ctx).units.find(u=>u.conceptId===concept.id&&u.classId===classId&&u.stage!=='completed');
 if(existing){if(existing.title!==concept.title)save(ctx,{...existing,title:concept.title});emitInteractionEvent(ctx,{app:'LEARN',action:'resume',sessionId:existing.id,conceptId:progressId,language:existing.locale,...curriculumFields(ctx)});return getLearningUnit(ctx,existing.id);}
 const unit:LearningUnit={id:crypto.randomUUID(),conceptId:concept.id,title:concept.title,locale:ctx.locale,classId,stage:'explain',checkPassed:false,difficulty:1,practiceRound:0,updatedAt:now()};
 save(ctx,unit);emitInteractionEvent(ctx,{app:'LEARN',action:'start',sessionId:unit.id,conceptId,language:unit.locale,...curriculumFields(ctx)});return unit;
}
export async function updateLearningLanguage(ctx:RequestContext,id:string,locale:Locale){
 const unit=getLearningUnit(ctx,id);if(unit.locale===locale)return unit;
 const repository=getContentRepository({...ctx,locale});let concept=await repository.getConcept(unit.conceptId);
 // A connected source can provide a language variant after the unit was first opened.
 if(concept?.languageUnavailable){const selected=getLearningWorkspace(ctx).selection;if(selected){await repository.getSyllabus(selected.board,selected.classLevel,selected.subject);concept=await repository.getConcept(unit.conceptId);}}
 guard(ctx);if(!concept)throw Error('This teaching language is not available for the saved concept. Your position remains unchanged.');
 unit.locale=locale;
 // A connected response belongs to its original language. Do not relabel it as a translation.
 if(concept.explanation)unit.explanation=concept.explanation;else delete unit.explanation;
 if(unit.question){const translated=[concept.check,...(concept.practice||[])].find(q=>q?.id===unit.question?.id);if(translated)unit.question=translated;else delete unit.question;}
 delete unit.response;
 return save(ctx,unit);
}
export async function requestUnitTeaching(ctx:RequestContext,id:string,mode:TeachingMode){
 const unit=getLearningUnit(ctx,id);const concept=await getContentRepository({...ctx,locale:unit.locale}).getConcept(unit.conceptId);if(!concept)throw Error('Content unavailable. Your position remains saved.');
 const started=Date.now();const api=getTeachingInterface(ctx);
 const packet={input:concept.title,conceptId:unit.conceptId,sessionId:id,language:unit.locale,difficulty:unit.difficulty,audience:concept.audience,context:{stage:unit.stage,source:concept.status}};
 const app=mode==='practice'?'PRACTICE':mode==='project'?'BUILD':'LEARN';
 const pedagogy=mode==='practice'?'practice':mode==='project'?'application':mode==='feedback'?'reflection':'explanation';
 emitInteractionEvent(ctx,{app,action:'request',sessionId:id,conceptId:unit.conceptId,language:unit.locale,pedagogy,...curriculumFields(ctx)});
 const response=await (mode==='practice'?api.requestPracticeQuestion(packet):mode==='feedback'?api.requestFeedback(packet):mode==='project'?api.requestProjectGuidance(packet):api.requestExplanation(packet));
 guard(ctx);unit.response=response;
 if(mode==='explanation'&&response.status!=='blocked')unit.explanation=response.status==='ready'?response.text:concept.explanation;
 if(mode==='practice'&&response.status!=='blocked')unit.question=response.question||(unit.stage==='check'?concept.check:concept.practice?.[Math.min(unit.difficulty-1,Math.max(0,(concept.practice?.length||1)-1))]);
 save(ctx,unit);emitInteractionEvent(ctx,{app,action:'response',sessionId:id,conceptId:unit.conceptId,language:unit.locale,latency:Date.now()-started,responseStatus:response.status,promptVersion:response.status==='ready'?response.promptVersion:undefined,pedagogy,...curriculumFields(ctx)});return unit;
}
export async function beginComprehension(ctx:RequestContext,id:string){const unit=getLearningUnit(ctx,id);if(unit.response?.status==='blocked')throw Error('Teaching is paused for safety.');if(!unit.explanation)throw Error('An explanation is not available yet. Save a question while the teaching service is disconnected.');unit.stage='check';delete unit.answer;delete unit.question;save(ctx,unit);return requestUnitTeaching(ctx,id,'practice');}
/** An outbox retains a scored local answer if the separate cognition adapter cannot write. */
export function flushLearningOutcome(ctx:RequestContext,id:string){const unit=getLearningUnit(ctx,id);if(unit.pending){recordLearningOutcome(ctx,unit.pending);delete unit.pending;save(ctx,unit);}return unit;}
export async function answerLearningQuestion(ctx:RequestContext,id:string,index:number){
 let unit=flushLearningOutcome(ctx,id);if(!['check','practice'].includes(unit.stage)||!unit.question||unit.response?.status==='blocked')throw Error('Open an available comprehension or practice question first.');
 if(!Number.isInteger(index)||!unit.question.options[index])throw Error('Choose one answer.');if(unit.answer)return unit;
 const correct=index===unit.question.answerIndex;const eventId=`${id}:${unit.stage}:${unit.practiceRound}:${unit.question.id}`;
 unit.answer={index,correct,id:eventId};unit.checkPassed=unit.checkPassed||(unit.stage==='check'&&correct);unit.practicePassed=unit.practicePassed||(unit.stage==='practice'&&correct);unit.difficulty=Math.max(1,Math.min(5,unit.difficulty+(correct?1:-1)));
 unit.pending={id:eventId,conceptId:unit.conceptId,kind:unit.stage==='check'?'check':'practice',correct:correct?1:0,total:1,verified:true,sessionId:id,language:unit.locale,classId:unit.classId,...curriculumFields(ctx)};
 save(ctx,unit);unit=flushLearningOutcome(ctx,id);
 if(!correct){const response=await getTeachingInterface(ctx).requestExplanation({input:'Re-explain this concept after an incorrect check.',conceptId:unit.conceptId,sessionId:id,language:unit.locale,difficulty:unit.difficulty});unit.response=response;save(ctx,unit);}
 return unit;
}
export async function nextLearningQuestion(ctx:RequestContext,id:string,practice=true){const unit=flushLearningOutcome(ctx,id);if(practice&&!unit.checkPassed)throw Error('Complete the comprehension check before practice. You can revisit the explanation at any time.');unit.stage=practice?'practice':'check';unit.practiceRound++;delete unit.answer;delete unit.question;save(ctx,unit);return requestUnitTeaching(ctx,id,'practice');}
export async function createLearningProject(ctx:RequestContext,id:string){
 const unit=flushLearningOutcome(ctx,id);if(!unit.checkPassed||!unit.practicePassed)throw Error('Complete a comprehension check and practice step before starting the guided project. Blank projects remain available in Build.');
 const artifacts=snapshot(ctx).artifacts;const existing=artifacts.find(a=>a.id===unit.artifactId)||artifacts.find(a=>a.learningSessionId===id&&a.conceptId===unit.conceptId);
 if(existing){if(unit.artifactId!==existing.id||!['build','completed'].includes(unit.stage)){unit.artifactId=existing.id;if(unit.stage!=='completed')unit.stage='build';save(ctx,unit);}emitInteractionEvent(ctx,{id:`build-start:${id}`,app:'BUILD',action:'start',sessionId:id,conceptId:unit.conceptId,language:unit.locale});return existing;}
 const concept=await getContentRepository(ctx).getConcept(unit.conceptId);if(!concept)throw Error('Project context unavailable.');
 const artifact=saveArtifact(ctx,{title:concept.project?.title||`Apply: ${concept.title}`,body:concept.project?.brief||'Define an outcome, create an artifact, and describe the evidence. Guidance is not connected yet.',conceptId:unit.conceptId,learningSessionId:id});
 unit.artifactId=artifact.id;unit.stage='build';save(ctx,unit);emitInteractionEvent(ctx,{id:`build-start:${id}`,app:'BUILD',action:'start',sessionId:id,conceptId:unit.conceptId,language:unit.locale});return artifact;
}
export function recordProjectSave(ctx:RequestContext,artifact:Artifact){
 if(artifact.status==='completed'&&artifact.conceptId&&(!artifact.body.trim()||!artifact.milestones.every(Boolean)))throw Error('Complete the project milestones and add your work before recording application evidence.');
 emitInteractionEvent(ctx,{id:artifact.status==='completed'?`artifact:${artifact.id}:completed-save`:undefined,app:'BUILD',action:'save',sessionId:artifact.learningSessionId||artifact.id,conceptId:artifact.conceptId,language:ctx.locale,...curriculumFields(ctx)});
 if(artifact.status!=='completed'||!artifact.conceptId)return;
 const linkedUnit=artifact.learningSessionId?getLearningUnit(ctx,artifact.learningSessionId):undefined;
 const outcome:LearningOutcome={id:`artifact:${artifact.id}:completed`,conceptId:artifact.conceptId,kind:'application',verified:false,sessionId:artifact.learningSessionId||artifact.id,language:ctx.locale,classId:linkedUnit?.classId,...curriculumFields(ctx)};
 recordLearningOutcome(ctx,outcome);
 if(artifact.learningSessionId){const unit=getLearningUnit(ctx,artifact.learningSessionId);unit.stage='completed';save(ctx,unit);}
}
export function prepareLearningConversation(ctx:RequestContext,id:string){const unit=getLearningUnit(ctx,id);if(unit.conversationId&&snapshot(ctx).conversations.some(c=>c.id===unit.conversationId))return unit.conversationId;const c=newConversation(ctx,unit.title);unit.conversationId=c.id;save(ctx,unit);return c.id;}
/** L1→L4 seam; only authored adapter/status blocks are appended. No local answer synthesis. */
export async function sendTeachingTurn(ctx:RequestContext,conversationId:string,text:string,inputType:'text'|'voice'='text'){
 const conversation=snapshot(ctx).conversations.find(c=>c.id===conversationId);if(!conversation)throw Error('Conversation not found.');
 updateConversation(ctx,conversationId,{draft:text});const unit=getLearningForConversation(ctx,conversationId);const intent=conversation.ask?.intent||'understand';
 const api=getTeachingInterface(ctx);const started=Date.now();const packet={input:text,intent,sessionId:unit?.id||conversationId,conceptId:unit?.conceptId,language:unit?.locale||ctx.locale,context:{material:conversation.ask?.material||'',source:conversation.ask?.source||'topic'}};
 emitInteractionEvent(ctx,{app:'ASK',action:'request',sessionId:packet.sessionId,conceptId:packet.conceptId,language:packet.language,inputType,intent,...curriculumFields(ctx)});
 const response=await (intent==='check'?api.requestFeedback(packet):intent==='build'?api.requestProjectGuidance(packet):api.requestExplanation(packet));guard(ctx);
 appendTeachingTurn(ctx,conversationId,text,response.text,response.status==='not_connected'?'en':packet.language,response.status);
 emitInteractionEvent(ctx,{app:'ASK',action:'response',sessionId:packet.sessionId,conceptId:packet.conceptId,language:packet.language,latency:Date.now()-started,responseStatus:response.status,promptVersion:response.status==='ready'?response.promptVersion:undefined,inputType,intent,...curriculumFields(ctx)});return response;
}
export function learningPriority(ctx:RequestContext){const units=getLearningWorkspace(ctx).units;const unit=[...units].filter(u=>u.stage!=='completed').sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))[0];const states=getStudentState(ctx).concepts;const due=states.find(c=>c.dueAt&&new Date(c.dueAt)<=workspaceNow());return{unit,due};}
