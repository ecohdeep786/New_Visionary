import type { ParentSummaryShare } from '../domain/workspace.ts';

/** Consent-bound fixed copies must be readable before display or mutation. */
export function assertParentSummaryHistory(value: unknown): asserts value is ParentSummaryShare[] | undefined {
 if (value === undefined) return;
 if (!Array.isArray(value) || new Set(value.map(row => row?.recipient)).size !== value.length || value.some(row =>
  !row || typeof row !== 'object' || Array.isArray(row) ||
  ['recipient', 'relationshipId', 'title', 'summary', 'version', 'sharedAt'].some(key => typeof row[key] !== 'string') ||
  !row.recipient || !row.relationshipId || !row.version || !row.summary.trim() || row.summary.length > 500
 )) throw Error('Saved parent summaries could not be read. Original records were kept.');
}
