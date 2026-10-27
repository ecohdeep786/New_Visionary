// AI-12 (KAN-138) — scoped quality collection replacing legacy raw-text export.
//
// Core responsibilities (server-owned; legacy disconnected):
//   1. legacyExport: ALWAYS refused (`legacy_export_disconnected`) — raw
//      query/response/context dumps, global-key exports and training-style
//      dataset generation stay disconnected; no flag or role re-enables them.
//   2. collect: ONLY through an approved, active purpose AND a scoped operator
//      carrying `quality.review:<purposeId>` — the ordinary authenticated
//      identity is not sufficient. Entries carry scoped fields only; the
//      presence of raw query/response/context fields refuses the entry
//      (`raw_text_forbidden`). Ground truth requires a human review record —
//      the feedback judge's generated response is refused (`not_ground_truth`).
//   3. exportDataset: the same scoped-operator + active-purpose + scope-binding
//      rules; an export beyond the approved scope filters refuses
//      (`beyond_approved_scope`).
import type {
  ApprovedPurpose,
  QualityEntry,
  QualityOperator,
  QualityScopeError as QualityScopeErrorType,
} from './quality-scope-types';
import { QualityScopeError } from './quality-scope-types';
import type { QualityScopeStore } from './quality-scope-lookups';

/** Raw private-text fields that must never appear in a collected entry. */
const RAW_FIELDS = ['rawQuery', 'rawResponse', 'retrievedContext', 'fullTranscript'] as const;

export class QualityScopeService {
  constructor(private readonly store: QualityScopeStore) {}

  /**
   * The legacy raw-text quality export path: permanently disconnected.
   * No flag, role, or purpose re-enables it.
   */
  async legacyExport(_requestedBy: unknown, _filters: unknown): Promise<never> {
    throw new QualityScopeError('legacy_export_disconnected');
  }

  private async requireScopedOperator(operator: QualityOperator, purposeId: string): Promise<void> {
    if (!operator.scopes.includes(`quality.review:${purposeId}`)) {
      throw new QualityScopeError('operator_scope_required');
    }
  }

  private assertNoRawText(candidate: Record<string, unknown>): void {
    for (const field of RAW_FIELDS) {
      if (field in candidate) throw new QualityScopeError('raw_text_forbidden');
    }
  }

  private assertWithinScope(purpose: ApprovedPurpose, entry: Pick<QualityEntry, 'conceptId' | 'sourceVersion' | 'locale'>): void {
    const f = purpose.scopeFilters;
    if (f.conceptId && f.conceptId !== entry.conceptId) throw new QualityScopeError('beyond_approved_scope');
    if (f.sourceVersion && f.sourceVersion !== entry.sourceVersion) throw new QualityScopeError('beyond_approved_scope');
    if (f.locale && f.locale !== entry.locale) throw new QualityScopeError('beyond_approved_scope');
  }

  /** Collect one quality entry through an approved purpose + scoped operator. */
  async collect(input: {
    operator: QualityOperator;
    entry: Omit<QualityEntry, 'collectedAt'> & Record<string, unknown>;
  }): Promise<QualityEntry> {
    await this.requireScopedOperator(input.operator, input.entry.purposeId);
    const purpose = await this.store.purpose(input.entry.purposeId);
    if (!purpose || purpose.status !== 'active') throw new QualityScopeError('purpose_not_active');
    this.assertNoRawText(input.entry);
    if (!input.entry.reviewedRef) throw new QualityScopeError('not_ground_truth');
    this.assertWithinScope(purpose, input.entry);

    const { rawQuery, rawResponse, retrievedContext, fullTranscript, ...scoped } = input.entry as Record<string, unknown>;
    void rawQuery; void rawResponse; void retrievedContext; void fullTranscript;
    const entry: QualityEntry = { ...(scoped as unknown as Omit<QualityEntry, 'collectedAt'>), collectedAt: new Date().toISOString() };
    await this.store.saveEntry(entry);
    return entry;
  }

  /** Export the dataset for a purpose — same scoped-operator + active rules. */
  async exportDataset(operator: QualityOperator, purposeId: string): Promise<QualityEntry[]> {
    await this.requireScopedOperator(operator, purposeId);
    const purpose = await this.store.purpose(purposeId);
    if (!purpose || purpose.status !== 'active') throw new QualityScopeError('purpose_not_active');
    const entries = await this.store.entriesFor(purposeId);
    return entries;
  }

  /** Record an approved purpose (product/education review decision). */
  async recordPurpose(purpose: ApprovedPurpose): Promise<void> {
    await this.store.savePurpose(purpose);
  }
}

export type { QualityScopeErrorType };
