// CONTENT-02 — ingestion orchestration. The service is the only mutation
// entrypoint: it enforces authority/consent/scan/digest gating at start, drives
// the stage order over the durable store with attempt fencing, keeps idempotent
// start semantics (same input digest never duplicates work), supports
// cancellation between stages, and releases results only to the owner of a
// succeeded evaluation.
//
// Restart honesty: a runner holds the verified bytes and per-stage artifacts in
// process memory for the run it executes. If a runner without that context
// claims a stage, the claim fails with RUNNER_CONTEXT_LOST and the job stays
// pending for a capable runner — a crashed or restarted dispatcher never fails
// a job by losing its own working set. The durable dispatcher (JOB-01/02) will
// replace this in-process working set with authenticated private object fetches.
import { randomUUID, createHash } from 'node:crypto';
import type { ChunkPlan, ResolvedBounds } from './ingestion-stages';
import {
  assembleChunks,chunkStage,digestOf,embedStage,evaluateStage,parseStage,resolveBounds,scanGate,
} from './ingestion-stages';
import { TRANSFORMATION_VERSIONS } from './ingestion-bounds';
import { IngestionError } from './ingestion-errors';
import type { IngestionStore } from './ingestion-store';
import type { EmbeddingAdapter } from './embedding-adapter';
import type {
  ChunkRecord,EmbeddingModelDescriptor,EvaluationReceipt,IngestionEventPage,
  IngestionJob,IngestionResult,IngestionStage,ParsedDocument,SourceAuthorization,
  SourceObjectReceipt,SourceProvenance,StageReceipt,
} from './ingestion-types';
import type { IngestionBounds } from './ingestion-bounds';
import { INGESTION_STAGE_ORDER } from './ingestion-types';

export interface StartIngestionRequest {
  requesterUid:string;
  authorization:SourceAuthorization;
  object:SourceObjectReceipt;
  /** The verified source bytes; sha-256 must match the receipt digest. */
  content:Buffer;
  provenance:SourceProvenance;
  /** Defaults to the attached adapter's descriptor when omitted. */
  model?:EmbeddingModelDescriptor;
}

export interface StartIngestionOutcome {
  job:IngestionJob;
  /** True when an existing active/succeeded job with the same input was reused. */
  idempotentReplay:boolean;
}

interface RunContext {
  bytes:Buffer;
  contentType:string;
  provenance:SourceProvenance;
}

export class IngestionService {
  private readonly bounds:ResolvedBounds;
  private readonly now:()=>string;
  private readonly runContexts=new Map<string,RunContext>();
  private readonly parsedCache=new Map<string,ParsedDocument>();
  private readonly planCache=new Map<string,ChunkPlan>();
  private readonly vectorCache=new Map<string,readonly (readonly number[])[]>();

  constructor(
    private readonly store:IngestionStore,
    private readonly embedder:EmbeddingAdapter,
    options:{ bounds?:Partial<IngestionBounds>; now?:()=>Date }={},
  ){
    this.bounds=resolveBounds(options.bounds);
    this.now=options.now?()=>options.now().toISOString():()=>new Date().toISOString();
  }

