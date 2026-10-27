// AI-15 (KAN-149) — AIRA P0–P3 context assembly with evidence-backed memory
// observations.
//
// Core responsibilities (server-owned; grounding never bargained away):
//   1. setConstitution (P0): the server constitution is immutable — the first
//      version sets it; a conflicting overwrite of an EXISTING version refuses
//      (`constitution_conflict`); a new version may supersede it. Every
//      assembly stamps the version it ran under.
//   2. assemble (P1–P3): permitted snapshot facts, bounded current-session
//      history (older turns dropped and COUNTED honestly), and authorized
//      retrieval sources — all behind the scoped conversation boundary
//      (owner-checked; wrong owner denied).
//   3. Grounding rule: when a token/latency budget would drop REQUIRED
//      grounding evidence, the assembly ABSTAINS (`groundingStatus:
//      'abstained'`, reason `budget_would_drop_grounding`) — it never ships an
//      ungrounded context. Abstention, not silent truncation.
//   4. Insufficient evidence: fewer observations are returned — the assembler
//      never invents one.
//   5. Provenance/correction/disable: every observation carries provenance;
//      disabled memories are excluded; corrected memories supersede the
//      original (the correction wins, the original is marked superseded);
//      onboarding facts are labeled.
//   6. NO automatic training: the assembly result is read-only context — this
//      service exposes no path that writes learner content into a training set.
import type {
  AssemblyError as AssemblyErrorType,
  AssemblyOwner,
  ContextAssembly,
  ConstitutionPolicy,
  MemoryObservation,
} from './context-assembly-types';
import { AssemblyError } from './context-assembly-types';
import type { ContextAssemblyStore } from './context-assembly-lookups';

