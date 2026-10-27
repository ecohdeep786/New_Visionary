// PRIV-01 (KAN-110) — approved purpose/minimization/retention by data class,
// including auth/device metadata, learning text, source files, billing/audit
// and model artifacts; supported age/admission/guardian flows.
//
// The checkpoint here is an EXECUTABLE privacy policy (composing CACHE-01's
// invariant pattern):
//   - Five DATA CLASSES, each with an approved policy: purpose, minimization
//     (permitted/forbidden fields), retention (explicit and justified — never
//     an invented deletion TTL; erasure is EVENT-DRIVEN on an owner request),
//     and access (owner / scoped-operator / system).
//   - ACCESS IS ENFORCEABLE: an access check against the policy denies any
//     actor whose authority does not match the class's access rule (wrong-user
//     deny; ordinary users denied operator-scoped classes; interactive actors
//     denied system classes).
//   - MINIMIZATION IS ENFORCED: collecting a field the class forbids refuses
//     (field_not_minimized) — the collection path fails closed.
//   - MODEL ARTIFACTS: never carry raw private text (KAN-91 redaction proof
//     composes) and are purpose-bound with no automatic training.
//   - ERASURE IS EVENT-DRIVEN and covers derived state: an owner erasure
//     request immediately revokes + deletes across the covered classes and
//     their derived caches (CACHE-01 revocation composition) — no TTL "hopes"
//     the data away.
//   - AGE/ADMISSION/GUARDIAN FLOWS are explicit: a learner under the admission
//     age requires an ACTIVE guardian consent to process learning data; the
//     flow states are first-class (guardian_required / guardian_active /
//     self_serve), never implicit.
//
// Exit: real-user data has enforceable access, lifecycle and support
// procedures.

/** The five approved data classes. */
export type DataClass =
  | 'auth_device'
  | 'learning_text'
  | 'source_files'
  | 'billing_audit'
  | 'model_artifacts';

/** Who may access a data class (enforced, not advisory). */
export type AccessRule = 'owner' | 'scoped_operator' | 'system';

/** The explicit retention record for a class. */
export interface RetentionRule {
  /** Bounded retention period in days, or 0 = no retention beyond processing. */
  days: number;
  /** The justification for this retention (approved, not invented). */
  justification: string;
  /** Erasure is always event-driven; this documents the trigger. */
  erasureTrigger: 'owner_erasure_request' | 'account_closure' | 'legal_minimum_elapsed';
}

/** The approved policy for one data class. */
export interface DataClassPolicy {
  dataClass: DataClass;
  /** The approved purpose statement. */
  purpose: string;
  /** Fields the class MAY collect (minimization allowlist). */
  permittedFields: readonly string[];
  retention: RetentionRule;
  access: AccessRule;
}

/** The full privacy policy: exactly the five data classes, no orphans. */
export interface PrivacyPolicy {
  policyVersion: string;
  classes: readonly DataClassPolicy[];
}

/** Supported age/admission/guardian flow states. */
export type GuardianFlowState = 'self_serve' | 'guardian_required' | 'guardian_active';

export class PrivacyError extends Error {
  constructor(
    public readonly code:
      | 'policy_invalid'
      | 'access_denied'
      | 'field_not_minimized'
      | 'raw_text_in_artifact'
      | 'guardian_required'
      | 'unknown_class'
  ) {
    super(code);
  }
}
