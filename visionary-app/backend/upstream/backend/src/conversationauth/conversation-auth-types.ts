// AI-04 (KAN-86) — enforce conversation UID/workspace ownership on every
// get/append/delete/context request. A supplied session ID or UUID is never
// authority.
//
// The checkpoint here is server-owned conversation authority:
//   - Every operation (get / append / delete / context) verifies the caller's
//     UID AND workspace against the conversation's SERVER-RECORDED owner.
//     A supplied session ID, conversation UUID or any client identifier is
//     NEVER authority — knowing an ID grants nothing.
//   - Server-derived authority: the caller's identity comes from the
//     authenticated request context (uid + workspace), never from the payload.
//   - Denials are uniform and honest: a wrong uid and an unknown conversation
//     are indistinguishable to the caller (no existence leak), each refusal
//     carries `denied: true` without revealing whether the conversation exists
//     for someone else.
//   - Workspace isolation: the same uid in a different workspace owns nothing
//     there — conversations are workspace-scoped.
//   - Delete is owner-only and idempotent-tolerant (deleting an already-deleted
//     conversation denies uniformly, no existence leak).
//   - Append enforces the conversation's pinned source revision context
//     integrity: a turn referencing a different source revision than the
//     conversation's pinned context is refused (no silent context drift).
//
// Exit: permitted, bounded conversation authority with no ID-based bypass.

/** Server-derived caller identity (never from the payload). */
export interface ConversationCaller {
  uid: string;
  workspaceId: string;
}

/** A conversation owned by exactly one uid in one workspace. */
export interface Conversation {
  conversationId: string;
  owner: ConversationCaller;
  /** The source revision the conversation's context is pinned to. */
  pinnedSourceVersion: string;
  turns: readonly { turnId: string; role: 'learner' | 'assistant'; body: string }[];
  deleted: boolean;
}

/** Uniform denial — no existence leak (wrong uid ≡ unknown id). */
export interface ConversationDenial {
  denied: true;
  /** Deliberately uniform: callers cannot distinguish "unknown" from "not yours". */
  reason: 'denied';
}

export interface ConversationTurnView {
  conversationId: string;
  pinnedSourceVersion: string;
  turns: readonly { turnId: string; role: 'learner' | 'assistant'; body: string }[];
}

export class ConversationError extends Error {
  constructor(
    public readonly code:
      | 'denied'
      | 'context_revision_mismatch'
  ) {
    super(code);
  }
}
