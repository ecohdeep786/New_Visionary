// CONTENT-05 — the gate itself. One entrypoint for retrieval and cache-lookup
// purposes, one for delivery-time recheck of pending output. Every decision is
// computed fresh (server-live), fail-closed on missing state, and bound to the
// fingerprint of its exact decision basis — query identity AND the pointer,
// consent and membership state it was computed from. Denials are typed
// reasons, not exceptions: a denial IS a valid, observable answer.
import { createHash } from 'node:crypto';
import type {
  ConsentState,GateDecision,GateDenyCode,PendingOutput,PointerState,
  RetrievalQueryContext,WorkspaceMembership,
} from './retrieval-gate-types';
import type { ConsentLookup,PointerLookup,WorkspaceLookup } from './retrieval-gate-lookups';

interface DecisionBasis {
  query:RetrievalQueryContext;
  pointer:Pick<PointerState,'state'|'revision'|'source'|'releasedLocales'>|null;
  consent:Pick<ConsentState,'policyRevision'|'revoked'>|null;
  membershipRole:string|null;
}

export class RetrievalGate {
  private readonly now:()=>string;
  constructor(
    private readonly pointers:PointerLookup,
    private readonly consents:ConsentLookup,
    private readonly workspaces:WorkspaceLookup,
    options:{ now?:()=>Date }={},
  ){
    this.now=options.now?()=>options.now().toISOString():()=>new Date().toISOString();
  }

  /**
   * The pre-retrieval / pre-cache-lookup authorization. Checks, in order:
   * authority → pointer released (source match, locale support) → consent →
   * workspace membership. First failure wins; every check re-runs per call.
   */
  async authorize(query:RetrievalQueryContext):Promise<GateDecision>{
    const deny=(reason:GateDenyCode,basis:DecisionBasis)=>this.decision(false,reason,basis);
    if(!query.requesterUid)return deny('AUTHORITY_MISSING',{query,pointer:null,consent:null,membershipRole:null});
    if(!query.nodeKey||!query.source?.provider||!query.source?.edition||!query.source?.version){
      return deny('AUTHORITY_MISSING',{query,pointer:null,consent:null,membershipRole:null});
    }

    const pointer=await this.pointers.byNode(query.nodeKey);
    const basis0:DecisionBasis={query,pointer,consent:null,membershipRole:null};
    if(!pointer)return deny('POINTER_NOT_RELEASED',basis0);
    if(pointer.state==='withdrawn')return deny('WITHDRAWN_POINTER',basis0);
    if(pointer.state!=='released')return deny('POINTER_NOT_RELEASED',basis0);
    if(pointer.source.provider!==query.source.provider||pointer.source.edition!==query.source.edition||pointer.source.version!==query.source.version){
      return deny('SOURCE_VERSION_MISMATCH',basis0);
    }
    if(query.locale!==null&&!pointer.releasedLocales.includes(query.locale))return deny('LOCALE_UNSUPPORTED',basis0);

    const consent=await this.consents.forSource(query.requesterUid,query.nodeKey);
    const basis1:DecisionBasis={query,pointer,consent,membershipRole:null};
    if(!consent)return deny('CONSENT_MISSING',basis1);
    if(consent.revoked)return deny('CONSENT_REVOKED',basis1);

    let membershipRole:string|null=null;
    if(query.workspaceId!==null){
      const membership:WorkspaceMembership|null=await this.workspaces.membership(query.requesterUid,query.workspaceId);
      if(!membership||!membership.member)return deny('WORKSPACE_MISMATCH',{query,pointer,consent,membershipRole});
      membershipRole=membership.role;
    }
    return this.decision(true,null,{query,pointer,consent,membershipRole});
  }

  /**
   * Delivery-time recheck for pending output: a result computed under an
   * earlier decision may only be served if a FRESH authorization still allows
   * it AND the decision basis is bit-identical (same pointer revision/state,
   * released locales, consent revision, membership role). A withdrawal, a
   * revision bump or a consent change between compute and delivery drops the
   * output — withdrawal stops pending output, not just new access.
   */
  async authorizeDelivery(pending:PendingOutput):Promise<GateDecision>{
    const fresh=await this.authorize(pending.queryContext);
    if(!fresh.allowed)return {...fresh,reason:fresh.reason??'STALE_DECISION'};
    if(fresh.fingerprint!==pending.originalDecision.fingerprint){
      return {...fresh,allowed:false,reason:'STALE_DECISION'};
    }
    return fresh;
  }

  private decision(allowed:boolean,reason:GateDenyCode|null,basis:DecisionBasis):GateDecision{
    return {
      allowed,
      reason,
      decisionSource:'server-live',
      fingerprint:createHash('sha256').update(JSON.stringify(basis)).digest('hex'),
      checkedAt:this.now(),
    };
  }
}
