export const DATA_CLASSES = ['auth_device', 'learning_text', 'source_files', 'billing_audit', 'model_artifacts', 'admission_proof', 'voice_transcript', 'offline_pack', 'pilot_feedback'] as const;
export type DataClass = typeof DATA_CLASSES[number];
export type Retention =
  | { mode: 'decision_required'; rationale: string }
  | { mode: 'owner_controlled'; rationale: string }
  | { mode: 'ephemeral'; days: 0; rationale: string }
  | { mode: 'bounded_days'; days: number; rationale: string }
  | { mode: 'legal_hold'; authorityRef: string; rationale: string };
export interface DataClassPolicy { dataClass: DataClass; purpose: string; permittedFields: string[]; access: 'owner' | 'operator' | 'service'; retention: Retention; }
export interface PrivacyPolicy { policyVersion: string; admission: { minimumSelfServeAge: 18; under18Activation: 'blocked' }; classes: DataClassPolicy[]; }
export interface PolicyApproval { state: 'approved'; policyVersion: string; policyDigest: string; approvedBy: string; approvedAt: string; }
export interface PolicySnapshot { policy: PrivacyPolicy; approval?: PolicyApproval; }
export interface ErasureRequest { id: string; uid: string; policyVersion: string; policyDigest: string; state: 'pending'; requestedAt: string; scope: 'personal_records'; }
export interface Restriction { uid: string; requestId: string; policyDigest: string; state: 'restricted'; }
/** This control plane stores review/job metadata, never copies SQL membership or
 * establishes institution ownership. Existing account/domain authorities remain. */
export interface PrivacyTransaction {
  policy(): Promise<PolicySnapshot | undefined>;
  restriction(uid: string): Promise<Restriction | undefined>;
  request(id: string): Promise<ErasureRequest | undefined>;
  subject(uid: string): Promise<unknown>;
  artifactProposal(id: string): Promise<unknown>;
  artifact(id: string): Promise<unknown>;
  createRequest(request: ErasureRequest): void;
  restrict(restriction: Restriction): void;
  createArtifact(id: string, record: Record<string, string>): void;
}
export interface PrivacyControlStore { transaction<T>(work: (tx: PrivacyTransaction) => Promise<T>): Promise<T>; }
export class PrivacyError extends Error {
  constructor(readonly code: 'policy_invalid' | 'policy_unapproved' | 'invalid_command' | 'access_denied' | 'processing_restricted' | 'field_not_minimized' | 'conflict' | 'unavailable') { super(code); }
}
