// DATA-09 — admission/guardian-link store contract + in-memory synthetic
// implementation. The Cloud SQL adapter implements the same surface over the
// DATA-01 persons/guardian-links tables at integration. Admission is
// server-computed; this store never accepts a client-computed decision.
import type { AdmissionStatus, GuardianLinkRecord, GuardianLinkState } from './admission-types';

export interface AdmissionStore {
  /** Server-owned birth registry value for the uid; null when unverifiable. */
  birthYear(uid: string): Promise<number | null>;
  /** Current admission status for a uid, if already computed. */
  admissionStatus(uid: string): Promise<AdmissionStatus | null>;
  setAdmissionStatus(uid: string, status: AdmissionStatus): Promise<void>;
  guardianLink(minorUid: string): Promise<GuardianLinkRecord | null>;
  createGuardianLink(record: GuardianLinkRecord): Promise<void>;
  updateGuardianLink(minorUid: string, state: GuardianLinkState, linkedAt?: string | null, deniedAt?: string | null): Promise<GuardianLinkRecord | null>;
}

export class InMemoryAdmissionStore implements AdmissionStore {
  readonly births = new Map<string, number>();
  readonly statuses = new Map<string, AdmissionStatus>();
  readonly links = new Map<string, GuardianLinkRecord>(); // by minorUid

  seedBirth(uid: string, birthYear: number) { this.births.set(uid, birthYear); }

  async birthYear(uid: string): Promise<number | null> { return this.births.get(uid) ?? null; }
  async admissionStatus(uid: string): Promise<AdmissionStatus | null> { return this.statuses.get(uid) ?? null; }
  async setAdmissionStatus(uid: string, status: AdmissionStatus) { this.statuses.set(uid, status); }
  async guardianLink(minorUid: string): Promise<GuardianLinkRecord | null> { return this.links.get(minorUid) ?? null; }
  async createGuardianLink(record: GuardianLinkRecord) { this.links.set(record.minorUid, record); }
  async updateGuardianLink(minorUid: string, state: GuardianLinkState, linkedAt: string | null = null, deniedAt: string | null = null) {
    const existing = this.links.get(minorUid);
    if (!existing) return null;
    const next = { ...existing, state, linkedAt: linkedAt ?? existing.linkedAt, deniedAt: deniedAt ?? existing.deniedAt };
    this.links.set(minorUid, next);
    return next;
  }
}
