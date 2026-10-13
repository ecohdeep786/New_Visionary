import type { Artifact } from '../domain/workspace.ts';

/** Validate retained assessments without repairing or discarding authored records. */
export function assertPortfolioReviewHistory(artifact: Pick<Artifact, 'portfolioReviews'>): void {
 const history: unknown = artifact.portfolioReviews;
 if (history === undefined) return;
 const ids = ['purpose', 'evidence', 'limits'];
 if (!Array.isArray(history) || history.some(review =>
  !review || typeof review !== 'object' || Array.isArray(review) ||
  typeof review.projectVersion !== 'string' || !review.projectVersion ||
  typeof review.reviewedAt !== 'string' || typeof review.reflection !== 'string' ||
  !Array.isArray(review.criteria) || review.criteria.length !== ids.length ||
  new Set(review.criteria.map((row: { id?: unknown } | null) => row?.id)).size !== ids.length ||
  review.criteria.some((row: { id?: unknown; rating?: unknown; note?: unknown } | null) =>
   !row || !ids.includes(String(row.id)) ||
   !['needs-work', 'explained', 'supported'].includes(String(row.rating)) || typeof row.note !== 'string')
 )) throw Error('Saved portfolio self-reviews could not be read. Original records were kept.');
}
