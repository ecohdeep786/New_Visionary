import type {MasteryStage,RequestContext} from '../domain/workspace.ts';
import {snapshot,workspaceNow,mastery} from './workspaceService.ts';
import {getLearningEvidenceHistory,getStudentState} from './mentorStateService.ts';
import {getLearningWorkspace} from './learningPipelineService.ts';
import {getJourney} from './journeys.ts';

export type EvidencePeriod=7|30|'all';
export interface ProgressEvent {id:string;kind:string;at:string;correct:number;total:number;measured:boolean;resumePath?:string;activityTitle?:string;sourceVersion?:string}
export interface ProgressObjective {id:string;title:string;titleLocale?:string;source:'guided'|'journey';stage:MasteryStage;dueAt?:string;events:ProgressEvent[];correct:number;total:number;applications:number}
/** Read-only owner report. The two evidence systems remain separately identified. */
export function getLearningProgress(ctx:RequestContext,period:EvidencePeriod=7){
 if(ctx.signal?.aborted)throw new DOMException('Cancelled','AbortError');
 const data=snapshot(ctx);
 if(!['student','professional','teacher'].includes(ctx.role))throw Error('Use your own learning workspace to view progress.');
 if(![7,30,'all'].includes(period))throw Error('Choose an available evidence period.');
 const asOf=workspaceNow();const cutoff=period==='all'?-Infinity:asOf.getTime()-period*86400000;
 const inPeriod=(at:string)=>Date.parse(at)>=cutoff&&Date.parse(at)<=asOf.getTime();
 const objectives:ProgressObjective[]=[];const unavailable:{source:string;message:string}[]=[];let hasSavedEvidence=false;
 let units:ReturnType<typeof getLearningWorkspace>['units']=[];
 try{units=getLearningWorkspace(ctx).units;if(!Array.isArray(units)||units.some(row=>!row||typeof row.id!=='string'||typeof row.conceptId!=='string'||typeof row.title!=='string'))throw Error('Saved activities are incomplete.');}
 catch{units=[];unavailable.push({source:'Activity resume links',message:'Saved activities could not be read. Evidence can still be reviewed; original activities were kept.'});}
 try{
  const history=getLearningEvidenceHistory(ctx);const states=getStudentState(ctx).concepts;
  hasSavedEvidence=history.length>0;
  for(const conceptId of new Set(history.map(row=>row.conceptId))){
   const records=history.filter(row=>row.conceptId===conceptId&&inPeriod(row.at));if(!records.length)continue;
   const state=states.find(row=>row.conceptId===conceptId);const matching=units.filter(row=>row.conceptId===conceptId);
   const events:ProgressEvent[]=records.map(row=>{const unit=matching.find(unit=>unit.id===row.sessionId);return{id:'guided:'+row.id,kind:row.kind,at:row.at,correct:row.correct,total:row.total,measured:row.verified&&row.total>0&&row.kind!=='application',resumePath:unit?'/dashboard/learn?unit='+encodeURIComponent(unit.id):undefined,activityTitle:unit?.title,sourceVersion:unit?.sourceContext?.provenance?unit.sourceContext.provenance.sourceId+' · version '+unit.sourceContext.provenance.version:undefined};});
   objectives.push({id:'guided:'+conceptId,title:matching.at(-1)?.title||'Recorded learning objective',titleLocale:matching.at(-1)?.locale||'en',source:'guided',stage:state?.stage||'Exploring',dueAt:state?.dueAt,events,correct:events.filter(row=>row.measured).reduce((n,row)=>n+row.correct,0),total:events.filter(row=>row.measured).reduce((n,row)=>n+row.total,0),applications:events.filter(row=>row.kind==='application').length});
  }
 }catch{unavailable.push({source:'Guided learning evidence',message:'Guided evidence could not be read completely. Original records were kept; these counts are unavailable.'});}
 // Build this source separately so malformed records never leave partially counted rows.
 try{
  const rows:ProgressObjective[]=[];const ids=new Set<string>();
  for(const session of data.sessions){for(const row of session.evidence){if(!row.id||ids.has(row.id)||!row.objectiveId||!['check','practice','application','retrieval'].includes(row.kind)||!Number.isInteger(row.correct)||!Number.isInteger(row.total)||row.correct<0||row.total<0||row.correct>row.total||!Number.isFinite(Date.parse(row.at)))throw Error('Incomplete journey evidence.');ids.add(row.id);}}
  hasSavedEvidence ||= ids.size>0;
  for(const session of data.sessions){
   for(const objectiveId of new Set(session.evidence.map(row=>row.objectiveId))){
    const saved=session.evidence.filter(row=>row.objectiveId===objectiveId);const records=saved.filter(row=>inPeriod(row.at));if(!records.length)continue;
    const journey=getJourney(session.journeyId,ctx.locale);const key='journey:'+session.journeyId+':'+objectiveId;
    let objective=rows.find(row=>row.id===key);
    if(!objective){objective={id:key,title:journey.title,titleLocale:ctx.locale,source:'journey',stage:'Exploring',events:[],correct:0,total:0,applications:0};rows.push(objective);}
    objective.events.push(...records.map(row=>({id:'journey:'+row.id,kind:row.kind,at:row.at,correct:row.correct,total:row.total,measured:row.total>0&&row.kind!=='application',resumePath:'/dashboard/home?session='+encodeURIComponent(session.id),activityTitle:journey.title})));
   }
  }
  for(const row of rows){
   const saved=data.sessions.flatMap(session=>session.evidence.filter(e=>'journey:'+session.journeyId+':'+e.objectiveId===row.id));
   row.stage=mastery(saved,true,asOf);row.correct=row.events.filter(e=>e.measured).reduce((n,e)=>n+e.correct,0);row.total=row.events.filter(e=>e.measured).reduce((n,e)=>n+e.total,0);row.applications=row.events.filter(e=>e.kind==='application').length;
  }
  objectives.push(...rows);
 }catch{unavailable.push({source:'Earlier guided journeys',message:'Earlier journey evidence could not be read completely. Original records were kept; these counts are unavailable.'});}
 for(const row of objectives)row.events.sort((a,b)=>b.at.localeCompare(a.at));
 objectives.sort((a,b)=>b.events[0]!.at.localeCompare(a.events[0]!.at));
 return {period,asOf:asOf.toISOString(),objectives,unavailable,hasSavedEvidence};
}
