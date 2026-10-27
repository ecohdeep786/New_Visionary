// CONTENT-08 (KAN-144) — reviewed concept/prerequisite DAG curation and
// source-versioned curriculum/exam views.
//
// Core responsibilities (server-owned; honest coverage only):
//   1. Canonical concepts: registerCanonical is idempotent per conceptId; a
//      conflicting duplicate identity is refused — a translation view
//      (addTranslationView) is locale-tagged on the SAME identity and never
//      creates a second concept.
//   2. Acyclic curation: addPrerequisite refuses self-loops and any edge whose
//      insertion would create a cycle (reachability check over the current DAG).
//   3. Versioned reviewed snapshots: snapshot() freezes the working DAG into an
//      immutable version; rollbackTo(version) restores that exact snapshot —
//      concepts and edges registered later do not leak back in after rollback.
//   4. Curriculum/exam views are source-versioned and preserve official
//      metadata, edition and verification provenance. Coverage inside a view is
//      distinguished: reviewed / provisional / unavailable — provisional and
//      unavailable are NEVER presented as official coverage.
//   5. Exam weights require calibration provenance; a weight without a
//      calibration reference is refused (no invented weights, no rank band).
//   6. The gap queue records missing coverage honestly: queueing a gap never
//      creates syllabus coverage and never promises a replacement deadline.
import type {
  CanonicalConcept,
  CurriculumView,
  CurationState,
  ExamView,
  GapQueueEntry,
} from './concept-graph-types';
import { ConceptGraphError } from './concept-graph-types';
import type { ConceptGraphStore } from './concept-graph-lookups';

