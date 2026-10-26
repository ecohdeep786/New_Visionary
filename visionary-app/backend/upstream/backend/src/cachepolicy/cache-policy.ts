// CACHE-01 — the product-wide cache policy table, one entry per feature-delivery
// matrix family, encoding the matrix's cache statements as enforced invariants.
// Launch default: NO server-side cache anywhere (activation stays blocked until
// the measured-need and isolation evidence of LATER-05/KAN-136); browser caching
// is bounded and event-driven; private material never reaches shared caches;
// entitlement/consent/permission decisions are never cache-authoritative.
import type { CachePolicyEntry, CachePolicyReport, CachePolicyViolation } from './cache-policy-types';

const BLOCKED='blocked-until-measured-need' as const;

function entry(e:Omit<CachePolicyEntry,'activation'>):CachePolicyEntry{
  return {...e,activation:BLOCKED};
}

export const CACHE_POLICY:readonly CachePolicyEntry[]=[
  entry({
    family:'public',
    canonicalStore:'none',
    revisionSource:'hashed asset digest; HTML/catalog revision revalidation',
    scopeKeys:['locale'],
    privateResponse:false,
    sharedCdnCacheable:true,
    browserCache:{enabled:true,maxAgeSeconds:300,invalidation:'event-driven'},
    apiCache:{enabled:false,maxAgeSeconds:null,invalidation:'no-store'},
    fallback:'pass-through',
    invalidationTriggers:['asset digest change','catalog revision bump'],
    notes:'Public hashed assets CDN only; revalidate HTML/catalog revisions; personalized checkout/auth returns are never publicly cached.',
  }),
  entry({
    family:'account',
    canonicalStore:'firestore-account',
    revisionSource:'account document update time + session revision',
    scopeKeys:['uid'],
    privateResponse:true,
    sharedCdnCacheable:false,
    browserCache:{enabled:false,maxAgeSeconds:null,invalidation:'no-store'},
    apiCache:{enabled:false,maxAgeSeconds:null,invalidation:'no-store'},
    fallback:'fail-closed',
    invalidationTriggers:['logout','account switch','credential/session revocation','profile mutation commit'],
    notes:'No shared auth/profile cache; account-scoped queries clear on logout/switch/revocation.',
  }),
  entry({
    family:'workspaces',
    canonicalStore:'sql-domain',
    revisionSource:'membership/policy revision cursor',
    scopeKeys:['uid','workspaceId','policyRevision'],
    privateResponse:true,
    sharedCdnCacheable:false,
    browserCache:{enabled:false,maxAgeSeconds:null,invalidation:'no-store'},
    apiCache:{enabled:false,maxAgeSeconds:null,invalidation:'no-store'},
    fallback:'fail-closed',
    invalidationTriggers:['permission grant/withdrawal','consent change','workspace switch','policy revision bump'],
    notes:'Partition by UID/workspace/policy; permission withdrawal invalidates pending and cache-derived access.',
  }),
  entry({
    family:'sources',
    canonicalStore:'sql-domain',
    revisionSource:'publication pointer revision + source version',
    scopeKeys:['uid','workspaceId','sourceVersion','locale'],
    privateResponse:true,
    sharedCdnCacheable:false,
    browserCache:{enabled:false,maxAgeSeconds:null,invalidation:'no-store'},
    apiCache:{enabled:false,maxAgeSeconds:null,invalidation:'no-store'},
    fallback:'fail-closed',
    invalidationTriggers:['publication withdrawal (pointer stops)','source version change','release/withdraw atomic swap','consent change'],
    notes:'Only permission-filtered source/release/version/locale views; withdrawal stops new retrieval and pending delivery (CONTENT-03/05 gates).',
  }),
  entry({
    family:'learn',
    canonicalStore:'sql-domain',
    revisionSource:'session revision + committed checkpoint cursor',
    scopeKeys:['uid','workspaceId','sourceVersion','sessionId'],
    privateResponse:true,
    sharedCdnCacheable:false,
    browserCache:{enabled:false,maxAgeSeconds:null,invalidation:'no-store'},
    apiCache:{enabled:false,maxAgeSeconds:null,invalidation:'no-store'},
    fallback:'fail-closed',
    invalidationTriggers:['session commit','checkpoint mutation','source withdrawal'],
    notes:'UID/workspace/source/session revision keys; unsaved local drafts stay separate from committed checkpoints.',
  }),
  entry({
    family:'ask',
    canonicalStore:'none',
    revisionSource:'not cached; responses are run-scoped',
    scopeKeys:['uid','runId'],
    privateResponse:true,
    sharedCdnCacheable:false,
    browserCache:{enabled:false,maxAgeSeconds:null,invalidation:'no-store'},
    apiCache:{enabled:false,maxAgeSeconds:null,invalidation:'no-store'},
    fallback:'fail-closed',
    invalidationTriggers:['no-store'],
    notes:'Scoped response caching remains off until the AI-05 isolation proof; never a global query-to-answer cache.',
  }),
  entry({
    family:'guide',
    canonicalStore:'sql-domain',
    revisionSource:'memory policy revision + plan revision',
    scopeKeys:['uid','policyRevision'],
    privateResponse:true,
    sharedCdnCacheable:false,
    browserCache:{enabled:false,maxAgeSeconds:null,invalidation:'no-store'},
    apiCache:{enabled:false,maxAgeSeconds:null,invalidation:'no-store'},
    fallback:'fail-closed',
    invalidationTriggers:['memory preference change','policy revision bump','plan mutation commit'],
    notes:'No unscoped personal-memory cache; current policy and memory preference are checked on each use.',
  }),
  entry({
    family:'practice',
    canonicalStore:'sql-domain',
    revisionSource:'attempt/evidence revision',
    scopeKeys:['uid','workspaceId','criteriaVersion'],
    privateResponse:true,
    sharedCdnCacheable:false,
    browserCache:{enabled:false,maxAgeSeconds:null,invalidation:'no-store'},
    apiCache:{enabled:false,maxAgeSeconds:null,invalidation:'no-store'},
    fallback:'fail-closed',
    invalidationTriggers:['attempt commit','criteria version change'],
    notes:'Answer keys and learner attempts never enter public/shared payloads; derived evidence queries are version-bound.',
  }),
  entry({
    family:'progress',
    canonicalStore:'sql-domain',
    revisionSource:'projection revision from immutable evidence',
    scopeKeys:['uid','workspaceId','projectionRevision'],
    privateResponse:true,
    sharedCdnCacheable:false,
    browserCache:{enabled:false,maxAgeSeconds:null,invalidation:'no-store'},
    apiCache:{enabled:false,maxAgeSeconds:null,invalidation:'no-store'},
    fallback:'fail-closed',
    invalidationTriggers:['evidence commit','projection rebuild start/finish'],
    notes:'Revisioned owner/workspace/projection keys; stale/rebuilding states are marked and refetched from evidence-backed authority.',
  }),
  entry({
    family:'build',
    canonicalStore:'sql-domain',
    revisionSource:'committed project revision + run snapshot id',
    scopeKeys:['uid','projectId','runId'],
    privateResponse:true,
    sharedCdnCacheable:false,
    browserCache:{enabled:false,maxAgeSeconds:null,invalidation:'no-store'},
    apiCache:{enabled:false,maxAgeSeconds:null,invalidation:'no-store'},
    fallback:'fail-closed',
    invalidationTriggers:['project commit','run snapshot immutabilization'],
    notes:'Per-tab original-base drafts stay separate from immutable committed revisions; stale proposals cannot update head.',
  }),
  entry({
    family:'classroom',
    canonicalStore:'sql-domain',
    revisionSource:'enrollment/submission review revision',
    scopeKeys:['uid','workspaceId','classroomId','submissionRevision'],
    privateResponse:true,
    sharedCdnCacheable:false,
    browserCache:{enabled:false,maxAgeSeconds:null,invalidation:'no-store'},
    apiCache:{enabled:false,maxAgeSeconds:null,invalidation:'no-store'},
    fallback:'fail-closed',
    invalidationTriggers:['enrollment change','submission/review revision bump'],
    notes:'Teachers see only permitted submitted copies/fields; private learner drafts/chat are excluded from any derivative.',
  }),
  entry({
    family:'guardian',
    canonicalStore:'sql-domain',
    revisionSource:'relationship purpose/period revision',
    scopeKeys:['uid','guardianUid','purpose','periodEnd'],
    privateResponse:true,
    sharedCdnCacheable:false,
    browserCache:{enabled:false,maxAgeSeconds:null,invalidation:'no-store'},
    apiCache:{enabled:false,maxAgeSeconds:null,invalidation:'no-store'},
    fallback:'fail-closed',
    invalidationTriggers:['relationship withdrawal','purpose/period change'],
    notes:'No child chat/draft cache access; summaries are purpose/period/policy scoped with immediate future-access withdrawal.',
  }),
  entry({
    family:'professional',
    canonicalStore:'sql-domain',
    revisionSource:'access agreement revision',
    scopeKeys:['uid','employerContext','agreementRevision'],
    privateResponse:true,
    sharedCdnCacheable:false,
    browserCache:{enabled:false,maxAgeSeconds:null,invalidation:'no-store'},
    apiCache:{enabled:false,maxAgeSeconds:null,invalidation:'no-store'},
    fallback:'fail-closed',
    invalidationTriggers:['employer access withdrawal','agreement revision bump'],
    notes:'Personal and company query/memory namespaces stay distinct; employer withdrawal invalidates only the agreed access.',
  }),
  entry({
    family:'organization',
    canonicalStore:'sql-domain',
    revisionSource:'organization/policy/release revision',
    scopeKeys:['uid','organizationId','policyRevision','releaseVersion'],
    privateResponse:true,
    sharedCdnCacheable:false,
    browserCache:{enabled:false,maxAgeSeconds:null,invalidation:'no-store'},
    apiCache:{enabled:false,maxAgeSeconds:null,invalidation:'no-store'},
    fallback:'fail-closed',
    invalidationTriggers:['organization policy change','release version change','membership change'],
    notes:'Organization/policy/release scoped projections; aggregates must never leak small-group/private student records.',
  }),
  entry({
    family:'billing',
    canonicalStore:'firestore-account',
    revisionSource:'entitlement/subscription state (server-live)',
    scopeKeys:['uid'],
    privateResponse:true,
    sharedCdnCacheable:false,
    browserCache:{enabled:false,maxAgeSeconds:null,invalidation:'no-store'},
    apiCache:{enabled:false,maxAgeSeconds:null,invalidation:'no-store'},
    fallback:'fail-closed',
    invalidationTriggers:['entitlement change','subscription mutation','webhook settlement'],
    notes:'Payment state/entitlement is always resolved authoritatively at request time; no public cache of private receipts; client events never infer paid success.',
  }),
  entry({
    family:'notifications',
    canonicalStore:'sql-domain',
    revisionSource:'inbox revision + unread count projection',
    scopeKeys:['uid','workspaceId','inboxRevision'],
    privateResponse:true,
    sharedCdnCacheable:false,
    browserCache:{enabled:false,maxAgeSeconds:null,invalidation:'no-store'},
    apiCache:{enabled:false,maxAgeSeconds:null,invalidation:'no-store'},
    fallback:'fail-closed',
    invalidationTriggers:['inbox mutation','preferences change'],
    notes:'Owner/workspace/policy/inbox revision with a bounded unread projection; no private material in public email links.',
  }),
  entry({
    family:'privacy',
    canonicalStore:'sql-domain',
    revisionSource:'consent/revocation policy revision',
    scopeKeys:['uid','policyRevision'],
    privateResponse:true,
    sharedCdnCacheable:false,
    browserCache:{enabled:false,maxAgeSeconds:null,invalidation:'no-store'},
    apiCache:{enabled:false,maxAgeSeconds:null,invalidation:'no-store'},
    fallback:'fail-closed',
    invalidationTriggers:['consent/revocation change','deletion request accepted','derived-context purge'],
    notes:'Revocation covers queries, objects, model contexts and derived caches; the cache policy never invents a record-retention TTL.',
  }),
  entry({
    family:'feedback',
    canonicalStore:'firestore-account',
    revisionSource:'submission receipt revision',
    scopeKeys:['uid','submissionKey'],
    privateResponse:true,
    sharedCdnCacheable:false,
    browserCache:{enabled:false,maxAgeSeconds:null,invalidation:'no-store'},
    apiCache:{enabled:false,maxAgeSeconds:null,invalidation:'no-store'},
    fallback:'fail-closed',
    invalidationTriggers:['submission commit','retry with original mutation key'],
    notes:'No shared feedback/note cache; an ambiguous submission keeps its draft and replays the original command key.',
  }),
];

