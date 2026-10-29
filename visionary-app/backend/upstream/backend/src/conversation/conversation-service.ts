// LEARN-05 (KAN-71) — owned Ask/Guide conversation state and typed
// model-response adapters with truthful disconnected/blocked/partial states.
//
// Core responsibilities (server-owned; honest; fail closed):
//   1. OWNED CONVERSATIONS: private per-UID, workspace-scoped; wrong users see
//      nothing (`not_owner` / `workspace_mismatch` — no leak).
//   2. TYPED MODEL RESPONSES: every model turn carries an explicit typed
//      outcome (final | partial | error | unavailable) with an understandable
//      reason; grounded finals carry citations.
//   3. TRUTHFUL UNTIL P07: without an ACCEPTED connected adapter, a final or
//      partial model answer refuses (`adapter_not_accepted`) — only honest
//      `unavailable`/`error` states are recordable. No fabricated answers.
//   4. COMMAND DEDUPLICATION: replayed commands converge to the SAME result
//      (conversation or turn); the same key with a changed payload refuses
//      (`command_changed`).
//   5. CROSS-DEVICE RESUME: the committed journey reads back byte-stably
//      (equal digest on another device/controller).
//   6. REVOCATION: a revoked conversation refuses further appends
//      (`conversation_revoked`); history is retained, never rewritten.
import { createHash } from 'node:crypto';
import type {
  Conversation,
  ConversationChannel,
  ConversationError as ConversationErrorType,
  ConversationOwner,
  ConversationTurn,
  LearnerTurn,
  ModelOutcome,
  ModelTurn,
} from './conversation-types';
import { ConversationError } from './conversation-types';
import type { ConversationStore } from './conversation-lookups';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/** Outcomes that claim real model output — they need an ACCEPTED adapter. */
const CLAIMING_OUTCOMES: ModelOutcome[] = ['final', 'partial'];

export class ConversationService {
  private conversationCounter = 0;
  private turnCounter = 0;

  constructor(private readonly store: ConversationStore) {}

