// CONTENT-02 — durable job/result/event storage. The interface is the seam the
// SQL domain store (DATA work) and the JOB-01..03 dispatch platform implement
// next; InMemoryIngestionStore is the contract-true reference used by the
// contract tests and local runs. All mutation paths enforce the same fencing
// rules a concurrent dispatcher would hit, so tests prove real concurrency
// behavior, not a friendlier in-memory fiction.
import type {
  IngestionEvent,IngestionEventPage,IngestionJob,IngestionResult,IngestionStage,StageReceipt,
} from './ingestion-types';
import { INGESTION_STAGE_ORDER } from './ingestion-types';
import { IngestionError } from './ingestion-errors';

export interface IngestionStore {
  /** Insert a fresh job; refuses when another active job holds the digest. */
  createJob(job:IngestionJob):Promise<void>;
  findJobByInputDigest(inputDigest:string):Promise<IngestionJob|null>;
  getJob(jobId:string):Promise<IngestionJob|null>;
  /** Fenced stage claim: verifies attempt, cancels and terminal states. */
  claimStage(jobId:string,stage:IngestionStage,expectedAttempt:number):Promise<IngestionJob>;
  /** Idempotent completion: same output digest is a no-op, changed conflicts. */
  completeStage(jobId:string,attempt:number,stage:IngestionStage,receipt:StageReceipt):Promise<IngestionJob>;
  /** Terminal success transition after the passed evaluation and saved result. */
  succeedJob(jobId:string,attempt:number,at:string):Promise<IngestionJob>;
  failJob(jobId:string,attempt:number,stage:IngestionStage,code:string,message:string):Promise<IngestionJob>;
  cancelJob(jobId:string,requestedBy:string):Promise<IngestionJob>;
  saveResult(result:IngestionResult):Promise<void>;
  getResult(jobId:string):Promise<IngestionResult|null>;
  appendEvent(event:Omit<IngestionEvent,'seq'>):Promise<IngestionEvent>;
  listEvents(jobId:string,cursor?:number,limit?:number):Promise<IngestionEventPage>;
}

const ACTIVE_STATUSES=new Set(['pending','running']);

function cloneJob(job:IngestionJob):IngestionJob{
  return JSON.parse(JSON.stringify(job)) as IngestionJob;
}

export class InMemoryIngestionStore implements IngestionStore {
  private readonly jobs=new Map<string,IngestionJob>();
  private readonly digests=new Map<string,string[]>();
  private readonly results=new Map<string,IngestionResult>();
  private readonly events:IngestionEvent[]=[];
  private seq=0;

  async createJob(job:IngestionJob):Promise<void>{
    const existing=await this.findJobByInputDigest(job.inputDigest);
    if(existing&&ACTIVE_STATUSES.has(existing.status))throw new IngestionError('DUPLICATE_ACTIVE_JOB','an active job already holds this input digest');
    if(this.jobs.has(job.jobId))throw new IngestionError('DUPLICATE_ACTIVE_JOB','job id collision');
    this.jobs.set(job.jobId,cloneJob(job));
    const list=this.digests.get(job.inputDigest)??[];
    list.push(job.jobId);
    this.digests.set(job.inputDigest,list);
  }

  async findJobByInputDigest(inputDigest:string):Promise<IngestionJob|null>{
    const list=this.digests.get(inputDigest)??[];
    for(let i=list.length-1;i>=0;i--){
      const job=this.jobs.get(list[i]);
      if(job)return cloneJob(job);
    }
    return null;
  }

  async getJob(jobId:string):Promise<IngestionJob|null>{
    const job=this.jobs.get(jobId);
    return job?cloneJob(job):null;
  }

  async claimStage(jobId:string,stage:IngestionStage,expectedAttempt:number):Promise<IngestionJob>{
    const job=this.jobs.get(jobId);
    if(!job)throw new IngestionError('JOB_NOT_FOUND',jobId);
    if(job.status==='cancelled')throw new IngestionError('JOB_CANCELLED','job was cancelled before stage '+stage,stage);
    if(job.status==='succeeded'||job.status==='failed')throw new IngestionError('ALREADY_COMPLETED','job is '+job.status,stage);
    if(job.attempt!==expectedAttempt)throw new IngestionError('STALE_ATTEMPT','expected attempt '+expectedAttempt+' but job holds '+job.attempt,stage);
    job.attempt+=1;
    job.status='running';
    job.updatedAt=new Date().toISOString();
    this.jobs.set(jobId,cloneJob(job));
    return cloneJob(job);
  }

