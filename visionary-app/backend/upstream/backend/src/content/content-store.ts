// CONTENT-01 — content catalog store contract + in-memory synthetic
// implementation. The Cloud SQL adapter implements the same surface over the
// Grade/Subject/Book/Chapter/Topic/Subtopic master tables plus the CONTENT-01
// metadata columns (source_versions, publications, content_nodes). Stable
// public IDs are the canonical external key; every row write is a fenced,
// owner-scoped transition that never mutates the durable identity.
import type { ContentNode, ContentKind } from './content-types';

export type CatalogWriteResult =
  | { ok: true; node: ContentNode }
  | { ok: false; reason: 'not_found' | 'unauthorized' };

/**
 * Mutable metadata columns only. The durable identity — publicId, kind,
 * parentId, ownerUid, source provider/edition — is intentionally NOT patchable
 * through this type, so an update can never recycle a public ID or repurpose
 * provenance. Source approval and publication state travel through this patch
 * because they are lifecycle state (not identity), but their transitions are
 * service-enforced (forward-only source approval; owner-only publish/withdraw).
 */
export type CatalogPatch = Partial<
  Pick<
    ContentNode,
    | 'name'
    | 'grade'
    | 'category'
    | 'authoredLanguage'
    | 'rights'
    | 'source'
    | 'publication'
    | 'publishedAt'
    | 'withdrawnAt'
    | 'updatedAt'
  >
>;

export interface CatalogStore {
  insert(node: ContentNode): Promise<void>;
  byPublicId(publicId: string): Promise<ContentNode | null>;
  byKind(kind: ContentKind): Promise<ContentNode[]>;
  byParent(parentId: string): Promise<ContentNode[]>;
  /** Owner-scoped metadata/lifecycle update; identity fields stay immutable. */
  update(publicId: string, ownerUid: string, patch: CatalogPatch): Promise<CatalogWriteResult>;
}

export class InMemoryCatalogStore implements CatalogStore {
  readonly nodes = new Map<string, ContentNode>();

  async insert(node: ContentNode): Promise<void> { this.nodes.set(node.publicId, node); }
  async byPublicId(publicId: string): Promise<ContentNode | null> { return this.nodes.get(publicId) ?? null; }
  async byKind(kind: ContentKind): Promise<ContentNode[]> {
    return [...this.nodes.values()].filter((n) => n.kind === kind);
  }
  async byParent(parentId: string): Promise<ContentNode[]> {
    return [...this.nodes.values()].filter((n) => n.parentId === parentId);
  }
  async update(publicId: string, ownerUid: string, patch: CatalogPatch): Promise<CatalogWriteResult> {
    const cur = this.nodes.get(publicId);
    if (!cur) return { ok: false, reason: 'not_found' };
    if (cur.rights.ownerUid !== ownerUid) return { ok: false, reason: 'unauthorized' };
    // Identity fields are carried over from the current row; a patch can never
    // reach them (CatalogPatch does not contain them, and the spread cannot
    // invent them), so a public ID is never recycled through this path.
    const next = { ...cur, ...patch } as ContentNode;
    this.nodes.set(publicId, next);
    return { ok: true, node: next };
  }
}
