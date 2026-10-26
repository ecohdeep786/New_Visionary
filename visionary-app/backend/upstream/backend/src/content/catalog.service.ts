// CONTENT-01 — content catalog service: stable IDs, source provider/version,
// rights, owner/visibility, grade/category and authored-language metadata.
//
// Rules enforced (server-side):
//   - register derives a STABLE public ID from the immutable identity
//     (kind|parentId|provider|edition) — `content:<sha256>` — and NEVER recycles
//     it. Re-registering the same identity is IDEMPOTENT: the exact same node is
//     returned (retries/replays cannot duplicate or drift a public ID). A
//     different owner claiming the same public ID is refused.
//   - source provider/version is first-class: `updateSourceVersion` advances
//     version/edition on a node while keeping the stable public ID, and resets
//     approval to pending (a new version is a new release candidate). Approval
//     is FORWARD-ONLY: pending → approved → released (or rejected, terminal);
//     a rejected source can still be replaced by a new version.
//   - publication lifecycle: register (draft/private) → publish → withdraw.
//     Publish is owner-only, requires an APPROVED/RELEASED source version, and
//     records publishedAt; withdraw makes the node private immediately and
//     records withdrawnAt.
//   - structural lineage is enforced (book under curriculum, chapter under
//     book, topic under chapter, concept under topic); parent must exist and be
//     the right kind.
//   - owner authority: only the owning uid may update metadata, advance source,
//     approve/reject source, publish or withdraw; provenance kind/parent and
//     the public ID are immutable once registered (store refuses identity
//     patches at the type level).
//   - retrieval eligibility: a node is eligible only when it AND every ancestor
//     are published AND public AND its own source version is approved/released.
//     A private/draft/withdrawn node, or any node under a private ancestor, or
//     a node whose source is pending/rejected, is never served.
//
// This mirrors the grade/subject/book/chapter/topic master tables (source
// versions / publications / content_nodes) so the enabler maps 1:1 onto catalog
// rows at integration. No syllabus promise: only concrete registered source
// nodes exist; nothing is invented for missing coverage.
import type { ContentNode, ContentKind, RegisterNodeInput, SourceApproval, SourceVersion } from './content-types';
import { PARENT_OF } from './content-types';
import type { CatalogPatch, CatalogStore, CatalogWriteResult } from './content-store';

export class CatalogError extends Error {
  constructor(
    public readonly code:
      | 'invalid_parent'
      | 'missing_parent'
      | 'already_registered'
      | 'id_claimed'
      | 'unknown_node'
      | 'unauthorized'
      | 'not_approved'
      | 'source_rejected'
      | 'invalid_approval_transition',
  ) {
    super(code);
  }
}

/** Approval order enforced (strictly forward-only). */
const APPROVAL_RANK: Record<SourceApproval, number> = {
  pending: 0,
  approved: 1,
  released: 2,
  rejected: 3,
};

export class CatalogService {
  constructor(private readonly store: CatalogStore) {}

  /** Stable ID: `content:<hex sha256 of "kind|parentId|provider|edition">`. Never recycled. */
  static async derivePublicId(kind: ContentKind, parentId: string | null, source: Pick<SourceVersion, 'provider' | 'edition'>): Promise<string> {
    const input = `${kind}|${parentId ?? ''}|${source.provider}|${source.edition}`;
    const bytes = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
    return `content:${hex}`;
  }