  /**
   * Start an ingestion job. Denies at the boundary: requester must be the
   * declared owner, consent must be present, the object must be a clean,
   * verified generation, and the presented bytes must hash to the receipt
   * digest. Starting is idempotent per input digest: an active or succeeded job
   * with the same digest is returned, not duplicated. A failed or cancelled job
   * does not block a fresh attempt (the old record stays for audit); the new
   * attempt re-runs every stage over the same immutable bytes.
   */
  async startIngestion(request:StartIngestionRequest):Promise<StartIngestionOutcome>{
    const {requesterUid,authorization,object,provenance}=request;
    if(requesterUid!==authorization.ownerUid)throw new IngestionError('AUTHORITY_DENIED','requester '+requesterUid+' is not the source owner '+authorization.ownerUid);
    if(requesterUid!==object.ownerUid)throw new IngestionError('AUTHORITY_DENIED','object generation belongs to '+object.ownerUid+', not the requester');
    if(!authorization.rightsGrant||!authorization.rightsGrant.trim())throw new IngestionError('CONSENT_DENIED','ingestion requires a non-empty rights grant');
    if(!authorization.processingConsent)throw new IngestionError('CONSENT_DENIED','rights-holder processing consent is required for ingestion');
    if(!provenance.provider||!provenance.edition||!provenance.version)throw new IngestionError('MALFORMED_PROVENANCE','provider, edition and version are required provenance');

    scanGate(object,this.bounds); // deny before any record is written

    const presentedDigest=createHash('sha256').update(request.content).digest('hex');
    if(presentedDigest!==object.digest)throw new IngestionError('OBJECT_UNVERIFIED','presented bytes do not match the verified generation digest');

    const model=request.model??this.embedder.descriptor;
    if(!model.model||!Number.isSafeInteger(model.dimension)||model.dimension<1)throw new IngestionError('EMBEDDING_DIMENSION_MISMATCH','invalid embedding model descriptor');

    const inputDigest=digestOf({
      pipeline:TRANSFORMATION_VERSIONS.pipeline,
      objectRef:object.objectRef,
      digest:object.digest,
      contentType:object.contentType,
      provenance,
      ownerUid:authorization.ownerUid,
      workspaceId:authorization.workspaceId,
      bounds:this.bounds,
      model,
    });

    const existing=await this.store.findJobByInputDigest(inputDigest);
    if(existing&&existing.status!=='failed'&&existing.status!=='cancelled'){
      return {job:existing,idempotentReplay:true};
    }

    const at=this.now();
    const job:IngestionJob={
      jobId:'ing_'+randomUUID(),
      ownerUid:authorization.ownerUid,
      workspaceId:authorization.workspaceId,
      status:'pending',
      attempt:0,
      inputDigest,
      completedStages:[],
      stageReceipts:[],
      failure:null,
      cancellation:null,
      createdAt:at,
      updatedAt:at,
    };
    await this.store.createJob(job);
    const stored=await this.store.getJob(job.jobId);
    this.runContexts.set(job.jobId,{bytes:request.content,contentType:object.contentType,provenance:{...provenance}});
    await this.store.appendEvent({at,jobId:job.jobId,type:'job.started',stage:null,detail:'digest '+inputDigest.slice(0,12)+' provider '+provenance.provider+'/'+provenance.edition+'/'+provenance.version});
    return {job:stored!,idempotentReplay:false};
  }

  /** Run every remaining stage; stops on the first failure, refusal or cancellation. */
  async run(jobId:string):Promise<IngestionJob>{
    let job=await this.mustGet(jobId);
    for(const stage of INGESTION_STAGE_ORDER){
      if(job.completedStages.includes(stage))continue;
      if(job.status==='cancelled'||job.status==='failed'||job.status==='succeeded')return job;
      job=await this.runStage(jobId,stage);
      if(job.status!=='running'&&job.status!=='pending')return job;
    }
    return job;
  }

  /**
   * Advance exactly one fenced stage. Claims bump the attempt; completions must
   * carry the claim's attempt, so a second concurrent runner invalidates the
   * first one's completion (stale attempts are refused, not merged). A runner
   * that lost its working set raises RUNNER_CONTEXT_LOST without failing the
   * job; real stage failures fail the job durably.
   */
  async runStage(jobId:string,stage:IngestionStage):Promise<IngestionJob>{
    if(!INGESTION_STAGE_ORDER.includes(stage))throw new IngestionError('ALREADY_COMPLETED','unknown stage '+stage,stage);
    const current=await this.mustGet(jobId);
    if(current.status==='cancelled')throw new IngestionError('JOB_CANCELLED','job was cancelled',stage);
    if(current.status==='succeeded'||current.status==='failed')throw new IngestionError('ALREADY_COMPLETED','job is '+current.status,stage);

    const claimed=await this.store.claimStage(jobId,stage,current.attempt);
    await this.store.appendEvent({at:this.now(),jobId,type:'stage.claimed',stage,detail:'attempt '+claimed.attempt});

    if(stage==='evaluate')return this.finalize(jobId,claimed.attempt);

    const startedAt=this.now();
    try{
      const receipt=await this.executeStage(jobId,stage,startedAt);
      const completed=await this.store.completeStage(jobId,claimed.attempt,stage,receipt);
      await this.store.appendEvent({at:this.now(),jobId,type:'stage.completed',stage,detail:'output '+receipt.outputDigest.slice(0,12)+' '+receipt.notes.join('; ')});
      return completed;
    }catch(error){
      if(error instanceof IngestionError&&error.code==='RUNNER_CONTEXT_LOST')throw error;
      const code=error instanceof IngestionError?error.code:'PIPELINE_ERROR';
      const message=error instanceof Error?error.message:String(error);
      const failed=await this.store.failJob(jobId,claimed.attempt,stage,code,message);
      await this.store.appendEvent({at:this.now(),jobId,type:'stage.failed',stage,detail:code+': '+message});
      return failed;
    }
  }

