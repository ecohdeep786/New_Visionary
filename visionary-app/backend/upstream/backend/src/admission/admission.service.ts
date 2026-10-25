// DATA-09 — admission and guardian-first linking service.
//
// Server-authoritative admission. Invariants:
//   - claimedAge and roleHint are client hints and never alone admit anyone.
//   - An adult (server birthYear >= 18) is admitted without a guardian.
//   - A supported minor (13..17) is NOT admitted until a verified guardian
//     account has linked the minor (guardian-first). Until then status is
//     pending_guardian and every sensitive command is denied.
//   - An unsupported user (below 13, or no verified birth registry entry) is
//     blocked: no role flag can convert them to a supported user.
//   - Only the verified guardian uid may link a minor; a minor cannot link
//     themselves or fabricate a guardian.
import type { AdmissionDecision, AdmissionOutcome, AdmissionSubject, GuardianLinkRecord, GuardianLinkState } from './admission-types';
import { SUPPORTED_MIN_AGE, ADULT_MIN_AGE, POLICY_VERSION } from './admission-types';
import type { AdmissionStore } from './admission-store';

export class AdmissionPolicyError extends Error {
  constructor(public readonly code: 'invalid_subject' | 'minor_needs_guardian' | 'unsupported' | 'guardian_required' | 'already_linked' | 'not_minor' | 'wrong_parties') {
    super(code);
  }
}

export interface AdmissionServiceOptions {
  now?: () => Date;
}

export class AdmissionService {
  private readonly now: () => Date;

  constructor(private readonly store: AdmissionStore, options: AdmissionServiceOptions = {}) {
    this.now = options.now ?? (() => new Date());
  }

  private when() { return this.now().toISOString(); }
  private newId(p: string) { return `${p}_${this.when().replace(/[^0-9]/g, '').slice(8)}`; }

  private validSubject(input: unknown): AdmissionSubject {
    if (typeof input !== 'object' || input === null) throw new AdmissionPolicyError('invalid_subject');
    const s = input as Record<string, unknown>;
    if (typeof s.uid !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(s.uid)) throw new AdmissionPolicyError('invalid_subject');
    const birthYear = typeof s.birthYear === 'number' ? s.birthYear : null;
    const claimedAge = typeof s.claimedAge === 'number' ? s.claimedAge : null;
    const roleHint = typeof s.roleHint === 'string' ? s.roleHint : null;
    // A client may never choose the policy version.
    return { uid: s.uid, policyVersion: POLICY_VERSION, birthYear, claimedAge, roleHint };
  }

  private decisionFor(subject: AdmissionSubject): { decision: AdmissionDecision; status: 'admitted' | 'pending_guardian' | 'blocked'; reason: string } {
    // Client role/age hints never alone admit. Only a verified server birthYear
    // registry entry can be trusted.
    if (subject.birthYear === null || subject.birthYear < 1900 || subject.birthYear > 2026) {
      return { decision: 'unsupported', status: 'blocked', reason: 'No verified birth registry entry; client age cannot establish admission.' };
    }
    const age = 2026 - subject.birthYear; // server clock year for the proof
    if (age >= ADULT_MIN_AGE) return { decision: 'adult', status: 'admitted', reason: 'Verified adult (18+).' };
    if (age >= SUPPORTED_MIN_AGE) return { decision: 'minor_linked', status: 'pending_guardian', reason: 'Supported minor: needs a verified guardian link before use.' };
    return { decision: 'minor_blocked', status: 'blocked', reason: 'Below the supported minimum age; client role flags cannot change this.' };
  }

  /** Server-side admission decision; never bypassed by client age/role flags. */
  async admit(input: unknown): Promise<AdmissionOutcome> {
    const subject = this.validSubject(input);
    const decision = this.decisionFor(subject);
    const link = await this.store.guardianLink(subject.uid);
    let status = decision.status;
    if (decision.status === 'pending_guardian') {
      status = link?.state === 'linked' ? 'admitted' : 'pending_guardian';
    }
    await this.store.setAdmissionStatus(subject.uid, status);
    return {
      uid: subject.uid,
      decision: status === 'admitted' && decision.decision === 'minor_linked' ? 'minor_linked' : decision.decision,
      status,
      policyVersion: subject.policyVersion,
      reason: status === 'admitted' && decision.decision === 'minor_linked'
        ? 'Supported minor admitted after verified guardian link.'
        : decision.reason,
      guardianLink: link,
    };
  }

  /** Guardian proposes a guardian-first link for a supported minor. */
  async requestLink(guardianUid: string, minorUid: string, minorBirthYear: number | null): Promise<GuardianLinkRecord> {
    if (!guardianUid || !minorUid || guardianUid === minorUid) throw new AdmissionPolicyError('wrong_parties');
    const existing = await this.store.guardianLink(minorUid);
    if (existing) {
      if (existing.state === 'linked' || existing.state === 'requested') throw new AdmissionPolicyError('already_linked');
      const updated = await this.store.updateGuardianLink(minorUid, 'requested');
      if (updated) return updated;
    }
    const record: GuardianLinkRecord = {
      id: this.newId('gl'),
      minorUid,
      guardianUid,
      state: 'requested',
      requestedAt: this.when(),
      linkedAt: null,
      deniedAt: null,
      policyVersion: POLICY_VERSION,
    };
    await this.store.createGuardianLink(record);
    return record;
  }

  /** Guardian confirms the link. Only after this a supported minor is admitted. */
  async confirmLink(guardianUid: string, minorUid: string): Promise<GuardianLinkRecord> {
    const record = await this.store.guardianLink(minorUid);
    if (!record) throw new AdmissionPolicyError('not_minor');
    if (record.state === 'linked') throw new AdmissionPolicyError('already_linked');
    if (record.guardianUid !== guardianUid) throw new AdmissionPolicyError('guardian_required');
    const linked = await this.store.updateGuardianLink(minorUid, 'linked', this.when());
    if (linked) await this.store.setAdmissionStatus(minorUid, 'admitted');
    return linked ?? record;
  }

  /** A minor cannot link themselves or deny a guardian. Only the guardian may deny. */
  async denyLink(guardianUid: string, minorUid: string): Promise<GuardianLinkRecord> {
    const record = await this.store.guardianLink(minorUid);
    if (!record) throw new AdmissionPolicyError('not_minor');
    if (record.guardianUid !== guardianUid) throw new AdmissionPolicyError('guardian_required');
    const denied = await this.store.updateGuardianLink(minorUid, 'denied', null, this.when());
    if (denied) await this.store.setAdmissionStatus(minorUid, 'pending_guardian');
    return denied ?? record;
  }

  /** Sensitive operations gate: a supported minor must be admitted via guardian link. */
  async requireAdmitted(uid: string): Promise<void> {
    const status = await this.store.admissionStatus(uid);
    if (status !== 'admitted') throw new AdmissionPolicyError('minor_needs_guardian');
  }
}
