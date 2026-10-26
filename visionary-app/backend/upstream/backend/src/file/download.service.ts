// FILE-03 — private download/export gateway and revocation service.
//
// Delivery model (reviewed residual validity):
//   - AUTHENTICATED GATEWAY grants: every `read` re-checks that the grant is
//     ACTIVE, owned by the acting uid and inside its lease. `revoke` flips the
//     grant to REVOKED; the very next read is refused. There is NO residual
//     window on the gateway channel — this is the path to use wherever
//     immediate revocation is required.
//   - SIGNED LINKS: a one-shot/time-bounded link with an explicit expiry. Its
//     residual validity is documented and bounded: bytes already delivered to a
//     device are NOT recalled, and the link is consumable only until its
//     expiry or revocation, whichever comes first. Signed links are qualified
//     for offline-use leases and convenience delivery, never for content that
//     must stop propagating instantly.
//   - Only READY immutable generations (FILE-01 READY + FILE-02 manifest) are
//     deliverable; quarantine, REJECTED and CANCELLED objects are refused.
//     Ownership is server-authoritative: a non-owner cannot read, revoke or
//     expire another uid's grant/export. Revocation never changes retained
//     learner records and never promises removal of already-delivered bytes.
import type { DownloadChannel, DownloadGrant, DownloadPolicy, ExportRecord } from './download-types';
import { DEFAULT_DOWNLOAD_POLICY } from './download-types';
import type { DownloadStore } from './download-store';

export class DownloadPolicyError extends Error {
  constructor(public readonly code: 'unauthorized' | 'not_found' | 'not_ready' | 'revoked' | 'expired' | 'used' | 'out_of_bounds' | 'state_conflict' | 'link_not_found' | 'link_revoked' | 'link_expired' | 'link_used') {
    super(code);
  }
}

/** A READY immutable generation the gateway may deliver. */
export interface DeliverableObject {
  objectId: string;
  generation: number;
  digest: string;
  size: number;
  type: string;
  bytes: Uint8Array;
}

/**
 * Resolves a READY immutable generation for delivery. At FILE cutover this maps
 * onto the FILE-01 READY bytes (verified + scanned) and the FILE-02 manifest
 * row; the enabler injects an in-memory resolver so behavior is reproduced
 * without a live object store.
 */
export interface ObjectResolver {
  /** Returns the READY generation owned by `ownerUid`, or throws `not_ready`/`unauthorized`. */
  requireReady(ownerUid: string, objectId: string, generation: number): Promise<DeliverableObject>;
}

export interface IssueGrantOptions {
  ownerUid: string;
  objectId: string;
  generation: number;
  channel: DownloadChannel;
  /** Overrides the policy default lease for this grant. */
  leaseMs?: number;
  /** Overrides the policy default read budget (signed links: usually 1). */
  maxReads?: number;
}

export interface ReadResult {
  bytes: Uint8Array;
  type: string;
  digest: string;
  size: number;
  /** Largest slice actually delivered on this read (for gateway reads that may paginate). */
  deliveredBytes: number;
}

const nowIso = () => new Date().toISOString();
const plusMs = (ms: number) => new Date(Date.now() + ms).toISOString();

