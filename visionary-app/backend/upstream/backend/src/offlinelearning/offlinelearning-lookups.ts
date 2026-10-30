// LEARN-13 (KAN-153) — the offline-learning store's typed seams. The owning
// store (pack catalog, downloads + quota, leases, consents, source withdrawal,
// staged pending attempts, protected criteria, evidence) implements these at
// integration; the in-memory implementation is contract-true and fails closed.
import { createHash } from 'node:crypto';
import type {
  OfflineOwner,
  OfflinePack,
  PackDownload,
  PendingAttempt,
  AttemptVerdict,
  ReconcileOutcome,
} from './offlinelearning-types';

export interface OfflineStore {
  packById(packId: string): Promise<OfflinePack | undefined>;
  isSourceWithdrawn(packId: string): Promise<boolean>;
  consentActive(owner: OfflineOwner, packId: string): Promise<boolean>;
  leaseActive(owner: OfflineOwner, packId: string): Promise<boolean>;
  usedBytes(owner: OfflineOwner): Promise<number>;
  quotaBytes(): Promise<number>;
  hasDownload(owner: OfflineOwner, packId: string): Promise<boolean>;
  saveDownload(download: PackDownload): Promise<void>;
  byDownloadId(owner: OfflineOwner, downloadId: string): Promise<PackDownload | undefined>;
  listDownloads(owner: OfflineOwner): Promise<PackDownload[]>;
  stagePending(attempt: PendingAttempt): Promise<void>;
  pendingFor(owner: OfflineOwner, packId: string): Promise<PendingAttempt[]>;
  evidenceFor(commandId: string): Promise<ReconcileOutcome | undefined>;
  recordEvidence(commandId: string, outcome: ReconcileOutcome): Promise<void>;
  /** Server-owned assessment: a verdict + award for the answer under a criteria version. */
  assess(packId: string, criteriaVersion: number, answer: unknown, claimedPass: boolean): Promise<{ verdict: AttemptVerdict; awardedPoints: number }>;
}

/** Contract-true in-memory store; bilevel owner-scoped and fail-closed. */
export class InMemoryOfflineStore implements OfflineStore {
  private packs = new Map<string, OfflinePack>();
  private withdrawals = new Set<string>();
  private consents = new Set<string>();
  private leases = new Map<string, string>(); // `${uid}|${packId}` -> leaseId
  private downloads: PackDownload[] = [];
  private pending: PendingAttempt[] = [];
  private evidence = new Map<string, ReconcileOutcome>();
  private maxQuotaBytes = 1000000;

  constructor(private readonly criteria: Record<string, { key: number; passPoints: number; retryKey: number }> = {}) {}

  setPack(pack: OfflinePack): void {
    this.packs.set(pack.packId, pack);
  }

  setConsent(uid: string, packId: string, active: boolean): void {
    const k = `${uid}|${packId}`;
    if (active) this.consents.add(k);
    else this.consents.delete(k);
  }

  setLease(uid: string, packId: string, active: boolean): void {
    const k = `${uid}|${packId}`;
    if (active) this.leases.set(k, `lease_${k}`);
    else this.leases.delete(k);
  }

  setSourceWithdrawn(packId: string, withdrawn: boolean): void {
    if (withdrawn) this.withdrawals.add(packId);
    else this.withdrawals.delete(packId);
  }

  async packById(packId: string): Promise<OfflinePack | undefined> {
    return this.packs.get(packId);
  }

  async isSourceWithdrawn(packId: string): Promise<boolean> {
    return this.withdrawals.has(packId);
  }

  async consentActive(owner: OfflineOwner, packId: string): Promise<boolean> {
    return this.consents.has(`${owner.uid}|${packId}`);
  }

  async leaseActive(owner: OfflineOwner, packId: string): Promise<boolean> {
    return this.leases.has(`${owner.uid}|${packId}`);
  }

  async usedBytes(owner: OfflineOwner): Promise<number> {
    return this.downloads.filter((d) => d.owner.uid === owner.uid && d.owner.workspaceId === owner.workspaceId).reduce((n, d) => n + d.sizeBytes, 0);
  }

  async quotaBytes(): Promise<number> {
    return this.maxQuotaBytes;
  }

  async hasDownload(owner: OfflineOwner, packId: string): Promise<boolean> {
    return this.downloads.some((d) => d.owner.uid === owner.uid && d.owner.workspaceId === owner.workspaceId && d.packId === packId);
  }

  async saveDownload(download: PackDownload): Promise<void> {
    this.downloads = [...this.downloads, { ...download, owner: { ...download.owner } }];
  }

  async byDownloadId(owner: OfflineOwner, downloadId: string): Promise<PackDownload | undefined> {
    return this.downloads.find((d) => d.downloadId === downloadId && d.owner.uid === owner.uid && d.owner.workspaceId === owner.workspaceId);
  }

  async listDownloads(owner: OfflineOwner): Promise<PackDownload[]> {
    return this.downloads.filter((d) => d.owner.uid === owner.uid && d.owner.workspaceId === owner.workspaceId);
  }

  async stagePending(attempt: PendingAttempt): Promise<void> {
    this.pending = [...this.pending, { ...attempt, owner: { ...attempt.owner } }];
  }

  async pendingFor(owner: OfflineOwner, packId: string): Promise<PendingAttempt[]> {
    return this.pending
      .filter((p) => p.owner.uid === owner.uid && p.owner.workspaceId === owner.workspaceId && p.packId === packId)
      .sort((a, b) => a.stagedAt.localeCompare(b.stagedAt));
  }

  async evidenceFor(commandId: string): Promise<ReconcileOutcome | undefined> {
    return this.evidence.get(commandId);
  }

  async recordEvidence(commandId: string, outcome: ReconcileOutcome): Promise<void> {
    this.evidence.set(commandId, outcome);
  }

  async assess(packId: string, criteriaVersion: number, answer: unknown, claimedPass: boolean): Promise<{ verdict: AttemptVerdict; awardedPoints: number }> {
    const criteria = this.criteria[`${packId}@${criteriaVersion}`];
    const a = JSON.stringify(answer ?? null);
    if (criteria && a === String(criteria.key)) {
      return { verdict: 'pass', awardedPoints: criteria.passPoints };
    }
    if (criteria && a === String(criteria.retryKey)) {
      return { verdict: 'retry', awardedPoints: 0 };
    }
    // The server decides; a client pass claim never flips the verdict.
    return { verdict: 'needs_review', awardedPoints: 0 };
  }

}

/** Helpers shared with the service (deterministic integrity). */
export function digestBytes(payload: string | Uint8Array): string {
  const b = typeof payload === 'string' ? Buffer.from(payload, 'utf8') : Buffer.from(payload);
  return createHash('sha256').update(b).digest('hex');
}
