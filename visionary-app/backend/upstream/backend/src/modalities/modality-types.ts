// AI-10 (KAN-92) — released voice/image/structured-activity operations with
// explicit schemas, permitted context, device/locale recovery and separate cost
// limits; unreleased modalities stay unavailable.
//
// The checkpoint here is honest multimodal operation gating:
//   - Each modality (voice / image / structured activity) is RELEASED or not —
//     a server-side release registry decides. An UNRELEASED modality reports
//     `unavailable` honestly and never falls back to another modality silently.
//   - Released operations validate against EXPLICIT schemas: a voice request
//     needs audio+locale, an image request needs image+concept, a structured
//     activity needs activity kind+steps — a payload violating the schema is
//     refused (schema_invalid), never guessed.
//   - Permitted context only: the operation runs against the caller's own
//     conversation/pinned revision (wrong owner denied — no cross-user context).
//   - Device/locale recovery: an operation may declare its device profile and
//     locale; a mismatched locale against the conversation's pinned locale is
//     refused (no silent locale drift).
//   - SEPARATE cost limits per modality: voice/image/activity each draw from
//     their own bounded allowance — exhausting the voice allowance never spends
//     the image allowance (no cross-modality leakage).
//
// Exit: evaluated, authorized assistance with bounded costs and no cross-user
// leakage.

/** The authenticated caller. */
export interface ModalityOwner {
  uid: string;
  workspaceId: string;
}

export type Modality = 'voice' | 'image' | 'structured_activity';

/** A modality operation request with its explicit schema payload. */
export interface ModalityOperation {
  modality: Modality;
  caller: ModalityOwner;
  conversationId: string;
  /** The conversation's pinned source revision. */
  pinnedSourceVersion: string;
  /** Request locale (device/locale recovery input). */
  locale: string;
  payload: Record<string, unknown>;
}

export class ModalityError extends Error {
  constructor(
    public readonly code:
      | 'modality_unreleased'
      | 'schema_invalid'
      | 'not_owner'
      | 'locale_mismatch'
      | 'modality_allowance_exhausted'
  ) {
    super(code);
  }
}
