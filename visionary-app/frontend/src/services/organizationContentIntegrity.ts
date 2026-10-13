import type { Resource } from '../domain/workspace.ts';
import { assertCurriculumTemplate } from './curriculumTemplate.ts';

const record = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const text = (value: unknown): value is string => typeof value === 'string';
const revision = (value: unknown): value is number => Number.isInteger(value) && Number(value) > 0;
const language = (value: unknown) => ['en', 'hi', 'bn'].includes(String(value));
const fail = () => { throw Error('Saved organization content is incomplete or ambiguous. Original records have not been changed. Restore a valid saved copy before retrying.'); };

/** Reject ambiguous imported editorial records before rendering or changing them. */
export function assertOrganizationContentRecord(value: unknown): asserts value is Resource {
 if (!record(value) || !text(value.id) || !value.id || !text(value.title) || !text(value.body) || !text(value.status)) fail();
 const item = value as Record<string, unknown>;
 if (item.curriculumTemplate !== undefined) assertCurriculumTemplate(item.curriculumTemplate);
 // Earlier authored notes remain read-only and do not gain a reviewed status.
 if (item.contentReview === undefined) return;
 const review = item.contentReview;
 if (!record(review) || !revision(review.revision) || !text(review.source) || !language(review.language) || !text(review.author) || !review.author || !Array.isArray(review.history) || !Array.isArray(review.versions) || !['draft', 'submitted', 'changes', 'approved', 'archived'].includes(String(item.status))) fail();
 const saved = review as Record<string, unknown>;
 const currentRevision = Number(saved.revision);
 const history = saved.history as unknown[];
 const versions = saved.versions as unknown[];
 if (history.some(event => !record(event) || !text(event.action) || !text(event.actor) || !event.actor || !text(event.at) || !revision(event.revision) || event.revision > currentRevision || !text(event.note))) fail();
 const seen = new Set<number>();
 for (const version of versions) {
  if (!record(version) || !revision(version.revision) || version.revision >= currentRevision || seen.has(version.revision) || !text(version.title) || !text(version.body) || !text(version.source) || !language(version.language)) fail();
  const earlier = version as Record<string, unknown>;
  seen.add(Number(earlier.revision));
  if (earlier.curriculumTemplate !== undefined) assertCurriculumTemplate(earlier.curriculumTemplate);
 }
 if (saved.deliveries !== undefined && (!Array.isArray(saved.deliveries) || saved.deliveries.some(delivery => !record(delivery) || !text(delivery.id) || !delivery.id))) fail();
}
