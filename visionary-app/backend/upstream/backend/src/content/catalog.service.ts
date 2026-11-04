// CONTENT-01 — content catalog service: stable IDs, source provider/version,
// rights, owner/visibility, grade/category and authored-language metadata.
//
// Rules enforced (server-side):
//   - register derives a STABLE public ID from the immutable identity
//     (kind|parentId|NAME|provider|edition) — `content:<sha256>`. The title is
//     part of the identity so distinct siblings (two chapters of the same book,
//     two books of the same curriculum) can never collapse to one ID. The ID is
//     NEVER recycled. Re-registering the same identity is IDEMPOTENT: the exact
//     same node is returned (retries/replays cannot duplicate or drift a public
//     ID). Registration is a COMPARE-AND-SET on the durable ID, so a racing
//     different owner is refused (id_claimed) instead of overwriting the first
//     registration, and concurrent same-owner duplicates converge to one row.
//     A non-owner may NOT attach a node beneath an existing parent — the child
//     inherits its owner from the parent (the whole lineage is one owner's).
//   - source provider/version is first-class: `updateSourceVersion` advances
//     the VERSION while keeping the stable public ID (provider/edition are part
//     of the identity and are immutable on a registered node), and resets
//     approval to pending (a new version is a new release candidate). Re-setting
//     the CURRENT version is an idempotent no-op (a retried command does not
//     reset an already-approved/released review). Approval is FORWARD-ONLY:
//     pending → approved → released (or rejected, terminal); a rejected source
//     can still be replaced by a new version.
//   - publication lifecycle: register (draft/private) → publish → withdraw.
//     Publish is owner-only, requires an APPROVED/RELEASED source version, and
//     records publishedAt once (re-publication keeps the first publish time);
//     withdraw makes the node private immediately and records withdrawnAt.
//     Publication state and rights CANNOT be reached through a metadata update —
//     only the dedicated lifecycle commands transition them, so a typed patch
//     can never bypass the approval/publish gate or reassign an owner.
//   - metadata update is strictly metadata: grade/category/authoredLanguage/
//     license only. It cannot edit the title (identity), rights, source,
//     publication or timestamps. A metadata change on an already
//     approved/released node resets its source approval to pending (the
//     released pointer must be re-reviewed before it is served again).
//   - structural lineage is enforced (book under curriculum, chapter under
//     book, topic under chapter, concept under topic); parent must exist, be the
//     right kind, and be owned by the same uid as the child.
//   - owner authority: only the owning uid may update metadata, advance source,
//     approve/reject source, publish or withdraw; provenance kind/parent, the
//     title and the public ID are immutable once registered (the store refuses
//     identity patches at the type level AND defensively at write time).
//   - retrieval eligibility: a node is eligible only when it AND every ancestor
//     are published AND public AND EACH has its own approved/released source
//     version. A private/draft/withdrawn node, any node under a private
//     ancestor, or any node in the chain whose source is pending/rejected is
//     never served.
//
// This mirrors the grade/subject/book/chapter/topic master tables (source
// versions / publications / content_nodes) so the enabler maps 1:1 onto catalog
// rows at integration. No syllabus promise: only concrete registered source
// nodes exist; nothing is invented for missing coverage.
import { createHash } from 'node:crypto';
import type { ContentNode, ContentKind, RegisterNodeInput, SourceApproval, SourceVersion, Visibility } from './content-types';
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
      | 'invalid_approval_transition'
      | 'invalid_metadata_patch'
      | 'identity_immutable',
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

/**
 * The only fields a metadata update may mutate — enforced inline in
 * `updateMetadata` (grade/category/authoredLanguage + license via rights).
 * Everything else is identity or lifecycle state that travels exclusively
 * through dedicated commands (publish/withdraw/setVisibility/
 * updateSourceVersion/approve/reject).
 */

export class CatalogService {
  constructor(private readonly store: CatalogStore) {}

  /**
   * Stable ID: `content:<hex sha256 of "kind|parentId|name|provider|edition">`.
   * The title is part of the identity because it is what distinguishes sibling
   * nodes under the same parent/provider/edition. Never recycled: a metadata
   * edit or source-version advance does not re-derive the ID.
   */
  static derivePublicId(
    kind: ContentKind,
    parentId: string | null,
    name: string,
    source: Pick<SourceVersion, 'provider' | 'edition'>,
  ): string {
    const input = `${kind}|${parentId ?? ''}|${name}|${source.provider}|${source.edition}`;
    return `content:${createHash('sha256').update(input, 'utf8').digest('hex')}`;
  }

  /**
   * Register a node — idempotent by stable public ID. Validates the parent
   * (exists, right kind, SAME OWNER), derives the ID, then COMPARE-AND-SETs the
   * row so concurrent duplicates converge to one durable row and a racing
   * different owner is refused instead of overwriting the first registration.
   */
  async register(input: RegisterNodeInput): Promise<ContentNode> {
    const expectedParentKind = PARENT_OF[input.kind];
    if (input.kind === 'curriculum' && input.parentId !== null) throw new CatalogError('invalid_parent');
    if (input.kind !== 'curriculum') {
      if (!input.parentId) throw new CatalogError('missing_parent');
      const parent = await this.store.byPublicId(input.parentId);
      if (!parent) throw new CatalogError('missing_parent');
      if (parent.kind !== expectedParentKind) throw new CatalogError('invalid_parent');
      // The child inherits the parent's owner: the structural lineage belongs to
      // one owner, so a foreign uid cannot attach content beneath a parent it
      // does not own (private or otherwise).
      if (parent.rights.ownerUid !== input.ownerUid) throw new CatalogError('unauthorized');
    }

    const publicId = CatalogService.derivePublicId(input.kind, input.parentId, input.name, input.source);
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
    const { created, durable } = await this.store.insertIfAbsent(node);
    if (!created) {
      // The durable row already exists for this identity. Fence against it:
      // identical retry → same node; a different owner claiming the same public
      // ID is refused; a same-owner re-registration with a different version is
      // a distinct release attempt and is refused (use updateSourceVersion).
      if (durable.rights.ownerUid !== input.ownerUid) throw new CatalogError('id_claimed');
      if (durable.source.version === input.source.version) return durable;
      throw new CatalogError('already_registered');
    }
    return durable;
  }

