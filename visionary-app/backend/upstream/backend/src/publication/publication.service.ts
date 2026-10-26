// CONTENT-03 — publication orchestration. Every command is owner-authorized,
// re-checks the ingestion receipt at both submit and release (incomplete
// ingestion cannot appear published, in depth), and changes the public pointer
// only through the store's compare-and-swap. Reviews are a separate actor: the
// owner cannot approve their own publication.
import { randomUUID, createHash } from 'node:crypto';
import type {
  IngestionReadiness,PublicationEventPage,PublicationPointer,PublicationRecord,
  SourceVersionIdentity,
} from './publication-types';
import { PublicationError } from './publication-errors';
import type { PublicationStore } from './publication-store';

export interface SubmitForReviewRequest {
  requesterUid:string;
  ownerUid:string;
  workspaceId:string|null;
  nodeKey:string;
  source:SourceVersionIdentity;
  ingestion:IngestionReadiness;
}

export class PublicationService {
  private readonly now:()=>string;
  constructor(
    private readonly store:PublicationStore,
    options:{ now?:()=>Date }={},
  ){
    this.now=options.now?()=>options.now().toISOString():()=>new Date().toISOString();
  }

  /** Create a draft publication from a COMPLETE ingestion receipt. */
  async submitForReview(request:SubmitForReviewRequest):Promise<PublicationRecord>{
    const {requesterUid,ownerUid,workspaceId,nodeKey,source,ingestion}=request;
    if(requesterUid!==ownerUid)throw new PublicationError('AUTHORITY_DENIED','requester '+requesterUid+' is not the source owner '+ownerUid);
    if(!nodeKey||!source.provider||!source.edition||!source.version)throw new PublicationError('MALFORMED_IDENTITY','nodeKey and provider/edition/version are required');
    if(!ingestion.jobId||!ingestion.inputDigest)throw new PublicationError('INGESTION_INCOMPLETE','a concrete ingestion receipt (jobId, inputDigest) is required');
    if(!ingestion.evaluationPassed)throw new PublicationError('INGESTION_INCOMPLETE','ingestion evaluation did not pass; incomplete ingestion cannot appear published');

    const at=this.now();
    const record:PublicationRecord={
      publicationId:'pub_'+randomUUID(),
      nodeKey,
      ownerUid,
      workspaceId,
      source:{...source},
      state:'in_review',
      revision:0,
      pointer:null,
      review:null,
      rejection:null,
      ingestion:{...ingestion},
      history:[],
      createdAt:at,
      updatedAt:at,
    };
    await this.store.createPublication(record);
    await this.store.appendEvent(record.publicationId,{at,type:'created',actorUid:requesterUid,detail:'node '+nodeKey+' source '+source.provider+'/'+source.edition+'/'+source.version+' ingestion '+ingestion.jobId.slice(0,16)});
    const stored=await this.store.getPublication(record.publicationId);
    return stored!;
  }

  /** Release an approved publication: the atomic pointer change. */
  async release(publicationId:string,requesterUid:string,expectedRevision:number):Promise<PublicationRecord>{
    const record=await this.mustGet(publicationId);
    if(requesterUid!==record.ownerUid)throw new PublicationError('AUTHORITY_DENIED','only the owner may release this publication');
    // A replayed release command resolves to the same committed pointer; it is
    // answered before the state guard so retries never fail spuriously.
    if(record.state==='released'&&record.pointer&&record.revision===expectedRevision+1){
      const at=this.now();
      await this.store.appendEvent(publicationId,{at,type:'released_replay',actorUid:requesterUid,detail:'revision '+record.revision+' target '+record.pointer.targetDigest.slice(0,12)});
      return record;
    }
    if(record.state!=='in_review')throw new PublicationError('INVALID_TRANSITION','release requires the in_review state; publication is '+record.state);
    if(!record.review)throw new PublicationError('INVALID_TRANSITION','release requires a recorded review approval');
    if(!record.ingestion.evaluationPassed)throw new PublicationError('INGESTION_INCOMPLETE','ingestion evaluation no longer passes; release refused');

    const revision=expectedRevision+1;
    const targetDigest=this.pointerDigest(record,revision);
    const at=this.now();
    let swapped:PublicationRecord;
    try{
      swapped=await this.store.swapPointer(publicationId,expectedRevision,(current)=>{
        const pointer:PublicationPointer={
          nodeKey:current.nodeKey,
          source:{...current.source},
          revision,
          targetDigest,
          releasedAt:at,
        };
        return {...current,state:'released',revision,pointer,rejection:null,updatedAt:at};
      });
    }catch(error){
      // A racing release with the identical payload deduplicates to the
      // committed pointer (same command key, same payload); a different
      // payload or another command's advance conflicts loudly.
      if(error instanceof PublicationError&&error.code==='CONCURRENT_REVISION_CONFLICT'){
        const committed=await this.mustGet(publicationId);
        if(committed.pointer&&committed.pointer.targetDigest===targetDigest){
          await this.store.appendEvent(publicationId,{at:this.now(),type:'released_replay',actorUid:requesterUid,detail:'revision '+committed.revision+' target '+targetDigest.slice(0,12)});
          return committed;
        }
      }
      throw error;
    }
    await this.store.appendEvent(publicationId,{at,type:'released',actorUid:requesterUid,detail:'revision '+revision+' target '+targetDigest.slice(0,12)});
    return swapped;
  }

