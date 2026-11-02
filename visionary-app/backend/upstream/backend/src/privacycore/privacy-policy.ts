import { createHash } from 'node:crypto';
import { DATA_CLASSES, PrivacyError, PrivacyPolicy, PolicySnapshot } from './privacy-core-types';
export function record(value: unknown, allowed: readonly string[]): asserts value is Record<string, any> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype || Object.keys(value).some(k => !allowed.includes(k))) throw new PrivacyError('invalid_command');
}
export const uid = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value) && !/^__.*__$/.test(value);
const text = (value: unknown, max: number) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
export function validatePrivacyPolicy(value: unknown): asserts value is PrivacyPolicy {
  try {
    record(value, ['policyVersion', 'admission', 'classes']);
    if (typeof value.policyVersion !== 'string' || !/^[A-Za-z0-9._:-]{1,64}$/.test(value.policyVersion)) throw Error();
    record(value.admission, ['minimumSelfServeAge', 'under18Activation']);
    // Preserve the current product boundary; a configuration/guardian flag alone
    // cannot enable children before the connected replacement is accepted.
    if (value.admission.minimumSelfServeAge !== 18 || value.admission.under18Activation !== 'blocked') throw Error();
    if (!Array.isArray(value.classes) || value.classes.length !== DATA_CLASSES.length) throw Error();
    const seen = new Set();
    for (const c of value.classes) {
      record(c, ['dataClass', 'purpose', 'permittedFields', 'retention', 'access']);
      if (!DATA_CLASSES.includes(c.dataClass) || seen.has(c.dataClass) || !text(c.purpose, 1000) || !['owner', 'operator', 'service'].includes(c.access)) throw Error();
      seen.add(c.dataClass);
      if (!Array.isArray(c.permittedFields) || !c.permittedFields.length || c.permittedFields.length > 40 || new Set(c.permittedFields).size !== c.permittedFields.length || c.permittedFields.some(f => typeof f !== 'string' || !/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(f) || ['constructor', 'prototype'].includes(f) || /password|privatekey|paymentsecret|sessioncookie/i.test(f))) throw Error();
      record(c.retention, ['mode', 'days', 'rationale', 'authorityRef']);
      if (!text(c.retention.rationale, 1000)) throw Error();
      switch (c.retention.mode) {
        case 'decision_required': case 'owner_controlled':
          if ('days' in c.retention || 'authorityRef' in c.retention) throw Error(); break;
        case 'ephemeral':
          if (c.retention.days !== 0 || 'authorityRef' in c.retention) throw Error(); break;
        case 'bounded_days':
          if (!Number.isSafeInteger(c.retention.days) || c.retention.days < 1 || !Number.isSafeInteger(c.retention.days * 86400000) || 'authorityRef' in c.retention) throw Error(); break;
        case 'legal_hold':
          if ('days' in c.retention || !text(c.retention.authorityRef, 256)) throw Error(); break;
        default: throw Error();
      }
    }
  } catch { throw new PrivacyError('policy_invalid'); }
}
function canonical(value: any): any {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])]));
  return value;
}
export const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
export function approvedPolicy(snapshot: unknown, trustedApprovers: ReadonlySet<string>, now: Date) {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) throw new PrivacyError('policy_unapproved');
  if (!snapshot) throw new PrivacyError('policy_unapproved');
  record(snapshot, ['policy', 'approval']); validatePrivacyPolicy(snapshot.policy);
  const policy = structuredClone(snapshot.policy) as PrivacyPolicy, approval = snapshot.approval;
  if (!approval || policy.classes.some(c => c.retention.mode === 'decision_required')) throw new PrivacyError('policy_unapproved');
  record(approval, ['state', 'policyVersion', 'policyDigest', 'approvedBy', 'approvedAt']);
  const timestamp = typeof approval.approvedAt === 'string' ? Date.parse(approval.approvedAt) : NaN;
  if (approval.state !== 'approved' || approval.policyVersion !== policy.policyVersion || approval.policyDigest !== digest(policy) || !uid(approval.approvedBy) || !trustedApprovers.has(approval.approvedBy) || !Number.isFinite(timestamp) || timestamp > now.getTime()) throw new PrivacyError('policy_unapproved');
  return { policy, policyDigest: approval.policyDigest as string };
}
/** A reviewable proposal, not a shipped/approved policy or a legal minimum. */
export function privacyPolicyDraft(): PolicySnapshot {
  const purposes = {
    auth_device: ['Authenticate and secure the owning account.', ['uid', 'deviceHash', 'lastSeenAt', 'authMethod']],
    learning_text: ['Deliver private learning and resume for the owner.', ['uid', 'conversationId', 'turnBody', 'sourceVersion', 'createdAt']],
    source_files: ['Use permitted owner source references.', ['uid', 'fileRef', 'sourceVersion', 'manifestDigest', 'uploadedAt']],
    billing_audit: ['Support authorized billing and security audit operations.', ['uid', 'invoiceRef', 'amountMinor', 'currency', 'occurredAt']],
    model_artifacts: ['Record reviewed operation metadata without private learning text.', ['uid', 'runId', 'modelVersion', 'evidenceDigest', 'occurredAt', 'policyDigest', 'policyVersion', 'serviceUid']],
    admission_proof: ['Keep minimal reviewed relationship/purpose/version proof references.', ['uid', 'relatedUid', 'purpose', 'policyVersion', 'proofRef', 'status', 'expiresAt']],
    voice_transcript: ['Use explicitly requested voice/text input; no always-on recording or default training.', ['uid', 'inputRef', 'purpose', 'createdAt']],
    offline_pack: ['Deliver explicitly permitted scoped offline material.', ['uid', 'packRef', 'sourceVersion', 'expiresAt']],
    pilot_feedback: ['Use minimized, separately reviewed pilot/evaluation metadata.', ['uid', 'feedbackRef', 'purpose', 'policyVersion', 'createdAt']],
  };
  return { policy: { policyVersion: 'priv-review-v1', admission: { minimumSelfServeAge: 18, under18Activation: 'blocked' },
    classes: DATA_CLASSES.map(dataClass => ({ dataClass, purpose: purposes[dataClass][0] as string, permittedFields: purposes[dataClass][1] as string[],
      access: dataClass === 'model_artifacts' ? 'service' : dataClass === 'billing_audit' ? 'operator' : 'owner',
      retention: { mode: 'decision_required', rationale: 'Await named policy-owner review; preserve current records and do not invent deletion or legal-retention periods.' } })) } };
}