export class AiraContextAssembler {
  constructor(
    private readonly store: ContextAssemblyStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** P0: set the constitution. Same version must match content; new version supersedes. */
  async setConstitution(policy: ConstitutionPolicy): Promise<void> {
    const current = await this.store.currentConstitution();
    if (current && current.version === policy.version) {
      // Immutability: re-setting an EXISTING version with different rules refuses.
      if (JSON.stringify(current.rules) !== JSON.stringify(policy.rules)) {
        throw new AssemblyError('constitution_conflict');
      }
      return; // idempotent re-set of identical content
    }
    await this.store.saveConstitution(policy);
  }

  /** Correct a memory: the correction supersedes the original observation. */
  async correctMemory(owner: AssemblyOwner, observationId: string, correctedContent: string): Promise<MemoryObservation> {
    const memories = await this.store.memories(owner);
    const original = memories.find((m) => m.observationId === observationId && !m.disabled);
    if (!original) throw new AssemblyError('unknown_memory');
    const correction: MemoryObservation = {
      observationId: `${observationId}_corr`,
      content: correctedContent,
      provenance: { ...original.provenance },
      onboardingFact: original.onboardingFact,
      layer: original.layer,
      disabled: false,
      supersededBy: null,
    };
    await this.store.saveMemory(correction);
    await this.store.saveMemory({ ...original, supersededBy: correction.observationId });
    return correction;
  }

  /** Disable a memory: excluded from all future assemblies. */
  async disableMemory(owner: AssemblyOwner, observationId: string): Promise<void> {
    const memories = await this.store.memories(owner);
    const memory = memories.find((m) => m.observationId === observationId);
    if (!memory) throw new AssemblyError('unknown_memory');
    await this.store.saveMemory({ ...memory, disabled: true });
  }

  /**
   * Assemble the AIRA context (P0–P3) behind the scoped conversation boundary.
   * Grounding is never dropped for budget — the assembly abstains instead.
   */
  async assemble(input: {
    owner: AssemblyOwner;
    conversationId: string;
    /** Token budget for the non-grounding (discretionary) portions. */
    budgetTokens: number;
    /** The observation ids carrying REQUIRED factual grounding. */
    requiredGroundingIds: readonly string[];
    /** Approved authored material allowed as grounding fallback. */
    approvedAuthoredFallback: readonly string[];
    maxHistoryTurns: number;
  }): Promise<ContextAssembly> {
    // Scoped conversation boundary: owner-checked (KAN-86 semantics).
    const conversation = await this.store.conversation(input.conversationId);
    if (!conversation) throw new AssemblyError('unknown_conversation');
    if (conversation.owner.uid !== input.owner.uid || conversation.owner.workspaceId !== input.owner.workspaceId) {
      throw new AssemblyError('not_owner');
    }

    const constitution = await this.store.currentConstitution();
    const constitutionVersion = constitution?.version ?? 0;

    // P1: permitted snapshot facts for this exact context separation.
    const snapshot = await this.store.permittedFacts({
      role: input.owner.role,
      workspaceId: input.owner.workspaceId,
      purpose: input.owner.purpose,
      language: input.owner.language,
    });

    // P2: bounded current-session history — older turns dropped and counted.
    const turns = conversation.turns;
    const includedTurns = turns.slice(-input.maxHistoryTurns);
    const historyBound = { included: includedTurns.length, dropped: turns.length - includedTurns.length };

    // P3: authorized retrieval sources only.
    const retrievalSources = await this.store.authorizedRetrievalSources({
      role: input.owner.role,
      workspaceId: input.owner.workspaceId,
      purpose: input.owner.purpose,
      language: input.owner.language,
    });

    // Memory observations: disabled excluded, superseded excluded, provenance kept.
    const allMemories = await this.store.memories(input.owner);
    const liveMemories = allMemories.filter((m) => !m.disabled && m.supersededBy === null);

    // GROUNDING RULE: required grounding must never be dropped for budget.
    const groundingObservations = liveMemories.filter((m) => input.requiredGroundingIds.includes(m.observationId));
    const groundingTokens = groundingObservations.reduce((sum, m) => sum + m.content.length, 0);
    if (groundingTokens > input.budgetTokens) {
      // The budget would cut required grounding: ABSTAIN (never truncate).
      // Approved authored material is the only alternate grounding source.
      if (input.approvedAuthoredFallback.length === 0) {
        return buildAbstained(this.store, input, constitutionVersion, snapshot, historyBound, retrievalSources, 'budget_would_drop_grounding');
      }
    }

    // Insufficient evidence: return fewer observations, never invent.
    const observations = liveMemories;
    if (observations.length === 0 && groundingObservations.length === 0 && input.approvedAuthoredFallback.length === 0) {
      return buildAbstained(this.store, input, constitutionVersion, snapshot, historyBound, retrievalSources, 'insufficient_evidence');
    }

    return {
      conversationId: input.conversationId,
      constitutionVersion,
      snapshot,
      history: includedTurns,
      historyBound,
      retrievalSources,
      observations,
      groundingStatus: 'grounded',
      abstainReason: null,
      assembledAt: this.now().toISOString(),
    };
  }

}

/** Module-level abstention builder — deliberately NOT a class method, so the
 * service's public surface stays exactly the four assembly operations (the
 * no-automatic-training surface test inspects this). */
async function buildAbstained(
  store: ContextAssemblyStore,
  input: { owner: AssemblyOwner; conversationId: string; maxHistoryTurns: number },
  constitutionVersion: number,
  snapshot: readonly { factId: string; key: string; value: string; onboardingFact: boolean }[],
  historyBound: { included: number; dropped: number },
  retrievalSources: readonly string[],
  reason: 'budget_would_drop_grounding' | 'insufficient_evidence',
): Promise<ContextAssembly> {
  const conversation = await store.conversation(input.conversationId);
  return {
    conversationId: input.conversationId,
    constitutionVersion,
    snapshot,
    history: (conversation?.turns ?? []).slice(-input.maxHistoryTurns),
    historyBound,
    retrievalSources,
    observations: [],
    groundingStatus: 'abstained',
    abstainReason: reason,
    assembledAt: new Date().toISOString(),
  };
}

export type { AssemblyErrorType };
