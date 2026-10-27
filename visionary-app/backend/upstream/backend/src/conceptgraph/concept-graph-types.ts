// CONTENT-08 (KAN-144) — versioned concept/prerequisite DAG curation and
// source-versioned curriculum/exam views.
//
// The checkpoint here is honest, backend-owned graph curation (Doc 02/11):
//   - Canonical concepts: one stable identity per concept; source/translation
//     views stay DISTINCT without duplicating identities (a translation view is
//     locale-tagged on the same canonical conceptId, never a second concept).
//   - Acyclic prerequisites: prerequisite curation forms a DAG. An edge that
//     would create a cycle is REJECTED (fail closed) — the graph is never
//     corrupted by a bad curation command.
//   - Versioned reviewed snapshots: every reviewed publication snapshot is
//     immutable and versioned; rollback restores an exact earlier snapshot and
//     later edits do not leak back in.
//   - Source-versioned curriculum/exam views: official school/exam metadata,
//     edition/current-syllabus/verification provenance are preserved. Exam
//     weights require an explicit calibration/provenance reference (no invented
//     weights, no rank band without an approved reference distribution).
//   - Coverage is distinguished: reviewed (a verified, released source backs the
//     concept in this edition), provisional (registered but unverified), and
//     unavailable (referenced but no source exists). A provisional or
//     unavailable concept is NEVER presented as official coverage.
//   - A gap queue records missing coverage honestly: queueing a gap cannot
//     invent an official syllabus and never promises an unstaffed replacement
//     deadline (no auto-fill date, ever).
//
// Exit: learners receive only authorized, supported, published versions.

/** The three honest coverage states (Doc 02: provisional = unverified, not invented). */
export type CurationState = 'reviewed' | 'provisional' | 'unavailable';

/** The kind of source backing a concept (official school/exam vs approved other). */
export type SourceClass = 'official_school' | 'official_exam' | 'professional' | 'institutional';

/** Verification provenance for one concept in one edition. */
export interface ConceptProvenance {
  provider: string;
  /** Source edition this verification belongs to (current-syllabus tracking). */
  edition: string;
  /** Source version the verification reviewed. */
  version: string;
  /** Who/what verified it (review record reference); absent until reviewed. */
  verificationRef: string | null;
  verifiedAt: string | null;
}

/** A canonical concept: one identity, source-versioned, translation views separate. */
export interface CanonicalConcept {
  /** Stable canonical identity — never duplicated by translation views. */
  conceptId: string;
  title: string;
  sourceClass: SourceClass;
  provenance: ConceptProvenance;
  /** true only when a verification record reviewed this concept's source. */
  reviewed: boolean;
  createdAt: string;
}

/** A translation view: locale-tagged on the SAME canonical identity. */
export interface TranslationView {
  conceptId: string;
  locale: string;
  title: string;
}

/** Directed prerequisite edge: `conceptId` requires `prerequisiteId`. */
export interface PrerequisiteEdge {
  conceptId: string;
  prerequisiteId: string;
}

/** An immutable reviewed publication snapshot of the DAG. */
export interface GraphSnapshot {
  version: number;
  conceptIds: readonly string[];
  edges: readonly PrerequisiteEdge[];
  createdAt: string;
}

/** Exam weight: a weight WITHOUT calibration provenance is refused. */
export interface ExamWeight {
  conceptId: string;
  weight: number;
  /** Calibration/reference provenance for this weight (Doc 20). */
  calibrationRef: string;
}

/** Official exam metadata preserved verbatim on the view. */
export interface ExamMetadata {
  examId: string;
  board: string;
  /** Official exam/year metadata. */
  year: string;
  sourceClass: SourceClass;
  edition: string;
}

/** A source-versioned exam view: official metadata + weighted concepts. */
export interface ExamView {
  metadata: ExamMetadata;
  sections: readonly { name: string; weights: readonly ExamWeight[] }[];
  /** Per-concept honest coverage inside THIS exam view. */
  coverage: readonly { conceptId: string; state: CurationState }[];
}

/** Curriculum view for one edition: coverage distinguished honestly. */
export interface CurriculumView {
  edition: string;
  reviewed: readonly string[];
  provisional: readonly string[];
  unavailable: readonly string[];
  /** The snapshot version this view was evaluated from. */
  snapshotVersion: number;
}

/** A curated gap: recorded missing coverage. It is NOT syllabus content. */
export interface GapQueueEntry {
  gapId: string;
  subject: string;
  requestedCoverage: string;
  requestedBy: string;
  queuedAt: string;
  /** Always null: a gap queue never promises an unstaffed replacement deadline. */
  promisedDeadline: null;
}

export class ConceptGraphError extends Error {
  constructor(
    public readonly code:
      | 'duplicate_identity'
      | 'unknown_concept'
      | 'cycle_rejected'
      | 'self_loop'
      | 'unknown_snapshot'
      | 'weight_without_provenance'
      | 'unknown_translation_concept'
      | 'duplicate_translation',
  ) {
    super(code);
  }
}
