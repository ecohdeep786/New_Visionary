// ROLE-06 (KAN-98) — the organization domain's typed state seams.
import type { AuditEntry, CurriculumItem, OrgInvite, OrgMembership, OrgRole } from './organization-types';

export interface OrganizationStore {
  saveMembership(m: OrgMembership): Promise<void>;
  membership(orgId: string, uid: string): Promise<OrgMembership | undefined>;
  saveInvite(invite: OrgInvite): Promise<void>;
  invite(inviteId: string): Promise<OrgInvite | undefined>;
  invitesByCode(code: string): Promise<OrgInvite[]>;
  saveCurriculum(item: CurriculumItem): Promise<void>;
  curriculum(curriculumId: string, version: number): Promise<CurriculumItem | undefined>;
  latestCurriculumVersion(orgId: string, curriculumId: string): Promise<number>;
  appendAudit(entry: AuditEntry): Promise<void>;
  auditLog(orgId: string): Promise<AuditEntry[]>;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Contract-true in-memory store; every seam fails closed. */
export class InMemoryOrganizationStore implements OrganizationStore {
  private memberships = new Map<string, OrgMembership>();
  private inviteList = new Map<string, OrgInvite>();
  private curricula = new Map<string, CurriculumItem>();
  private audit = new Map<string, AuditEntry[]>();

  async saveMembership(m: OrgMembership): Promise<void> {
    this.memberships.set(`${m.orgId}|${m.uid}`, clone(m));
  }

  async membership(orgId: string, uid: string): Promise<OrgMembership | undefined> {
    const found = this.memberships.get(`${orgId}|${uid}`);
    return found ? clone(found) : undefined;
  }

  async saveInvite(invite: OrgInvite): Promise<void> {
    this.inviteList.set(invite.inviteId, clone(invite));
  }

  async invite(inviteId: string): Promise<OrgInvite | undefined> {
    const found = this.inviteList.get(inviteId);
    return found ? clone(found) : undefined;
  }

  async invitesByCode(code: string): Promise<OrgInvite[]> {
    return [...this.inviteList.values()].filter((i) => i.code === code).map(clone);
  }

  async saveCurriculum(item: CurriculumItem): Promise<void> {
    this.curricula.set(`${item.orgId}@${item.curriculumId}@${item.version}`, clone(item));
  }

  async curriculum(curriculumId: string, version: number): Promise<CurriculumItem | undefined> {
    const found = [...this.curricula.values()].find((c) => c.curriculumId === curriculumId && c.version === version);
    return found ? clone(found) : undefined;
  }

  async latestCurriculumVersion(orgId: string, curriculumId: string): Promise<number> {
    let latest = 0;
    for (const c of this.curricula.values()) {
      if (c.orgId === orgId && c.curriculumId === curriculumId && c.version > latest) latest = c.version;
    }
    return latest;
  }

  async appendAudit(entry: AuditEntry): Promise<void> {
    const list = this.audit.get(entry.orgId) ?? [];
    list.push(clone(entry));
    this.audit.set(entry.orgId, list);
  }

  async auditLog(orgId: string): Promise<AuditEntry[]> {
    return (this.audit.get(orgId) ?? []).map(clone);
  }
}

export type { OrgRole };
