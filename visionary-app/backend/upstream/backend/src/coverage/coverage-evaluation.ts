// CONTENT-06 (KAN-65) — the coverage/retrieval evaluator.
//
// Core responsibilities (server-owned; labels never establish support):
//   1. Derive, from the injected catalog/pointer store, the set of RELEASED
//      categories and, per category, the released languages — i.e. the
//      (category, language) segments a learner may actually retrieve. The
//      evaluator never treats the frontend's category labels as coverage.
//   2. Evaluate coverage on every released segment: which catalog nodes are
//      released + eligible for that exact language (evidence), and any other
//      category nodes that did NOT become evidence (unprovedClaims — honest
//      gaps the UI must not advertise).
//   3. Evaluate retrieval on every released segment: returning exactly the
//      eligible released node keys for that language only — never a node whose
//      pointer locale does not cover the language (no cross-language leak,
//      including Hindi/Bengali where released).
//   4. Evaluate claims: a frontend label for (category, language) is proved
//      ONLY when a released eligible source exists for that exact segment.
//      Otherwise it is reported as unavailable/not_released — fail closed.
//   5. Server-live: every evaluation is recomputed from current store state;
//      a withdrawal, pointer demotion or source rejection immediately drops a
//      node from coverage (no authoritative cache).
import type {
  CatalogNodeFacts,
  CategoryCoverage,
  CategoryLanguageRow,
  CategoryLabelClaim,
  ClaimEvaluation,
  CoverageReport,
  CoverageStatus,
  LanguageTag,
  ReleasedSourceEvidence,
} from './coverage-evaluation-types';
import type { CatalogLookup } from './coverage-evaluation-lookups';

/** A node proves coverage for (category, language) only when all hold. */
export function provesCoverage(node: CatalogNodeFacts, language: LanguageTag): boolean {
  if (!node.eligibleForRetrieval) return false;
  if (node.sourceRelease !== 'released') return false;
  return node.pointerLocales.some((l) => l.language === language && l.pointerState === 'released');
}

export class CoverageEvaluator {
  private readonly now: () => string;
  constructor(
    private readonly catalog: CatalogLookup,
    options: { now?: () => Date } = {},
  ) {
    this.now = options.now ? () => options.now().toISOString() : () => new Date().toISOString();
  }

  private releasedLocalesOf(node: CatalogNodeFacts): readonly LanguageTag[] {
    return node.pointerLocales.filter((l) => l.pointerState === 'released').map((l) => l.language);
  }

  private evidenceFor(node: CatalogNodeFacts, language: LanguageTag): ReleasedSourceEvidence {
    return {
      nodeKey: node.nodeKey,
      source: { ...node.source },
      releasedLocales: this.releasedLocalesOf(node),
      authoredLanguage: node.authoredLanguage,
    };
  }