  /** Register a new node — idempotent by stable public ID. Validates parent, then derives the ID. */
  async register(input: RegisterNodeInput): Promise<ContentNode> {
    const expectedParentKind = PARENT_OF[input.kind];
    if (input.kind === 'curriculum' && input.parentId !== null) throw new CatalogError('invalid_parent');
    if (input.kind !== 'curriculum') {
      if (!input.parentId) throw new CatalogError('missing_parent');
      const parent = await this.store.byPublicId(input.parentId);
      if (!parent) throw new CatalogError('missing_parent');
      if (parent.kind !== expectedParentKind) throw new CatalogError('invalid_parent');
    }

    const publicId = await CatalogService.derivePublicId(input.kind, input.parentId, input.source);
    const existing = await this.store.byPublicId(publicId);
    if (existing) {
      // Identical re-registration (retry/duplicate intent): return the same node — the ID is
      // not recycled or duplicated. A different owner claiming the same public ID is refused.
      if (existing.rights.ownerUid === input.ownerUid && existing.source.version === input.source.version) return existing;
      throw new CatalogError(existing.rights.ownerUid === input.ownerUid ? 'already_registered' : 'id_claimed');
    }

    const now = new Date().toISOString();
    const node: ContentNode = {
      publicId,
      kind: input.kind,
      name: input.name,
      parentId: input.parentId,
      rights: { ownerUid: input.ownerUid, visibility: 'private', license: input.license ?? null },
      source: { ...input.source, approval: 'pending', approvedAt: null, releasedAt: null },
      publication: 'draft',
      grade: input.grade ?? null,
      category: input.category ?? null,
      authoredLanguage: input.authoredLanguage ?? 'en',
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
      withdrawnAt: null,
    };
    await this.store.insert(node);
    return node;
  }

  /** Owner-only metadata update; identity (publicId/kind/parent/provenance anchor) stays immutable. */
  async updateMetadata(publicId: string, ownerUid: string, patch: CatalogPatch): Promise<ContentNode> {
    const res = await this.store.update(publicId, ownerUid, { ...patch, updatedAt: new Date().toISOString() });
    if (!res.ok) throw this.fromWriteResult(res);
    return res.node;
  }

  /**
   * Advance the source version of a node (provider/edition/version) while keeping
   * the stable public ID. A new version is a fresh release candidate: approval
   * resets to pending so nothing is ever released without a re-review.
   */
  async updateSourceVersion(publicId: string, ownerUid: string, source: Pick<SourceVersion, 'provider' | 'edition' | 'version'>): Promise<ContentNode> {
    const cur = await this.store.byPublicId(publicId);
    if (!cur) throw new CatalogError('unknown_node');
    if (cur.rights.ownerUid !== ownerUid) throw new CatalogError('unauthorized');
    if (source.version === cur.source.version) throw new CatalogError('already_registered'); // no-op version
    const res = await this.store.update(publicId, ownerUid, {
      source: { ...source, approval: 'pending', approvedAt: null, releasedAt: null },
      updatedAt: new Date().toISOString(),
    });
    if (!res.ok) throw this.fromWriteResult(res);
    return res.node;
  }

  /** Forward-only, strictly step-wise source approval: pending → approved → released. */
  async approveSource(publicId: string, ownerUid: string, next: 'approved' | 'released'): Promise<ContentNode> {
    const cur = await this.store.byPublicId(publicId);
    if (!cur) throw new CatalogError('unknown_node');
    if (cur.rights.ownerUid !== ownerUid) throw new CatalogError('unauthorized');
    const from = cur.source.approval;
    if (from === 'rejected') throw new CatalogError('source_rejected');
    // Strictly step-wise: you cannot jump pending → released or downgrade.
    if (next === cur.source.approval || APPROVAL_RANK[next] !== APPROVAL_RANK[from] + 1) throw new CatalogError('invalid_approval_transition');
    const now = new Date().toISOString();
    const source: SourceVersion = {
      ...cur.source,
      approval: next,
      approvedAt: next === 'approved' ? now : cur.source.approvedAt ?? now,
      releasedAt: next === 'released' ? now : cur.source.releasedAt,
    };
    const res = await this.store.update(publicId, ownerUid, { source, updatedAt: now });
    if (!res.ok) throw this.fromWriteResult(res);
    return res.node;
  }

  /** Owner-only resolve/reject of a source version (terminal unless a new version replaces it). */
  async rejectSource(publicId: string, ownerUid: string): Promise<ContentNode> {
    const cur = await this.store.byPublicId(publicId);
    if (!cur) throw new CatalogError('unknown_node');
    if (cur.rights.ownerUid !== ownerUid) throw new CatalogError('unauthorized');
    if (cur.source.approval === 'rejected') throw new CatalogError('invalid_approval_transition');
    const res = await this.store.update(publicId, ownerUid, {
      source: { ...cur.source, approval: 'rejected' },
      updatedAt: new Date().toISOString(),
    });
    if (!res.ok) throw this.fromWriteResult(res);
    return res.node;
  }

