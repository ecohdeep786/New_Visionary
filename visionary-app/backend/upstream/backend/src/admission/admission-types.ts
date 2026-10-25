// DATA-09 — approved age/admission and guardian-first account/linking workflow.
//
// Server-side admission only: a client-supplied age, role flag or browser
// record never establishes admission or converts an unsupported minor into a
// supported user. Admission derives from server-verified identity, the approved
// policy version and — for supported minors — an explicit guardian link made by
// the verified guardian account before the minor account is usable.
export type AdmissionDecision = 'adult' | 'guardian' | 'minor_linked' | 'minor_blocked' | 'unsupported';

export type AdmissionStatus = 'blocked' | 'pending_guardian' | 'admitted';

/** Guardian-first link state. A minor is only supported after `linked`. */
export type GuardianLinkState = 'none' | 'requested' | 'linked' | 'denied';

export interface AdmissionSubject {
  uid: string;
  /** Server-derived policy version at decision time; never from the client. */
  policyVersion: string;
  /** Verified birth-year field (server-owned); absent = cannot admit a minor. */
  birthYear: number | null;
  claimedAge: number | null; // client hint, never authoritative alone
  roleHint: string | null; // client hint, never authoritative alone
}

export interface GuardianLinkRecord {
  id: string;
  minorUid: string;
  guardianUid: string;
  state: GuardianLinkState;
  requestedAt: string;
  linkedAt: string | null;
  deniedAt: string | null;
  policyVersion: string;
}

export interface AdmissionOutcome {
  uid: string;
  decision: AdmissionDecision;
  status: AdmissionStatus;
  policyVersion: string;
  reason: string;
  guardianLink: GuardianLinkRecord | null;
}

/** Minimum supported age; minors below need a verified guardian link. */
export const SUPPORTED_MIN_AGE = 13;
export const ADULT_MIN_AGE = 18;
export const POLICY_VERSION = 'admission.v1';
