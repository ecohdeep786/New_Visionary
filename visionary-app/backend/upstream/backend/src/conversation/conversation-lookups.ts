// LEARN-05 (KAN-71) — the conversation domain's typed state seams.
import type {
  Conversation,
  ConversationOwner,
  ConversationTurn,
} from './conversation-types';

export interface ConversationStore {
  saveConversation(conversation: Conversation): Promise<void>;
  conversation(conversationId: string): Promise<Conversation | undefined>;
  saveTurn(turn: ConversationTurn): Promise<void>;
  turns(conversationId: string): Promise<ConversationTurn[]>;
  /** Command dedup ledger: commandKey -> { payloadHash, resultRef }. */
  recordCommand(commandKey: string, payloadHash: string, resultRef: string): Promise<void>;
  commandPayload(commandKey: string): Promise<string | undefined>;
  commandResultRef(commandKey: string): Promise<string | undefined>;
  /** Whether an evaluated connected model-response adapter is ACCEPTED (P07). */
  adapterAccepted(): Promise<boolean>;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Contract-true in-memory store; tests drive the full domain without a DB. */
export class InMemoryConversationStore implements ConversationStore {
  private conversations = new Map<string, Conversation>();
  private turnList = new Map<string, ConversationTurn[]>();
  private commands = new Map<string, { hash: string; resultRef: string }>();
  private accepted = false;

  setAdapterAccepted(accepted: boolean): void {
    this.accepted = accepted;
  }

  async saveConversation(conversation: Conversation): Promise<void> {
    this.conversations.set(conversation.conversationId, clone(conversation));
  }
  async conversation(conversationId: string): Promise<Conversation | undefined> {
    const found = this.conversations.get(conversationId);
    return found ? clone(found) : undefined;
  }
  async saveTurn(turn: ConversationTurn): Promise<void> {
    const list = this.turnList.get(turn.conversationId) ?? [];
    list.push(clone(turn));
    this.turnList.set(turn.conversationId, list);
  }
  async turns(conversationId: string): Promise<ConversationTurn[]> {
    return clone(this.turnList.get(conversationId) ?? []);
  }
  async recordCommand(commandKey: string, payloadHash: string, resultRef: string): Promise<void> {
    const prior = this.commands.get(commandKey);
    this.commands.set(commandKey, { hash: payloadHash, resultRef: resultRef || prior?.resultRef || '' });
  }
  async commandPayload(commandKey: string): Promise<string | undefined> {
    return this.commands.get(commandKey)?.hash;
  }
  async commandResultRef(commandKey: string): Promise<string | undefined> {
    const ref = this.commands.get(commandKey)?.resultRef;
    return ref || undefined;
  }
  async adapterAccepted(): Promise<boolean> {
    return this.accepted;
  }
}