  /** Open an owned conversation (idempotent per commandKey). */
  async createConversation(
    owner: ConversationOwner,
    commandKey: string,
    channel: ConversationChannel,
  ): Promise<Conversation> {
    const payloadHash = hash(`create|${commandKey}|${channel}`);
    const prior = await this.store.commandPayload(commandKey);
    if (prior && prior !== payloadHash) throw new ConversationError('command_changed');
    if (prior && prior === payloadHash) {
      const ref = await this.store.commandResultRef(commandKey);
      if (ref) {
        const existing = await this.store.conversation(ref);
        if (existing) return existing;
      }
    }
    const conversation: Conversation = {
      conversationId: `conv_${++this.conversationCounter}`,
      owner: { ...owner },
      channel,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    await this.store.saveConversation(conversation);
    await this.store.recordCommand(commandKey, payloadHash, conversation.conversationId);
    return conversation;
  }

  /** Append the learner's own message (idempotent per commandKey). */
  async appendLearnerTurn(
    owner: ConversationOwner,
    commandKey: string,
    conversationId: string,
    content: string,
  ): Promise<LearnerTurn> {
    const conversation = await this.requireOwnedConversation(owner, conversationId);
    if (conversation.status === 'revoked') throw new ConversationError('conversation_revoked');
    if (!content?.trim()) throw new ConversationError('turn_invalid');
    const payloadHash = hash(`learner|${commandKey}|${conversationId}|${content}`);
    const prior = await this.store.commandPayload(commandKey);
    if (prior && prior !== payloadHash) throw new ConversationError('command_changed');
    if (prior && prior === payloadHash) {
      const existing = await this.turnByRef(commandKey);
      if (existing) return existing as LearnerTurn;
    }
    const turn: LearnerTurn = {
      turnId: `trn_${++this.turnCounter}`,
      conversationId,
      role: 'learner',
      content,
      at: new Date().toISOString(),
    };
    await this.store.saveTurn(turn);
    await this.store.recordCommand(commandKey, payloadHash, `${conversationId}|${turn.turnId}`);
    return turn;
  }

  /**
   * Record a TYPED model-response adapter outcome. Until an evaluated adapter
   * is ACCEPTED (P07), claiming final/partial output refuses — only honest
   * `unavailable`/`error` states are recordable. Idempotent per commandKey.
   */
  async recordModelTurn(
    owner: ConversationOwner,
    commandKey: string,
    conversationId: string,
    outcome: ModelOutcome,
    adapterId: string,
    reason: string,
    content: string | null = null,
    citations: readonly string[] = [],
  ): Promise<ModelTurn> {
    const conversation = await this.requireOwnedConversation(owner, conversationId);
    if (conversation.status === 'revoked') throw new ConversationError('conversation_revoked');
    if (!adapterId?.trim() || !reason?.trim()) throw new ConversationError('turn_invalid');
    const accepted = await this.store.adapterAccepted();
    if (CLAIMING_OUTCOMES.includes(outcome) && !accepted) {
      throw new ConversationError('adapter_not_accepted');
    }
    const payloadHash = hash(`model|${commandKey}|${conversationId}|${outcome}|${adapterId}|${reason}|${content ?? ''}`);
    const prior = await this.store.commandPayload(commandKey);
    if (prior && prior !== payloadHash) throw new ConversationError('command_changed');
    if (prior && prior === payloadHash) {
      const existing = await this.turnByRef(commandKey);
      if (existing) return existing as ModelTurn;
    }
    const turn: ModelTurn = {
      turnId: `trn_${++this.turnCounter}`,
      conversationId,
      role: 'model',
      outcome,
      adapterId,
      reason,
      content: outcome === 'final' ? content : null,
      citations: outcome === 'final' ? [...citations] : [],
      at: new Date().toISOString(),
    };
    await this.store.saveTurn(turn);
    await this.store.recordCommand(commandKey, payloadHash, `${conversationId}|${turn.turnId}`);
    return turn;
  }

  /**
   * Cross-device resume: the committed journey reads back byte-stably — the
   * same conversation and turns on any controller over the same store.
   */
  async resumeConversation(
    owner: ConversationOwner,
    conversationId: string,
  ): Promise<{ conversation: Conversation; turns: ConversationTurn[]; digest: string }> {
    const conversation = await this.requireOwnedConversation(owner, conversationId);
    const turns = await this.store.turns(conversationId);
    return { conversation, turns, digest: hash(JSON.stringify({ conversation, turns })) };
  }

  /** Revoke a conversation — further appends refuse; history is retained. */
  async revokeConversation(owner: ConversationOwner, conversationId: string): Promise<Conversation> {
    const conversation = await this.requireOwnedConversation(owner, conversationId);
    const revoked: Conversation = { ...conversation, status: 'revoked' };
    await this.store.saveConversation(revoked);
    return revoked;
  }

  private async turnByRef(commandKey: string): Promise<ConversationTurn | undefined> {
    const ref = await this.store.commandResultRef(commandKey);
    if (!ref || !ref.includes('|')) return undefined;
    const [conversationId, turnId] = ref.split('|');
    const turns = await this.store.turns(conversationId);
    return turns.find((t) => t.turnId === turnId) ?? undefined;
  }

  private async requireOwnedConversation(owner: ConversationOwner, conversationId: string): Promise<Conversation> {
    const conversation = await this.store.conversation(conversationId);
    if (!conversation) throw new ConversationError('conversation_unknown');
    if (conversation.owner.uid !== owner.uid) throw new ConversationError('not_owner');
    if (conversation.owner.workspaceId !== owner.workspaceId) throw new ConversationError('workspace_mismatch');
    return conversation;
  }
}

export type { ConversationErrorType, ConversationTurn };
