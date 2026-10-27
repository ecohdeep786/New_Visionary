// CONTENT-04 (KAN-63) — the catalog/concept → reviewed DTO adapter.
//
// Core responsibilities (server-owned; the adapted output is what learners
// receive — a miss is null, never invented curriculum):
//   1. getSubjects: the distinct subjects that have at least one released,
//      eligible concept — derived from the store, never from UI labels.
//   2. getSyllabus: build the reviewed graph DTO from released, eligible catalog
//      concepts for an exact board/classLevel/subject. If no concept proves the
//      selection, return null (a selection with no released source is a miss,
//      not an empty syllabus).
//   3. getConcept: the reviewed concept DTO for a stable catalog id — only for
//      released, eligible concept nodes. Unknown or unreleased → null.
//   4. Locale distinctions preserved: authored language, interface language and
//      released locales stay distinct. A released+eligible concept whose
//      released locales do not include the requested interface locale returns
//      `languageUnavailable: true` with its true availableLocales — it is
//      present but not supported in that language (never an invented
//      translation).
//   5. Authoring representations passed through unchanged; provenance included.
//   6. Server-live: every DTO is recomputed from current store state. No
//      authoritative cache; withdrawal / pointer demotion / source rejection
//      immediately changes what adapters return.
import type { CatalogNodeFacts, ConceptDTO, GraphDTO, Locale, Provenance, SubjectCatalogueDTO, SyllabusDTO } from './catalog-adapter-types';
import type { CatalogAdapterLookup, SubjectLookup } from './catalog-adapter-lookups';

function isConcept(n: CatalogNodeFacts): boolean {
  return n.kind === 'concept' && n.sourceRelease === 'released' && n.eligibleForRetrieval && n.releasedLocales.length > 0;
}

export class CatalogDtoAdapter {
  constructor(
    private readonly store: CatalogAdapterLookup & SubjectLookup,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  private provenanceOf(n: CatalogNodeFacts): Provenance {
    return { provider: n.source.provider, sourceId: n.nodeKey, version: n.source.version };
  }

  private conceptDTO(n: CatalogNodeFacts, locale: Locale): ConceptDTO {
    const availableLocales = [...n.releasedLocales].sort();
    return {
      id: n.catalogId,
      title: n.title,
      topicId: n.parentId ?? '',
      prerequisiteIds: [...n.prerequisiteIds],
      status: n.status,
      representations: n.representations.map((r) => ({ ...r })),
      locale,
      availableLocales,
      languageUnavailable: !availableLocales.includes(locale),
      provenance: this.provenanceOf(n),
    };
  }

  /** Distinct subjects with released, eligible content — null when none exists. */
  async getSubjects(board: string, classLevel: string): Promise<SubjectCatalogueDTO | null> {
    const all = await this.store.allNodes();
    const subjects = new Set<string>();
    for (const n of all) {
      if (isConcept(n) && n.board === board && n.classLevel === classLevel) subjects.add(n.subject);
    }
    if (subjects.size === 0) return null;
    return { board, classLevel, subjects: [...subjects].sort() };
  }

  /** Reviewed syllabus + graph DTO, or null (a miss is null — never invented). */
  async getSyllabus(board: string, classLevel: string, subject: string, locale: Locale = 'en'): Promise<GraphDTO | null> {
    const all = await this.store.allNodes();
    const concepts = all.filter((n) => isConcept(n) && n.board === board && n.classLevel === classLevel && n.subject === subject);
    if (concepts.length === 0) return null;

    const conceptDTOs = concepts.map((n) => this.conceptDTO(n, locale));
    const topicIds = [...new Set(conceptDTOs.map((c) => c.topicId))];
    const topics = topicIds.flatMap((topicId) => {
      const topic = all.find((n) => n.catalogId === topicId && n.kind === 'topic');
      if (!topic) return [];
      return [{
        id: topic.catalogId,
        title: topic.title,
        chapterId: topic.parentId ?? '',
        conceptIds: conceptDTOs.filter((c) => c.topicId === topicId).map((c) => c.id),
        status: topic.status,
      }];
    });

    const representative = concepts[0];
    const availableLocales = [...new Set(concepts.flatMap((c) => c.releasedLocales))].sort();
    const syllabusDTO: SyllabusDTO = {
      id: representative.nodeKey,
      board,
      classLevel,
      subject,
      status: representative.status,
      contentLocale: locale,
      availableLocales,
      provenance: this.provenanceOf(representative),
    };
    return { syllabus: syllabusDTO, topics, concepts: conceptDTOs };
  }

  /** Reviewed concept DTO or null for an unknown/not-supported concept. */
  async getConcept(catalogId: string, locale: Locale = 'en'): Promise<ConceptDTO | null> {
    const node = await this.store.byCatalogId(catalogId);
    if (!node || !isConcept(node)) return null;
    return this.conceptDTO(node, locale);
  }
}