  /**
   * Owner-only metadata update. Only grade/category/authoredLanguage/license are
   * mutable; a patch attempting to touch name/rights/source/publication/
   * timestamps is refused (invalid_metadata_patch). A metadata change on an
   * already approved/released node resets its source approval to pending — the
   * released pointer must be re-reviewed before the edited record is served.
   */
  async updateMetadata(publicId: string, ownerUid: string, patch: CatalogPatch): Promise<ContentNode> {
    const cur = await this.store.byPublicId(publicId);
    if (!cur) throw new CatalogError('unknown_node');
    if (cur.rights.ownerUid !== ownerUid) throw new CatalogError('unauthorized');

    // Only grade/category/authoredLanguage and the license (via rights) are
    // metadata. Anything else — name (identity), source, publication, timestamps,
    // a visibility/owner assertion — is refused: the dedicated commands own
    // those transitions, so a typed patch can never bypass the approval/publish
    // gate or reassign an owner.
    for (const k of Object.keys(patch)) {
      if (k !== 'grade' && k !== 'category' && k !== 'authoredLanguage' && k !== 'rights') {
        throw new CatalogError('invalid_metadata_patch');
      }
    }
    if (patch.rights !== undefined) {
      const r = patch.rights;
      if ('ownerUid' in r && r.ownerUid !== cur.rights.ownerUid) throw new CatalogError('invalid_metadata_patch');
      if ('visibility' in r && r.visibility !== cur.rights.visibility) throw new CatalogError('invalid_metadata_patch');
    }

    const now = new Date().toISOString();
    const storePatch: CatalogPatch = { updatedAt: now };
    let changesContent = false;
    if (patch.grade !== undefined) { storePatch.grade = patch.grade; changesContent = changesContent || patch.grade !== cur.grade; }
    if (patch.category !== undefined) { storePatch.category = patch.category; changesContent = changesContent || patch.category !== cur.category; }
    if (patch.authoredLanguage !== undefined) { storePatch.authoredLanguage = patch.authoredLanguage; changesContent = changesContent || patch.authoredLanguage !== cur.authoredLanguage; }
    if (patch.rights !== undefined && patch.rights.license !== undefined) {
      storePatch.rights = { ...cur.rights, license: patch.rights.license };
      changesContent = changesContent || patch.rights.license !== cur.rights.license;
    }

    // A content-affecting edit on an already approved/released pointer forces
    // re-review: nothing changes on a released record without a fresh approval.
    if (changesContent && (cur.source.approval === 'approved' || cur.source.approval === 'released')) {
      storePatch.source = { ...cur.source, approval: 'pending', approvedAt: null, releasedAt: null };
    }
    const res = await this.store.update(publicId, ownerUid, storePatch);
    if (!res.ok) throw this.fromWriteResult(res);
    return res.node;
  }

  /** Owner-only visibility scoping (e.g. the `school` bucket). Serving is still gated by eligibility. */
  async setVisibility(publicId: string, ownerUid: string, visibility: Visibility): Promise<ContentNode> {
    const cur = await this.store.byPublicId(publicId);
    if (!cur) throw new CatalogError('unknown_node');
    if (cur.rights.ownerUid !== ownerUid) throw new CatalogError('unauthorized');
    const res = await this.store.update(publicId, ownerUid, {
      rights: { ...cur.rights, visibility },
      updatedAt: new Date().toISOString(),
    });
    if (!res.ok) throw this.fromWriteResult(res);
    return res.node;
  }

  /**
   * Advance the source VERSION of a node while keeping the stable public ID.
   * provider/edition are part of the immutable identity — changing them would
   * require a different node (refused). A new version is a fresh release
   * candidate: approval resets to pending so nothing is re-released without a
   * re-review. Re-setting the current version is an idempotent no-op.
   */
  async updateSourceVersion(publicId: string, ownerUid: string, source: Pick<SourceVersion, 'provider' | 'edition' | 'version'>): Promise<ContentNode> {
    const cur = await this.store.byPublicId(publicId);
    if (!cur) throw new CatalogError('unknown_node');
    if (cur.rights.ownerUid !== ownerUid) throw new CatalogError('unauthorized');
    if (source.provider !== cur.source.provider || source.edition !== cur.source.edition) {
      throw new CatalogError('identity_immutable');
    }
    if (source.version === cur.source.version) return cur;
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
   * Retrieval eligibility: the node AND every ancestor must be published &
   * public AND each carry its own APPROVED/RELEASED source version. This is the
   * gate the API/render layer calls before serving any catalog content — a
   * rejected (or still pending) ancestor is as blocking as a private one.
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
      if (node.source.approval !== 'approved' && node.source.approval !== 'released') {
        return { ok: false, reason: node.source.approval === 'rejected' ? `source_rejected:${node.kind}` : `source_not_approved:${node.kind}` };
      }
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