function randomToken(): string {
  const bytes = new Uint8Array(24);
  globalThis.crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export class DownloadGateway {
  constructor(
    private readonly store: DownloadStore,
    private readonly resolver: ObjectResolver,
    private readonly policy: DownloadPolicy = DEFAULT_DOWNLOAD_POLICY,
  ) {}

  /** Issue a grant. The target generation must be READY + owned. */
  async issueGrant(opts: IssueGrantOptions): Promise<DownloadGrant> {
    if (opts.channel !== 'gateway' && opts.channel !== 'signed_link') throw new DownloadPolicyError('state_conflict');
    const object = await this.resolver.requireReady(opts.ownerUid, opts.objectId, opts.generation);
    if (object.size > this.policy.maxDeliverableBytes) throw new DownloadPolicyError('out_of_bounds');
    const leaseMs = opts.leaseMs ?? (opts.channel === 'signed_link' ? this.policy.signedLinkTtlMs : this.policy.gatewayLeaseMs);
    const maxReads = opts.maxReads ?? (opts.channel === 'signed_link' ? this.policy.signedLinkMaxReads : Number.MAX_SAFE_INTEGER);
    const grant: DownloadGrant = {
      id: `dl_${Date.now()}_${Math.floor(Math.random() * 1e9)}`,
      ownerUid: opts.ownerUid,
      objectId: object.objectId,
      generation: object.generation,
      digest: object.digest,
      size: object.size,
      type: object.type,
      channel: opts.channel,
      state: 'ACTIVE',
      expiresAt: plusMs(leaseMs),
      token: opts.channel === 'signed_link' ? randomToken() : null,
      remainingReads: maxReads,
      revokedAt: null,
      lastReadAt: null,
      bytesDelivered: 0,
      createdAt: nowIso(),
    };
    await this.store.insert(grant);
    return grant;
  }

  /**
   * Gateway read — the immediate-revocation path. The grant is re-checked on
   * every call: ACTIVE, owned, unexpired, within its read budget. A revoked
   * grant refuses the very next read.
   */
  async read(grantId: string, ownerUid: string, maxBytes = this.policy.maxDeliverableBytes): Promise<ReadResult> {
    const grant = await this.requireReadable(grantId, ownerUid);
    const object = await this.resolver.requireReady(ownerUid, grant.objectId, grant.generation);
    const delivered = Math.min(object.bytes.byteLength, maxBytes);
    const remaining = grant.remainingReads - 1;
    const res = await this.store.updateGrant(grantId, ownerUid, {
      remainingReads: remaining,
      bytesDelivered: grant.bytesDelivered + delivered,
      lastReadAt: nowIso(),
      state: remaining <= 0 ? 'USED' : grant.state,
    });
    if (!res.ok) throw this.fromGrantWrite(res);
    return { bytes: object.bytes.slice(0, delivered), type: object.type, digest: object.digest, size: object.size, deliveredBytes: delivered };
  }

  /** Immediate revocation of a gateway grant — subsequent reads are refused. */
  async revoke(grantId: string, ownerUid: string): Promise<DownloadGrant> {
    const grant = await this.store.grant(grantId);
    if (!grant) throw new DownloadPolicyError('not_found');
    if (grant.ownerUid !== ownerUid) throw new DownloadPolicyError('unauthorized');
    const res = await this.store.updateGrant(grantId, ownerUid, { state: 'REVOKED', revokedAt: nowIso() });
    if (!res.ok) throw this.fromGrantWrite(res);
    return res.grant;
  }

  /**
   * Issue a signed link. Residual validity is documented: the link stays
   * consumable until expiry or revocation (whichever is earlier) but bytes
   * already delivered to a device are NOT recalled, and a single-use link is
   * consumed by its first read.
   */
  async issueSignedLink(opts: { ownerUid: string; objectId: string; generation: number; ttlMs?: number; maxReads?: number }): Promise<{ grant: DownloadGrant; signedLink: { token: string; expiresAt: string } }> {
    const grant = await this.issueGrant({ ownerUid: opts.ownerUid, objectId: opts.objectId, generation: opts.generation, channel: 'signed_link', leaseMs: opts.ttlMs, maxReads: opts.maxReads });
    return { grant, signedLink: { token: grant.token!, expiresAt: grant.expiresAt } };
  }

  /** Consume a signed link by token. Single-use links are USED after the first read. */
  async readSignedLink(token: string, ownerUid: string): Promise<ReadResult> {
    const grant = await this.store.grantTokens(ownerUid);
    const match = grant.find((g) => g.token === token);
    if (!match) throw new DownloadPolicyError('link_not_found');
    if (match.state === 'REVOKED') throw new DownloadPolicyError('link_revoked');
    if (match.state === 'USED') throw new DownloadPolicyError('link_used');
    if (match.state !== 'ACTIVE') throw new DownloadPolicyError('link_expired');
    if (match.expiresAt <= nowIso()) throw new DownloadPolicyError('link_expired');
    return this.read(match.id, ownerUid);
  }

  /** Mark ACTIVE gateway grants past their expiry as EXPIRED. */
  async expire(now = nowIso()): Promise<number> {
    const expired = await this.store.activeExpired(now);
    let count = 0;
    for (const g of expired) {
      const res = await this.store.updateGrant(g.id, g.ownerUid, { state: 'EXPIRED' });
      if (res.ok) count += 1;
    }
    return count;
  }

  private async requireReadable(grantId: string, ownerUid: string): Promise<DownloadGrant> {
    const grant = await this.store.grant(grantId);
    if (!grant) throw new DownloadPolicyError('not_found');
    if (grant.ownerUid !== ownerUid) throw new DownloadPolicyError('unauthorized');
    if (grant.state === 'REVOKED') throw new DownloadPolicyError('revoked');
    if (grant.state === 'USED') throw new DownloadPolicyError('used');
    if (grant.state !== 'ACTIVE') throw new DownloadPolicyError('expired');
    if (grant.expiresAt <= nowIso()) throw new DownloadPolicyError('expired');
    if (grant.remainingReads <= 0) throw new DownloadPolicyError('used');
    return grant;
  }

  private fromGrantWrite(r: { ok: true; grant: DownloadGrant } | { ok: false; reason: 'not_found' | 'conflict' | 'unauthorized' }): DownloadPolicyError {
    if ('reason' in r && r.reason === 'unauthorized') return new DownloadPolicyError('unauthorized');
    if ('reason' in r && r.reason === 'conflict') return new DownloadPolicyError('state_conflict');
    return new DownloadPolicyError('not_found');
  }
}

export class ExportService {
  constructor(
    private readonly store: DownloadStore,
    private readonly resolver: ObjectResolver,
    private readonly policy: DownloadPolicy = DEFAULT_DOWNLOAD_POLICY,
  ) {}

  /**
   * Create a bounded, owner-scoped export of READY immutable generations.
   * Every member is resolved (READY + owned) at creation — an export never
   * silently drops a member that stopped being deliverable.
   */
  async createExport(opts: { ownerUid: string; objects: Array<{ objectId: string; generation: number }> }): Promise<ExportRecord> {
    if (opts.objects.length === 0) throw new DownloadPolicyError('out_of_bounds');
    if (opts.objects.length > this.policy.maxExportObjects) throw new DownloadPolicyError('out_of_bounds');
    const pinned = [] as ExportRecord['objects'];
    for (const o of opts.objects) {
      const obj = await this.resolver.requireReady(opts.ownerUid, o.objectId, o.generation);
      pinned.push({ objectId: obj.objectId, generation: obj.generation, digest: obj.digest, size: obj.size, type: obj.type });
    }
    const record: ExportRecord = {
      id: `exp_${Date.now()}_${Math.floor(Math.random() * 1e9)}`,
      ownerUid: opts.ownerUid,
      objects: pinned,
      state: 'ACTIVE',
      expiresAt: plusMs(this.policy.exportLeaseMs),
      createdAt: nowIso(),
      deliveredBytes: 0,
    };
    await this.store.insertExport(record);
    return record;
  }

  /** Read an export through the same gateway discipline (immediate revocation). */
  async readExport(exportId: string, ownerUid: string, onMember?: (member: DeliverableObject) => Promise<void> | void): Promise<{ members: DeliverableObject[]; deliveredBytes: number }> {
    const record = await this.store.exportById(exportId);
    if (!record) throw new DownloadPolicyError('not_found');
    if (record.ownerUid !== ownerUid) throw new DownloadPolicyError('unauthorized');
    if (record.state === 'REVOKED') throw new DownloadPolicyError('revoked');
    if (record.state !== 'ACTIVE') throw new DownloadPolicyError('expired');
    if (record.expiresAt <= nowIso()) throw new DownloadPolicyError('expired');
    const members: DeliverableObject[] = [];
    let bytes = 0;
    for (const o of record.objects) {
      const obj = await this.resolver.requireReady(ownerUid, o.objectId, o.generation);
      bytes += obj.bytes.byteLength;
      members.push(obj);
      if (onMember) await onMember(obj);
    }
    const res = await this.store.updateExport(exportId, ownerUid, { deliveredBytes: record.deliveredBytes + bytes });
    if (!res.ok) throw this.fromExportWrite(res);
    return { members, deliveredBytes: bytes };
  }

  /** Immediate export revocation — subsequent reads of the export are refused. */
  async revokeExport(exportId: string, ownerUid: string): Promise<ExportRecord> {
    const record = await this.store.exportById(exportId);
    if (!record) throw new DownloadPolicyError('not_found');
    if (record.ownerUid !== ownerUid) throw new DownloadPolicyError('unauthorized');
    const res = await this.store.updateExport(exportId, ownerUid, { state: 'REVOKED' });
    if (!res.ok) throw this.fromExportWrite(res);
    return res.record;
  }

  /** Mark ACTIVE exports past their lease as EXPIRED. */
  async expireExports(now = nowIso()): Promise<number> {
    const expired = await this.store.exportedExpired(now);
    let count = 0;
    for (const e of expired) {
      const res = await this.store.updateExport(e.id, e.ownerUid, { state: 'EXPIRED' });
      if (res.ok) count += 1;
    }
    return count;
  }

  private fromExportWrite(r: { ok: true; record: ExportRecord } | { ok: false; reason: 'not_found' | 'conflict' | 'unauthorized' }): DownloadPolicyError {
    if ('reason' in r && r.reason === 'unauthorized') return new DownloadPolicyError('unauthorized');
    if ('reason' in r && r.reason === 'conflict') return new DownloadPolicyError('state_conflict');
    return new DownloadPolicyError('not_found');
  }
}