  /** Owner-only publish — requires an approved/released source; records publishedAt (first publish preserved). */
  async publish(publicId: string, ownerUid: string): Promise<ContentNode> {
    const cur = await this.store.byPublicId(publicId);
    if (!cur) throw new CatalogError('unknown_node');
    if (cur.rights.ownerUid !== ownerUid) throw new CatalogError('unauthorized');
    if (cur.source.approval !== 'approved' && cur.source.approval !== 'released') {
      throw new CatalogError(cur.source.approval === 'rejected' ? 'source_rejected' : 'not_approved');
    }
    const now = new Date().toISOString();
    const res = await this.store.update(publicId, ownerUid, {
      rights: { ...cur.rights, visibility: 'public' },
      publication: 'published',
      publishedAt: cur.publishedAt ?? now,
      withdrawnAt: null,
      updatedAt: now,
    });
    if (!res.ok) throw this.fromWriteResult(res);
    return res.node;
  }

  /** Owner-only withdraw: node becomes private and ineligible immediately. */
  async withdraw(publicId: string, ownerUid: string): Promise<ContentNode> {
    const cur = await this.store.byPublicId(publicId);
    if (!cur) throw new CatalogError('unknown_node');
    if (cur.rights.ownerUid !== ownerUid) throw new CatalogError('unauthorized');
    const res = await this.store.update(publicId, ownerUid, {
      rights: { ...cur.rights, visibility: 'private' },
      publication: 'withdrawn',
      withdrawnAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    if (!res.ok) throw this.fromWriteResult(res);
    return res.node;
  }

  /** Lineage chain from a node up to its curriculum. */
  async lineage(publicId: string): Promise<ContentNode[]> {
    const chain: ContentNode[] = [];
    let cursor: ContentNode | null = await this.store.byPublicId(publicId);
    if (!cursor) throw new CatalogError('unknown_node');
    while (cursor) {
      chain.unshift(cursor);
      cursor = cursor.parentId ? await this.store.byPublicId(cursor.parentId) : null;
    }
    return chain;
  }

  /**
   * Retrieval eligibility: node AND all ancestors must be published & public, and
   * the node's own source version must be approved/released. This is the gate
   * the API/render layer calls before serving any catalog content.
   */
  async eligibleForRetrieval(publicId: string): Promise<{ ok: boolean; reason: string }> {
    let chain: ContentNode[];
    try {
      chain = await this.lineage(publicId);
    } catch {
      return { ok: false, reason: 'unknown_node' };
    }
    for (const node of chain) {
      if (node.publication !== 'published') return { ok: false, reason: `not_published:${node.kind}` };
      if (node.rights.visibility !== 'public') return { ok: false, reason: `not_public:${node.kind}` };
    }
    const self = chain[chain.length - 1];
    if (self.source.approval !== 'approved' && self.source.approval !== 'released') {
      return { ok: false, reason: self.source.approval === 'rejected' ? 'source_rejected' : 'source_not_approved' };
    }
    return { ok: true, reason: 'ok' };
  }

  /** Durable inventory per kind (e.g. catalog refetch). */
  async byKind(kind: ContentKind): Promise<ContentNode[]> {
    return this.store.byKind(kind);
  }

  /** Children of a node (stable tree traversal by public IDs). */
  async children(parentId: string): Promise<ContentNode[]> {
    return this.store.byParent(parentId);
  }

  private fromWriteResult(r: CatalogWriteResult): CatalogError {
    if ('reason' in r && r.reason === 'unauthorized') return new CatalogError('unauthorized');
    if ('reason' in r && r.reason === 'not_found') return new CatalogError('unknown_node');
    return new CatalogError('invalid_parent');
  }
}
