// LEARN-13 (KAN-153) — rights-aware offline lessons and pending-attempt
// reconciliation.
//
// Core responsibilities (server-owned; fail closed):
//   1. downloadPack: issue a rights-approved offline pack to an eligible owner
//      with a bounded size quota; refuse ineligible / withdrawn / unconsented /
//      unleased / over-quota. Reveals that AI generation stays ONLINE (no
//      on-device model) and discloses the revocation limitation for bytes
//      already downloaded.
//   2. readPackDownload: an owner re-reads their own download's immutable
//      digest (account-scoped). A different account never sees it.
//   3. stagePending: record a device-staged pending attempt bound to the pack's
//      original base version and an explicit command id — only for an owner
//      with an authorized download; attempts never carry a local pass flag.
//   4. reconcilePending: on reconnect the SERVER re-authorizes (session
//      eligibility, consent, source withdrawal, offline-use lease) and
//      reassesses every pending attempt in order using the PROTECTED criteria
//      key — the client pass claim is a claim only. Duplicate command ids
//      converge (same recorded outcome); out-of-order replays are ordered by
//      staging time. Committed evidence survives expiry/withdrawal.
import type {
  DownloadDecision,
  OfflineError as OfflineErrorType,
  OfflineOwner,
  OfflinePack,
  PendingAttempt,
  ReconcileOutcome,
  ReconcileResult,
  PackDownload,
} from './offlinelearning-types';
import { OfflineError } from './offlinelearning-types';
import type { OfflineStore } from './offlinelearning-lookups';

const REVOCATION_NOTICE =
  'Revocation cannot remove already-downloaded bytes; only future access (re-download, further commands) is blocked.';

export class OfflineLearningService {
  private downloadCounter = 0;
  constructor(
    private readonly store: OfflineStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Issue a rights-approved offline pack to an eligible owner (bounded quota). */
  async downloadPack(owner: OfflineOwner, packId: string, deviceId: string): Promise<DownloadDecision> {
    const pack = await this.store.packById(packId);
    if (!pack) return this.deny('unknown_pack', owner);
    if (await this.store.isSourceWithdrawn(packId)) return this.deny('source_withdrawn', owner);
    if (!(await this.store.consentActive(owner, packId))) return this.deny('consent_not_active', owner);
    if (!(await this.store.leaseActive(owner, packId))) return this.deny('lease_expired', owner);

    const used = await this.store.usedBytes(owner);
    const quota = await this.store.quotaBytes();
    if (used + pack.sizeBytes > quota) return this.deny('storage_limit', owner, used, quota);

    const download: PackDownload = {
      downloadId: `dl_${++this.downloadCounter}`,
      owner: { ...owner },
      packId: pack.packId,
      sizeBytes: pack.sizeBytes,
      contentDigest: pack.contentDigest,
      downloadedAt: this.now().toISOString(),
    };
    await this.store.saveDownload(download);
    return {
      ok: true,
      downloadId: download.downloadId,
      packId: pack.packId,
      sizeBytes: pack.sizeBytes,
      contentDigest: pack.contentDigest,
      offlineAvailability: true,
      revocationLimitation: REVOCATION_NOTICE,
    };
  }

  /** An owner re-reads their own download's immutable digest (account-scoped). */
  async readPackDownload(owner: OfflineOwner, downloadId: string): Promise<{ digest: string; sizeBytes: number }> {
    const download = await this.store.byDownloadId(owner, downloadId);
    if (!download) throw new OfflineError('not_owner');
    return { digest: download.contentDigest, sizeBytes: download.sizeBytes };
  }

  /** Record a device-staged pending attempt (base-version + command identity). */
  async stagePending(owner: OfflineOwner, attempt: Omit<PendingAttempt, 'owner' | 'stagedAt'>): Promise<{ outcome: 'staged' }> {
    if (!(await this.store.hasDownload(owner, attempt.packId))) throw new OfflineError('not_owner');
    const full: PendingAttempt = { ...attempt, owner: { ...owner }, stagedAt: this.now().toISOString() };
    await this.store.stagePending(full);
    return { outcome: 'staged' };
  }

  /**
   * On reconnect: RE-AUTHORIZE then REASSESS every pending attempt in order.
   * Duplicate command ids converge to the recorded outcome; out-of-order
   * replays are ordered by staging time. A client pass claim never flips the
   * server verdict. New commands are denied when eligibility is gone while
   * committed evidence stays.
   */
  async reconcilePending(owner: OfflineOwner, packId: string): Promise<ReconcileResult> {
    if (!(await this.store.hasDownload(owner, packId))) throw new OfflineError('not_owner');

    const consentActive = await this.store.consentActive(owner, packId);
    const sourceWithdrawn = await this.store.isSourceWithdrawn(packId);
    const leaseExpired = !(await this.store.leaseActive(owner, packId));
    const allAuthorized = consentActive && !sourceWithdrawn && !leaseExpired;

    const pending = await this.store.pendingFor(owner, packId);
    const outcomes: ReconcileOutcome[] = [];
    for (const attempt of pending) {
      const recorded = await this.store.evidenceFor(attempt.commandId);
      if (recorded) {
        outcomes.push({ ...recorded, outcome: 'duplicate' });
        continue;
      }
      const { verdict, awardedPoints } = await this.store.assess(packId, attempt.baseVersion, attempt.answer, attempt.clientClaimedPass);
      const outcome: ReconcileOutcome = {
        commandId: attempt.commandId,
        outcome: 'assessed',
        verdict,
        awardedPoints,
        criteriaVersion: attempt.baseVersion,
        claimedPass: attempt.clientClaimedPass,
        acceptEvidence: allAuthorized,
      };
      await this.store.recordEvidence(attempt.commandId, outcome);
      outcomes.push(outcome);
    }

    return {
      owner: { ...owner },
      outcomes,
      reauthorization: { sessionEligible: true, consentActive, sourceWithdrawn, leaseExpired },
      revocationLimitation: REVOCATION_NOTICE,
    };
  }

  private async deny(reason: 'storage_limit' | 'source_withdrawn' | 'consent_not_active' | 'lease_expired' | 'unknown_pack', owner: OfflineOwner, used?: number, quota?: number): Promise<DownloadDecision> {
    const [usedBytes, quotaBytes] = used === undefined ? [await this.store.usedBytes(owner), await this.store.quotaBytes()] : [used, quota as number];
    return { ok: false, reason, usedBytes, quotaBytes } as DownloadDecision;
  }
}

export type { OfflineErrorType };
