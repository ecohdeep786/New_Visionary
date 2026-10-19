import { ConflictException, HttpException, ServiceUnavailableException } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { accountPath } from '../auth/firebase-product/account-storage';
import { coverageAccount, coverageAdmission, coverageCategories, coverageDimensions, coveragePublication, coverageRoles, coverageSelection, coverageSliceId, qualifiedCoverageSlice } from './coverage.policy';

// Global release policy contains no person records. Only trusted deployment/source
// review tooling may publish it; browser callers have no publication endpoint.
export const coveragePublicationPath = 'visionary_coverage_releases/current';

export async function accountCoverage(db: Firestore, uid: string, input?: unknown) {
  const selection = input === undefined ? null : coverageSelection(input);
  try {
    return await db.runTransaction(async tx => {
      const account = coverageAccount((await tx.get(db.doc(accountPath(uid)))).data(), uid);
      const now = Date.now();
      const publication = coveragePublication((await tx.get(db.doc(coveragePublicationPath))).data(), now);
      const revision = publication?.revision || null;
      if (selection && (selection.expectedProfileVersion !== account.version || selection.expectedCatalogRevision !== revision)) throw new ConflictException('Your account or learning coverage changed. Reload coverage before retrying.');
      let reason = coverageAdmission(account, selection?.tuple);
      let sourceQualified = false;
      if (selection && !reason && publication) {
        const id = coverageSliceId(account.profile.identity, selection.tuple);
        const snapshot = await tx.get(db.doc(`visionary_coverage_releases/${revision}/slices/${id}`));
        sourceQualified = publication.categoryCounts[selection.tuple.category] > 0 && qualifiedCoverageSlice(snapshot.data(), publication, account.profile.identity, selection.tuple, Date.now());
      }
      const finishedAt = Date.now();
      if (publication && Date.parse(publication.expiresAt) <= finishedAt) throw new ServiceUnavailableException('Learning coverage expired during this check. Reload coverage before retrying.');
      if (!reason) reason = !publication ? 'coverage-not-published' : selection ? sourceQualified ? 'source-qualified-access-check-required' : 'exact-source-not-qualified' : 'exact-source-check-required';
      return { version: 1, uid, profileVersion: account.version, catalogRevision: revision,
        checkedAt: new Date(finishedAt).toISOString(), expiresAt: new Date(Math.min(finishedAt + 30000, publication ? Date.parse(publication.expiresAt) : Infinity)).toISOString(),
        status: sourceQualified ? 'source-qualified' : 'unavailable', reason, runtimeAuthorization: false,
        current: { role: account.profile?.identity || null, stage: account.profile?.education_stage || null },
        categories: coverageCategories.map(id => ({ id, qualifiedSlices: publication?.categoryCounts[id] || 0, exactSourceCheckRequired: true })),
        dimensions: { roles: coverageRoles, categories: coverageCategories, ...coverageDimensions },
        ...(selection ? { selection: selection.tuple } : {}) };
    });
  } catch (error) {
    if (error instanceof HttpException) throw error;
    throw new ServiceUnavailableException('Learning coverage could not be verified. Your saved selections are unchanged. Retry when connected.');
  }
}
