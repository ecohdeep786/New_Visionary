import { approvedPolicy, digest, record, uid } from './privacy-policy';
import { DataClass, ErasureRequest, PrivacyControlStore, PrivacyError, PrivacyTransaction } from './privacy-core-types';
/** Internal control-plane boundary. Callers derive UIDs from current verified
 * identities; this library neither authenticates HTTP nor replaces owning-store
 * record authority. No live provider or product controller is installed here. */
export class PrivacyCoreService {
  private readonly approvers: ReadonlySet<string>;
  private readonly services: ReadonlySet<string>;
  private readonly now: () => Date;
  constructor(private readonly store: PrivacyControlStore, options: { trustedApprovers?: readonly string[]; trustedServices?: readonly string[]; now?: () => Date } = {}) {
    this.approvers = new Set(options.trustedApprovers ?? []); this.services = new Set(options.trustedServices ?? []); this.now = options.now ?? (() => new Date());
  }
  private identity(value: unknown): asserts value is string { if (!uid(value)) throw new PrivacyError('access_denied'); }
  private async policy(tx: PrivacyTransaction) { return approvedPolicy(await tx.policy(), this.approvers, this.now()); }
  async minimize(dataClass: DataClass, candidate: unknown) {
    return this.store.transaction(async tx => { const { policy } = await this.policy(tx); return this.fields(policy.classes.find(c => c.dataClass === dataClass)?.permittedFields, candidate); });
  }
  private fields(allowed: readonly string[] | undefined, candidate: unknown) {
    if (!allowed) throw new PrivacyError('policy_invalid');
    // This helper accepts bounded scalar metadata only. Domain-owned structured
    // text/documents require their own explicit schema; an allowed root field
    // cannot smuggle an arbitrary private object/array into approved metadata.
    try {
      record(candidate, allowed);
      for (const value of Object.values(candidate)) {
        if (typeof value === 'string' && value.length <= 4000) continue;
        if (typeof value === 'boolean') continue;
        if (typeof value === 'number' && Number.isFinite(value)) continue;
        throw Error();
      }
      if (JSON.stringify(candidate).length > 16000) throw Error();
    } catch { throw new PrivacyError('field_not_minimized'); }
    return structuredClone(candidate);
  }
  async admission(actorUid: string) {
    this.identity(actorUid);
    return this.store.transaction(async tx => {
      const { policy, policyDigest } = await this.policy(tx);
      if (await tx.restriction(actorUid)) return { allowed: false, state: 'processing_restricted' };
      const subject = await tx.subject(actorUid);
      try { record(subject, ['uid', 'ageBand', 'assurance', 'status', 'policyVersion', 'policyDigest', 'acknowledgementUid', 'acknowledgementPurpose', 'expiresAt', 'revokedAt']); } catch { return { allowed: false, state: 'review_required' }; }
      if (subject.uid !== actorUid || subject.status !== 'active' || subject.policyVersion !== policy.policyVersion || subject.policyDigest !== policyDigest || subject.assurance !== 'declared' || subject.acknowledgementUid !== actorUid || subject.acknowledgementPurpose !== 'personal-policy-review' || subject.revokedAt !== null || !Number.isFinite(Date.parse(subject.expiresAt)) || Date.parse(subject.expiresAt) <= this.now().getTime()) return { allowed: false, state: 'review_required' };
      if (subject.ageBand !== 'adult') return { allowed: false, state: 'guardian_review_required' };
      return { allowed: true, state: 'adult_current_boundary', assurance: subject.assurance };
    });
  }
  async requestErasure(actorUid: string, commandId: unknown): Promise<{ request: ErasureRequest; replay: boolean; deletionComplete: false }> {
    this.identity(actorUid);
    if (typeof commandId !== 'string' || !/^[A-Za-z0-9._:-]{1,128}$/.test(commandId)) throw new PrivacyError('invalid_command');
    return this.store.transaction(async tx => {
      const { policy, policyDigest } = await this.policy(tx), key = digest([actorUid, commandId]);
      const existing = await tx.request(key), restriction = await tx.restriction(actorUid);
      if (restriction) {
        try { record(restriction, ['uid', 'requestId', 'policyDigest', 'state']); } catch { throw new PrivacyError('conflict'); }
        if (!/^[a-f0-9]{64}$/.test(restriction.requestId) || restriction.uid !== actorUid || restriction.state !== 'restricted' || restriction.policyDigest !== policyDigest) throw new PrivacyError('conflict');
      }
      const pending = existing ?? (restriction ? await tx.request(restriction.requestId) : undefined);
      if (pending) {
        try { record(pending, ['id', 'uid', 'policyVersion', 'policyDigest', 'state', 'scope', 'requestedAt']); } catch { throw new PrivacyError('conflict'); }
        if (restriction?.requestId !== pending.id || pending.id !== (existing ? key : restriction?.requestId) || pending.uid !== actorUid || pending.policyVersion !== policy.policyVersion || pending.policyDigest !== policyDigest || pending.state !== 'pending' || pending.scope !== 'personal_records' || !Number.isFinite(Date.parse(pending.requestedAt)) || Date.parse(pending.requestedAt) > this.now().getTime() || !restriction) throw new PrivacyError('conflict');
        return { request: pending, replay: true, deletionComplete: false };
      }
      if (restriction) throw new PrivacyError('conflict');
      const request: ErasureRequest = { id: key, uid: actorUid, policyVersion: policy.policyVersion, policyDigest, state: 'pending', scope: 'personal_records', requestedAt: this.now().toISOString() };
      // One owning transaction commits the pending request and restriction before
      // any consumer deletion. No customer data is deleted and no completion or
      // global authorization-revocation acknowledgement is invented.
      tx.restrict({ uid: actorUid, requestId: key, policyDigest, state: 'restricted' }); tx.createRequest(request);
      return { request, replay: false, deletionComplete: false };
    });
  }
  async collectArtifact(actorUid: string, input: unknown) {
    this.identity(actorUid);
    if (!this.services.has(actorUid)) throw new PrivacyError('access_denied');
    record(input, ['uid', 'runId', 'modelVersion', 'evidenceDigest']); this.identity(input.uid);
    if (typeof input.runId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(input.runId) || typeof input.modelVersion !== 'string' || !/^[A-Za-z0-9._:-]{1,64}$/.test(input.modelVersion) || typeof input.evidenceDigest !== 'string' || !/^[a-f0-9]{64}$/.test(input.evidenceDigest)) throw new PrivacyError('field_not_minimized');
    const metadata = structuredClone(input) as Record<string, string>, key = digest([metadata.uid, metadata.runId]);
    return this.store.transaction(async tx => {
      const { policy, policyDigest } = await this.policy(tx);
      if (await tx.restriction(metadata.uid)) throw new PrivacyError('processing_restricted');
      const proposal = await tx.artifactProposal(key), prior = await tx.artifact(key);
      try { record(proposal, ['uid', 'runId', 'modelVersion', 'evidenceDigest', 'policyVersion', 'policyDigest', 'purpose', 'status', 'expiresAt', 'revokedAt', 'serviceUid']); } catch { throw new PrivacyError('access_denied'); }
      if (proposal.status !== 'approved' || proposal.revokedAt !== null || proposal.policyVersion !== policy.policyVersion || proposal.policyDigest !== policyDigest || proposal.purpose !== 'model-operation' || proposal.serviceUid !== actorUid || !Number.isFinite(Date.parse(proposal.expiresAt)) || Date.parse(proposal.expiresAt) <= this.now().getTime() || ['uid', 'runId', 'modelVersion', 'evidenceDigest'].some(k => proposal[k] !== metadata[k])) throw new PrivacyError('access_denied');
      const value = { ...metadata, occurredAt: this.now().toISOString(), policyDigest, policyVersion: policy.policyVersion, serviceUid: actorUid };
      const rule = policy.classes.find(c => c.dataClass === 'model_artifacts');
      if (rule?.access !== 'service') throw new PrivacyError('access_denied'); this.fields(rule.permittedFields, value);
      if (prior) {
        try { record(prior, Object.keys(value)); } catch { throw new PrivacyError('conflict'); }
        if (!Number.isFinite(Date.parse(prior.occurredAt)) || Date.parse(prior.occurredAt) > this.now().getTime() || ['uid', 'runId', 'modelVersion', 'evidenceDigest', 'policyDigest', 'policyVersion', 'serviceUid'].some(k => prior[k] !== value[k])) throw new PrivacyError('conflict'); return { replay: true };
      }
      tx.createArtifact(key, value); return { replay: false };
    });
  }
}
