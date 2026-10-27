// CONTENT-07 (KAN-66) — the media delivery gate's typed state seams. The domain
// stores (catalog CONTENT-01, publication pointer CONTENT-03, retrieval gate
// CONTENT-05, file/object stores) implement these at integration; the in-memory
// implementation is contract-true and fails closed: unknown node/media proves
// nothing.
import type {
  MediaPointer,
  SourceMediaFacts,
  SourceReleaseState,
} from './media-gate-types';

export interface MediaLookup {
  /** All source-media facts the gate may use to authorize delivery. */
  allNodes(): Promise<SourceMediaFacts[]>;
  /** Media facts for one source node, or undefined if unknown. */
  byNode(nodeKey: string): Promise<SourceMediaFacts | undefined>;
}

/**
 * The gate needs two independent facts about each node:
 *  (a) catalog eligibility + source release (CONTENT-01/06),
 *  (b) the declared media pointers and their per-media gates.
 * The in-memory implementation is contract-true so tests and local runs exercise
 * the full authorization path without a database.
 */
export class InMemoryMediaStore implements MediaLookup {
  private readonly nodes = new Map<string, SourceMediaFacts>();

  setNode(facts: SourceMediaFacts): void {
    this.nodes.set(facts.nodeKey, {
      ...facts,
      media: facts.media.map((m) => ({ ...m })),
    });
  }

  removeNode(nodeKey: string): void { this.nodes.delete(nodeKey); }

  async allNodes(): Promise<SourceMediaFacts[]> {
    return [...this.nodes.values()].map((n) => ({
      ...n,
      media: n.media.map((m) => ({ ...m })),
    }));
  }

  async byNode(nodeKey: string): Promise<SourceMediaFacts | undefined> {
    const found = this.nodes.get(nodeKey);
    return found ? { ...found, media: found.media.map((m) => ({ ...m })) } : undefined;
  }

  /** Helpers to build common media facts (see tests). */
  static mediaPointer(input: {
    mediaKey: string;
    kind?: MediaPointer['kind'];
    ref?: string;
    gates?: Partial<{ rights: MediaPointer['rights']; privacy: MediaPointer['privacy']; cost: MediaPointer['cost'] }>;
  }): MediaPointer {
    return {
      mediaKey: input.mediaKey,
      kind: input.kind ?? 'owned_media',
      ref: input.ref ?? `gs://media/${input.mediaKey}.mp4`,
      rights: input.gates?.rights ?? 'approved',
      privacy: input.gates?.privacy ?? 'approved',
      cost: input.gates?.cost ?? 'approved',
    };
  }

  static node(input: {
    nodeKey: string;
    nodeVersion?: string;
    sourceRelease?: SourceReleaseState;
    eligible?: boolean;
    media?: readonly MediaPointer[];
  }): SourceMediaFacts {
    return {
      nodeKey: input.nodeKey,
      nodeVersion: input.nodeVersion ?? '1.0.0',
      sourceRelease: input.sourceRelease ?? 'released',
      eligibleForDelivery: input.eligible ?? true,
      media: input.media ?? [],
    };
  }
}