  /** Owner-only cancellation; terminal jobs refuse. */
  async cancel(jobId:string,requesterUid:string):Promise<IngestionJob>{
    const job=await this.mustGet(jobId);
    if(requesterUid!==job.ownerUid)throw new IngestionError('AUTHORITY_DENIED','only the owner may cancel this job');
    const cancelled=await this.store.cancelJob(jobId,requesterUid);
    await this.store.appendEvent({at:this.now(),jobId,type:'job.cancelled',stage:cancelled.cancellation?.stage??null,detail:'cancelled by '+requesterUid});
    return cancelled;
  }

  /** Durable job status; readable only by the owner (opaque to everyone else). */
  async getStatus(jobId:string,requesterUid:string):Promise<IngestionJob>{
    const job=await this.mustGet(jobId);
    if(requesterUid!==job.ownerUid)throw new IngestionError('AUTHORITY_DENIED','job status is owner-scoped');
    return job;
  }

  /** The committed ingestion result; only a succeeded job has one, owner-only. */
  async getResult(jobId:string,requesterUid:string):Promise<IngestionResult>{
    const job=await this.mustGet(jobId);
    if(requesterUid!==job.ownerUid)throw new IngestionError('AUTHORITY_DENIED','ingestion results are owner-scoped');
    if(job.status!=='succeeded')throw new IngestionError('ALREADY_COMPLETED','job '+job.status+' has no result; a succeeded evaluation is required',job.failure?.stage??null);
    const result=await this.store.getResult(jobId);
    if(!result)throw new IngestionError('ALREADY_COMPLETED','succeeded job is missing its result record');
    return result;
  }

  /** Durable observation events with cursor-based refetch; owner-only. */
  async listEvents(jobId:string,requesterUid:string,cursor?:number,limit?:number):Promise<IngestionEventPage>{
    const job=await this.mustGet(jobId);
    if(requesterUid!==job.ownerUid)throw new IngestionError('AUTHORITY_DENIED','job events are owner-scoped');
    return this.store.listEvents(jobId,cursor,limit);
  }

  // -------------------------------------------------------------------------

  private async executeStage(jobId:string,stage:IngestionStage,startedAt:string):Promise<StageReceipt>{
    switch(stage){
      case 'scan':{
        // The scan gate ran at start against the receipt; the durable stage
        // receipt re-states the acceptance so the completed stage is
        // verifiable from the job record alone.
        const job=await this.mustGet(jobId);
        return {
          stage,transformationVersion:TRANSFORMATION_VERSIONS.scan,startedAt,finishedAt:this.now(),
          outputDigest:digestOf({stage,digest:job.inputDigest,v:TRANSFORMATION_VERSIONS.scan}),
          notes:['object generation accepted at start (clean, scanned, manifest-verified, digest-bound)'],
        };
      }
      case 'parse':{
        const context=this.runContexts.get(jobId);
        if(!context)throw new IngestionError('RUNNER_CONTEXT_LOST','verified source bytes are not held by this runner','parse');
        const parsed=parseStage(context.bytes,context.contentType,this.bounds);
        this.parsedCache.set(jobId,parsed);
        return {
          stage,transformationVersion:TRANSFORMATION_VERSIONS.parse,startedAt,finishedAt:this.now(),
          outputDigest:digestOf({stage,text:parsed.text,pages:parsed.pages,sections:parsed.sections}),
          notes:[...parsed.parseWarnings,'parsed '+parsed.text.length+' chars, '+parsed.pages.length+' page(s), '+parsed.sections.length+' section(s)'],
        };
      }
      case 'chunk':{
        const parsed=this.parsedCache.get(jobId);
        if(!parsed)throw new IngestionError('RUNNER_CONTEXT_LOST','parse output is not held by this runner','chunk');
        const plan=chunkStage(parsed,this.bounds);
        this.planCache.set(jobId,plan);
        return {
          stage,transformationVersion:TRANSFORMATION_VERSIONS.chunk,startedAt,finishedAt:this.now(),
          outputDigest:digestOf({stage,chunks:plan.chunks.map((c)=>[c.charStart,c.charEnd])}),
          notes:[...plan.warnings,'planned '+plan.chunks.length+' chunk(s)'],
        };
      }
      case 'embed':{
        const plan=this.planCache.get(jobId);
        if(!plan)throw new IngestionError('RUNNER_CONTEXT_LOST','chunk plan is not held by this runner','embed');
        const texts=plan.chunks.map((c)=>c.text);
        const vectors=texts.length?await embedStage(texts,this.embedder,this.bounds):[];
        this.vectorCache.set(jobId,vectors);
        return {
          stage,transformationVersion:TRANSFORMATION_VERSIONS.embed,startedAt,finishedAt:this.now(),
          outputDigest:digestOf({stage,model:this.embedder.descriptor,vectors:vectors.map((v)=>v.length)}),
          notes:['embedded '+vectors.length+' chunk(s) with model '+this.embedder.descriptor.model+' dimension '+this.embedder.descriptor.dimension],
        };
      }
      default:{
        // 'evaluate' is routed to finalize() by runStage and never reaches the
        // stage executor; anything else is a programming error.
        throw new IngestionError('ALREADY_COMPLETED','stage '+String(stage)+' is not executable here',stage);
      }
    }
  }

