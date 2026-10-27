// AI-15 (KAN-149) — AIRA P0–P3 context assembly and evidence-backed memory
// observations behind the current scoped conversation boundary.
//
// The checkpoint here is honest, inspectable context assembly:
//   - P0 CONSTITUTION: an immutable server constitution/policy — set once,
//     versioned; a conflicting overwrite is refused; every assembly stamps the
//     constitution version it ran under.
//   - P1 PERMITTED SNAPSHOT: only permitted learner/context facts enter —
//     role, workspace, purpose and language contexts stay SEPARATE (five-way
//     separation); two assemblies for different purposes/languages never see
//     each other's context.
//   - P2 BOUNDED HISTORY: only the bounded current-session history enters —
//     older turns are dropped HONESTLY (counted, not hidden); no cross-session
//     bleed.
//   - P3 AUTHORIZED RETRIEVAL: only sources the caller may retrieve enter
//     (server-side filtering; forbidden sources never reach the model).
//   - GROUNDING IS NEVER BARGAINED AWAY: required factual grounding must not
//     be dropped to meet a token/latency budget — when the budget would cut
//     grounding evidence, the assembly ABSTAINS (groundingStatus 'abstained')
//     or falls back to APPROVED AUTHORED material, never to an ungrounded
//     answer.
//   - INSUFFICIENT EVIDENCE: the assembler returns FEWER observations when
//     evidence is insufficient — it never invents an observation.
//   - PROVENANCE / CORRECTION / DISABLE: every observation carries provenance
//     (sourceId + reviewedRef); onboarding facts are labeled; a disabled
//     memory is excluded; a corrected memory supersedes the original.
//   - NO AUTOMATIC TRAINING: the assembly exposes no training sink — an
//     assembly result is conversation context, never a training write.
//
// Exit: evaluated, authorized assistance behind the scoped conversation
// boundary with inspectable, evidence-backed observations.

/** The authenticated assembly caller (server-derived). */
export interface AssemblyOwner {
  uid: string;
  workspaceId: string;
  /** Five-way context separation inputs. */
  role: string;
  purpose: string;
  language: string;
}

/** The immutable server constitution/policy (P0). */
export interface ConstitutionPolicy {
  version: number;
  /** The policy rules text — immutable once set for a version. */
  rules: readonly string[];
}

/** A permitted learner/context fact (P1). */
export interface PermittedFact {
  factId: string;
  key: string;
  value: string;
  /** Onboarding facts are labeled as such (never mixed into learned evidence). */
  onboardingFact: boolean;
}

/** One evidence-backed memory observation. */
export interface MemoryObservation {
  observationId: string;
  content: string;
  /** Provenance: where this observation comes from. */
  provenance: { sourceId: string; reviewedRef: string | null };
  /** Onboarding facts are labeled. */
  onboardingFact: boolean;
  /** Layer the observation was drawn from: 'history' | 'retrieval' | 'fact'. */
  layer: 'history' | 'retrieval' | 'fact';
  /** Disabled memories are excluded from assemblies entirely. */
  disabled: boolean;
  /** When corrected, the correcting observation supersedes this one. */
  supersededBy: string | null;
}

/** The full AIRA context assembly result. */
export interface ContextAssembly {
  conversationId: string;
  /** The constitution version this assembly ran under (P0). */
  constitutionVersion: number;
  /** P1 permitted snapshot facts (context-separated). */
  snapshot: readonly PermittedFact[];
  /** P2 bounded current-session history. */
  history: readonly { turnId: string; role: 'learner' | 'assistant'; body: string }[];
  /** Honest accounting of the history bound. */
  historyBound: { included: number; dropped: number };
  /** P3 authorized retrieval source ids. */
  retrievalSources: readonly string[];
  /** The evidence-backed observations (fewer when evidence is insufficient). */
  observations: readonly MemoryObservation[];
  /** 'grounded' only when required grounding is present; else 'abstained'. */
  groundingStatus: 'grounded' | 'abstained';
  /** Why abstained (present only when abstained). */
  abstainReason: 'budget_would_drop_grounding' | 'insufficient_evidence' | null;
  assembledAt: string;
}

export class AssemblyError extends Error {
  constructor(
    public readonly code:
      | 'not_owner'
      | 'unknown_conversation'
      | 'constitution_conflict'
      | 'unknown_memory'
  ) {
    super(code);
  }
}
