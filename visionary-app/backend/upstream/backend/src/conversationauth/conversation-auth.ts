// AI-04 (KAN-86) — conversation UID/workspace ownership enforcement.
//
// Core responsibilities (server-owned; no ID-based bypass):
//   1. Every operation (get / append / delete / context) derives authority from
//      the authenticated caller (uid + workspace) and checks it against the
//      conversation's SERVER-RECORDED owner. A supplied session ID, conversation
//      UUID, or any payload identifier is never authority.
//   2. Denials are UNIFORM: wrong uid and unknown conversation both return the
//      same `denied` outcome — no existence leak.
//   3. Append enforces pinned-context integrity: a turn citing a source
//      revision different from the conversation's pinned revision refuses.
//   4. Delete is owner-only; deleting an already-deleted conversation denies
//      uniformly (no existence leak).
import type {
  Conversation,
  ConversationDenial,
  ConversationError as ConversationErrorType,
  ConversationCaller,
  ConversationTurnView,
} from './conversation-auth-types';
import { ConversationError } from './conversation-auth-types';
import type { ConversationStore } from './conversation-auth-lookups';

export class ConversationAuthService {
  constructor(private readonly store: ConversationStore) {}

  /** Load + authorize in one step; uniform denial, no existence leak. */
  private async authorize(conversationId: string, caller: ConversationCaller): Promise<Conversation | ConversationDenial> {
    // NOTE: the caller's uid/workspace come from the authenticated request
    // context — never from the payload. Any ID in the payload is just an
    // address, never authority.
    const conversation = await this.store.byConversationId(conversationId);
    if (!conversation || conversation.deleted) return { denied: true, reason: 'denied' };
    if (conversation.owner.uid !== caller.uid || conversation.owner.workspaceId !== caller.workspaceId) {
      return { denied: true, reason: 'denied' };
    }
    return conversation;
  }

  /** GET turns: owner-scoped; uniform denial for strangers and unknown ids. */
  async getTurns(conversationId: string, caller: ConversationCaller): Promise<ConversationTurnView | ConversationDenial> {
    const conversation = await this.authorize(conversationId, caller);
    if ('denied' in conversation) return conversation;
    return {
      conversationId: conversation.conversationId,
      pinnedSourceVersion: conversation.pinnedSourceVersion,
      turns: conversation.turns,
    };
  }

  /** APPEND a learner turn: owner-scoped; pinned-context revision enforced. */
  async appendTurn(input: {
    conversationId: string;
    caller: ConversationCaller;
    turnId: string;
    body: string;
    sourceVersion: string;
  }): Promise<{ committed: true; turnCount: number } | ConversationDenial> {
    const conversation = await this.authorize(input.conversationId, input.caller);
    if ('denied' in conversation) return conversation;
    if (conversation.pinnedSourceVersion !== input.sourceVersion) {
      throw new ConversationError('context_revision_mismatch');
    }
    const updated: Conversation = {
      ...conversation,
      turns: [...conversation.turns, { turnId: input.turnId, role: 'learner', body: input.body }],
    };
    await this.store.saveConversation(updated);
    return { committed: true, turnCount: updated.turns.length };
  }

  /** CONTEXT read: owner-scoped; returns the pinned revision for ML binding. */
  async getContext(conversationId: string, caller: ConversationCaller): Promise<{ conversationId: string; pinnedSourceVersion: string } | ConversationDenial> {
    const conversation = await this.authorize(conversationId, caller);
    if ('denied' in conversation) return conversation;
    return { conversationId: conversation.conversationId, pinnedSourceVersion: conversation.pinnedSourceVersion };
  }

  /** DELETE: owner-only; uniform denial (already-deleted ≡ unknown ≡ not yours). */
  async deleteConversation(conversationId: string, caller: ConversationCaller): Promise<ConversationDenial | { deleted: true }> {
    const conversation = await this.authorize(conversationId, caller);
    if ('denied' in conversation) return conversation;
    await this.store.saveConversation({ ...conversation, deleted: true });
    return { deleted: true };
  }
}

export type { ConversationErrorType };
