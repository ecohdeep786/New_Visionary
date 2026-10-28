// ROLE-05 (KAN-97) — the professional domain's typed state seams.
import type { ProOwner, ProRecord, ShareGrant, Sponsorship } from './professional-types';

export interface ProfessionalStore {
  saveRecord(record: ProRecord): Promise<void>;
  record(recordId: string): Promise<ProRecord | undefined>;
  records(ownerUid: string, scope: RecordScopeOf): Promise<ProRecord[]>;
  saveSponsorship(s: Sponsorship): Promise<void>;
  sponsorship(companyId: string, memberUid: string): Promise<Sponsorship | undefined>;
  saveShare(share: ShareGrant): Promise<void>;
  share(shareId: string): Promise<ShareGrant | undefined>;
  shares(companyId: string, memberUid: string): Promise<ShareGrant[]>;
}

type RecordScopeOf = 'personal' | 'company';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Contract-true in-memory store; every seam fails closed. */
export class InMemoryProfessionalStore implements ProfessionalStore {
  private recordList = new Map<string, ProRecord>();
  private sponsorships = new Map<string, Sponsorship>();
  private shareList = new Map<string, ShareGrant>();

  async saveRecord(record: ProRecord): Promise<void> {
    this.recordList.set(record.recordId, clone(record));
  }

  async record(recordId: string): Promise<ProRecord | undefined> {
    const found = this.recordList.get(recordId);
    return found ? clone(found) : undefined;
  }

  async records(ownerUid: string, scope: RecordScopeOf): Promise<ProRecord[]> {
    return [...this.recordList.values()]
      .filter((r) => r.ownerUid === ownerUid && r.scope === scope)
      .map(clone);
  }

  async saveSponsorship(s: Sponsorship): Promise<void> {
    this.sponsorships.set(`${s.companyId}|${s.memberUid}`, clone(s));
  }

  async sponsorship(companyId: string, memberUid: string): Promise<Sponsorship | undefined> {
    const found = this.sponsorships.get(`${companyId}|${memberUid}`);
    return found ? clone(found) : undefined;
  }

  async saveShare(share: ShareGrant): Promise<void> {
    this.shareList.set(share.shareId, clone(share));
  }

  async share(shareId: string): Promise<ShareGrant | undefined> {
    const found = this.shareList.get(shareId);
    return found ? clone(found) : undefined;
  }

  async shares(companyId: string, memberUid: string): Promise<ShareGrant[]> {
    return [...this.shareList.values()]
      .filter((s) => s.companyId === companyId && s.ownerUid === memberUid)
      .map(clone);
  }
}

export type { ProOwner };
