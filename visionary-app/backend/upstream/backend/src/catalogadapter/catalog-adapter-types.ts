// CONTENT-04 (KAN-63) — catalog/concept adapters connected to reviewed server
// DTOs. The DTO shapes here mirror the reviewed contract the frontend facade
// declares (frontend/src/services/contentRepository.ts ContentRepositoryAdapter:
// "a miss is null, not invented curriculum") so the backend adapter maps 1:1
// onto the API boundary at cutover.
//
// The checkpoint here is an honest, backend-owned adapter layer:
//   - getSubjects / getSyllabus / getConcept return the REVIEWED DTO shapes
//     built from catalog facts (CONTENT-01 stable IDs/provenance), published
//     pointer released locales (CONTENT-03/05) and eligibility — never from
//     frontend labels.
//   - Locale/source-language distinctions are preserved: authored language,
//     interface language and released locale stay distinct. A concept whose
//     released locales do not include the requested interface locale reports
//     `languageUnavailable: true` with the real `availableLocales` (it is
//     present but not supported in that language), instead of serving an
//     unapproved translation.
//   - Authoring representations (text/diagram/cube/number-line/scene) are
//     passed through unchanged as part of the concept DTO.
//   - Unsupported/unavailable states are explicit: a selection or concept with
//     no released, eligible source returns null (a miss is null) — the adapter
//     never invents a syllabus, a subject, or coverage.
//   - Server-live: every DTO is derived from current store state; a withdrawal,
//     pointer demotion or source rejection immediately changes what the adapter
//     can return (no authoritative cache).
//
// Exit: learners receive only authorized, supported, published versions.

/** Reviewed content status (mirror of the frontend contract). */
export type Status = 'sample' | 'provisional' | 'official';

/** Provenance: which approved source backs a node (provider/sourceId/version). */
export interface Provenance {
  provider: string;
  sourceId: string;
  version: string;
}

/** BCP-47 interface/requested locale. */
export type Locale = string;

/** Source-release state mirrored from the catalog (CONTENT-01/06). */
export type SourceReleaseState = 'pending' | 'approved' | 'released' | 'rejected';

/** Authoring representation passed through unchanged (frontend contract shape). */
export interface Representation {
  id: string;
  kind: 'text' | 'diagram' | 'cube' | 'number-line' | 'scene';
  alternative: string;
  assetId?: string;
  numberLine?: { minimum: number; maximum: number; divisions: number; initial: number };
  series?: { label: string; value: number }[];
}

/** Reviewed concept DTO (subset produced by this adapter). */
export interface ConceptDTO {
  id: string;
  title: string;
  topicId: string;
  prerequisiteIds: readonly string[];
  status: Status;
  officialId?: string;
  representations: readonly Representation[];
  /** The interface locale this DTO was requested/rendered for. */
  locale: Locale;
  /** Locales the released source actually supports (never invented). */
  availableLocales: readonly Locale[];
  /** True when the concept is released+eligible but not in the requested locale. */
  languageUnavailable: boolean;
  provenance: Provenance;
}

/** Reviewed syllabus DTO (graph root). */
export interface SyllabusDTO {
  id: string;
  board: string;
  classLevel: string;
  subject: string;
  status: Status;
  contentLocale?: Locale;
  availableLocales?: readonly Locale[];
  provenance: Provenance;
}

/** Reviewed graph DTO (a full syllabus response). */
export interface GraphDTO {
  syllabus: SyllabusDTO;
  topics: readonly { id: string; title: string; chapterId: string; conceptIds: readonly string[]; status: Status }[];
  concepts: readonly ConceptDTO[];
}

/** Reviewed subjects catalogue DTO. */
export interface SubjectCatalogueDTO {
  board: string;
  classLevel: string;
  subjects: readonly string[];
}

/** A stable catalog node as the adapter sees it (CONTENT-01 store shape). */
export interface CatalogNodeFacts {
  /** Stable public ID — `content:<sha256>`, never recycled (CONTENT-01). */
  nodeKey: string;
  /** Stable concept/topic/chapter id used in DTOs. */
  catalogId: string;
  kind: 'curriculum' | 'book' | 'chapter' | 'topic' | 'concept';
  title: string;
  parentId: string | null;
  subject: string;
  board: string;
  classLevel: string;
  status: Status;
  authoredLanguage: Locale;
  /** Released locales of this node's published pointer (CONTENT-03/05). */
  releasedLocales: readonly Locale[];
  sourceRelease: SourceReleaseState;
  /** Catalog eligibility: node + every ancestor published & public + approved/released. */
  eligibleForRetrieval: boolean;
  prerequisiteIds: readonly string[];
  representations: readonly Representation[];
  source: { provider: string; version: string };
}
