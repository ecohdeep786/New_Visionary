import { randomUUID } from 'node:crypto';
// BUILD-03 (KAN-77) — verified guided briefs pinned to provable evidence.
//
// Core responsibilities (server-owned; blank projects ungated):
//   1. Blank projects stay available WITHOUT guided-learning gates: a project
//      with no brief requires no evidence, no verification and no gate.
//   2. createBrief: every pin is verified server-side (released revision,
//      existing rubric/check, owner-bound practice evidence) before the brief
//      becomes verified product state; the pinned evidence digest travels with
//      the brief.
//   3. amendBrief: amendments append a new immutable version; the previous
//      version's pins stay byte-stable.
//   4. Wrong users denied; unknown evidence refused; fail closed.
import { createHash } from 'node:crypto';
import type {
  BriefOwner,
  BriefPins,
  GuidedBrief,
  GuidedBriefError as GuidedBriefErrorType,
} from './guided-brief-types';
import { GuidedBriefError } from './guided-brief-types';
import type { BriefEvidenceLookup, GuidedBriefStore } from './guided-brief-lookups';

function digestPins(pins: BriefPins): string {
  const canonical = JSON.stringify([
    pins.objectiveConceptId,
    pins.sourceVersion,
    pins.rubricRef,
    pins.checkId,
    [...pins.practiceEvidenceIds].sort(),
  ]);
  return createHash('sha256').update(canonical, 'utf8').digest('hex').slice(0, 32);
}

export class GuidedBriefService {
  constructor(
    private readonly store: GuidedBriefStore,
    private readonly evidence: BriefEvidenceLookup,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /**
   * Create a verified guided brief: every pin must verify against server-side
   * evidence before the brief is committed. Blank projects need none of this.
   */
  async createBrief(owner: BriefOwner, projectId: string, pins: BriefPins): Promise<GuidedBrief> {
    const projectOwner = await this.evidence.projectOwner(projectId);
    if (!projectOwner) throw new GuidedBriefError('unknown_project');
    if (projectOwner.uid !== owner.uid || projectOwner.workspaceId !== owner.workspaceId) throw new GuidedBriefError('not_owner');

    await this.verifyPins(owner, pins);

    const brief: GuidedBrief = {
      briefId: `brf_${randomUUID()}`,
      owner: { ...owner },
      projectId,
      pins: { ...pins, practiceEvidenceIds: [...pins.practiceEvidenceIds] },
      version: 1,
      pinsDigest: digestPins(pins),
      status: 'verified',
      createdAt: this.now().toISOString(),
    };
    await this.store.saveBrief(brief);
    return brief;
  }

  /** Amend a brief: appends a new immutable version (previous stays byte-stable). */
  async amendBrief(owner: BriefOwner, projectId: string, pins: BriefPins): Promise<GuidedBrief> {
    // Ownership is verified before brief lookup so a stranger is denied as
    // not_owner, not misled by an unknown-project error.
    const projectOwner = await this.evidence.projectOwner(projectId);
    if (!projectOwner) throw new GuidedBriefError('unknown_project');
    if (projectOwner.uid !== owner.uid || projectOwner.workspaceId !== owner.workspaceId) throw new GuidedBriefError('not_owner');

    const existing = await this.store.briefsFor(owner, projectId);
    if (existing.length === 0) throw new GuidedBriefError('unknown_project');
    const latest = existing[existing.length - 1];
    await this.verifyPins(owner, pins);

    // The amend version is claimed ATOMICALLY against the latest version: two
    // concurrent amends can never claim the same version (the loser
    // recomputes; deterministic content converges).
    for (let attempt = 0; attempt < 4; attempt++) {
      const current = (await this.store.briefsFor(owner, projectId)).filter((b) => b.briefId === latest.briefId).sort((a, b) => a.version - b.version).pop();
      const brief: GuidedBrief = {
        briefId: latest.briefId,
        owner: { ...owner },
        projectId,
        pins: { ...pins, practiceEvidenceIds: [...pins.practiceEvidenceIds] },
        version: (current?.version ?? 0) + 1,
        pinsDigest: digestPins(pins),
        status: 'verified',
        createdAt: this.now().toISOString(),
      };
      const saved = await this.store.saveBriefCas(brief, current?.version ?? 0);
      if (saved.ok) return brief;
    }
    throw new GuidedBriefError('evidence_not_verified'); // bounded-retry exhaustion surfaces as a typed retryable refusal
  }

  private async verifyPins(owner: BriefOwner, pins: BriefPins): Promise<void> {
    if (!(await this.evidence.isReleasedRevision(pins.objectiveConceptId, pins.sourceVersion))) {
      throw new GuidedBriefError('evidence_not_verified');
    }
    if (!(await this.evidence.rubricExists(pins.objectiveConceptId, pins.sourceVersion, pins.rubricRef))) {
      throw new GuidedBriefError('evidence_missing');
    }
    if (!(await this.evidence.checkExists(pins.objectiveConceptId, pins.sourceVersion, pins.checkId))) {
      throw new GuidedBriefError('evidence_missing');
    }
    for (const evidenceId of pins.practiceEvidenceIds) {
      if (!(await this.evidence.practiceEvidenceExists(owner.uid, pins.objectiveConceptId, evidenceId))) {
        throw new GuidedBriefError('evidence_missing');
      }
    }
  }
}

export type { GuidedBriefErrorType };
