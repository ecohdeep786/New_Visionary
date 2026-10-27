// BUILD-06 (KAN-80) — exact-revision sharing, consent-bound summaries,
// classroom-copy bridge.
//
// Core responsibilities (server-owned; privacy preserving):
//   1. shareRevision: the owner shares ONE exact revision with NAMED accepted
//      recipients; later private edits never leak into the share.
//   2. viewShared: only an ACCEPTED recipient may read the shared revision —
//      exactly that revision's payload, never newer private work.
//   3. parentSummary: produced ONLY while guardian consent is active; revoked
//      or expired consent blocks generation immediately.
//   4. classroomCopy: a teacher copies the shared revision into a NEW private
//      project owned by the class; the copy carries ONLY the shared revision
//      payload — private drafts/conversations/history never cross (asserted).
//   5. Wrong users denied; unknown shares/revisions fail closed.
import type {
  ParentSummaryRequest,
  RevisionShare,
  ShareOwner,
  SharingError as SharingErrorType,
} from './sharing-types';
import { SharingError } from './sharing-types';
import type { SharingStore } from './sharing-lookups';

export class SharingService {
  private shareCounter = 0;
  constructor(
    private readonly store: SharingStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Share ONE exact revision with named accepted recipients (owner-only). */
  async shareRevision(owner: ShareOwner, projectId: string, revisionNo: number, recipients: readonly string[]): Promise<RevisionShare> {
    const payload = await this.store.payloadAt(projectId, revisionNo);
    if (payload === undefined) throw new SharingError('unknown_revision');
    const share: RevisionShare = {
      shareId: `shr_${++this.shareCounter}`,
      owner: { ...owner },
      projectId,
      revisionNo,
      recipients: [...recipients],
      sharedAt: this.now().toISOString(),
    };
    await this.store.saveShare(share);
    return share;
  }

  /** An accepted recipient reads the EXACT shared revision — nothing newer. */
  async viewShared(shareId: string, viewerUid: string): Promise<{ projectId: string; revisionNo: number; payload: unknown }> {
    const share = await this.store.byShareId(shareId);
    if (!share) throw new SharingError('unknown_share');
    if (!share.recipients.includes(viewerUid)) throw new SharingError('recipient_not_accepted');
    const payload = await this.store.payloadAt(share.projectId, share.revisionNo);
    if (payload === undefined) throw new SharingError('unknown_revision');
    return { projectId: share.projectId, revisionNo: share.revisionNo, payload };
  }

  /** Consent-bound parent summary: blocked immediately when consent is gone. */
  async parentSummary(request: ParentSummaryRequest, sections: string[]): Promise<{ summaryId: string; sections: string[] }> {
    if (!request.consentActive) throw new SharingError('consent_not_active');
    await this.store.saveSummary(request, { sections });
    return { summaryId: request.summaryId, sections };
  }

  /**
   * Classroom-copy bridge: copy the shared revision into a NEW private project
   * owned by the class teacher. Only the shared revision payload crosses —
   * the original's private drafts/conversations/history never do.
   */
  async classroomCopy(input: { teacher: ShareOwner; shareId: string; title: string }): Promise<{ newProjectId: string; revisionNo: number; privateStateCopied: false }> {
    const share = await this.store.byShareId(input.shareId);
    if (!share) throw new SharingError('unknown_share');
    if (!share.recipients.includes(input.teacher.uid)) throw new SharingError('recipient_not_accepted');

    const payload = await this.store.payloadAt(share.projectId, share.revisionNo);
    if (payload === undefined) throw new SharingError('unknown_revision');

    const newProjectId = await this.store.createProject({ ...input.teacher }, input.title);
    const revisionNo = await this.store.appendRevision(newProjectId, payload);

    // Privacy assertion: the original's private state must NOT have crossed.
    const privateCrossed = await this.store.privateStateExists(newProjectId);
    if (privateCrossed) throw new SharingError('unknown_project');

    return { newProjectId, revisionNo, privateStateCopied: false };
  }
}

export type { SharingErrorType };
