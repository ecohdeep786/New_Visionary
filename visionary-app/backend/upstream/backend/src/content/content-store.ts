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
 * parentId, ownerUid — is intentionally NOT patchable through this type, so an
 * update can never recycle a public ID or repurpose provenance. Lifecycle
 * state (source approval, publication) is NOT part of this patch: those travel
 * only through their dedicated service methods (forward-only source approval;
 * owner-only publish/withdraw), so a metadata update can never bypass the
 * approval/publish gates.
 */
export type CatalogPatch = Partial<
  Pick<
    ContentNode,
    | 'name'
    | 'grade'
    | 'category'
    | 'authoredLanguage'
    | 'updatedAt'
  >
  & { license?: string | null }>;

/**
 * The store-level patch: everything the service's own lifecycle methods may
 * write (source approval state, publication bookkeeping) plus metadata. Still
 * excludes the durable identity (publicId/kind/parentId) and raw rights —
 * visibility changes ride publish/withdraw only, and ownerUid never changes.
 */
export type CatalogStorePatch = CatalogPatch & Partial<Pick<ContentNode, 'rights' | 'source' | 'publication' | 'publishedAt' | 'withdrawnAt'>>;

export interface CatalogStore {
  insert(node: ContentNode): Promise<void>;
  byPublicId(publicId: string): Promise<ContentNode | null>;
  byKind(kind: ContentKind): Promise<ContentNode[]>;
  byParent(parentId: string): Promise<ContentNode[]>;
  /** Owner-scoped metadata/lifecycle update; identity fields stay immutable. */
  update(publicId: string, ownerUid: string, patch: CatalogStorePatch): Promise<CatalogWriteResult>;
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
  async update(publicId: string, ownerUid: string, patch: CatalogStorePatch): Promise<CatalogWriteResult> {
    const cur = this.nodes.get(publicId);
    if (!cur) return { ok: false, reason: 'not_found' };
    if (cur.rights.ownerUid !== ownerUid) return { ok: false, reason: 'unauthorized' };
    // license is metadata (metadata patches carry it standalone); visibility
    // and ownerUid travel only with the publish/withdraw lifecycle patches.
    const rights = patch.rights ?? ('license' in patch ? { ...cur.rights, license: patch.license ?? null } : cur.rights);
    const { license: _license, ...rest } = patch;
    const next = { ...cur, ...rest, rights, source: patch.source ?? cur.source } as ContentNode;
    this.nodes.set(publicId, next);
    return { ok: true, node: next };
  }
}
