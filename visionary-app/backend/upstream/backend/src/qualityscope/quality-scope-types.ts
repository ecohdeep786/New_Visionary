// AI-12 (KAN-138) — replace unsafe legacy quality export before ML integration.
//
// The source review found: global Redis quality keys, raw
// query/response/retrieved-context records, fixed TTLs, weekly training-style
// dataset generation, and quality export routes mounted on the ordinary
// authenticated gateway without a distinct scoped operator policy. The feedback
// judge's generated GoldenResponse is not reviewed ground truth.
//
// The checkpoint here replaces all of that:
//   - LEGACY STAYS DISCONNECTED: any legacy-style raw-text quality export —
//     bulk raw query/response/context dumps, global-key exports, training-style
//     dataset generation — is REFUSED explicitly (`legacy_export_disconnected`).
//     The legacy path is never re-enabled by a flag or a role.
//   - Replacement collection ONLY through an APPROVED PURPOSE: a scoped
//     collection request must bind an approved purpose record (explicit scope
//     filters: concept/version/locale) that is currently active.
//   - DISTINCT SCOPED OPERATOR POLICY: collection/export requires a scoped
//     operator carrying the quality.review scope for that purpose — the
//     ordinary authenticated user identity is NOT sufficient (no accidental
//     exports from the ordinary gateway).
//   - REVIEWED GROUND TRUTH ONLY: a dataset entry's response qualifies as
//     ground truth only with a human review record (`reviewedRef`); the
//     feedback judge's generated response is refused as ground truth.
//   - NO RAW PRIVATE TEXT: collected entries carry only the scoped fields; the
//     presence of raw query/response/context fields refuses the entry.
//
// Exit: no unsafe quality export reaches ML integration.

/** A scoped quality operator (distinct from the ordinary authenticated user). */
export interface QualityOperator {
  operatorId: string;
  /** The scopes this operator carries (e.g. quality.review:<purposeId>). */
  scopes: readonly string[];
}

/** An approved collection purpose with explicit scope filters. */
export interface ApprovedPurpose {
  purposeId: string;
  /** The reviewed purpose statement (why this collection exists). */
  purposeStatement: string;
  /** Explicit scope filters the collection is bound to. */
  scopeFilters: { conceptId?: string; sourceVersion?: string; locale?: string };
  status: 'active' | 'revoked';
}

/** A collected quality entry (scoped fields only). */
export interface QualityEntry {
  entryId: string;
  purposeId: string;
  conceptId: string;
  sourceVersion: string;
  locale: string;
  /** The response record — ground truth ONLY when human-reviewed. */
  response: unknown;
  /** Human review record reference; absent = NOT ground truth. */
  reviewedRef: string | null;
  collectedAt: string;
}

export class QualityScopeError extends Error {
  constructor(
    public readonly code:
      | 'legacy_export_disconnected'
      | 'operator_scope_required'
      | 'purpose_not_active'
      | 'not_ground_truth'
      | 'raw_text_forbidden'
      | 'beyond_approved_scope'
  ) {
    super(code);
  }
}
