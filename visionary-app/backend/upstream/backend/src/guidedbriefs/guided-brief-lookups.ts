// BUILD-03 (KAN-77) — the guided-brief domain's typed state seams. The owning
// stores (briefs, project ownership, evidence verification) implement these at
// integration; the in-memory implementation is contract-true and fails closed.
import type { BriefOwner, GuidedBrief } from './guided-brief-types';

/** Evidence verification facts the brief service validates server-side. */
export interface BriefEvidenceLookup {
  projectOwner(projectId: string): Promise<BriefOwner | undefined>;
  /** True only when the (concept, sourceVersion) is a released revision. */
  isReleasedRevision(conceptId: string, sourceVersion: string): Promise<boolean>;
  /** True only when the rubric exists for this concept revision. */
  rubricExists(conceptId: string, sourceVersion: string, rubricRef: string): Promise<boolean>;
  /** True only when the check exists for this concept revision. */
  checkExists(conceptId: string, sourceVersion: string, checkId: string): Promise<boolean>;
  /** True only when the practice evidence id belongs to this owner + concept. */
  practiceEvidenceExists(uid: string, conceptId: string, evidenceId: string): Promise<boolean>;
}

export interface GuidedBriefStore {
  saveBrief(brief: GuidedBrief): Promise<void>;
  briefsFor(owner: BriefOwner, projectId: string): Promise<GuidedBrief[]>;
}

/** Contract-true in-memory store; verified briefs are immutable versions. */
export class InMemoryGuidedBriefStore implements GuidedBriefStore {
  private briefs: GuidedBrief[] = [];

  async saveBrief(brief: GuidedBrief): Promise<void> {
    this.briefs = [...this.briefs, { ...brief, owner: { ...brief.owner }, pins: { ...brief.pins, practiceEvidenceIds: [...brief.pins.practiceEvidenceIds] } }];
  }

  async briefsFor(owner: BriefOwner, projectId: string): Promise<GuidedBrief[]> {
    return this.briefs
      .filter((b) => b.owner.uid === owner.uid && b.owner.workspaceId === owner.workspaceId && b.projectId === projectId)
      .map((b) => ({ ...b, owner: { ...b.owner }, pins: { ...b.pins, practiceEvidenceIds: [...b.pins.practiceEvidenceIds] } }))
      .sort((a, b) => a.version - b.version);
  }

  static evidence(input: {
    projects?: readonly { projectId: string; owner: BriefOwner }[];
    released?: readonly { conceptId: string; sourceVersion: string }[];
    rubrics?: readonly { conceptId: string; sourceVersion: string; rubricRef: string }[];
    checks?: readonly { conceptId: string; sourceVersion: string; checkId: string }[];
    practice?: readonly { uid: string; conceptId: string; evidenceId: string }[];
  }): BriefEvidenceLookup {
    const projects = new Map((input.projects ?? []).map((p) => [p.projectId, p.owner]));
    const released = new Set((input.released ?? []).map((r) => `${r.conceptId}@${r.sourceVersion}`));
    const rubrics = new Set((input.rubrics ?? []).map((r) => `${r.conceptId}@${r.sourceVersion}|${r.rubricRef}`));
    const checks = new Set((input.checks ?? []).map((c) => `${c.conceptId}@${c.sourceVersion}|${c.checkId}`));
    const practice = new Set((input.practice ?? []).map((p) => `${p.uid}|${p.conceptId}|${p.evidenceId}`));
    return {
      async projectOwner(projectId: string) {
        const owner = projects.get(projectId);
        return owner ? { ...owner } : undefined;
      },
      async isReleasedRevision(conceptId: string, sourceVersion: string) {
        return released.has(`${conceptId}@${sourceVersion}`);
      },
      async rubricExists(conceptId: string, sourceVersion: string, rubricRef: string) {
        return rubrics.has(`${conceptId}@${sourceVersion}|${rubricRef}`);
      },
      async checkExists(conceptId: string, sourceVersion: string, checkId: string) {
        return checks.has(`${conceptId}@${sourceVersion}|${checkId}`);
      },
      async practiceEvidenceExists(uid: string, conceptId: string, evidenceId: string) {
        return practice.has(`${uid}|${conceptId}|${evidenceId}`);
      },
    };
  }
}
