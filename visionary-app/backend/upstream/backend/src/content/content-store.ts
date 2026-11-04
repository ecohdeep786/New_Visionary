// CONTENT-01 — content catalog store contract + in-memory synthetic
// implementation. The Cloud SQL adapter implements the same surface over the
// Grade/Subject/Book/Chapter/Topic/Subtopic master tables plus the CONTENT-01
// metadata columns (source_versions, publications, content_nodes). Stable
// public IDs are the canonical external key; every row write is a fenced,
// owner-scoped transition that never mutates the durable identity.
//
// Registration is a COMPARE-AND-SET keyed by the stable public ID, so concurrent
// duplicate registrations converge to exactly one durable row and a racing
// different owner can never overwrite the first registration. Every row write
// preserves the immutable identity — publicId, kind, parentId, name, ownerUid
// and the source provider/edition anchor — no matter what a patch attempts.
import type { ContentNode, ContentKind } from './content-types';

export type CatalogWriteResult =
  | { ok: true; node: ContentNode }
  | { ok: false; reason: 'not_found' | 'unauthorized' };

/**
 * Mutable columns only, for lifecycle-state transitions the service controls:
 * metadata (grade/category/authoredLanguage/license) and lifecycle state
 * (rights visibility, source version+approval, publication, timestamps). The
 * durable identity — publicId, kind, parentId, name, ownerUid, source
 * provider/edition — is intentionally NOT patchable: the type omits it, and
 * the store defensively carries it over from the current row regardless of the
 * patch, so no update can recycle a public ID, rename a node, or reassign an
 * owner. Lifecycle transitions are service-enforced (forward-only source
 * approval; owner-only publish/withdraw; metadata-only updates cannot touch
 * source/rights/publication).
 */
export type CatalogPatch = Partial<
  Pick<
    ContentNode,
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
  /** Blind insert (bounded test seeding); registration uses `insertIfAbsent`. */
  insert(node: ContentNode): Promise<void>;
  /**
   * Atomic compare-and-set by public ID: inserts the node and reports whether
   * it created the row, returning the single durable node for that ID either
   * way. A subsequent registration then fences owner/version against THAT row,
   * so a racing different owner can never overwrite the first registration.
   */
  insertIfAbsent(node: ContentNode): Promise<{ created: boolean; durable: ContentNode }>;
  byPublicId(publicId: string): Promise<ContentNode | null>;
  byKind(kind: ContentKind): Promise<ContentNode[]>;
  byParent(parentId: string): Promise<ContentNode[]>;
  /** Owner-scoped metadata/lifecycle update; identity fields stay immutable. */
  update(publicId: string, ownerUid: string, patch: CatalogPatch): Promise<CatalogWriteResult>;
}

export class InMemoryCatalogStore implements CatalogStore {
  readonly nodes = new Map<string, ContentNode>();

  async insert(node: ContentNode): Promise<void> { this.nodes.set(node.publicId, node); }

  async insertIfAbsent(node: ContentNode): Promise<{ created: boolean; durable: ContentNode }> {
    // No await between the check and the set: the decision is atomic within this
    // synchronous block, so two concurrent registrations of one identity cannot
    // both "succeed" and silently overwrite each other.
    const existing = this.nodes.get(node.publicId);
    if (existing) return { created: false, durable: existing };
    this.nodes.set(node.publicId, node);
    return { created: true, durable: node };
  }

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
    // Identity fields are carried over from the current row no matter what the
    // patch contains: a public ID is never recycled, a node can never be
    // renamed or re-parented, an owner can never be reassigned, and the source
    // provider/edition anchor is immutable (only the version + approval travel
    // through the patch under service control).
    const next = { ...cur, ...patch } as ContentNode;
    next.publicId = cur.publicId;
    next.kind = cur.kind;
    next.parentId = cur.parentId;
    next.name = cur.name;
    next.rights = { ...cur.rights, ...(patch.rights ?? {}), ownerUid: cur.rights.ownerUid };
    next.source = { ...cur.source, ...(patch.source ?? {}), provider: cur.source.provider, edition: cur.source.edition };
    this.nodes.set(publicId, next);
    return { ok: true, node: next };
  }
}