  /**
   * Evaluate coverage + retrieval on every released category/language.
   * Categories and released languages are derived from the store; frontend
   * labels are never part of this computation, so a label can never fabricate
   * support.
   */
  async evaluateAll(): Promise<CoverageReport> {
    const nodes = await this.catalog.allNodes();
    const byCategory = new Map<string, CatalogNodeFacts[]>();
    for (const n of nodes) {
      const list = byCategory.get(n.categoryId) ?? [];
      list.push(n);
      byCategory.set(n.categoryId, list);
    }

    const categories: CategoryCoverage[] = [];
    for (const [categoryId, categoryNodes] of byCategory.entries()) {
      // Released languages: derived strictly from proving sources.
      const releasedLanguages = new Set<LanguageTag>();
      for (const node of categoryNodes) {
        for (const lang of this.releasedLocalesOf(node)) {
          if (provesCoverage(node, lang)) releasedLanguages.add(lang);
        }
      }

      const rows: CategoryLanguageRow[] = [];
      for (const language of [...releasedLanguages].sort()) {
        const evidence = categoryNodes
          .filter((n) => provesCoverage(n, language))
          .map((n) => this.evidenceFor(n, language));
        // unprovedClaims = nodes whose AUTHORED language claims this segment but
        // fail to prove it (e.g. authored 'hi' with no released hi pointer).
        // These are honest gaps the UI must not advertise as supported. Nodes
        // in other languages are not claims for this segment — a hi-released
        // node not proving en is not an English gap.
        const unprovedClaims = categoryNodes
          .filter((n) => n.authoredLanguage === language && !provesCoverage(n, language))
          .map((n) => n.nodeKey);
        const status: CoverageStatus = unprovedClaims.length > 0 ? 'partial' : 'supported';
        rows.push({ categoryId, language, status, evidence, unprovedClaims });
      }

      categories.push({ categoryId, releasedLanguages: [...releasedLanguages].sort(), rows });
    }
    categories.sort((a, b) => a.categoryId.localeCompare(b.categoryId));

    return {
      categories,
      unprovedLabels: [],
      decisionSource: 'server-live',
      evaluatedAt: this.now(),
    };
  }

  /**
   * Evaluate a list of frontend category labels as CLAIMS. A claim is proved
   * only by a released eligible source for the exact (category, language);
   * anything else reports its honest state (unavailable / not_released).
   */
  async evaluateClaims(claims: readonly CategoryLabelClaim[]): Promise<{
    unprovedLabels: readonly CategoryLabelClaim[];
    categories: readonly CategoryCoverage[];
  }> {
    const report = await this.evaluateAll();
    const unprovedLabels: CategoryLabelClaim[] = [];
    for (const claim of claims) {
      const category = report.categories.find((c) => c.categoryId === claim.categoryId);
      const row = category?.rows.find((r) => r.language === claim.language);
      if (!row || row.evidence.length === 0) unprovedLabels.push(claim);
    }
    return { unprovedLabels, categories: report.categories };
  }

  /** Evaluate one frontend label claim: does backend proof support it? */
  async evaluateClaim(claim: CategoryLabelClaim): Promise<ClaimEvaluation> {
    const { categories } = await this.evaluateClaims([claim]);
    const category = categories.find((c) => c.categoryId === claim.categoryId);
    const row = category?.rows.find((r) => r.language === claim.language);
    const releasedLanguages = category?.releasedLanguages ?? [];
    const proved = Boolean(row && row.evidence.length > 0);
    return {
      categoryId: claim.categoryId,
      language: claim.language,
      releasedLanguages,
      proved,
      supportedStatus: proved ? 'supported' : category && category.rows.length > 0 ? 'not_released' : 'unavailable',
      evidence: row?.evidence ?? [],
    };
  }

  /**
   * Evaluate RETRIEVAL for a (category, language) segment: the exact set of
   * eligible released node keys a learner may retrieve — only nodes whose
   * released pointer covers this language. Fail closed: a segment with no
   * released evidence returns empty with a typed reason.
   */
  async evaluateRetrieval(categoryId: string, language: LanguageTag): Promise<{
    categoryId: string;
    language: LanguageTag;
    retrievable: readonly string[];
    multipleFound: boolean;
    reason: 'released' | 'unavailable' | 'not_released';
  }> {
    const nodes = await this.catalog.byCategory(categoryId);
    const proving = nodes.filter((n) => provesCoverage(n, language));
    if (proving.length === 0) {
      const hasAnyRelease = nodes.some((n) => n.sourceRelease === 'released' && this.releasedLocalesOf(n).length > 0);
      return {
        categoryId,
        language,
        retrievable: [],
        multipleFound: false,
        reason: hasAnyRelease ? 'not_released' : 'unavailable',
      };
    }
    return {
      categoryId,
      language,
      retrievable: proving.map((n) => n.nodeKey),
      multipleFound: proving.length > 1,
      reason: 'released',
    };
  }
}
