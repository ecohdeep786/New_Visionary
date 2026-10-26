// CONTENT-03 — durable publication storage. The interface is the seam the SQL
// domain store implements next; InMemoryPublicationStore is contract-true and
// keeps the atomic pointer semantics a real single-statement conditional
// UPDATE would provide: one compare-and-swap per nodeKey, no read-modify-write
// races, and event sequences for durable observation.
import type {
  PublicationEvent,PublicationEventPage,PublicationRecord,PublicationPointer,
} from './publication-types';
import { PublicationError } from './publication-errors';

export interface PublicationStore {
  createPublication(record:PublicationRecord):Promise<void>;
  getPublication(publicationId:string):Promise<PublicationRecord|null>;
  getPublicationByNode(nodeKey:string,sourceVersion:string):Promise<PublicationRecord|null>;
  getPointer(nodeKey:string):Promise<PublicationRecord|null>;
  /**
   * Atomic compare-and-swap on the released pointer revision. Applies `swap`
   * only when the stored revision still equals expectedRevision; otherwise
   * refuses with CONCURRENT_REVISION_CONFLICT. Idempotent replay of a release
   * command is the SERVICE's call: it re-reads and matches the committed
   * targetDigest, so a same-payload retry deduplicates while any other lost
   * race (e.g. a concurrent withdraw) fails loudly instead of being swallowed.
   */
  swapPointer(publicationId:string,expectedRevision:number,swap:(record:PublicationRecord)=>PublicationRecord):Promise<PublicationRecord>;
  appendEvent(publicationId:string,event:Omit<PublicationEvent,'seq'>):Promise<PublicationEvent>;
  listEvents(publicationId:string,cursor?:number,limit?:number):Promise<PublicationEventPage>;
}

const ACTIVE_STATES=new Set(['draft','in_review','released']);

function clone<T>(value:T):T{
  return JSON.parse(JSON.stringify(value)) as T;
}

export class InMemoryPublicationStore implements PublicationStore {
  private readonly records=new Map<string,PublicationRecord>();
  private readonly byNode=new Map<string,string[]>();
  private readonly events=new Map<string,PublicationEvent[]>();
  private seq=0;

  async createPublication(record:PublicationRecord):Promise<void>{
    const duplicate=await this.getPublicationByNode(record.nodeKey,record.source.version);
    if(duplicate&&ACTIVE_STATES.has(duplicate.state)){
      throw new PublicationError('DUPLICATE_PUBLICATION','an active publication already exists for '+record.nodeKey+'@'+record.source.version);
    }
    if(this.records.has(record.publicationId))throw new PublicationError('DUPLICATE_PUBLICATION','publication id collision');
    this.records.set(record.publicationId,clone(record));
    const key=record.nodeKey+'@'+record.source.version;
    const list=this.byNode.get(key)??[];
    list.push(record.publicationId);
    this.byNode.set(key,list);
  }

  async getPublication(publicationId:string):Promise<PublicationRecord|null>{
    const record=this.records.get(publicationId);
    return record?clone(record):null;
  }

  async getPublicationByNode(nodeKey:string,sourceVersion:string):Promise<PublicationRecord|null>{
    const list=this.byNode.get(nodeKey+'@'+sourceVersion)??[];
    for(let i=list.length-1;i>=0;i--){
      const record=this.records.get(list[i]);
      if(record)return clone(record);
    }
    return null;
  }

  async getPointer(nodeKey:string):Promise<PublicationRecord|null>{
    // The released pointer for a node is the highest-revision released record.
    let best:PublicationRecord|null=null;
    for(const record of this.records.values()){
      if(record.nodeKey!==nodeKey||record.state!=='released'||!record.pointer)continue;
      if(!best||(record.pointer.revision>best.pointer!.revision))best=clone(record);
    }
    return best;
  }

  async swapPointer(publicationId:string,expectedRevision:number,swap:(record:PublicationRecord)=>PublicationRecord):Promise<PublicationRecord>{
    const record=this.records.get(publicationId);
    if(!record)throw new PublicationError('PUBLICATION_NOT_FOUND',publicationId);
    if(record.revision!==expectedRevision){
      throw new PublicationError('CONCURRENT_REVISION_CONFLICT','expected revision '+expectedRevision+' but pointer holds '+record.revision);
    }
    const next=swap(clone(record));
    this.records.set(publicationId,clone(next));
    return clone(next);
  }

  async appendEvent(publicationId:string,event:Omit<PublicationEvent,'seq'>):Promise<PublicationEvent>{
    this.seq+=1;
    const full:PublicationEvent={...event,seq:this.seq};
    const list=this.events.get(publicationId)??[];
    list.push(full);
    this.events.set(publicationId,list);
    return {...full};
  }

  async listEvents(publicationId:string,cursor?:number,limit=50):Promise<PublicationEventPage>{
    const filtered=(this.events.get(publicationId)??[]).filter((e)=>cursor===undefined||e.seq>cursor);
    const page=filtered.slice(0,Math.max(1,limit));
    const last=page.length?page[page.length-1].seq:cursor??0;
    return {events:page.map((e)=>({...e})),nextCursor:filtered.length>page.length?last:null};
  }
}
