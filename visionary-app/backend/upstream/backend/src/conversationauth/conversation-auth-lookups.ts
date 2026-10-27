// AI-04 (KAN-86) — the conversation-authority domain's typed state seams. The
// owning store (server-recorded conversation ownership) implements this at
// integration; the in-memory implementation is contract-true and fails closed.
import type { Conversation } from './conversation-auth-types';

export interface ConversationStore {
  saveConversation(conversation: Conversation): Promise<void>;
  byConversationId(conversationId: string): Promise<Conversation | undefined>;
}

/** Contract-true in-memory store; ownership is server-recorded state. */
export class InMemoryConversationStore implements ConversationStore {
  private conversations = new Map<string, Conversation>();

  async saveConversation(conversation: Conversation): Promise<void> {
    this.conversations.set(conversation.conversationId, { ...conversation, owner: { ...conversation.owner }, turns: [...conversation.turns] });
  }

  async byConversationId(conversationId: string): Promise<Conversation | undefined> {
    const found = this.conversations.get(conversationId);
    return found ? { ...found, owner: { ...found.owner }, turns: [...found.turns] } : undefined;
  }
}
