// AI-10 (KAN-92) — the modality gate's typed state seams. The owning stores
// (release registry, conversations, per-modality allowances) implement these at
// integration; the in-memory implementation is contract-true and fails closed.
import type { ModalityOwner } from './modality-types';

/** A conversation the modality operation may run against. */
export interface ModalityConversation {
  conversationId: string;
  owner: ModalityOwner;
  pinnedSourceVersion: string;
  locale: string;
}

export interface ModalityStore {
  /** True only when this modality is RELEASED. */
  isReleased(modality: string): Promise<boolean>;
  conversation(conversationId: string): Promise<ModalityConversation | undefined>;
  /** Atomic per-modality allowance check-and-deduct (one bucket per modality). */
  tryConsumeAllowance(owner: ModalityOwner, modality: string, cost: number): Promise<boolean>;
}

/** Contract-true in-memory store; allowances are separate buckets. */
export class InMemoryModalityStore implements ModalityStore {
  private released = new Set<string>();
  private conversations = new Map<string, ModalityConversation>();
  private allowances = new Map<string, number>();

  release(modality: string): void {
    this.released.add(modality);
  }

  seedConversation(conversation: ModalityConversation): void {
    this.conversations.set(conversation.conversationId, { ...conversation, owner: { ...conversation.owner } });
  }

  seedAllowance(owner: ModalityOwner, modality: string, amount: number): void {
    this.allowances.set(`${owner.uid}|${owner.workspaceId}|${modality}`, amount);
  }

  async isReleased(modality: string): Promise<boolean> {
    return this.released.has(modality);
  }

  async conversation(conversationId: string): Promise<ModalityConversation | undefined> {
    const found = this.conversations.get(conversationId);
    return found ? { ...found, owner: { ...found.owner } } : undefined;
  }

  async tryConsumeAllowance(owner: ModalityOwner, modality: string, cost: number): Promise<boolean> {
    const key = `${owner.uid}|${owner.workspaceId}|${modality}`;
    const balance = this.allowances.get(key) ?? 0;
    if (balance < cost) return false;
    this.allowances.set(key, balance - cost);
    return true;
  }
}
