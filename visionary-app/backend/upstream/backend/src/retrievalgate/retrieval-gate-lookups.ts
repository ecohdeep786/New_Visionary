// CONTENT-05 — the gate's state lookups. Each is a typed seam the durable
// stores implement at integration; the in-memory implementations are
// contract-true and fail closed: an unknown answer denies, never allows.
import type {
  ConsentState,PointerState,RetrievalQueryContext,WorkspaceMembership,
} from './retrieval-gate-types';

export interface PointerLookup {
  /** Current released/withdrawn pointer state for a node; null denies. */
  byNode(nodeKey:string):Promise<PointerState|null>;
}

export interface ConsentLookup {
  /** Consent for the requester over this node's source; null denies. */
  forSource(requesterUid:string,nodeKey:string):Promise<ConsentState|null>;
}

export interface WorkspaceLookup {
  /** Membership for the requester in the query's workspace; null denies. */
  membership(requesterUid:string,workspaceId:string):Promise<WorkspaceMembership|null>;
}

export class InMemoryLookups implements PointerLookup,ConsentLookup,WorkspaceLookup {
  private readonly pointers=new Map<string,PointerState>();
  private readonly consents=new Map<string,ConsentState>();
  private readonly memberships=new Map<string,WorkspaceMembership>();

  setPointer(nodeKey:string,state:PointerState|null):void{
    if(state===null)this.pointers.delete(nodeKey);
    else this.pointers.set(nodeKey,{...state,source:{...state.source},releasedLocales:[...state.releasedLocales]});
  }

  setConsent(requesterUid:string,nodeKey:string,state:ConsentState|null):void{
    const key=requesterUid+'|'+nodeKey;
    if(state===null)this.consents.delete(key);
    else this.consents.set(key,{...state});
  }

  setMembership(requesterUid:string,workspaceId:string,state:WorkspaceMembership|null):void{
    const key=requesterUid+'|'+workspaceId;
    if(state===null)this.memberships.delete(key);
    else this.memberships.set(key,{...state});
  }

  async byNode(nodeKey:string):Promise<PointerState|null>{
    const state=this.pointers.get(nodeKey);
    return state?{...state,source:{...state.source},releasedLocales:[...state.releasedLocales]}:null;
  }

  async forSource(requesterUid:string,nodeKey:string):Promise<ConsentState|null>{
    return this.consents.get(requesterUid+'|'+nodeKey)??null;
  }

  async membership(requesterUid:string,workspaceId:string):Promise<WorkspaceMembership|null>{
    return this.memberships.get(requesterUid+'|'+workspaceId)??null;
  }
}