  async completeStage(jobId:string,attempt:number,stage:IngestionStage,receipt:StageReceipt):Promise<IngestionJob>{
    const job=this.jobs.get(jobId);
    if(!job)throw new IngestionError('JOB_NOT_FOUND',jobId);
    if(job.status==='cancelled')throw new IngestionError('JOB_CANCELLED','job was cancelled; completion refused for stage '+stage,stage);
    if(job.attempt!==attempt)throw new IngestionError('STALE_ATTEMPT','completion for attempt '+attempt+' but job holds '+job.attempt,stage);
    const previous=(job.stageReceipts as StageReceipt[]).find((r)=>r.stage===stage);
    if(previous){
      if(previous.outputDigest===receipt.outputDigest)return cloneJob(job);
      throw new IngestionError('CONCURRENT_COMPLETION_CONFLICT','stage '+stage+' already completed with a different output',stage);
    }
    (job.stageReceipts as StageReceipt[]).push(receipt);
    (job.completedStages as IngestionStage[]).push(stage);
    job.updatedAt=new Date().toISOString();
    this.jobs.set(jobId,cloneJob(job));
    return cloneJob(job);
  }

  async succeedJob(jobId:string,attempt:number,at:string):Promise<IngestionJob>{
    const job=this.jobs.get(jobId);
    if(!job)throw new IngestionError('JOB_NOT_FOUND',jobId);
    if(job.status==='cancelled')throw new IngestionError('JOB_CANCELLED','cancelled job cannot succeed',null);
    if(job.attempt!==attempt)throw new IngestionError('STALE_ATTEMPT','success for attempt '+attempt+' but job holds '+job.attempt,null);
    if(job.status==='succeeded')return cloneJob(job);
    if(job.status!=='running'&&job.status!=='pending')throw new IngestionError('ALREADY_COMPLETED','job is '+job.status,null);
    job.status='succeeded';
    job.updatedAt=at;
    this.jobs.set(jobId,cloneJob(job));
    return cloneJob(job);
  }

  async failJob(jobId:string,attempt:number,stage:IngestionStage,code:string,message:string):Promise<IngestionJob>{
    const job=this.jobs.get(jobId);
    if(!job)throw new IngestionError('JOB_NOT_FOUND',jobId);
    if(job.status==='cancelled')throw new IngestionError('JOB_CANCELLED','cancelled job cannot fail a stage',stage);
    if(job.attempt!==attempt)throw new IngestionError('STALE_ATTEMPT','failure for attempt '+attempt+' but job holds '+job.attempt,stage);
    job.status='failed';
    job.failure={stage,code,message,at:new Date().toISOString()};
    job.updatedAt=job.failure.at;
    this.jobs.set(jobId,cloneJob(job));
    return cloneJob(job);
  }

  async cancelJob(jobId:string,requestedBy:string):Promise<IngestionJob>{
    const job=this.jobs.get(jobId);
    if(!job)throw new IngestionError('JOB_NOT_FOUND',jobId);
    if(job.status==='succeeded'||job.status==='failed')throw new IngestionError('ALREADY_COMPLETED','cannot cancel a '+job.status+' job');
    const done=new Set<IngestionStage>(job.completedStages);
    const nextStage=INGESTION_STAGE_ORDER.find((s)=>!done.has(s))??null;
    job.status='cancelled';
    job.cancellation={requestedBy,at:new Date().toISOString(),stage:nextStage};
    job.updatedAt=job.cancellation.at;
    this.jobs.set(jobId,cloneJob(job));
    return cloneJob(job);
  }

  async saveResult(result:IngestionResult):Promise<void>{
    this.results.set(result.jobId,JSON.parse(JSON.stringify(result)) as IngestionResult);
  }

  async getResult(jobId:string):Promise<IngestionResult|null>{
    const result=this.results.get(jobId);
    return result?JSON.parse(JSON.stringify(result)) as IngestionResult:null;
  }

  async appendEvent(event:Omit<IngestionEvent,'seq'>):Promise<IngestionEvent>{
    this.seq+=1;
    const full:IngestionEvent={...event,seq:this.seq};
    this.events.push(full);
    return {...full};
  }

  async listEvents(jobId:string,cursor?:number,limit=50):Promise<IngestionEventPage>{
    const filtered=this.events.filter((e)=>e.jobId===jobId&&(cursor===undefined||e.seq>cursor));
    const page=filtered.slice(0,Math.max(1,limit));
    const last=page.length?page[page.length-1].seq:cursor??0;
    const hasMore=filtered.length>page.length;
    return {events:page.map((e)=>({...e})),nextCursor:hasMore?last:null};
  }
}