/**
 * Enforce the CACHE-01 invariants over the policy table. A violation is a
 * defect in the policy artifact itself, not a runtime condition.
 */
export function validateCachePolicy(entries:readonly CachePolicyEntry[]):CachePolicyReport{
  const violations:CachePolicyViolation[]=[];
  const seen=new Set<string>();
  for(const e of entries){
    const fam=e.family;
    if(seen.has(fam))violations.push({family:fam,rule:'unique-family',detail:'duplicate policy entry'});
    seen.add(fam);
    if(e.privateResponse&&e.sharedCdnCacheable)violations.push({family:fam,rule:'private-never-shared-cdn',detail:'private responses must not be shared-CDN cacheable'});
    if(e.privateResponse&&(!e.scopeKeys.includes('uid')))violations.push({family:fam,rule:'private-scope-uid',detail:'private families must scope at least by uid'});
    if(e.apiCache.enabled)violations.push({family:fam,rule:'no-server-cache-at-launch',detail:'server cache is disabled until the LATER-05 measured-need and isolation gate'});
    if(e.browserCache.enabled){
      if(e.browserCache.invalidation!=='event-driven')violations.push({family:fam,rule:'event-driven-invalidation',detail:'enabled caches invalidate by event, not by TTL expiry'});
      if(!e.invalidationTriggers.length)violations.push({family:fam,rule:'invalidation-triggers-required',detail:'an enabled cache must name its invalidation events'});
    }else if(e.browserCache.invalidation!=='no-store'){
      violations.push({family:fam,rule:'disabled-means-no-store',detail:'a disabled browser cache must be declared no-store'});
    }
    for(const maxAge of [e.browserCache.maxAgeSeconds,e.apiCache.maxAgeSeconds]){
      if(maxAge!==null&&(!Number.isFinite(maxAge)||maxAge<=0||maxAge>86400))violations.push({family:fam,rule:'bounded-freshness',detail:'freshness bounds are positive and capped at 86400s'});
    }
    if(e.privateResponse&&e.fallback!=='fail-closed')violations.push({family:fam,rule:'private-fails-closed',detail:'private reads fail closed to the canonical store when a cache is down'});
    if(!e.privateResponse&&e.fallback!=='pass-through')violations.push({family:fam,rule:'public-pass-through',detail:'public families declare pass-through degradation'});
  }
  return {valid:violations.length===0,violations};
}

/**
 * Completeness against the feature-delivery matrix: every family in the matrix
 * has exactly one policy entry and no entry exists without a matrix family.
 */
export function coverageAgainstMatrix(entries:readonly CachePolicyEntry[],matrixFamilyIds:readonly string[]):CachePolicyReport{
  const violations:CachePolicyViolation[]=[];
  const policy=new Set(entries.map((e)=>e.family));
  const matrix=new Set(matrixFamilyIds);
  for(const id of matrixFamilyIds)if(!policy.has(id))violations.push({family:id,rule:'matrix-coverage',detail:'feature family has no cache policy entry'});
  for(const e of entries)if(!matrix.has(e.family))violations.push({family:e.family,rule:'matrix-coverage',detail:'policy entry without a feature-delivery matrix family'});
  return {valid:violations.length===0,violations};
}
