// PRIV-01 (KAN-110) — the shipped product-wide privacy policy by data class,
// as executable data + a fail-closed validator (composing the CACHE-01
// invariant pattern).
import type { DataClass, DataClassPolicy, PrivacyPolicy } from './privacy-core-types';

/** The five approved data classes — completeness is validated against this. */
export const APPROVED_DATA_CLASSES: readonly DataClass[] = [
  'auth_device',
  'learning_text',
  'source_files',
  'billing_audit',
  'model_artifacts',
];

/** The shipped, approved policy (versioned; tampering is detectable). */
export function shippedPrivacyPolicy(): PrivacyPolicy {
  return {
    policyVersion: 'priv-v1',
    classes: [
      {
        dataClass: 'auth_device',
        purpose: 'Authenticate the user and secure their session on their devices.',
        permittedFields: ['uid', 'deviceId', 'deviceKind', 'lastSeenAt', 'authMethod'],
        retention: { days: 180, justification: 'Device trust window; shorter than a year, reviewed.', erasureTrigger: 'owner_erasure_request' },
        access: 'owner',
      },
      {
        dataClass: 'learning_text',
        purpose: 'Deliver teaching, checks and resume for the owning learner only.',
        permittedFields: ['uid', 'conversationId', 'turnBody', 'conceptId', 'sourceVersion', 'createdAt'],
        retention: { days: 365, justification: 'Learning continuity for one school year; owner erasure always available.', erasureTrigger: 'owner_erasure_request' },
        access: 'owner',
      },
      {
        dataClass: 'source_files',
        purpose: 'Store the owner\'s uploaded source content for their own retrieval.',
        permittedFields: ['uid', 'fileRef', 'sourceVersion', 'manifestDigest', 'uploadedAt'],
        retention: { days: 0, justification: 'Held only while the owner keeps the project; event-driven erasure on request.', erasureTrigger: 'owner_erasure_request' },
        access: 'owner',
      },
      {
        dataClass: 'billing_audit',
        purpose: 'Maintain lawful billing records and a tamper-evident audit trail.',
        permittedFields: ['uid', 'invoiceRef', 'amountMinor', 'currency', 'auditEvent', 'occurredAt'],
        retention: { days: 2555, justification: 'Seven-year legal minimum for billing/audit records.', erasureTrigger: 'legal_minimum_elapsed' },
        access: 'scoped_operator',
      },
      {
        dataClass: 'model_artifacts',
        purpose: 'Operate permitted ML features (redacted telemetry, evaluated outputs).',
        permittedFields: ['runId', 'redactedFields', 'modelVersion', 'occurredAt'],
        retention: { days: 90, justification: 'Short operational window; artifacts are redacted and purpose-bound.', erasureTrigger: 'owner_erasure_request' },
        access: 'system',
      },
    ],
  };
}

/** Structural + semantic validation (fail closed). */
export function validatePrivacyPolicy(policy: PrivacyPolicy): void {
  const seen = new Set<string>();
  for (const c of policy.classes) {
    if (seen.has(c.dataClass)) throw new Error('policy_invalid: duplicate class');
    seen.add(c.dataClass);
    if (!c.purpose || c.purpose.trim().length === 0) throw new Error('policy_invalid: missing purpose');
    if (c.permittedFields.length === 0) throw new Error('policy_invalid: empty minimization allowlist');
    if (c.retention.days < 0 || !c.retention.justification || c.retention.justification.trim().length === 0) {
      throw new Error('policy_invalid: retention must be explicit and justified');
    }
    if (!['owner', 'scoped_operator', 'system'].includes(c.access)) throw new Error('policy_invalid: unknown access rule');
  }
  // Completeness: exactly the approved classes — no missing, no orphans.
  for (const required of APPROVED_DATA_CLASSES) {
    if (!seen.has(required)) throw new Error(`policy_invalid: missing class ${required}`);
  }
  for (const c of policy.classes) {
    if (!APPROVED_DATA_CLASSES.includes(c.dataClass)) throw new Error(`policy_invalid: orphan class ${c.dataClass}`);
  }
}
