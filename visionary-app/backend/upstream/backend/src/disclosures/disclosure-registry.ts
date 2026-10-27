// PRIV-07 (KAN-116) — accountable disclosures, separate approvals, rights
// review, and an honest launch checklist.
//
// Core responsibilities (server-owned; approvals are separate records):
//   1. recordDisclosure: a draft with a version and an ACCOUNTABLE OWNER —
//      a disclosure without an owner refuses (`owner_required`).
//   2. approve: a SEPARATE approval record binding the EXACT version (with
//      approver identity + date). Approving v1 does NOT approve v2; the
//      disclosure object itself never carries an approved flag.
//   3. publish: requires a matching approval for the exact version — an
//      unapproved (or version-mismatched) disclosure refuses to publish.
//   4. recordRightsReview / launchChecklist: every content source, model and
//      provider in the launch set requires a rights review with an accountable
//      owner; the checklist reports approved vs pending per item — never a
//      blanket claim. A missing review refuses the item.
import type {
  Disclosure,
  DisclosureApproval,
  DisclosureError as DisclosureErrorType,
  RightsReview,
} from './disclosure-types';
import { DisclosureError } from './disclosure-types';
import type { DisclosureStore } from './disclosure-lookups';

export class DisclosureRegistry {
  constructor(private readonly store: DisclosureStore) {}

  /** Record a disclosure draft (accountable owner required). */
  async recordDisclosure(disclosure: Disclosure): Promise<Disclosure> {
    if (!disclosure.accountableOwner?.ownerId || !disclosure.accountableOwner?.role) {
      throw new DisclosureError('owner_required');
    }
    await this.store.saveDisclosure({ ...disclosure, accountableOwner: { ...disclosure.accountableOwner } });
    return disclosure;
  }

  /** Record a SEPARATE approval binding the exact disclosure version. */
  async approve(approval: DisclosureApproval): Promise<void> {
    const disclosure = await this.store.disclosure(approval.disclosureId, approval.version);
    if (!disclosure) throw new DisclosureError('unknown_disclosure');
    if (!approval.approver?.ownerId) throw new DisclosureError('owner_required');
    await this.store.saveApproval({ ...approval, approver: { ...approval.approver } });
  }

  /** Publish: requires a matching approval for the EXACT version. */
  async publish(disclosureId: string, version: number): Promise<{ published: true; approvedBy: string }> {
    const disclosure = await this.store.disclosure(disclosureId, version);
    if (!disclosure) throw new DisclosureError('unknown_disclosure');
    const approval = await this.store.approvalFor(disclosureId, version);
    if (!approval) throw new DisclosureError('not_approved');
    return { published: true, approvedBy: approval.approver.ownerId };
  }

  /** Record a rights review for a content source / model / provider. */
  async recordRightsReview(review: RightsReview): Promise<void> {
    if (!review.accountableOwner?.ownerId) throw new DisclosureError('owner_required');
    if (!review.rightsScope || review.rightsScope.trim().length === 0) throw new DisclosureError('owner_required');
    await this.store.saveRightsReview({ ...review, accountableOwner: { ...review.accountableOwner } });
  }

  /** The honest launch checklist: approved vs pending per item. */
  async launchChecklist(input: {
    disclosures: readonly { disclosureId: string; version: number }[];
    rightsSubjects: readonly { subjectKind: RightsReview['subjectKind']; subjectId: string }[];
  }): Promise<{
    disclosures: readonly { disclosureId: string; version: number; state: 'approved' | 'pending' }[];
    rights: readonly { subjectKind: string; subjectId: string; state: 'reviewed' | 'missing' }[];
  }> {
    const disclosureStates: { disclosureId: string; version: number; state: 'approved' | 'pending' }[] = [];
    for (const d of input.disclosures) {
      const approval = await this.store.approvalFor(d.disclosureId, d.version);
      disclosureStates.push({ disclosureId: d.disclosureId, version: d.version, state: approval ? 'approved' : 'pending' });
    }
    const rights: { subjectKind: string; subjectId: string; state: 'reviewed' | 'missing' }[] = [];
    for (const subject of input.rightsSubjects) {
      const review = await this.store.rightsReview(subject.subjectKind, subject.subjectId);
      rights.push({ subjectKind: subject.subjectKind, subjectId: subject.subjectId, state: review ? 'reviewed' : 'missing' });
    }
    return { disclosures: disclosureStates, rights };
  }
}

export type { DisclosureErrorType };
