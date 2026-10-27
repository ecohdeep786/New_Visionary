// PRIV-01 (KAN-110) — the privacy core service: enforceable access,
// minimization, event-driven erasure covering derived state, and the
// supported age/admission/guardian flows.
//
// Core responsibilities (server-owned; fail closed):
//   1. accessCheck: enforce the class access rule — owner classes check
//      uid+workspace; scoped-operator classes require the operator scope;
//      system classes deny every interactive actor.
//   2. minimize: strip a candidate record down to the class's permitted fields;
//      the presence of a forbidden field refuses (field_not_minimized) —
//      collection fails closed instead of silently dropping fields.
//   3. requestErasure: EVENT-DRIVEN erasure — immediately revokes the owner's
//      authorization (CACHE-01/scoped-cache composition) and deletes the
//      owner's data across the erasable classes; billing/audit is retained per
//      its legal minimum and reported honestly in the receipt.
//   4. guardianFlow: the supported age/admission flow — a learner under the
//      admission age requires an ACTIVE guardian consent to process learning
//      data (`guardian_required` otherwise); the flow state is explicit.
//   5. collectArtifact: model artifacts are redacted-only — the presence of
//      raw private text refuses (`raw_text_in_artifact`).
import type {
  DataClass,
  GuardianFlowState,
  PrivacyError as PrivacyErrorType,
  PrivacyPolicy,
} from './privacy-core-types';
import { PrivacyError } from './privacy-core-types';
import type { PrivacyPolicyStore } from './privacy-core-lookups';

export interface ErasureReceipt {
  ownerUid: string;
  revoked: true;
  deletedClasses: readonly DataClass[];
  /** Classes retained by legal minimum, reported honestly. */
  retainedClasses: readonly { dataClass: DataClass; reason: string }[];
  derivedCachesInvalidated: true;
}

export class PrivacyCoreService {
  constructor(
    private readonly store: PrivacyPolicyStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Enforceable access check against the class policy. */
  async accessCheck(dataClass: DataClass, actor: { uid: string; workspaceId: string; scopes?: readonly string[] }): Promise<{ allowed: true } | { allowed: false; reason: string }> {
    const policy = await this.policyFor(dataClass);
    if (policy.access === 'owner') {
      // The caller must BE the owner (uid+workspace match the record's owner;
      // here the store's ownership check via the actor identity).
      const isOwner = await this.store.isOwner(dataClass, actor.uid, actor.workspaceId);
      return isOwner ? { allowed: true } : { allowed: false, reason: 'owner_only' };
    }
    if (policy.access === 'scoped_operator') {
      const hasScope = (actor.scopes ?? []).some((s) => s.startsWith('quality.review:') || s === 'audit.read');
      return hasScope ? { allowed: true } : { allowed: false, reason: 'operator_scope_required' };
    }
    // system: no interactive actor passes.
    return { allowed: false, reason: 'system_only' };
  }

  /** Minimization: refuse forbidden fields; return the minimized record. */
  async minimize(dataClass: DataClass, candidate: Record<string, unknown>): Promise<Record<string, unknown>> {
    const policy = await this.policyFor(dataClass);
    const forbidden = Object.keys(candidate).filter((k) => !policy.permittedFields.includes(k));
    if (forbidden.length > 0) throw new PrivacyError('field_not_minimized');
    return candidate;
  }

  /**
   * Event-driven erasure: revoke + delete across erasable classes; derived
   * caches invalidated; legal-minimum classes reported honestly as retained.
   */
  async requestErasure(ownerUid: string, workspaceId: string): Promise<ErasureReceipt> {
    const policy = await this.currentPolicy();
    const deletedClasses: DataClass[] = [];
    const retainedClasses: { dataClass: DataClass; reason: string }[] = [];
    for (const c of policy.classes) {
      if (c.retention.erasureTrigger === 'legal_minimum_elapsed') {
        retainedClasses.push({ dataClass: c.dataClass, reason: `Retained per legal minimum: ${c.retention.justification}` });
        continue;
      }
      await this.store.deleteOwnerData(c.dataClass, ownerUid, workspaceId);
      deletedClasses.push(c.dataClass);
    }
    // Derived caches + authorization revoke immediately (CACHE-01/AI-05 composition).
    await this.store.revokeDerivedCaches(ownerUid);
    return { ownerUid, revoked: true, deletedClasses, retainedClasses, derivedCachesInvalidated: true };
  }

  /** The supported age/admission/guardian flow for a learner. */
  guardianFlow(input: { learnerAge: number; admissionAge: number; guardianConsentActive: boolean }): { state: GuardianFlowState; learningDataAllowed: boolean } {
    if (input.learnerAge >= input.admissionAge) {
      return { state: 'self_serve', learningDataAllowed: true };
    }
    if (input.guardianConsentActive) {
      return { state: 'guardian_active', learningDataAllowed: true };
    }
    return { state: 'guardian_required', learningDataAllowed: false };
  }

  /** Collect a model artifact: redacted-only, never raw private text. */
  async collectArtifact(input: { runId: string; fields: Record<string, string | number>; rawPrivateText: readonly string[] }): Promise<void> {
    const serialized = JSON.stringify(input.fields);
    if (input.rawPrivateText.some((t) => serialized.includes(t))) {
      throw new PrivacyError('raw_text_in_artifact');
    }
    await this.store.saveArtifact({ ...input.fields, runId: input.runId, occurredAt: this.now().toISOString() });
  }

  private async policyFor(dataClass: DataClass) {
    const policy = await this.currentPolicy();
    const found = policy.classes.find((c) => c.dataClass === dataClass);
    if (!found) throw new PrivacyError('unknown_class');
    return found;
  }

  private async currentPolicy(): Promise<PrivacyPolicy> {
    return this.store.currentPolicy();
  }
}

export type { PrivacyErrorType };