  /**
   * The evaluate stage: assembles chunks, runs the deterministic quality gates
   * and, only on a passed receipt, commits the result and succeeds the job. A
   * failed evaluation fails the job — an incomplete ingestion can never present
   * itself as ready (publication is CONTENT-03's atomic pointer anyway).
   */
  private async finalize(jobId:string,attempt:number):Promise<IngestionJob>{
    const startedAt=this.now();
    try{
      const context=this.runContexts.get(jobId);
      const parsed=this.parsedCache.get(jobId);
      const plan=this.planCache.get(jobId);
      const vectors=this.vectorCache.get(jobId);
      if(!context||!parsed||!plan||!vectors)throw new IngestionError('RUNNER_CONTEXT_LOST','stage artifacts are not held by this runner','evaluate');
      const model=this.embedder.descriptor;
      const chunks:ChunkRecord[]=assembleChunks({plan,parsed,vectors,model,provenance:context.provenance});
      const evaluation:EvaluationReceipt=evaluateStage({chunks,parsed,model,bounds:this.bounds});
      if(!evaluation.passed){
        return await this.store.failJob(jobId,attempt,'evaluate','EVALUATION_FAILED',evaluation.failedReasons.join('; '));
      }
      const finishedAt=this.now();
      const result:IngestionResult={
        jobId,
        inputDigest:(await this.mustGet(jobId)).inputDigest,
        provenance:context.provenance,
        model,
        transformationVersions:{
          scan:TRANSFORMATION_VERSIONS.scan,parse:TRANSFORMATION_VERSIONS.parse,chunk:TRANSFORMATION_VERSIONS.chunk,
          embed:TRANSFORMATION_VERSIONS.embed,evaluate:TRANSFORMATION_VERSIONS.evaluate,
        },
        chunks,
        evaluation,
        finishedAt,
      };
      await this.store.saveResult(result);
      await this.store.completeStage(jobId,attempt,'evaluate',{
        stage:'evaluate',transformationVersion:TRANSFORMATION_VERSIONS.evaluate,startedAt,finishedAt,
        outputDigest:digestOf({checks:evaluation.checks,chunks:chunks.length}),
        notes:evaluation.checks.map((c)=>c.id+':'+(c.passed?'pass':'fail')),
      });
      const succeeded=await this.store.succeedJob(jobId,attempt,finishedAt);
      await this.store.appendEvent({at:finishedAt,jobId,type:'job.succeeded',stage:'evaluate',detail:chunks.length+' chunk(s) ready for review'});
      return succeeded;
    }catch(error){
      if(error instanceof IngestionError&&error.code==='RUNNER_CONTEXT_LOST')throw error;
      const code=error instanceof IngestionError?error.code:'PIPELINE_ERROR';
      const message=error instanceof Error?error.message:String(error);
      const failed=await this.store.failJob(jobId,attempt,'evaluate',code,message);
      await this.store.appendEvent({at:this.now(),jobId,type:'stage.failed',stage:'evaluate',detail:code+': '+message});
      return failed;
    }
  }

  private async mustGet(jobId:string):Promise<IngestionJob>{
    const job=await this.store.getJob(jobId);
    if(!job)throw new IngestionError('JOB_NOT_FOUND',jobId);
    return job;
  }
}
