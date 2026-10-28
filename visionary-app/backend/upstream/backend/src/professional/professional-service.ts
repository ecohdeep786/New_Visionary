// ROLE-05 (KAN-97) — separate professional personal/company records,
// sponsored membership and explicit portfolio/project shares.
//
// Core responsibilities (server-owned; separation enforced; fail closed):
//   1. SEPARATE records: personal and company scopes are strictly separate
//      stores; a company record carrying a personal-learning reference
//      refuses (`personal_learning_forbidden`); reading is owner-only
//      (uniform `not_owner`, no leak).
//   2. SPONSORED membership: a company sponsor (only) grants a member the
//      sponsored tier — the sponsorship grants company benefits ONLY and
//      NEVER personal-learning access (`grantsPersonalLearningAccess` is
//      false by construction).
//   3. EXPLICIT portfolio/project shares: visibility of a personal item to a
//      company exists ONLY through an explicit, purpose-bound, revocable
//      share grant by the item's owner.
//   4. EMPLOYER ACCESS BOUNDARY: the company view of a member returns the
//      member's company records plus explicitly granted items ONLY — personal
//      learning is absent even with an active sponsorship; a company-side
//      personal-learning read refuses (`share_grant_required`).
import type {
  ProfessionalError as ProfessionalErrorType,
  ProOwner,
  ProRecord,
  ShareGrant,
  Sponsorship,
} from './professional-types';
import { ProfessionalError } from './professional-types';
import type { ProfessionalStore } from './professional-lookups';

/** Reference markers that indicate private personal-learning content. */
const PERSONAL_LEARNING_HINTS = ['learning', 'learner', 'mastery', 'session_ref', 'conversation'];

export class ProfessionalService {
  private recordCounter = 0;
  private sponsorshipCounter = 0;
  private shareCounter = 0;

  constructor(private readonly store: ProfessionalStore) {}

  /** Add a PERSONAL professional record (owner scope only). */
  async addPersonalRecord(owner: ProOwner, kind: string, value: string): Promise<ProRecord> {
    if (!kind || !value) throw new ProfessionalError('profile_definition_invalid');
    const record: ProRecord = {
      recordId: `rec_${++this.recordCounter}`,
      ownerUid: owner.uid,
      workspaceId: owner.workspaceId,
      scope: 'personal',
      companyId: null,
      kind,
      value,
      createdAt: new Date().toISOString(),
    };
    await this.store.saveRecord(record);
    return record;
  }

  /** Add a COMPANY professional record (company scope; no personal-learning refs). */
  async addCompanyRecord(
    owner: ProOwner,
    companyId: string,
    kind: string,
    value: string,
  ): Promise<ProRecord> {
    if (!companyId || !kind || !value) throw new ProfessionalError('profile_definition_invalid');
    const lowered = `${kind} ${value}`.toLowerCase();
    if (PERSONAL_LEARNING_HINTS.some((h) => lowered.includes(h))) {
      throw new ProfessionalError('personal_learning_forbidden');
    }
    const record: ProRecord = {
      recordId: `rec_${++this.recordCounter}`,
      ownerUid: owner.uid,
      workspaceId: owner.workspaceId,
      scope: 'company',
      companyId,
      kind,
      value,
      createdAt: new Date().toISOString(),
    };
    await this.store.saveRecord(record);
    return record;
  }

  /** Read one record (owner only; uniform denial otherwise). */
  async readRecord(owner: ProOwner, recordId: string): Promise<ProRecord> {
    const record = await this.store.record(recordId);
    if (!record || record.ownerUid !== owner.uid || record.workspaceId !== owner.workspaceId) {
      throw new ProfessionalError('not_owner');
    }
    return record;
  }

  /** Sponsor a member (company sponsor only; benefits only, never learning). */
  async sponsorMembership(
    sponsor: ProOwner,
    companyId: string,
    memberUid: string,
    tier: string,
  ): Promise<Sponsorship> {
    if (!sponsor.uid.startsWith('company_')) {
      // The sponsor must be a company-side principal (company_<id> uid).
      throw new ProfessionalError('sponsor_only');
    }
    if (!companyId || !memberUid || !tier) throw new ProfessionalError('profile_definition_invalid');
    const sponsorship: Sponsorship = {
      sponsorshipId: `spn_${++this.sponsorshipCounter}`,
      companyId,
      memberUid,
      tier,
      sponsoredBy: sponsor.uid,
      grantsPersonalLearningAccess: false,
    };
    await this.store.saveSponsorship(sponsorship);
    return sponsorship;
  }

  /** Explicitly share one portfolio/project item to one company (owner only). */
  async shareToCompany(
    owner: ProOwner,
    companyId: string,
    itemType: 'portfolio' | 'project',
    itemRef: string,
    purpose: string,
  ): Promise<ShareGrant> {
    if (!companyId || !itemRef || !purpose) throw new ProfessionalError('profile_definition_invalid');
    const share: ShareGrant = {
      shareId: `shr_${++this.shareCounter}`,
      ownerUid: owner.uid,
      companyId,
      itemType,
      itemRef,
      purpose,
      revoked: false,
    };
    await this.store.saveShare(share);
    return share;
  }

  /** Revoke one share (owner only). */
  async revokeShare(owner: ProOwner, shareId: string): Promise<void> {
    const share = await this.store.share(shareId);
    if (!share || share.ownerUid !== owner.uid) throw new ProfessionalError('not_owner');
    await this.store.saveShare({ ...share, revoked: true });
  }

  /**
   * The company view of one member: company-scope records + explicitly
   * granted items ONLY. Personal learning is structurally absent.
   */
  async companyView(companyPrincipal: ProOwner, companyId: string, memberUid: string) {
    if (!companyPrincipal.uid.startsWith('company_')) {
      throw new ProfessionalError('sponsor_only');
    }
    const companyRecords = (await this.store.records(memberUid, 'company')).filter(
      (r) => r.companyId === companyId,
    );
    const grants = (await this.store.shares(companyId, memberUid)).filter((s) => !s.revoked);
    return {
      memberUid,
      companyRecords,
      sharedItems: grants.map((g) => ({ itemType: g.itemType, itemRef: g.itemRef, purpose: g.purpose })),
      // The boundary made explicit: personal learning is NEVER in this view.
      personalLearningCount: 0,
    };
  }

  /** A company-side personal-learning read always refuses. */
  async readPersonalLearningAsCompany(): Promise<never> {
    throw new ProfessionalError('share_grant_required');
  }
}

export type { ProfessionalErrorType };
