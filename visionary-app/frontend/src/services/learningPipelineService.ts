import type { RequestContext, Locale, Artifact } from '../domain/workspace.ts';
import { workspaceIdentity, workspaceNow, snapshot, saveArtifact, newConversation, updateConversation, appendTeachingTurn } from './workspaceService.ts';
import { getContentRepository, getSavedConceptOrigin, SAMPLE_SELECTION, type ContentSelection, type ContentQuestion, type ContentProvenance, type ContentConcept } from './contentRepository.ts';
import { getTeachingInterface, type TeachingResponse, type TeachingMode } from './teachingInterface.ts';
import { emitInteractionEvent, recordLearningOutcome, getStudentState, getStudentClassLearningContext } from './mentorStateService.ts';

export interface LearningUnit {
 id:string; conceptId:string; title:string; locale:Locale; classId?:string; stage:'explain'|'check'|'practice'|'build'|'completed';
 sourceContext?:{selection:ContentSelection;provenance:ContentProvenance};
 representation?:{mode:'model'|'text';size:number;rotation:number;point?:number};
 attempts?:{id:string;kind:'check'|'practice';question:ContentQuestion;selectedIndex:number;correct:boolean;at:string;locale?:Locale}[];
 checkPassed:boolean; practicePassed?:boolean; difficulty:number; practiceRound:number; question?:ContentQuestion;
 answer?:{index:number;correct:boolean;id:string}; response?:TeachingResponse; explanation?:string;
 answerDraft?:{questionVersion:string;round:number;index:number};
 durableSessionId?:string; durableRevision?:number; durableFailedChecks?:number; durableReviewSuggested?:boolean; durableCancelled?:boolean;
 durableCheckId?:string; durablePreviousStrategy?:string; durableStrategyIndex?:number;
 durableStart?:{commandId:string}; durablePresent?:{commandId:string;checkId:string;strategy:string}; durableAssess?:{commandId:string;checkId:string;selection:number};
 conversationId?:string; artifactId?:string; updatedAt:string; pending?:LearningOutcome;
}
interface LearningOutcome {id:string;conceptId:string;kind:'check'|'practice'|'application';correct?:number;total?:number;verified:boolean;sessionId:string;language:Locale;board?:string;classLevel?:string;classId?:string}
interface LearningSpace {selection?:ContentSelection;syllabusId?:string;units:LearningUnit[]}
interface Store {version:1;spaces:Record<string,LearningSpace>}
const KEY='visionary_learning_pipeline_v1';
const now=()=>workspaceNow().toISOString();
/** Server-held receipt for one durable session revision. The authored answer key stays server-side. */
export interface DurableLearningReceipt {
 version:1; uid:string; sessionId:string; workspaceId:string; status:'active'|'cancelled';
 phase:'explain'|'check'|'check_passed'|'review_suggested';
 revision:number; failedChecks:number; maxFailedChecks:number; previousStrategy:string|null;
 checkPassed:boolean; reviewSuggested:boolean; check:{checkId:string;strategy:string;optionCount:number}|null;
 createdAt:string; updatedAt:string; cancelledAt?:string; receipt?:{id:string;checkId:string;passed:boolean};
}
export interface LearningSessionAdapter {
 start(command:{version:1;commandId:string;workspaceId:string;conceptId:string;sourceVersion:string;criteriaVersion:string;provider:string;sourceId:string;maxFailedChecks?:number}):Promise<DurableLearningReceipt>;
 get(sessionId:string):Promise<DurableLearningReceipt>;
 present(sessionId:string,command:unknown):Promise<DurableLearningReceipt>;
 assess(sessionId:string,command:unknown):Promise<DurableLearningReceipt>;
 cancel(sessionId:string,command:unknown):Promise<DurableLearningReceipt>;
}
const durableStrategies=['worked_example','analogy','practice','visual','socratic'] as const;
let durableSessions:LearningSessionAdapter|null=null;
/** Unconfigured or unverified adapters keep every check local and unverified. */
export function configureLearningSessionAdapter(adapter:LearningSessionAdapter|null){durableSessions=adapter;}
export function learningSessionAdapterConfigured(){return durableSessions!==null;}
function guard(ctx:RequestContext){const identity=workspaceIdentity(ctx);if(ctx.role==='professional'&&identity.person.ageBand!=='adult')throw Error('Professional journeys are available only to adult profiles. Use a general learning workspace.');if(ctx.signal?.aborted)throw new DOMException('Cancelled','AbortError');}
function read():Store{const raw=localStorage.getItem(KEY);if(!raw)return{version:1,spaces:{}};try{const value=JSON.parse(raw);if(value.version!==1||!value.spaces||typeof value.spaces!=='object'||Array.isArray(value.spaces))throw Error();return value;}catch{throw Error('Your saved learning could not be read. No records were removed.');}}
function validSourceContext(value:LearningUnit['sourceContext']){
 if(value===undefined)return true; // Older activities predate source pinning.
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 const {selection,provenance}=value;
 return Boolean(selection&&typeof selection==='object'&&!Array.isArray(selection)&&['board','classLevel','subject'].every(key=>typeof selection[key as keyof ContentSelection]==='string'&&selection[key as keyof ContentSelection].trim())&&provenance&&typeof provenance==='object'&&!Array.isArray(provenance)&&['provider','sourceId','version'].every(key=>typeof provenance[key as keyof ContentProvenance]==='string'&&provenance[key as keyof ContentProvenance].trim()));
}
/** Durable linkage is only valid with its own session identity; partial state fails closed. */
function validDurableState(unit:LearningUnit){
 const strings=['durableSessionId','durableCheckId','durablePreviousStrategy'] as const;
 for(const key of strings){const value=unit[key];if(value!==undefined&&(typeof value!=='string'||!value))return false;}
 const numbers=['durableRevision','durableFailedChecks','durableStrategyIndex'] as const;
 for(const key of numbers){const value=unit[key];if(value!==undefined&&(!Number.isSafeInteger(value)||value<0))return false;}
 if(unit.durableReviewSuggested!==undefined&&typeof unit.durableReviewSuggested!=='boolean')return false;
 if(unit.durableCancelled!==undefined&&typeof unit.durableCancelled!=='boolean')return false;
 if(unit.durableSessionId===undefined&&(unit.durableRevision!==undefined||unit.durableCheckId!==undefined||unit.durablePreviousStrategy!==undefined||unit.durableReviewSuggested!==undefined||unit.durableCancelled!==undefined||unit.durablePresent!==undefined||unit.durableAssess!==undefined))return false;
 if(unit.durableStart!==undefined&&(!unit.durableStart||typeof unit.durableStart.commandId!=='string'||!unit.durableStart.commandId))return false;
 if(unit.durablePresent!==undefined&&(!unit.durablePresent||typeof unit.durablePresent.commandId!=='string'||!unit.durablePresent.commandId||typeof unit.durablePresent.checkId!=='string'||!unit.durablePresent.checkId||!durableStrategies.includes(unit.durablePresent.strategy as typeof durableStrategies[number])))return false;
 if(unit.durableAssess!==undefined&&(!unit.durableAssess||typeof unit.durableAssess.commandId!=='string'||!unit.durableAssess.commandId||typeof unit.durableAssess.checkId!=='string'||!unit.durableAssess.checkId||!Number.isSafeInteger(unit.durableAssess.selection)||unit.durableAssess.selection<0))return false;
 return true;
}
function own(db:Store,ctx:RequestContext){guard(ctx);const existing=db.spaces[ctx.workspaceId];if(existing!==undefined&&(!existing||typeof existing!=='object'||Array.isArray(existing)||!Array.isArray(existing.units)||existing.units.some(unit=>!unit||typeof unit.id!=='string'||!unit.id||typeof unit.conceptId!=='string'||typeof unit.title!=='string'||!validSourceContext(unit.sourceContext)||!validDurableState(unit))||new Set(existing.units.map(unit=>unit.id)).size!==existing.units.length||(existing.selection!==undefined&&(!existing.selection||['board','classLevel','subject'].some(key=>typeof existing.selection![key as keyof ContentSelection]!=='string')))||(existing.syllabusId!==undefined&&typeof existing.syllabusId!=='string')))throw Error('Saved learning activities are incomplete or ambiguous. Original records were kept; retry after restoring a valid saved copy.');return existing??(db.spaces[ctx.workspaceId]={units:[]});}
function write(db:Store,ctx:RequestContext){guard(ctx);try{localStorage.setItem(KEY,JSON.stringify(db));}catch{throw Error('Learning changes could not be saved. Keep this page open and retry.');}if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('visionary:learning-change'));}
function save(ctx:RequestContext,unit:LearningUnit){const db=read();const data=own(db,ctx);const index=data.units.findIndex(u=>u.id===unit.id);unit.updatedAt=now();if(index<0)data.units.push(unit);else data.units[index]=unit;write(db,ctx);return structuredClone(unit);}
export function getLearningWorkspace(ctx:RequestContext){return structuredClone(own(read(),ctx));}
export function getLearningUnit(ctx:RequestContext,id:string){const unit=getLearningWorkspace(ctx).units.find(u=>u.id===id);if(!unit)throw Error('This learning activity is unavailable in this workspace.');return unit;}
/** An awaited response must not replace work saved by another tab or action. */
function assertCurrentLearningUnit(ctx:RequestContext,expected:LearningUnit){
 if(JSON.stringify(getLearningUnit(ctx,expected.id))!==JSON.stringify(expected)){
  const error=new Error('This learning activity changed while the request was loading. Your latest saved work was kept. Reload the activity before retrying.');
  error.name='LearningUnitConflictError';throw error;
 }
}
export function learningAnswerSelection(unit:LearningUnit){
 if(unit.answer)return String(unit.answer.index);
 const draft=unit.answerDraft;
 return draft&&unit.question&&draft.round===unit.practiceRound&&draft.questionVersion===JSON.stringify(unit.question)&&Number.isInteger(draft.index)&&draft.index>=0&&draft.index<unit.question.options.length?String(draft.index):'';
}
/** An unsubmitted choice is private draft state, never scored evidence. */
export function saveLearningAnswerDraft(ctx:RequestContext,id:string,index:number,questionVersion:string,round:number){
 const unit=getLearningUnit(ctx,id);
 if(!['check','practice'].includes(unit.stage)||!unit.question||unit.answer||unit.response?.status==='blocked'||JSON.stringify(unit.question)!==questionVersion||unit.practiceRound!==round)throw Error('This question changed or was already answered. Your current selection remains here; reload the saved activity before continuing.');
 if(!Number.isInteger(index)||index<0||index>=unit.question.options.length)throw Error('Choose an available answer.');
 if(unit.answerDraft?.questionVersion===questionVersion&&unit.answerDraft.round===round&&unit.answerDraft.index===index)return unit;
 unit.answerDraft={questionVersion,round,index};return save(ctx,unit);
}
export function getLearningReviewQueue(ctx:RequestContext){
 const states=new Map(getStudentState(ctx).concepts.map(item=>[item.conceptId,item]));const today=workspaceNow().getTime();
 const unique=new Map<string,LearningUnit>();
 for(const unit of getLearningWorkspace(ctx).units.filter(item=>item.checkPassed).reverse().sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))){const key=`${unit.classId||'personal'}:${unit.conceptId}`;if(!unique.has(key))unique.set(key,unit);}
 return [...unique.values()].map(unit=>{const evidence=states.get(unit.conceptId);return{unit,dueAt:evidence?.dueAt,due:Boolean(evidence?.dueAt&&new Date(evidence.dueAt).getTime()<=today),recordedAnswers:evidence?.total||0};}).sort((a,b)=>Number(b.due)-Number(a.due)||(a.dueAt||'9999').localeCompare(b.dueAt||'9999'));
}
/** A representation changes the view, never assessment evidence or mastery. */
export function updateLearningRepresentation(ctx:RequestContext,id:string,patch:Partial<NonNullable<LearningUnit['representation']>>){
 const unit=getLearningUnit(ctx,id);const next={mode:'model' as const,size:3,rotation:25,...unit.representation,...patch};
 if(!['model','text'].includes(next.mode)||!Number.isInteger(next.size)||next.size<1||next.size>8||!Number.isInteger(next.rotation)||next.rotation<0||next.rotation>360)throw Error('Choose a valid model view. Your saved position is unchanged.');
  if(next.point!==undefined&&(!Number.isInteger(next.point)||next.point<0||next.point>16))throw Error('Choose a valid number line point. Your saved position is unchanged.');
 unit.representation=next;return save(ctx,unit);
}
/** Revisiting teaching preserves recorded answers and the saved model controls. */
export function reviewLearningExplanation(ctx:RequestContext,id:string){
 const unit=flushLearningOutcome(ctx,id);
 if(!['check','practice'].includes(unit.stage))throw Error('Open a check or practice step before reviewing this explanation.');
 unit.stage='explain';return save(ctx,unit);
}
export function getLearningForConversation(ctx:RequestContext,id:string){return getLearningWorkspace(ctx).units.find(u=>u.conversationId===id);}
function curriculumFields(ctx:RequestContext,unit?:LearningUnit){const selected=unit?.sourceContext?.selection||getLearningWorkspace(ctx).selection;return selected?{board:selected.board,classLevel:selected.classLevel}:{};}
export async function selectLearningSyllabus(ctx:RequestContext,selection:ContentSelection){const syllabus=await getContentRepository(ctx).getSyllabus(selection.board,selection.classLevel,selection.subject);const db=read();Object.assign(own(db,ctx),{selection,syllabusId:syllabus.id});write(db,ctx);emitInteractionEvent(ctx,{app:'LEARN',action:'view',sessionId:syllabus.id,language:ctx.locale,board:selection.board,classLevel:selection.classLevel});return syllabus;}
/** Explicit bridge from older cube entry points into the single saved learning activity. */
export async function openCubeLearningSample(ctx:RequestContext){
 if(ctx.role!=='student')throw Error('Open a student workspace to use this authored cube activity.');
 await selectLearningSyllabus(ctx,SAMPLE_SELECTION);
 return startLearningUnit(ctx,'sample:cube:concept');
}
export async function startLearningUnit(ctx:RequestContext,conceptId:string,classId?:string,authorizeStart?:()=>void){
 const classContext=classId?getStudentClassLearningContext(ctx,classId):null;
 const selection=getLearningWorkspace(ctx).selection;
 if(classContext&&(!classContext.subject||selection?.subject!==classContext.subject))throw Error('Select this connected class subject before linking learning evidence.');
 const repository=getContentRepository(ctx);const progressId=await repository.resolveProgressId(conceptId);
 const concept=await repository.getConcept(progressId);if(!concept)throw Error('This concept is unavailable. Return to your learning outline.');
 if(classContext&&selection){const outline=await repository.getSyllabus(selection.board,selection.classLevel,selection.subject);if(!outline.chapters.some(chapter=>chapter.topicIds.includes(concept.topicId)))throw Error('This concept is not in the connected class subject. Open its own learning outline instead.');}
 guard(ctx);authorizeStart?.();
 const existing=getLearningWorkspace(ctx).units.find(u=>{const prior=u.sourceContext?.provenance,current=concept.provenance;return u.conceptId===concept.id&&u.classId===classId&&u.stage!=='completed'&&(!prior||Boolean(current&&prior.provider===current.provider&&prior.sourceId===current.sourceId&&prior.version===current.version));});
 if(existing){if(existing.title!==concept.title)save(ctx,{...existing,title:concept.title});emitInteractionEvent(ctx,{app:'LEARN',action:'resume',sessionId:existing.id,conceptId:progressId,language:existing.locale,...curriculumFields(ctx,existing)});return getLearningUnit(ctx,existing.id);}
 const unit:LearningUnit={id:crypto.randomUUID(),conceptId:concept.id,title:concept.title,locale:ctx.locale,classId,sourceContext:getSavedConceptOrigin(ctx,concept.id),stage:'explain',checkPassed:false,difficulty:1,practiceRound:0,updatedAt:now()};
 save(ctx,unit);emitInteractionEvent(ctx,{app:'LEARN',action:'start',sessionId:unit.id,conceptId,language:unit.locale,...curriculumFields(ctx,unit)});
 // A connected account opens the durable session right away; an offline start keeps the pending identity for retry.
 if(durableSessions&&unit.sourceContext?.provenance){try{return await ensureDurableSession(ctx,unit);}catch{return unit;}}
 return unit;
}
export function assertLearningSource(unit:LearningUnit,concept:ContentConcept){
 const prior=unit.sourceContext?.provenance,current=concept.provenance;
 if(prior&&(!current||prior.provider!==current.provider||prior.sourceId!==current.sourceId||prior.version!==current.version)){const error=new Error('The source version for this saved activity changed. Its original work is retained; open a reviewed new activity instead of replacing its source.');error.name='LearningSourceConflictError';throw error;}
}
async function currentLearningSource(ctx:RequestContext,unit:LearningUnit){
 const concept=await getContentRepository({...ctx,locale:unit.locale}).getConcept(unit.conceptId);
 if(!concept)throw Error('Content unavailable. Your position remains saved.');
 assertLearningSource(unit,concept);assertCurrentLearningUnit(ctx,unit);return concept;
}
function durableScope(ctx:RequestContext,unit:LearningUnit){const provenance=unit.sourceContext?.provenance;return provenance?{workspaceId:ctx.workspaceId,sourceVersion:provenance.version,criteriaVersion:provenance.version}:null;}
function nextDurableStrategy(unit:LearningUnit){const index=unit.durableStrategyIndex||0;let strategy=durableStrategies[index%durableStrategies.length];if((unit.durableFailedChecks||0)>0&&strategy===unit.durablePreviousStrategy)strategy=durableStrategies[(index+1)%durableStrategies.length];unit.durableStrategyIndex=index+1;return strategy;}
/** The exact command identity is saved before the network call, so a lost response replays it. */
async function ensureDurableSession(ctx:RequestContext,unit:LearningUnit){
 const adapter=durableSessions,scope=durableScope(ctx,unit),provenance=unit.sourceContext?.provenance;
 if(!adapter||!scope||!provenance||unit.durableSessionId)return unit;
 const pending=unit.durableStart||{commandId:crypto.randomUUID()};unit.durableStart=pending;save(ctx,unit);
 const receipt=await adapter.start({version:1,commandId:pending.commandId,workspaceId:scope.workspaceId,conceptId:unit.conceptId,sourceVersion:scope.sourceVersion,criteriaVersion:scope.criteriaVersion,provider:provenance.provider,sourceId:provenance.sourceId,maxFailedChecks:3});
 guard(ctx);assertCurrentLearningUnit(ctx,unit);
 delete unit.durableStart;unit.durableSessionId=receipt.sessionId;unit.durableRevision=receipt.revision;unit.durableFailedChecks=receipt.failedChecks;unit.durableReviewSuggested=receipt.reviewSuggested;unit.durableCancelled=receipt.status==='cancelled';
 return save(ctx,unit);
}
/** Presentation stays pinned to the saved source revision and reuses one identity on retry. */
async function presentDurableCheck(ctx:RequestContext,unit:LearningUnit){
 const adapter=durableSessions,scope=durableScope(ctx,unit),question=unit.question;
 if(!adapter||!unit.durableSessionId||!scope||!question)throw Error('The connected check is not ready. Reopen the check and retry when connected.');
 const prior=unit.durablePresent&&unit.durablePresent.checkId===question.id?unit.durablePresent:null;
 const commandId=prior?prior.commandId:crypto.randomUUID(),strategy=prior?prior.strategy:nextDurableStrategy(unit);
 unit.durablePresent={commandId,checkId:question.id,strategy};save(ctx,unit);
 const receipt=await adapter.present(unit.durableSessionId,{version:1,commandId,expectedRevision:unit.durableRevision||0,workspaceId:scope.workspaceId,sourceVersion:scope.sourceVersion,criteriaVersion:scope.criteriaVersion,strategy,validation:'passed',checkId:question.id,prompt:question.prompt,options:[...question.options],answerIndex:question.answerIndex});
 guard(ctx);assertCurrentLearningUnit(ctx,unit);
 if(receipt.check?.checkId!==question.id)throw Error('The connected check did not confirm this question. Your saved work is kept; reopen the check before retrying.');
 delete unit.durablePresent;unit.durableRevision=receipt.revision;unit.durableFailedChecks=receipt.failedChecks;unit.durableReviewSuggested=receipt.reviewSuggested;unit.durableCheckId=receipt.check.checkId;unit.durablePreviousStrategy=strategy;
 return save(ctx,unit);
}
/** Only a server assessment counts; a graded answer keeps its exact identity for retry. */
async function assessDurableAnswer(ctx:RequestContext,unit:LearningUnit,index:number){
 const adapter=durableSessions,scope=durableScope(ctx,unit),checkId=unit.durableCheckId;
 if(!adapter||!unit.durableSessionId||!scope||!checkId)throw Error('The connected check was not confirmed. Reopen the check and retry when connected.');
 const prior=unit.durableAssess&&unit.durableAssess.checkId===checkId&&unit.durableAssess.selection===index?unit.durableAssess:null;
 const commandId=prior?prior.commandId:crypto.randomUUID();
 unit.durableAssess={commandId,checkId,selection:index};save(ctx,unit);
 const receipt=await adapter.assess(unit.durableSessionId,{version:1,commandId,expectedRevision:unit.durableRevision||0,workspaceId:scope.workspaceId,sourceVersion:scope.sourceVersion,criteriaVersion:scope.criteriaVersion,checkId,selection:index});
 guard(ctx);assertCurrentLearningUnit(ctx,unit);
 if(!receipt.receipt||receipt.receipt.checkId!==checkId)throw Error('The connected assessment did not confirm this answer. Your saved work is kept; retry when connected.');
 delete unit.durableAssess;unit.durableRevision=receipt.revision;unit.durableFailedChecks=receipt.failedChecks;unit.durableReviewSuggested=receipt.reviewSuggested;delete unit.durableCheckId;
 return {unit:save(ctx,unit),passed:receipt.receipt.passed,receiptId:receipt.receipt.id};
}
export async function updateLearningLanguage(ctx:RequestContext,id:string,locale:Locale){
 const unit=getLearningUnit(ctx,id);if(unit.locale===locale)return unit;
 const repository=getContentRepository({...ctx,locale});let concept=await repository.getConcept(unit.conceptId);
 // A connected source can provide a language variant after the unit was first opened.
 if(concept?.languageUnavailable){const selected=unit.sourceContext?.selection||getLearningWorkspace(ctx).selection;if(selected){await repository.getSyllabus(selected.board,selected.classLevel,selected.subject);concept=await repository.getConcept(unit.conceptId);}}
 guard(ctx);if(!concept)throw Error('This teaching language is not available for the saved concept. Your position remains unchanged.');
 assertLearningSource(unit,concept);
 assertCurrentLearningUnit(ctx,unit);
 unit.locale=locale;
 // A connected response belongs to its original language. Do not relabel it as a translation.
 if(concept.explanation)unit.explanation=concept.explanation;else delete unit.explanation;
 if(unit.question){const translated=[concept.check,...(concept.practice||[])].find(q=>q?.id===unit.question?.id);if(translated)unit.question=translated;else delete unit.question;}
 // A translated check keeps its durable link only while the pinned question identity survives.
 if(unit.durableCheckId&&(!unit.question||unit.question.id!==unit.durableCheckId)){
  delete unit.durableSessionId;delete unit.durableRevision;delete unit.durableFailedChecks;delete unit.durableReviewSuggested;delete unit.durableCancelled;
  delete unit.durableCheckId;delete unit.durablePreviousStrategy;delete unit.durableStrategyIndex;delete unit.durablePresent;delete unit.durableAssess;delete unit.durableStart;
 }
 delete unit.response;
 return save(ctx,unit);
}
export async function requestUnitTeaching(ctx:RequestContext,id:string,mode:TeachingMode){
 const unit=getLearningUnit(ctx,id);const concept=await getContentRepository({...ctx,locale:unit.locale}).getConcept(unit.conceptId);if(!concept)throw Error('Content unavailable. Your position remains saved.');assertLearningSource(unit,concept);assertCurrentLearningUnit(ctx,unit);
 const started=Date.now();const api=getTeachingInterface(ctx);
 const packet={input:concept.title,conceptId:unit.conceptId,sessionId:id,language:unit.locale,difficulty:unit.difficulty,audience:concept.audience,context:{stage:unit.stage,source:concept.status}};
 const app=mode==='practice'?'PRACTICE':mode==='project'?'BUILD':'LEARN';
 const pedagogy=mode==='practice'?'practice':mode==='project'?'application':mode==='feedback'?'reflection':'explanation';
 emitInteractionEvent(ctx,{app,action:'request',sessionId:id,conceptId:unit.conceptId,language:unit.locale,pedagogy,...curriculumFields(ctx,unit)});
 const response=await (mode==='practice'?api.requestPracticeQuestion(packet):mode==='feedback'?api.requestFeedback(packet):mode==='project'?api.requestProjectGuidance(packet):api.requestExplanation(packet));
 guard(ctx);await currentLearningSource(ctx,unit);unit.response=response;
 if(mode==='explanation'&&response.status!=='blocked')unit.explanation=response.status==='ready'?response.text:concept.explanation;
 if(mode==='practice'&&response.status!=='blocked')unit.question=response.question||(unit.stage==='check'?concept.check:concept.practice?.[Math.min(unit.difficulty-1,Math.max(0,(concept.practice?.length||1)-1))]);
 save(ctx,unit);emitInteractionEvent(ctx,{app,action:'response',sessionId:id,conceptId:unit.conceptId,language:unit.locale,latency:Date.now()-started,responseStatus:response.status,promptVersion:response.status==='ready'?response.promptVersion:undefined,pedagogy,...curriculumFields(ctx,unit)});return unit;
}
export async function beginComprehension(ctx:RequestContext,id:string){
 let unit=getLearningUnit(ctx,id);if(unit.response?.status==='blocked')throw Error('Teaching is paused for safety.');if(!unit.explanation)throw Error('An explanation is not available yet. Save a question while the teaching service is disconnected.');
 await currentLearningSource(ctx,unit);
 if(unit.durableReviewSuggested&&!unit.durableCancelled)throw Error('This topic reached its bounded check limit after three failed checks. Review the explanation and your saved work, or ask a trusted adult or teacher for help. Another check is not started automatically.');
 if(unit.answer)unit.practiceRound++;unit.stage='check';delete unit.answer;delete unit.answerDraft;delete unit.question;save(ctx,unit);
 const taught=await requestUnitTeaching(ctx,id,'practice');
 if(!durableSessions)return taught;
 if(taught.durableCancelled){
  // An explicit new check starts a fresh connected session; the cancelled session and its recorded work stay untouched.
  delete taught.durableSessionId;delete taught.durableRevision;delete taught.durableFailedChecks;delete taught.durableReviewSuggested;delete taught.durableCancelled;
  delete taught.durableCheckId;delete taught.durablePreviousStrategy;delete taught.durableStrategyIndex;delete taught.durablePresent;delete taught.durableAssess;delete taught.durableStart;
  save(ctx,taught);
 }
 try{
  const started=await ensureDurableSession(ctx,taught);
  if(started.durableCheckId&&started.question&&started.question.id===started.durableCheckId)return started;
  return await presentDurableCheck(ctx,started);
 }catch(failure){const current=getLearningUnit(ctx,taught.id);if(current.stage==='check'&&!current.durableCheckId){current.stage='explain';save(ctx,current);}throw failure;}
}
/** Reconnect/read-back for a saved activity; the server stays the authority for phase and counts. */
export async function resumeLearningSession(ctx:RequestContext,id:string){
 const adapter=durableSessions;if(!adapter)throw Error('Connected learning progress is unavailable in this session.');
 const unit=getLearningUnit(ctx,id);if(!unit.durableSessionId)throw Error('This learning activity has no connected session yet.');
 const receipt=await adapter.get(unit.durableSessionId);
 guard(ctx);assertCurrentLearningUnit(ctx,unit);
 unit.durableRevision=receipt.revision;unit.durableFailedChecks=receipt.failedChecks;unit.durableReviewSuggested=receipt.reviewSuggested;unit.durableCancelled=receipt.status==='cancelled';
 if(receipt.previousStrategy)unit.durablePreviousStrategy=receipt.previousStrategy;else delete unit.durablePreviousStrategy;
 if(receipt.check?.checkId)unit.durableCheckId=receipt.check.checkId;else delete unit.durableCheckId;
 unit.checkPassed=unit.checkPassed||receipt.checkPassed;
 return save(ctx,unit);
}
/** Explicit learner cancellation; recorded evidence and attempts are never removed. */
export async function cancelLearningSession(ctx:RequestContext,id:string){
 const adapter=durableSessions;const unit=getLearningUnit(ctx,id);
 if(!adapter||!unit.durableSessionId)throw Error('This learning activity has no connected session to cancel.');
 const scope=durableScope(ctx,unit);if(!scope)throw Error('This learning activity has no pinned source revision to cancel.');
 const receipt=await adapter.cancel(unit.durableSessionId,{version:1,commandId:crypto.randomUUID(),expectedRevision:unit.durableRevision||0,workspaceId:scope.workspaceId,sourceVersion:scope.sourceVersion,criteriaVersion:scope.criteriaVersion});
 guard(ctx);assertCurrentLearningUnit(ctx,unit);
 unit.durableRevision=receipt.revision;unit.durableCancelled=receipt.status==='cancelled';unit.durableReviewSuggested=receipt.reviewSuggested;
 // A cancelled session voids its open check; only an explicit new check may open another.
 delete unit.durableCheckId;delete unit.durablePresent;delete unit.durableAssess;
 return save(ctx,unit);
}
/** An outbox retains a scored local answer if the separate cognition adapter cannot write. */
export function flushLearningOutcome(ctx:RequestContext,id:string){const unit=getLearningUnit(ctx,id);if(unit.pending){recordLearningOutcome(ctx,unit.pending);delete unit.pending;save(ctx,unit);}return unit;}
export async function answerLearningQuestion(ctx:RequestContext,id:string,index:number,expectedQuestion?:{version:string;round:number}){
 let unit=flushLearningOutcome(ctx,id);if(!['check','practice'].includes(unit.stage)||!unit.question||unit.response?.status==='blocked')throw Error('Open an available comprehension or practice question first.');
 if(expectedQuestion&&(expectedQuestion.version!==JSON.stringify(unit.question)||expectedQuestion.round!==unit.practiceRound))throw Error('This question changed. Your selection was not graded. Reload the saved activity before continuing.');
 if(!Number.isInteger(index)||!unit.question.options[index])throw Error('Choose one answer.');if(unit.answer)return unit;
 const question=unit.question;
 await currentLearningSource(ctx,unit);
 if(durableSessions&&unit.durableCancelled&&unit.stage==='check')throw Error('This connected check was cancelled. Begin a new check or open another saved activity.');
 let correct:boolean,eventId:string;
 if(durableSessions&&unit.durableSessionId&&!unit.durableCancelled&&unit.stage==='check'){
  if(!unit.durableCheckId){if(!unit.durablePresent)throw Error('The connected check was not confirmed. Your selection is kept; reopen the check and retry when connected.');unit=await presentDurableCheck(ctx,unit);}
  const graded=await assessDurableAnswer(ctx,unit,index);unit=graded.unit;correct=graded.passed;eventId=graded.receiptId;
 }else{correct=index===question.answerIndex;eventId=`${id}:${unit.stage}:${unit.practiceRound}:${question.id}`;}
 delete unit.answerDraft;unit.answer={index,correct,id:eventId};unit.checkPassed=unit.checkPassed||(unit.stage==='check'&&correct);unit.practicePassed=unit.practicePassed||(unit.stage==='practice'&&correct);unit.difficulty=Math.max(1,Math.min(5,unit.difficulty+(correct?1:-1)));
 if(!unit.attempts?.some(item=>item.id===eventId))unit.attempts=[...(unit.attempts||[]),{id:eventId,kind:unit.stage==='check'?'check':'practice',question,selectedIndex:index,correct,at:now(),locale:unit.locale}];
 unit.pending={id:eventId,conceptId:unit.conceptId,kind:unit.stage==='check'?'check':'practice',correct:correct?1:0,total:1,verified:true,sessionId:id,language:unit.locale,classId:unit.classId,...curriculumFields(ctx,unit)};
 save(ctx,unit);unit=flushLearningOutcome(ctx,id);
 if(!correct){const response=await getTeachingInterface(ctx).requestExplanation({input:'Re-explain this concept after an incorrect check.',conceptId:unit.conceptId,sessionId:id,language:unit.locale,difficulty:unit.difficulty});await currentLearningSource(ctx,unit);unit.response=response;save(ctx,unit);}
 return unit;
}
export async function nextLearningQuestion(ctx:RequestContext,id:string,practice=true){const unit=flushLearningOutcome(ctx,id);if(practice&&!unit.checkPassed)throw Error('Complete the comprehension check before practice. You can revisit the explanation at any time.');await currentLearningSource(ctx,unit);unit.stage=practice?'practice':'check';unit.practiceRound++;delete unit.answer;delete unit.answerDraft;delete unit.question;save(ctx,unit);return requestUnitTeaching(ctx,id,'practice');}
export async function createLearningProject(ctx:RequestContext,id:string){
 const unit=flushLearningOutcome(ctx,id);if(!unit.checkPassed||!unit.practicePassed)throw Error('Complete a comprehension check and practice step before starting the guided project. Blank projects remain available in Build.');
 const artifacts=snapshot(ctx).artifacts;const existing=artifacts.find(a=>a.id===unit.artifactId)||artifacts.find(a=>a.learningSessionId===id&&a.conceptId===unit.conceptId);
 if(existing){if(unit.artifactId!==existing.id||!['build','completed'].includes(unit.stage)){unit.artifactId=existing.id;if(unit.stage!=='completed')unit.stage='build';save(ctx,unit);}emitInteractionEvent(ctx,{id:`build-start:${id}`,app:'BUILD',action:'start',sessionId:id,conceptId:unit.conceptId,language:unit.locale});return existing;}
 const concept=await getContentRepository({...ctx,locale:unit.locale}).getConcept(unit.conceptId);if(!concept)throw Error('Project context unavailable.');
 assertLearningSource(unit,concept);
 assertCurrentLearningUnit(ctx,unit);
 const rubric=concept.project?.criteria?.length?{criteria:concept.project.criteria,responses:{},locale:unit.locale,sourceProvider:concept.provenance?.provider,sourceVersion:concept.provenance?.version}:undefined;
 const artifact=saveArtifact(ctx,{title:concept.project?.title||`Apply: ${concept.title}`,body:'',projectBrief:concept.project?.brief||'Define an outcome, create an artifact, and describe the evidence. Guidance is not connected yet.',conceptId:unit.conceptId,learningSessionId:id,rubric});
 unit.artifactId=artifact.id;unit.stage='build';save(ctx,unit);emitInteractionEvent(ctx,{id:`build-start:${id}`,app:'BUILD',action:'start',sessionId:id,conceptId:unit.conceptId,language:unit.locale});return artifact;
}
export function validateProjectCompletion(artifact:Artifact){
 if(artifact.status!=='completed'||!artifact.conceptId)return;
 if(!artifact.body.trim()||!artifact.milestones.every(Boolean))throw Error('Complete the project milestones and add your work before recording application evidence.');
 if(artifact.rubric?.criteria.some(item=>!artifact.rubric?.responses[item.id]?.trim()))throw Error('Respond to every project criterion before recording application evidence. Your draft is kept.');
}
export function recordProjectSave(ctx:RequestContext,artifact:Artifact){
 validateProjectCompletion(artifact);
 const linkedUnit=artifact.learningSessionId?getLearningWorkspace(ctx).units.find(item=>item.id===artifact.learningSessionId):undefined;
 emitInteractionEvent(ctx,{id:artifact.status==='completed'?`artifact:${artifact.id}:completed-save`:undefined,app:'BUILD',action:'save',sessionId:artifact.learningSessionId||artifact.id,conceptId:artifact.conceptId,language:ctx.locale,...curriculumFields(ctx,linkedUnit)});
 if(artifact.status!=='completed'||!artifact.conceptId)return;
 const outcome:LearningOutcome={id:`artifact:${artifact.id}:completed`,conceptId:artifact.conceptId,kind:'application',verified:false,sessionId:artifact.learningSessionId||artifact.id,language:ctx.locale,classId:linkedUnit?.classId,...curriculumFields(ctx,linkedUnit)};
 recordLearningOutcome(ctx,outcome);
 if(artifact.learningSessionId){const unit=getLearningUnit(ctx,artifact.learningSessionId);unit.stage='completed';save(ctx,unit);}
}
export function prepareLearningConversation(ctx:RequestContext,id:string){const unit=getLearningUnit(ctx,id);if(unit.conversationId&&snapshot(ctx).conversations.some(c=>c.id===unit.conversationId))return unit.conversationId;const c=newConversation(ctx,unit.title);unit.conversationId=c.id;save(ctx,unit);return c.id;}
/** L1→L4 seam; only authored adapter/status blocks are appended. No local answer synthesis. */
export async function sendTeachingTurn(ctx:RequestContext,conversationId:string,text:string,inputType:'text'|'voice'='text'){
 const conversation=snapshot(ctx).conversations.find(c=>c.id===conversationId);if(!conversation)throw Error('Conversation not found.');
 updateConversation(ctx,conversationId,{draft:text});const unit=getLearningForConversation(ctx,conversationId);const intent=conversation.ask?.intent||'understand';
 const api=getTeachingInterface(ctx);const started=Date.now();const packet={input:text,intent,sessionId:unit?.id||conversationId,conceptId:unit?.conceptId,language:unit?.locale||ctx.locale,context:{material:conversation.ask?.material||'',source:conversation.ask?.source||'topic'}};
 emitInteractionEvent(ctx,{app:'ASK',action:'request',sessionId:packet.sessionId,conceptId:packet.conceptId,language:packet.language,inputType,intent,...curriculumFields(ctx,unit)});
 const response=await (intent==='check'?api.requestFeedback(packet):intent==='build'?api.requestProjectGuidance(packet):api.requestExplanation(packet));guard(ctx);
 appendTeachingTurn(ctx,conversationId,text,response.text,response.status==='not_connected'?'en':packet.language,response.status);
 emitInteractionEvent(ctx,{app:'ASK',action:'response',sessionId:packet.sessionId,conceptId:packet.conceptId,language:packet.language,latency:Date.now()-started,responseStatus:response.status,promptVersion:response.status==='ready'?response.promptVersion:undefined,inputType,intent,...curriculumFields(ctx,unit)});return response;
}
export function learningPriority(ctx:RequestContext){const units=getLearningWorkspace(ctx).units;const unit=[...units].filter(u=>u.stage!=='completed').sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))[0];const states=getStudentState(ctx).concepts;const due=states.find(c=>c.dueAt&&new Date(c.dueAt)<=workspaceNow());return{unit,due};}
