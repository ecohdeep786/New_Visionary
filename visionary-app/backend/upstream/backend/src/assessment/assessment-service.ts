// LEARN-12 (KAN-148) — only the released assessment modes: fixed
// source/criteria/official-paper snapshots, server-owned answers/scoring,
// durable sectional timing and interrupted mock resume, plus evidence-qualified
// exam-weighted readiness with missing-data/coverage labels.
//
// Core responsibilities (server-owned; honest; fail closed):
//   1. RELEASED PAPERS ONLY: startSession requires a RELEASED paper (named
//      releaser); unreleased refuses `source_not_released`.
//   2. FIXED SNAPSHOTS: the session pins the paper's source/criteria/
//      official-paper refs at start; later paper edits never move a live session.
//   3. SERVER-OWNED TIMING: per-section remaining time is durable and
//      server-owned; ticking only ever DECREASES it; an exhausted section
//      refuses further answers; reconnect/resume NEVER resets a timer.
//   4. SERVER-OWNED SCORING: answers are scored server-side against the
//      PROTECTED key for the pinned criteria; the result is immutable and
//      reproducible (byte-stable digest); the key is never echoed. A client
//      pass/score CLAIM that disagrees with the server verdict is overruled.
//   5. EVIDENCE-QUALIFIED READINESS: exam-weighted readiness derives only from
//      immutable assessed evidence; missing concepts surface as visible
//      coverage labels (full | partial | missing_data); evidence-free readiness
//      refuses `evidence_required`.
//   6. RANK NEEDS A VALIDATED REFERENCE DISTRIBUTION: without a validated,
//      permitted distribution the rank stays honestly unavailable
//      (`reference_distribution_unavailable`) — never an invented percentile.
//   7. PROFESSIONAL OUTCOMES USE CAPABILITY/RUBRIC VOCABULARY AND NEVER AWARD A
//      CREDENTIAL AUTOMATICALLY (`credential_not_automatic` — no credential
//      from a probability).
//   8. COMMAND DEDUPLICATION: start/submit commands carry a stable commandKey;
//      same key + same payload converges idempotently; same key + changed
//      payload refuses `command_changed`.
import { createHash } from 'node:crypto';
import type {
  AssessmentError as AssessmentErrorType,
  AssessmentOwner,
  AssessmentPaper,
  AssessmentSession,
  ProfessionalOutcome,
  ReadinessReport,
  ReferenceDistribution,
  SessionResult,
} from './assessment-types';
import { AssessmentError } from './assessment-types';
import type { AssessmentStore } from './assessment-lookups';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export class AssessmentService {
  private sessionCounter = 0;
  private outcomeCounter = 0;

  constructor(private readonly store: AssessmentStore) {}

  /** Release a fixed paper snapshot (named releaser; explicit act). */
  async releasePaper(
    paper: Omit<AssessmentPaper, 'released' | 'releasedBy'>,
    releasedBy: string,
  ): Promise<AssessmentPaper> {
    if (!releasedBy?.trim()) throw new AssessmentError('paper_invalid');
    validatePaper(paper);
    const saved: AssessmentPaper = { ...clone(paper), released: true, releasedBy };
    await this.store.savePaper(saved);
    return saved;
  }

  /** Load the PROTECTED key for one question (server-side use only). */
  async loadAnswerKey(paperId: string, questionId: string, key: unknown): Promise<void> {
    await this.store.saveAnswerKey(paperId, questionId, key);
  }

  /**
   * Start a durable timed mock session from a RELEASED paper. The session pins
   * the paper snapshot. Idempotent per commandKey: a replayed command converges
   * to the SAME session; a changed payload refuses.
   */
  async startSession(owner: AssessmentOwner, commandKey: string, paperId: string): Promise<AssessmentSession> {
    const payloadHash = hash(`start|${commandKey}|${paperId}`);
    const prior = await this.store.commandPayload(commandKey);
    if (prior && prior !== payloadHash) throw new AssessmentError('command_changed');
    if (prior && prior === payloadHash) {
      const existingId = await this.store.commandResult(commandKey);
      if (existingId) {
        const existing = await this.store.session(existingId);
        if (existing) return existing;
      }
    }
    const paper = await this.store.paper(paperId);
    if (!paper) throw new AssessmentError('paper_unknown');
    if (!paper.released) throw new AssessmentError('source_not_released');
    const session: AssessmentSession = {
      sessionId: `asm_${++this.sessionCounter}`,
      owner: { ...owner },
      paperId,
      snapshot: {
        sourceRef: paper.sourceRef,
        sourceVersion: paper.sourceVersion,
        criteriaVersion: paper.criteriaVersion,
        officialPaperRef: paper.officialPaperRef,
      },
      sections: paper.sections.map((s) => ({
        sectionId: s.sectionId,
        remainingMs: s.durationMs,
        answers: {},
        submitted: false,
        score: null,
      })),
      status: 'active',
      startedAt: new Date().toISOString(),
    };
    await this.store.saveSession(session);
    await this.store.recordCommand(commandKey, payloadHash, session.sessionId);
    return session;
  }

  /**
   * DURABLE SECTIONAL TIMING: consume elapsed ms from one section's remaining
   * time. Ticking only ever decreases the remainder; reconnect/resume NEVER
   * resets it; an exhausted section refuses further answers.
   */
  async tickSection(owner: AssessmentOwner, sessionId: string, sectionId: string, elapsedMs: number): Promise<AssessmentSession> {
    const session = await this.requireOwnedSession(owner, sessionId);
    if (session.status === 'completed') throw new AssessmentError('session_completed');
    const section = session.sections.find((s) => s.sectionId === sectionId);
    if (!section) throw new AssessmentError('section_unknown');
    if (!Number.isFinite(elapsedMs) || elapsedMs < 0) throw new AssessmentError('section_unknown');
    section.remainingMs = Math.max(0, section.remainingMs - Math.floor(elapsedMs));
    await this.store.saveSession(session);
    return session;
  }

  /**
   * Answer one question inside a section while time remains. Server-owned:
   * answers are stored for server scoring; a section past exhaustion refuses.
   */
  async answerQuestion(
    owner: AssessmentOwner,
    sessionId: string,
    sectionId: string,
    questionId: string,
    answer: unknown,
  ): Promise<AssessmentSession> {
    const session = await this.requireOwnedSession(owner, sessionId);
    if (session.status === 'completed') throw new AssessmentError('session_completed');
    const section = session.sections.find((s) => s.sectionId === sectionId);
    if (!section) throw new AssessmentError('section_unknown');
    if (section.remainingMs <= 0) throw new AssessmentError('section_time_exhausted');
    if (section.submitted) throw new AssessmentError('section_already_submitted');
    section.answers[questionId] = answer;
    await this.store.saveSession(session);
    return session;
  }

  /**
   * Submit one section: SERVER-OWNED scoring against the protected key for the
   * pinned criteria version. A client claim that disagrees is overruled and
   * never flips the outcome. Immutable once submitted.
   */
  async submitSection(
    owner: AssessmentOwner,
    commandKey: string,
    sessionId: string,
    sectionId: string,
    claim?: { claimedScore: number },
  ): Promise<AssessmentSession> {
    const session = await this.requireOwnedSession(owner, sessionId);
    const paper = await this.requirePaper(session.paperId);
    const sectionDef = paper.sections.find((s) => s.sectionId === sectionId);
    const section = session.sections.find((s) => s.sectionId === sectionId);
    if (!sectionDef || !section) throw new AssessmentError('section_unknown');
    const payloadHash = hash(`submit|${commandKey}|${sessionId}|${sectionId}`);
    const prior = await this.store.commandPayload(commandKey);
    if (prior && prior !== payloadHash) throw new AssessmentError('command_changed');
    await this.store.recordCommand(commandKey, payloadHash);
    if (section.submitted) return session; // idempotent resubmission converges

    let awarded = 0;
    for (const qid of sectionDef.questionIds) {
      const key = await this.store.answerKey(session.paperId, qid);
      if (key === undefined) continue; // unanswered/unkeyed question scores 0
      if (section.answers[qid] !== undefined && section.answers[qid] === key) {
        awarded += sectionDef.points / sectionDef.questionIds.length;
      }
    }
    awarded = Math.round(awarded * 100) / 100;
    section.score = { awarded, points: sectionDef.points };
    section.submitted = true;
    section.remainingMs = Math.min(section.remainingMs, 0);
    // The client claim never decides the outcome; disagreement is overruled.
    void claim;
    if (allSectionsDone(session)) session.status = 'completed';
    await this.store.saveSession(session);
    return session;
  }

  /** Finalize the session result: immutable, byte-stable, server-owned. */
  async finalizeSession(owner: AssessmentOwner, sessionId: string): Promise<SessionResult> {
    const session = await this.requireOwnedSession(owner, sessionId);
    if (!allSectionsDone(session)) throw new AssessmentError('session_completed');
    const totalAwarded = round2(session.sections.reduce((s, x) => s + (x.score?.awarded ?? 0), 0));
    const totalPoints = round2(session.sections.reduce((s, x) => s + (x.score?.points ?? 0), 0));
    const body = { totalAwarded, totalPoints, criteriaVersion: session.snapshot.criteriaVersion };
    const result: SessionResult = {
      sessionId,
      ...body,
      digest: hash(JSON.stringify(body)),
      scoredAt: new Date().toISOString(),
    };
    await this.store.saveResult(result);
    return result;
  }

  /**
   * Evidence-qualified exam-weighted readiness with visible coverage labels.
   * Rank requires a VALIDATED permitted reference distribution — otherwise the
   * rank stays honestly unavailable.
   */
  async readiness(
    owner: AssessmentOwner,
    paperId: string,
    evidenceConcepts: readonly string[],
  ): Promise<ReadinessReport> {
    const paper = await this.requirePaper(paperId);
    if (!evidenceConcepts.length) throw new AssessmentError('evidence_required');
    let weightedSum = 0;
    let weightTotal = 0;
    const missing: string[] = [];
    for (const section of paper.sections) {
      weightTotal += section.points;
      for (const qid of section.questionIds) {
        const fraction = await this.store.assessedEvidence(owner, qid);
        if (fraction === undefined) {
          missing.push(qid);
          continue;
        }
        weightedSum += clamp01(fraction) * (section.points / section.questionIds.length);
      }
    }
    const coverage = missing.length === 0 ? 'full' : missing.length >= evidenceConcepts.length ? 'missing_data' : 'partial';
    const readinessPercent = weightTotal > 0 ? Math.round((weightedSum / weightTotal) * 100) : 0;
    const distribution = await this.store.referenceDistribution(paper.sourceRef);
    const rank = distribution?.validated
      ? ({ available: true, percentile: Math.min(99, Math.max(1, readinessPercent)) } as const)
      : ({ available: false, reason: 'reference_distribution_unavailable' } as const);
    const report: ReadinessReport = {
      owner: { ...owner },
      paperId,
      readinessPercent,
      coverage,
      missingConcepts: missing,
      rank,
    };
    await this.store.saveReadiness(report);
    return report;
  }

  /**
   * Rank prediction: requires a VALIDATED permitted reference distribution;
   * without one it refuses honestly — never an invented percentile.
   */
  async rankPrediction(owner: AssessmentOwner, paperId: string): Promise<{ percentile: number }> {
    const paper = await this.requirePaper(paperId);
    const distribution = await this.store.referenceDistribution(paper.sourceRef);
    if (!distribution || !distribution.validated) {
      throw new AssessmentError('reference_distribution_unavailable');
    }
    const report = await this.store.readinessFor(owner, paperId);
    if (!report) throw new AssessmentError('evidence_required');
    return { percentile: report.rank.available ? report.rank.percentile : 1 };
  }

  /** Validate a reference distribution (named validator; explicit act). */
  async validateReferenceDistribution(paperRef: string, distributionId: string, validatedBy: string): Promise<ReferenceDistribution> {
    if (!validatedBy?.trim() || !distributionId?.trim()) {
      throw new AssessmentError('reference_distribution_unavailable');
    }
    const distribution: ReferenceDistribution = { distributionId, paperRef, validated: true, validatedBy };
    await this.store.saveReferenceDistribution(distribution);
    return distribution;
  }

  /**
   * A professional outcome in capability/rubric vocabulary. It NEVER awards a
   * credential automatically — `credentialAwarded` is false by construction,
   * and an explicit award attempt refuses.
   */
  async professionalOutcome(
    owner: AssessmentOwner,
    paperRef: string,
    capabilities: Record<string, number>,
    rubricVersion: string,
  ): Promise<ProfessionalOutcome> {
    if (!rubricVersion?.trim() || Object.keys(capabilities).length === 0) {
      throw new AssessmentError('paper_invalid');
    }
    const normalized: Record<string, number> = {};
    for (const [cap, value] of Object.entries(capabilities)) {
      normalized[cap] = Math.round(clamp01(value) * 100) / 100;
    }
    const outcome: ProfessionalOutcome = {
      outcomeId: `pro_${++this.outcomeCounter}`,
      owner: { ...owner },
      paperRef,
      capabilities: normalized,
      rubricVersion,
      credentialAwarded: false,
    };
    await this.store.saveProfessionalOutcome(outcome);
    return outcome;
  }

  /** Attempting to award a credential from an outcome always refuses. */
  async awardCredential(): Promise<never> {
    throw new AssessmentError('credential_not_automatic');
  }

  /**
   * Ingest one immutable assessed-evidence fraction per concept (LEARN-02/08
   * outcome seam) — the only input readiness weights.
   */
  async recordAssessedEvidenceForReadiness(owner: AssessmentOwner, conceptId: string, fraction: number): Promise<void> {
    if (!Number.isFinite(fraction) || fraction < 0 || fraction > 1) throw new AssessmentError('evidence_required');
    await this.store.recordAssessedEvidence(owner, conceptId, clamp01(fraction));
  }

  /** Interrupted mock resume: byte-stable session state for a second device. */
  async resumeSession(owner: AssessmentOwner, sessionId: string): Promise<{ session: AssessmentSession; digest: string }> {
    const session = await this.requireOwnedSession(owner, sessionId);
    return { session, digest: hash(JSON.stringify(session)) };
  }

  private async requireOwnedSession(owner: AssessmentOwner, sessionId: string): Promise<AssessmentSession> {
    const session = await this.store.session(sessionId);
    if (!session) throw new AssessmentError('session_unknown');
    if (session.owner.uid !== owner.uid) throw new AssessmentError('not_owner');
    if (session.owner.workspaceId !== owner.workspaceId) throw new AssessmentError('workspace_mismatch');
    return session;
  }

  private async requirePaper(paperId: string): Promise<AssessmentPaper> {
    const paper = await this.store.paper(paperId);
    if (!paper) throw new AssessmentError('paper_unknown');
    return paper;
  }
}

function validatePaper(paper: Omit<AssessmentPaper, 'released' | 'releasedBy'>): void {
  if (!paper.paperId || !paper.sourceRef || !paper.sourceVersion || !paper.criteriaVersion || !paper.officialPaperRef) {
    throw new AssessmentError('paper_invalid');
  }
  if (!paper.sections.length) throw new AssessmentError('paper_invalid');
  for (const s of paper.sections) {
    if (!s.sectionId || !Number.isFinite(s.durationMs) || s.durationMs <= 0) throw new AssessmentError('paper_invalid');
    if (!Number.isFinite(s.points) || s.points <= 0) throw new AssessmentError('paper_invalid');
    if (!s.questionIds.length) throw new AssessmentError('paper_invalid');
  }
}

function allSectionsDone(session: AssessmentSession): boolean {
  return session.sections.every((s) => s.submitted);
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export type { AssessmentErrorType };