  /** Record the reviewer's approval while the publication is in review. */
  async approve(publicationId:string,reviewerUid:string,note:string):Promise<PublicationRecord>{
    const record=await this.mustGet(publicationId);
    if(record.state!=='in_review')throw new PublicationError('INVALID_TRANSITION','approval requires the in_review state; publication is '+record.state);
    if(reviewerUid===record.ownerUid)throw new PublicationError('SELF_APPROVAL_DENIED','the owner cannot approve their own publication');
    const at=this.now();
    const swapped=await this.store.swapPointer(publicationId,record.revision,(current)=>({
      ...current,review:{reviewerUid,decidedAt:at,note:note??''},rejection:null,updatedAt:at,
    }));
    await this.store.appendEvent(publicationId,{at,type:'review_approved',actorUid:reviewerUid,detail:(note??'').slice(0,120)});
    return swapped;
  }

  /** Record a rejection; the publication stays in review for rework. */
  async reject(publicationId:string,reviewerUid:string,note:string):Promise<PublicationRecord>{
    const record=await this.mustGet(publicationId);
    if(record.state!=='in_review')throw new PublicationError('INVALID_TRANSITION','rejection requires the in_review state; publication is '+record.state);
    if(reviewerUid===record.ownerUid)throw new PublicationError('SELF_APPROVAL_DENIED','the owner cannot review their own publication');
    const at=this.now();
    const swapped=await this.store.swapPointer(publicationId,record.revision,(current)=>({
      ...current,rejection:{reviewerUid,decidedAt:at,note:note??''},updatedAt:at,
    }));
    await this.store.appendEvent(publicationId,{at,type:'review_rejected',actorUid:reviewerUid,detail:(note??'').slice(0,120)});
    return swapped;
  }

  /** Withdraw a released publication: the pointer stops resolving immediately. */
  async withdraw(publicationId:string,requesterUid:string):Promise<PublicationRecord>{
    const record=await this.mustGet(publicationId);
    if(requesterUid!==record.ownerUid)throw new PublicationError('AUTHORITY_DENIED','only the owner may withdraw this publication');
    if(record.state!=='released')throw new PublicationError('INVALID_TRANSITION','withdrawal requires the released state; publication is '+record.state);
    const at=this.now();
    const swapped=await this.store.swapPointer(publicationId,record.revision,(current)=>({
      ...current,state:'withdrawn',pointer:null,updatedAt:at,
    }));
    await this.store.appendEvent(publicationId,{at,type:'withdrawn',actorUid:requesterUid,detail:'revision '+record.revision+' stopped'});
    return swapped;
  }

  /**
   * Restore a withdrawn publication back into REVIEW. Restored content never
   * returns to released directly: a fresh approval and a new atomic pointer
   * swap are required, so withdrawal always stops access until re-reviewed.
   */
  async restore(publicationId:string,requesterUid:string):Promise<PublicationRecord>{
    const record=await this.mustGet(publicationId);
    if(requesterUid!==record.ownerUid)throw new PublicationError('AUTHORITY_DENIED','only the owner may restore this publication');
    if(record.state!=='withdrawn')throw new PublicationError('INVALID_TRANSITION','restore requires the withdrawn state; publication is '+record.state);
    if(!record.ingestion.evaluationPassed)throw new PublicationError('INGESTION_INCOMPLETE','ingestion evaluation no longer passes; restore refused');
    const at=this.now();
    const swapped=await this.store.swapPointer(publicationId,record.revision,(current)=>({
      ...current,state:'in_review',review:null,updatedAt:at,
    }));
    await this.store.appendEvent(publicationId,{at,type:'restored',actorUid:requesterUid,detail:'re-entered review; fresh approval required before release'});
    return swapped;
  }

  /**
   * The reader gate: resolve the released pointer for a node. Withdrawn,
   * in_review and draft pointers refuse; released pointers resolve for any
   * authenticated reader (workspace/role/consent filtering is CONTENT-05).
   */
  async readPointer(nodeKey:string,requesterUid:string):Promise<PublicationPointer>{
    if(!requesterUid)throw new PublicationError('AUTHORITY_DENIED','an authenticated requester is required');
    const record=await this.store.getPointer(nodeKey);
    if(!record||!record.pointer)throw new PublicationError('PUB_NOT_RELEASED','no released pointer for '+nodeKey);
    return record.pointer;
  }

  /** Owner-scoped record read. */
  async getRecord(publicationId:string,requesterUid:string):Promise<PublicationRecord>{
    const record=await this.mustGet(publicationId);
    if(requesterUid!==record.ownerUid)throw new PublicationError('AUTHORITY_DENIED','publication records are owner-scoped');
    return record;
  }

  /** Durable observation events with cursor refetch; owner-scoped. */
  async listEvents(publicationId:string,requesterUid:string,cursor?:number,limit?:number):Promise<PublicationEventPage>{
    const record=await this.mustGet(publicationId);
    if(requesterUid!==record.ownerUid)throw new PublicationError('AUTHORITY_DENIED','publication events are owner-scoped');
    return this.store.listEvents(publicationId,cursor,limit);
  }

  private pointerDigest(record:PublicationRecord,revision:number):string{
    return createHash('sha256').update(JSON.stringify({
      nodeKey:record.nodeKey,
      source:record.source,
      revision,
      ingestion:record.ingestion.inputDigest,
    })).digest('hex');
  }

  private async mustGet(publicationId:string):Promise<PublicationRecord>{
    const record=await this.store.getPublication(publicationId);
    if(!record)throw new PublicationError('PUBLICATION_NOT_FOUND',publicationId);
    return record;
  }
}
