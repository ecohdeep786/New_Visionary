// CONTENT-06 (KAN-65) — the coverage evaluator's typed state seams. The domain
// stores (catalog CONTENT-01, publication pointer CONTENT-03, retrieval gate
// CONTENT-05) implement these at integration; the in-memory implementations are
// contract-true and fail closed: an unknown category/language proves nothing.
import type {
  CatalogNodeFacts,
  LanguageTag,
  PointerLocaleSupport,
  SourceReleaseState,
} from './coverage-evaluation-types';

export interface CatalogLookup {
  /** All catalog node facts the evaluator may use to derive coverage. */
  allNodes(): Promise<CatalogNodeFacts[]>;
  /** Nodes belonging to one category (facts; eligibility is evaluated fresh). */
  byCategory(categoryId: string): Promise<CatalogNodeFacts[]>;
}

/**
 * The evaluator needs three independent state facts about each node:
 *  (a) catalog eligibility (CONTENT-01 `eligibleForRetrieval`),
 *  (b) published-pointer released locales (CONTENT-03 pointer),
 *  (c) the exact requested language.
 * In-memory implementations are contract-true so tests and local runs exercise
 * the full evaluation without a database.
 */
export class InMemoryCoverageStore implements CatalogLookup {
  private readonly nodes = new Map<string, CatalogNodeFacts>();

  setNode(facts: CatalogNodeFacts): void {
    this.nodes.set(facts.nodeKey, { ...facts, source: { ...facts.source }, pointerLocales: [...facts.pointerLocales] });
  }

  removeNode(nodeKey: string): void { this.nodes.delete(nodeKey); }

  async allNodes(): Promise<CatalogNodeFacts[]> {
    return [...this.nodes.values()].map((n) => ({ ...n, source: { ...n.source }, pointerLocales: [...n.pointerLocales] }));
  }

  async byCategory(categoryId: string): Promise<CatalogNodeFacts[]> {
    const all = await this.allNodes();
    return all.filter((n) => n.categoryId === categoryId);
  }

  /** Helpers to build common facts (see tests). */
  static releasedNode(input: {
    nodeKey: string; categoryId: string; authoredLanguage?: LanguageTag;
    source?: Partial<{ provider: string; edition: string; version: string }>;
    sourceRelease?: SourceReleaseState; pointerLocales?: readonly LanguageTag[];
    eligible?: boolean;
  }): CatalogNodeFacts {
    const pointerLocales = (input.pointerLocales ?? ['en'] as readonly LanguageTag[])
      .map((language) => ({ language, pointerState: 'released' as PointerLocaleSupport }));
    return {
      nodeKey: input.nodeKey,
      categoryId: input.categoryId,
      authoredLanguage: input.authoredLanguage ?? 'en',
      source: {
        provider: input.source?.provider ?? 'cisce',
        edition: input.source?.edition ?? 'ed-2024',
        version: input.source?.version ?? '1.0.0',
      },
      sourceRelease: input.sourceRelease ?? 'released',
      eligibleForRetrieval: input.eligible ?? true,
      pointerLocales,
    };
  }
}
