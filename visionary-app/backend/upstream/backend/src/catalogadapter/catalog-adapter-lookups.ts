// CONTENT-04 (KAN-63) — the adapter's typed state seams. The catalog store
// (CONTENT-01) and published-pointer store (CONTENT-03/05) implement these at
// integration; the in-memory implementation is contract-true and fails closed:
// an unknown node/selection proves nothing (a miss is null).
import type { CatalogNodeFacts } from './catalog-adapter-types';

export interface CatalogAdapterLookup {
  allNodes(): Promise<CatalogNodeFacts[]>;
  byCatalogId(catalogId: string): Promise<CatalogNodeFacts | undefined>;
}

/** @return distinct subjects with at least one released, eligible concept. */
export interface SubjectLookup {
  releasedSubjects(): Promise<Set<string>>;
}

/** Contract-true in-memory store; tests drive the full adapter without a DB. */
export class InMemoryAdapterStore implements CatalogAdapterLookup, SubjectLookup {
  private readonly nodes = new Map<string, CatalogNodeFacts>();

  setNode(facts: CatalogNodeFacts): void {
    this.nodes.set(facts.catalogId, { ...facts, representations: facts.representations.map((r) => ({ ...r })) });
  }

  addNode(facts: CatalogNodeFacts): void { this.setNode(facts); }
  removeNode(catalogId: string): void { this.nodes.delete(catalogId); }

  async allNodes(): Promise<CatalogNodeFacts[]> {
    return [...this.nodes.values()].map((n) => ({ ...n, representations: n.representations.map((r) => ({ ...r })) }));
  }

  async byCatalogId(catalogId: string): Promise<CatalogNodeFacts | undefined> {
    const found = this.nodes.get(catalogId);
    return found ? { ...found, representations: found.representations.map((r) => ({ ...r })) } : undefined;
  }

  async releasedSubjects(): Promise<Set<string>> {
    const all = await this.allNodes();
    const subjects = new Set<string>();
    for (const n of all) {
      if (n.kind === 'concept' && n.sourceRelease === 'released' && n.eligibleForRetrieval && n.releasedLocales.length > 0) {
        subjects.add(n.subject);
      }
    }
    return subjects;
  }

  /** Helpers to build common facts (see tests). Supports chain (curriculum → … → concept). */
  static node(input: Partial<CatalogNodeFacts> & { catalogId: string; title: string; subject: string }): CatalogNodeFacts {
    return {
      nodeKey: input.nodeKey ?? `content:${input.catalogId}`,
      catalogId: input.catalogId,
      kind: input.kind ?? 'concept',
      title: input.title,
      parentId: input.parentId ?? null,
      subject: input.subject,
      board: input.board ?? 'Sample',
      classLevel: input.classLevel ?? '6',
      status: input.status ?? 'official',
      authoredLanguage: input.authoredLanguage ?? 'en',
      releasedLocales: input.releasedLocales ?? ['en'],
      sourceRelease: input.sourceRelease ?? 'released',
      eligibleForRetrieval: input.eligibleForRetrieval ?? true,
      prerequisiteIds: input.prerequisiteIds ?? [],
      representations: input.representations ?? [],
      source: input.source ?? { provider: 'cisce', version: '1.0.0' },
    };
  }

  static rep(overrides: Partial<import('./catalog-adapter-types').Representation> = {}): import('./catalog-adapter-types').Representation {
    return { id: overrides.id ?? 'rep1', kind: overrides.kind ?? 'text', alternative: overrides.alternative ?? 'plain text', ...overrides };
  }
}
