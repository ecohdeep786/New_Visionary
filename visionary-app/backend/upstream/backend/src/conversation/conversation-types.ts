// LEARN-05 (KAN-71) — owned Ask/Guide/conversation state and typed
// model-response adapters, with truthful disconnected/blocked/partial states
// until P07 (private AI) acceptance, and cross-device resume of a committed
// journey.
//
// Design constraints (server-owned; honest; fail closed):
//   - OWNED STATE: conversations are private per-UID with a workspace scope;
//     wrong uid/workspace is refused uniformly (`not_owner`/`workspace_mismatch`,
//     no leak).
//   - TYPED MODEL-RESPONSE ADAPTERS: a model turn carries an explicit typed
//     outcome — final | partial | error | unavailable — with an understandable
//     reason (and citations for grounded finals). A generated answer is never
//     committed product state by itself; it is recorded as a turn of the
//     conversation.
//   - TRUTHFUL UNTIL P07: while no evaluated connected adapter is ACCEPTED,
//     recording a `final` or `partial` model answer refuses
//     (`adapter_not_accepted`) — the only honest states are `unavailable` and
//     `error` with a reason. Fabricating an answer without an accepted adapter
//     is impossible by construction.
//   - COMMAND DEDUPLICATION: turn-append commands carry a stable commandKey;
//     same key + same payload converges to the SAME turn; changed payload
//     refuses (`command_changed`) — retry/reconnect never duplicates turns.
//   - CROSS-DEVICE RESUME: the committed journey (conversation + turns) reads
//     back byte-stably on another device (equal digest).
//   - REVOCATION: a revoked conversation refuses further appends
//     (`conversation_revoked`); history is retained.
export interface ConversationOwner {
  uid: string;
  workspaceId: string;
}

/** Ask (grounded assistance) or Guide (planning) conversation channel. */
export type ConversationChannel = 'ask' | 'guide';

/** An owned conversation (private per-UID; workspace-scoped). */
export interface Conversation {
  conversationId: string;
  owner: ConversationOwner;
  channel: ConversationChannel;
  status: 'active' | 'revoked';
  createdAt: string;
}

/** One learner turn (the learner's own message). */
export interface LearnerTurn {
  turnId: string;
  conversationId: string;
  role: 'learner';
  content: string;
  at: string;
}

/** The typed outcome of a model-response adapter. */
export type ModelOutcome = 'final' | 'partial' | 'error' | 'unavailable';

/** A typed model response turn (adapter-identified; honest states only). */
export interface ModelTurn {
  turnId: string;
  conversationId: string;
  role: 'model';
  outcome: ModelOutcome;
  /** The adapter that produced (or would have produced) the response. */
  adapterId: string;
  /** Understandable reason — required for partial/error/unavailable. */
  reason: string;
  /** Present only for grounded final responses from an accepted adapter. */
  content: string | null;
  citations: readonly string[];
  at: string;
}

export type ConversationTurn = LearnerTurn | ModelTurn;

export class ConversationError extends Error {
  readonly code:
    | 'not_owner'
    | 'workspace_mismatch'
    | 'conversation_unknown'
    | 'conversation_revoked'
    | 'turn_invalid'
    | 'adapter_not_accepted'
    | 'command_changed';
  constructor(code: ConversationError['code']) {
    super(code);
    this.code = code;
  }
}
