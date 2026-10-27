// CONTENT-08 (KAN-144) — the graph service's typed state seams. The owning
// store (canonical concepts, prerequisite edges, versioned snapshots, exam
// views, gap queue) implements this at integration; the in-memory
// implementation is contract-true and fails closed.
import type {
  CanonicalConcept,
  ExamView,
  GapQueueEntry,
  GraphSnapshot,
  PrerequisiteEdge,
  TranslationView,
} from './concept-graph-types';

export interface ConceptGraphStore {
  upsertConcept(concept: CanonicalConcept): Promise<void>;
  removeConcept(conceptId: string): Promise<void>;
  allConcepts(): Promise<CanonicalConcept[]>;
  byConceptId(conceptId: string): Promise<CanonicalConcept | undefined>;
  saveTranslation(view: TranslationView): Promise<void>;
  allTranslations(): Promise<TranslationView[]>;
  allEdges(): Promise<PrerequisiteEdge[]>;
  addEdge(edge: PrerequisiteEdge): Promise<void>;
  removeEdge(edge: PrerequisiteEdge): Promise<void>;
  saveSnapshot(snapshot: GraphSnapshot): Promise<void>;
  snapshots(): Promise<GraphSnapshot[]>;
  currentSnapshotVersion(): Promise<number | null>;
  setCurrentSnapshotVersion(version: number): Promise<void>;
  saveExamView(view: ExamView): Promise<void>;
  examViews(): Promise<ExamView[]>;
  saveGap(entry: GapQueueEntry): Promise<void>;
  gaps(): Promise<GapQueueEntry[]>;
}

/** Mutable working state captured by a snapshot. */
export interface GraphState {
  concepts: Map<string, CanonicalConcept>;
  edges: PrerequisiteEdge[];
}

/**
 * Contract-true in-memory store. Snapshots are immutable copies of the working
 * state at snapshot time; rollback restores an exact earlier snapshot.
 */
export class InMemoryConceptGraphStore implements ConceptGraphStore {
  private concepts = new Map<string, CanonicalConcept>();
  private translations: TranslationView[] = [];
  private edges: PrerequisiteEdge[] = [];
  private versions: GraphSnapshot[] = [];
  private currentVersion: number | null = null;
  private exams: ExamView[] = [];
  private gapEntries: GapQueueEntry[] = [];

  async upsertConcept(concept: CanonicalConcept): Promise<void> {
    this.concepts.set(concept.conceptId, { ...concept, provenance: { ...concept.provenance } });
  }

  async removeConcept(conceptId: string): Promise<void> {
    // Curation edges are review decisions, not concept state: removing a
    // concept (e.g. its source was withdrawn) keeps the edges so the curriculum
    // view can honestly report the referenced coverage as `unavailable`.
    this.concepts.delete(conceptId);
    this.translations = this.translations.filter((t) => t.conceptId !== conceptId);
  }

  async allConcepts(): Promise<CanonicalConcept[]> {
    return [...this.concepts.values()].map((c) => ({ ...c, provenance: { ...c.provenance } }));
  }

  async byConceptId(conceptId: string): Promise<CanonicalConcept | undefined> {
    const found = this.concepts.get(conceptId);
    return found ? { ...found, provenance: { ...found.provenance } } : undefined;
  }

  async saveTranslation(view: TranslationView): Promise<void> {
    this.translations.push({ ...view });
  }

  /** Direct working-state mutation used by rollback restore (not part of the seam). */
  restore(state: GraphState): void {
    this.concepts = new Map(state.concepts);
    this.edges = state.edges.map((e) => ({ ...e }));
  }

  async allTranslations(): Promise<TranslationView[]> {
    return this.translations.map((t) => ({ ...t }));
  }

  async allEdges(): Promise<PrerequisiteEdge[]> {
    return this.edges.map((e) => ({ ...e }));
  }

  async addEdge(edge: PrerequisiteEdge): Promise<void> {
    this.edges.push({ ...edge });
  }

  async removeEdge(edge: PrerequisiteEdge): Promise<void> {
    this.edges = this.edges.filter((e) => !(e.conceptId === edge.conceptId && e.prerequisiteId === edge.prerequisiteId));
  }

  async saveSnapshot(snapshot: GraphSnapshot): Promise<void> {
    this.versions.push({ ...snapshot, conceptIds: [...snapshot.conceptIds], edges: snapshot.edges.map((e) => ({ ...e })) });
    this.currentVersion = snapshot.version;
  }

  async snapshots(): Promise<GraphSnapshot[]> {
    return this.versions.map((v) => ({ ...v, conceptIds: [...v.conceptIds], edges: v.edges.map((e) => ({ ...e })) }));
  }

  async currentSnapshotVersion(): Promise<number | null> {
    return this.currentVersion;
  }

  async setCurrentSnapshotVersion(version: number): Promise<void> {
    this.currentVersion = version;
  }

  async saveExamView(view: ExamView): Promise<void> {
    this.exams.push(view);
  }

  async examViews(): Promise<ExamView[]> {
    return this.exams;
  }

  async saveGap(entry: GapQueueEntry): Promise<void> {
    this.gapEntries.push({ ...entry });
  }

  async gaps(): Promise<GapQueueEntry[]> {
    return this.gapEntries.map((g) => ({ ...g }));
  }

  /** Helpers to build common inputs (see tests). */
  static concept(input: {
    conceptId: string;
    title: string;
    sourceClass?: CanonicalConcept['sourceClass'];
    provider?: string;
    edition?: string;
    version?: string;
    verificationRef?: string | null;
    reviewed?: boolean;
    at?: string;
  }): CanonicalConcept {
    const reviewed = input.reviewed ?? (input.verificationRef !== undefined && input.verificationRef !== null);
    return {
      conceptId: input.conceptId,
      title: input.title,
      sourceClass: input.sourceClass ?? 'official_school',
      provenance: {
        provider: input.provider ?? 'cisce',
        edition: input.edition ?? 'ed-2024',
        version: input.version ?? '1.0.0',
        verificationRef: input.verificationRef ?? null,
        verifiedAt: reviewed ? (input.at ?? new Date().toISOString()) : null,
      },
      reviewed,
      createdAt: input.at ?? new Date().toISOString(),
    };
  }
}
