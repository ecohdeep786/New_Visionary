// CONTENT-01 — stable curriculum/book/chapter/topic/concept IDs, source
// provider/version, rights, owner/visibility, grade/category and authored-
// language metadata.
//
// The catalog maps 1:1 onto the Grade/Subject/Book/Chapter/Topic/Subtopic
// master tables plus CONTENT-01 metadata columns (source_versions, publications,
// content_nodes at DATA integration — D-085 trace). The durable external
// identity is a STABLE PUBLIC ID: publishers, devices and retrieval all address
// content by it, so it is derived once from the immutable identity (kind +
// parent + source provider + edition) and is NEVER recycled or repurposed after
// registration. Name/grade/category/language edits never change the ID.
//
// Source provider/version is a first-class, reviewable value: a node is eligible
// for retrieval only when its source version is APPROVED/RELEASED (the
// "approved released-language/source pointer"), the node AND every ancestor are
// published/public, and a caller with the right to read actually exists. Owner
// authority is server-authoritative; a non-owner can neither mutate nor
// publish/withdraw another uid's node. No syllabus promise: only concrete
// registered source nodes exist; nothing is invented for missing coverage.

export type ContentKind = 'curriculum' | 'book' | 'chapter' | 'topic' | 'concept';

/** Access bucket. `school` is a scoped bucket; only `public` is broadly retrievable. */
export type Visibility = 'public' | 'school' | 'private';

/** Publication lifecycle of a node (observability/history, not a separate flag). */
export type PublicationState = 'draft' | 'published' | 'withdrawn';

/**
 * Source-version approval — the release pointer gate. Forward-only:
 * pending → approved → released, or rejected (terminal). A node whose source
 * is pending/rejected is never eligible for retrieval, even if it is public.
 */
export type SourceApproval = 'pending' | 'approved' | 'released' | 'rejected';

/** Right/owner metadata: who may publish/withdraw and who may see each node. */
export interface ContentRights {
  /** Owning uid — server-authoritative, immutable after registration. */
  ownerUid: string;
  /** Visibility bucket; private content is not eligible for public retrieval. */
  visibility: Visibility;
  /** Optional license/rights string ("copyright-owner-grant", "cc-by-4.0", ...). */
  license: string | null;
}

/** Provenance: which source provider + edition/version this node came from. */
export interface SourceVersion {
  /** Source provider, e.g. "cisce", "ncert". */
  provider: string;
  /** Provider edition identifier (stable across versions of the same edition). */
  edition: string;
  /** Version tag within the edition (semver-ish); distinguishes revisions. */
  version: string;
  /** Approval state of this source version (the released pointer gate). */
  approval: SourceApproval;
  /** When this source version was approved (null until then). */
  approvedAt: string | null;
  /** When this source version was released (null until then). */
  releasedAt: string | null;
}

export interface ContentNode {
  /** Stable public ID — derived once, never recycled, immutable. */
  publicId: string;
  kind: ContentKind;
  /** Human name/title (editable; the public ID does not change). */
  name: string;
  /** Structural parent: curriculum → book → chapter → topic → concept. */
  parentId: string | null;
  rights: ContentRights;
  source: SourceVersion;
  publication: PublicationState;
  /** Grade/category metadata (e.g. school-years band or curriculum track). */
  grade: string | null;
  category: string | null;
  /** Authored language tag (BCP-47); not the interface/locale language. */
  authoredLanguage: string;
  createdAt: string;
  updatedAt: string;
  /** First publish instant; re-publication keeps the original publish time. */
  publishedAt: string | null;
  /** Last withdraw instant (null until withdrawn). */
  withdrawnAt: string | null;
}

/** Input to register a new stable content node (idempotent by stable ID). */
export interface RegisterNodeInput {
  kind: ContentKind;
  name: string;
  parentId: string | null;
  ownerUid: string;
  source: { provider: string; edition: string; version: string };
  grade?: string | null;
  category?: string | null;
  authoredLanguage?: string;
  license?: string | null;
}

export const CONTENT_KINDS: ContentKind[] = ['curriculum', 'book', 'chapter', 'topic', 'concept'];

/** Which kind may be a parent of each kind (structural invariants). */
export const PARENT_OF: Record<ContentKind, ContentKind | null> = {
  curriculum: null,
  book: 'curriculum',
  chapter: 'book',
  topic: 'chapter',
  concept: 'topic',
};
