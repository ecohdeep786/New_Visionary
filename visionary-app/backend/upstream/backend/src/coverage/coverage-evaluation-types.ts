// CONTENT-06 (KAN-65) — evaluate coverage and retrieval on every released
// category/language, including Hindi/Bengali segmentation where released.
//
// The checkpoint here is honest, backend-owned coverage accounting:
//   - A "released category/language" means a concrete released source exists:
//     a catalog node that is published + public + source-approved/released AND
//     whose publication pointer lists the language in its released locales
//     (CONTENT-03/05 integration). A node whose authoredLanguage is 'hi' but
//     whose released locales are ['en'] does NOT establish Hindi coverage —
//     authored language and released-locale support stay distinct (KAN-64).
//   - Coverage and retrieval are evaluated on EVERY released category/language,
//     never only on whatever the frontend happens to label. A frontend category
//     label is a CLAIM, not content proof: a labeled category/language with no
//     released, eligible source reports unavailable, never "supported".
//   - Retrieval on a released category/language must return only released,
//     eligible, published nodes in that exact language segment; a node released
//     for 'en' is never returned for the 'hi' segment (no cross-language leak).
//   - The evaluation is server-live: it is recomputed from the injected state
//     on every call and carries no authoritative cache (CACHE-01 / KAN-141).
//     A withdrawal, a draft/in_review pointer or a pending source drops a node
//     from coverage immediately.
//
// Exit: learners receive only authorized, supported, published versions.

/** BCP-47 language tag. Released languages today are the ones actually released. */
export type LanguageTag = string;

/** Backend-owned published pointer language support (CONTENT-03/05 shape). */
export type PointerLocaleSupport = 'released' | 'withdrawn' | 'in_review' | 'draft';

/**
 * Source-release state mirrored from the catalog (CONTENT-01) by shape: only
 * source versions approved/released are ever eligible for retrieval, so only
 * they can establish coverage.
 */
export type SourceReleaseState = 'pending' | 'approved' | 'released' | 'rejected';

/**
 * A per-language coverage row for one category segment.
 *
 * `status` is the honest, backend-owned verdict:
 *   - supported        — at least one released, eligible, published source
 *                         exists for this exact (category, language); that
 *                         source is what a learner may actually retrieve,
 *   - partial          — some eligible released sources exist but not all of
 *                         the claimed/labeled nodes for this segment are
 *                         released/eligible (coverage gaps are explicit),
 *   - unavailable      — no released, eligible source exists for this
 *                         (category, language); this is the state a frontend
 *                         label may NOT claim as support,
 *   - not_released     — the language is not in the released locales of any
 *                         eligible published pointer for this category (e.g.
 *                         Bengali labelled before it is released).
 */
export type CoverageStatus =
  | 'supported'
  | 'partial'
  | 'unavailable'
  | 'not_released';

/** The evidence behind a coverage row: the released eligible sources. */
export interface ReleasedSourceEvidence {
  nodeKey: string;
  source: { provider: string; edition: string; version: string };
  /** Released locales of this node's published pointer (CONTENT-03/05). */
  releasedLocales: readonly LanguageTag[];
  /** The authored language (metadata; never used to deny locale support). */
  authoredLanguage: LanguageTag;
}

export interface CategoryLanguageRow {
  categoryId: string;
  language: LanguageTag;
  status: CoverageStatus;
  /** Released, eligible sources that actually back this (category, language). */
  evidence: readonly ReleasedSourceEvidence[];
  /** Claimed node keys (frontend label) that did NOT turn into evidence. */
  unprovedClaims: readonly string[];
}

export interface CategoryCoverage {
  categoryId: string;
  /**
   * The languages a learner may actually retrieve for this category — derived
   * from released eligible sources, not from frontend labels.
   */
  releasedLanguages: readonly LanguageTag[];
  rows: readonly CategoryLanguageRow[];
}

export interface CoverageReport {
  /** Evaluated for every released category/language currently in the store. */
  categories: readonly CategoryCoverage[];
  /** Claimed (label) category/language pairs that found no backend proof. */
  unprovedLabels: readonly { categoryId: string; language: LanguageTag }[];
  decisionSource: 'server-live';
  evaluatedAt: string;
}

/** A frontend category label: a CLAIM that this category exists for learners. */
export interface CategoryLabelClaim {
  categoryId: string;
  /** Frontend labels are typically language-agnostic; evaluated per released language. */
  language: LanguageTag;
}

/** The eligibility predicates the evaluator needs (see coverage-evaluation-lookups.ts). */
export interface CatalogNodeFacts {
  nodeKey: string;
  categoryId: string;
  /** BCP-47 authored language; distinguishes content language from locales. */
  authoredLanguage: LanguageTag;
  source: { provider: string; edition: string; version: string };
  sourceRelease: SourceReleaseState;
  /** Catalog eligibility: published + public + source approved/released + every ancestor. */
  eligibleForRetrieval: boolean;
  /** Current published-pointer locale support (the released pointer gate). */
  pointerLocales: readonly { language: LanguageTag; pointerState: PointerLocaleSupport }[];
}

/** Result of evaluating one claimed category (labels never establish support). */
export interface ClaimEvaluation {
  categoryId: string;
  language: LanguageTag;
  /** Backend-derived released languages for the category (label-independent). */
  releasedLanguages: readonly LanguageTag[];
  /** True only if released eligible sources prove this exact claim. */
  proved: boolean;
  supportedStatus: CoverageStatus;
  evidence: readonly ReleasedSourceEvidence[];
}
