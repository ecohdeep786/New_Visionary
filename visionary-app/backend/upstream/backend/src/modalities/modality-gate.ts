// AI-10 (KAN-92) — released multimodal operations with explicit schemas,
// permitted context, device/locale recovery and separate cost limits.
//
// Core responsibilities (server-owned; unreleased stays unavailable):
//   1. Release registry: an UNRELEASED modality reports `modality_unreleased`
//      honestly — it never falls back to another modality silently.
//   2. Explicit schemas: voice needs audio+audioLocale; image needs
//      imageRef+conceptId; structured activity needs activityKind+steps — a
//      payload violating the schema refuses (`schema_invalid`), never guessed.
//   3. Permitted context only: the operation runs against the caller's OWN
//      conversation (wrong owner denied); the request's pinned revision must
//      match the conversation's (no context drift).
//   4. Device/locale recovery: the request locale must match the conversation's
//      locale (`locale_mismatch` otherwise) — no silent locale drift.
//   5. SEPARATE cost limits: each modality draws from its own allowance bucket;
//      exhausting voice never spends image (`modality_allowance_exhausted`).
import type {
  ModalityError as ModalityErrorType,
  ModalityOperation,
} from './modality-types';
import { ModalityError } from './modality-types';
import type { ModalityStore } from './modality-lookups';

/** The explicit schema each released modality requires. */
const SCHEMAS: Record<string, readonly string[]> = {
  voice: ['audioRef', 'audioLocale'],
  image: ['imageRef', 'conceptId'],
  structured_activity: ['activityKind', 'steps'],
};

export class ModalityGate {
  constructor(private readonly store: ModalityStore) {}

  /** Authorize + validate one modality operation (fail closed). */
  async authorize(operation: ModalityOperation): Promise<{ modality: string; conversationId: string }> {
    // 1. Release registry: unreleased stays unavailable, honestly.
    if (!(await this.store.isReleased(operation.modality))) {
      throw new ModalityError('modality_unreleased');
    }
    // 2. Explicit schema: the payload must carry exactly the required fields.
    const required = SCHEMAS[operation.modality];
    if (!required || required.some((f) => !(f in operation.payload))) {
      throw new ModalityError('schema_invalid');
    }
    // 3. Permitted context: the caller must own the conversation, and the
    //    pinned revision must match (no context drift).
    const conversation = await this.store.conversation(operation.conversationId);
    if (!conversation) throw new ModalityError('not_owner');
    if (
      conversation.owner.uid !== operation.caller.uid ||
      conversation.owner.workspaceId !== operation.caller.workspaceId
    ) {
      throw new ModalityError('not_owner');
    }
    if (conversation.pinnedSourceVersion !== operation.pinnedSourceVersion) {
      throw new ModalityError('schema_invalid');
    }
    // 4. Device/locale recovery: the request locale must match the conversation's.
    if (conversation.locale !== operation.locale) {
      throw new ModalityError('locale_mismatch');
    }
    return { modality: operation.modality, conversationId: operation.conversationId };
  }

  /** Consume the modality's OWN allowance (separate cost limits). */
  async consumeAllowance(operation: ModalityOperation, cost: number): Promise<void> {
    const granted = await this.store.tryConsumeAllowance(operation.caller, operation.modality, cost);
    if (!granted) throw new ModalityError('modality_allowance_exhausted');
  }
}

export type { ModalityErrorType };