export class ConceptGraphService {
  private snapshotCounter = 0;
  constructor(
    private readonly store: ConceptGraphStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Register a canonical concept; idempotent per identity, conflicts refused. */
  async registerCanonical(input: Omit<CanonicalConcept, 'createdAt'>): Promise<CanonicalConcept> {
    const existing = await this.store.byConceptId(input.conceptId);
    if (existing) {
      if (existing.title === input.title && existing.provenance.version === input.provenance.version) return existing;
      throw new ConceptGraphError('duplicate_identity');
    }
    const concept: CanonicalConcept = {
      ...input,
      provenance: { ...input.provenance },
      createdAt: this.now().toISOString(),
    };
    await this.store.upsertConcept(concept);
    return concept;
  }

  /** Add a locale-tagged translation view on the SAME canonical identity. */
  async addTranslationView(conceptId: string, locale: string, title: string): Promise<void> {
    if (!(await this.store.byConceptId(conceptId))) throw new ConceptGraphError('unknown_translation_concept');
    const existing = await this.store.allTranslations();
    if (existing.some((t) => t.conceptId === conceptId && t.locale === locale)) {
      throw new ConceptGraphError('duplicate_translation');
    }
    await this.store.saveTranslation({ conceptId, locale, title });
  }

  /** Add a prerequisite edge; refuses self-loops and cycle-creating edges. */
  async addPrerequisite(conceptId: string, prerequisiteId: string): Promise<void> {
    if (conceptId === prerequisiteId) throw new ConceptGraphError('self_loop');
    if (!(await this.store.byConceptId(conceptId)) || !(await this.store.byConceptId(prerequisiteId))) {
      throw new ConceptGraphError('unknown_concept');
    }
    // Would `prerequisiteId` transitively reach `conceptId`? Then
    // conceptId → prerequisiteId closes a cycle: reject (fail closed).
    if (await this.reaches(prerequisiteId, conceptId)) throw new ConceptGraphError('cycle_rejected');
    await this.store.addEdge({ conceptId, prerequisiteId });
  }

  /** DFS over "requires" edges: does `from` transitively reach `to`? */
  private async reaches(from: string, to: string): Promise<boolean> {
    const edges = await this.store.allEdges();
    const adjacency = new Map<string, string[]>();
    for (const e of edges) {
      const list = adjacency.get(e.conceptId) ?? [];
      list.push(e.prerequisiteId);
      adjacency.set(e.conceptId, list);
    }
    const seen = new Set<string>();
    const stack = [from];
    while (stack.length) {
      const current = stack.pop() as string;
      if (current === to) return true;
      if (seen.has(current)) continue;
      seen.add(current);
      for (const next of adjacency.get(current) ?? []) stack.push(next);
    }
    return false;
  }

  /** Freeze the working DAG into an immutable, versioned reviewed snapshot. */
  async snapshot(): Promise<number> {
    const concepts = await this.store.allConcepts();
    const edges = await this.store.allEdges();
    const version = ++this.snapshotCounter;
    await this.store.saveSnapshot({
      version,
      conceptIds: concepts.map((c) => c.conceptId).sort(),
      edges: edges.map((e) => ({ ...e })),
      createdAt: this.now().toISOString(),
    });
    return version;
  }

  /** Restore the exact earlier snapshot; later edits do not leak back in. */
  async rollbackTo(version: number): Promise<void> {
    const target = (await this.store.snapshots()).find((v) => v.version === version);
    if (!target) throw new ConceptGraphError('unknown_snapshot');
    const keep = new Set(target.conceptIds);
    for (const c of await this.store.allConcepts()) {
      if (!keep.has(c.conceptId)) await this.store.removeConcept(c.conceptId);
    }
    // Restore the snapshot's exact edge set.
    for (const e of await this.store.allEdges()) {
      if (!target.edges.some((t) => t.conceptId === e.conceptId && t.prerequisiteId === e.prerequisiteId)) {
        await this.store.removeEdge(e);
      }
    }
    for (const e of target.edges) {
      const current = await this.store.allEdges();
      if (!current.some((t) => t.conceptId === e.conceptId && t.prerequisiteId === e.prerequisiteId)) {
        await this.store.addEdge(e);
      }
    }
    await this.store.setCurrentSnapshotVersion(version);
  }

  /**
   * Curriculum view for one edition: coverage distinguished honestly.
   * reviewed = verified concept in this edition; provisional = registered but
   * unverified (or another edition); unavailable = referenced by an edge but
   * with no registered concept.
   */
  async curriculumView(edition: string): Promise<CurriculumView> {
    const concepts = await this.store.allConcepts();
    const edges = await this.store.allEdges();
    const reviewed: string[] = [];
    const provisional: string[] = [];
    for (const c of concepts) {
      if (c.provenance.edition === edition && c.reviewed) reviewed.push(c.conceptId);
      else provisional.push(c.conceptId);
    }
    const known = new Set([...reviewed, ...provisional]);
    const unavailable = [...new Set(edges.flatMap((e) => [e.conceptId, e.prerequisiteId]))]
      .filter((id) => !known.has(id));
    const version = await this.store.currentSnapshotVersion();
    return {
      edition,
      reviewed: reviewed.sort(),
      provisional: provisional.sort(),
      unavailable: unavailable.sort(),
      snapshotVersion: version ?? 0,
    };
  }

  /** Build a source-versioned exam view; weights require calibration provenance. */
  async examView(metadata: ExamView['metadata'], sections: ExamView['sections']): Promise<ExamView> {
    for (const section of sections) {
      for (const weight of section.weights) {
        if (!weight.calibrationRef) throw new ConceptGraphError('weight_without_provenance');
        if (!(await this.store.byConceptId(weight.conceptId))) throw new ConceptGraphError('unknown_concept');
      }
    }
    const coverage: { conceptId: string; state: CurationState }[] = [];
    const seen = new Set<string>();
    for (const section of sections) {
      for (const weight of section.weights) {
        if (seen.has(weight.conceptId)) continue;
        seen.add(weight.conceptId);
        const concept = await this.store.byConceptId(weight.conceptId);
        coverage.push({ conceptId: weight.conceptId, state: concept?.reviewed ? 'reviewed' : 'provisional' });
      }
    }
    const view: ExamView = { metadata: { ...metadata }, sections, coverage };
    await this.store.saveExamView(view);
    return view;
  }

  /** Queue a curated gap. It never creates coverage and never promises a date. */
  async queueGap(input: { gapId: string; subject: string; requestedCoverage: string; requestedBy: string }): Promise<GapQueueEntry> {
    const entry: GapQueueEntry = { ...input, queuedAt: this.now().toISOString(), promisedDeadline: null };
    await this.store.saveGap(entry);
    return entry;
  }
}
