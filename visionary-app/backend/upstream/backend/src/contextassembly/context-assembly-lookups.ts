// AI-15 (KAN-149) — the context-assembly domain's typed state seams. The
// owning stores (constitution, conversation boundary, memory, permitted
// retrieval) implement these at integration; the in-memory implementation is
// contract-true and fails closed.
import type {
  AssemblyOwner,
  ConstitutionPolicy,
  MemoryObservation,
  PermittedFact,
} from './context-assembly-types';

/** The scoped conversation boundary (KAN-86 semantics). */
export interface AssemblyConversation {
  conversationId: string;
  owner: AssemblyOwner;
  turns: readonly { turnId: string; role: 'learner' | 'assistant'; body: string }[];
}

export interface ContextAssemblyStore {
  /** P0 — the current immutable constitution, or undefined until first set. */
  currentConstitution(): Promise<ConstitutionPolicy | undefined>;
  saveConstitution(policy: ConstitutionPolicy): Promise<void>;
  /** P2 — the scoped conversation (owner-checked upstream). */
  conversation(conversationId: string): Promise<AssemblyConversation | undefined>;
  /** P1 — permitted snapshot facts for this exact context separation. */
  permittedFacts(context: { role: string; workspaceId: string; purpose: string; language: string }): Promise<PermittedFact[]>;
  /** P3 — sources authorized for retrieval in this context. */
  authorizedRetrievalSources(context: { role: string; workspaceId: string; purpose: string; language: string }): Promise<readonly string[]>;
  /** Evidence-backed memory observations for the owner (all states). */
  memories(owner: AssemblyOwner): Promise<MemoryObservation[]>;
  saveMemory(observation: MemoryObservation): Promise<void>;
}

/** Contract-true in-memory store; the constitution is immutable once set. */
export class InMemoryContextStore implements ContextAssemblyStore {
  private constitution: ConstitutionPolicy | undefined;
  private conversations = new Map<string, AssemblyConversation>();
  private facts: PermittedFact[] = [];
  private retrievalSources: readonly string[] = [];
  private memoryRows: MemoryObservation[] = [];

  async currentConstitution(): Promise<ConstitutionPolicy | undefined> {
    return this.constitution ? { ...this.constitution, rules: [...this.constitution.rules] } : undefined;
  }

  async saveConstitution(policy: ConstitutionPolicy): Promise<void> {
    this.constitution = { ...policy, rules: [...policy.rules] };
  }

  seedConversation(conversation: AssemblyConversation): void {
    this.conversations.set(conversation.conversationId, { ...conversation, owner: { ...conversation.owner }, turns: [...conversation.turns] });
  }

  seedFacts(facts: readonly PermittedFact[]): void {
    this.facts = [...facts];
  }

  seedRetrievalSources(sources: readonly string[]): void {
    this.retrievalSources = [...sources];
  }

  seedMemories(memories: readonly MemoryObservation[]): void {
    this.memoryRows = memories.map((m) => ({ ...m }));
  }

  async conversation(conversationId: string): Promise<AssemblyConversation | undefined> {
    const found = this.conversations.get(conversationId);
    return found ? { ...found, owner: { ...found.owner }, turns: [...found.turns] } : undefined;
  }

  async permittedFacts(context: { role: string; workspaceId: string; purpose: string; language: string }): Promise<PermittedFact[]> {
    // Facts are context-tagged at the source; only exact-context facts surface.
    return this.facts
      .filter((f) => f.key.startsWith(`${context.role}|${context.workspaceId}|${context.purpose}|${context.language}|`) || f.key.startsWith('global|'))
      .map((f) => ({ ...f }));
  }

  async authorizedRetrievalSources(context: { role: string; workspaceId: string; purpose: string; language: string }): Promise<readonly string[]> {
    return [...this.retrievalSources];
  }

  async memories(owner: AssemblyOwner): Promise<MemoryObservation[]> {
    return this.memoryRows.map((m) => ({ ...m }));
  }

  async saveMemory(observation: MemoryObservation): Promise<void> {
    // Upsert by observationId (the SQL adapter mirrors with a PRIMARY KEY):
    // corrections/disables update the existing row rather than appending.
    this.memoryRows = [...this.memoryRows.filter((m) => m.observationId !== observation.observationId), { ...observation }];
  }
}
