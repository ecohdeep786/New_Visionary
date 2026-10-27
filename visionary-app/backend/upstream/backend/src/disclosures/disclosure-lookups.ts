// PRIV-07 (KAN-116) — the disclosure registry's typed state seams. The owning
// stores (disclosures, approvals, rights reviews) implement these at
// integration; the in-memory implementation is contract-true and fails closed.
import type { Disclosure, DisclosureApproval, RightsReview } from './disclosure-types';

export interface DisclosureStore {
  saveDisclosure(disclosure: Disclosure): Promise<void>;
  disclosure(disclosureId: string, version: number): Promise<Disclosure | undefined>;
  latestVersion(disclosureId: string): Promise<number | undefined>;
  saveApproval(approval: DisclosureApproval): Promise<void>;
  approvalFor(disclosureId: string, version: number): Promise<DisclosureApproval | undefined>;
  saveRightsReview(review: RightsReview): Promise<void>;
  rightsReview(subjectKind: string, subjectId: string): Promise<RightsReview | undefined>;
}

/** Contract-true in-memory store; approvals are separate records. */
export class InMemoryDisclosureStore implements DisclosureStore {
  private disclosures = new Map<string, Disclosure>();
  private approvals = new Map<string, DisclosureApproval>();
  private reviews = new Map<string, RightsReview>();

  private static dkey(disclosureId: string, version: number): string {
    return `${disclosureId}@${version}`;
  }

  async saveDisclosure(disclosure: Disclosure): Promise<void> {
    this.disclosures.set(InMemoryDisclosureStore.dkey(disclosure.disclosureId, disclosure.version), { ...disclosure, accountableOwner: { ...disclosure.accountableOwner } });
  }

  async disclosure(disclosureId: string, version: number): Promise<Disclosure | undefined> {
    const found = this.disclosures.get(InMemoryDisclosureStore.dkey(disclosureId, version));
    return found ? { ...found, accountableOwner: { ...found.accountableOwner } } : undefined;
  }

  async latestVersion(disclosureId: string): Promise<number | undefined> {
    const versions = [...this.disclosures.values()]
      .filter((d) => d.disclosureId === disclosureId)
      .map((d) => d.version)
      .sort((a, b) => b - a);
    return versions[0];
  }

  async saveApproval(approval: DisclosureApproval): Promise<void> {
    this.approvals.set(InMemoryDisclosureStore.dkey(approval.disclosureId, approval.version), { ...approval, approver: { ...approval.approver } });
  }

  async approvalFor(disclosureId: string, version: number): Promise<DisclosureApproval | undefined> {
    const found = this.approvals.get(InMemoryDisclosureStore.dkey(disclosureId, version));
    return found ? { ...found, approver: { ...found.approver } } : undefined;
  }

  async saveRightsReview(review: RightsReview): Promise<void> {
    this.reviews.set(`${review.subjectKind}|${review.subjectId}`, { ...review, accountableOwner: { ...review.accountableOwner } });
  }

  async rightsReview(subjectKind: string, subjectId: string): Promise<RightsReview | undefined> {
    const found = this.reviews.get(`${subjectKind}|${subjectId}`);
    return found ? { ...found, accountableOwner: { ...found.accountableOwner } } : undefined;
  }
}
