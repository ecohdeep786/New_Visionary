// LEARN-12 (KAN-148) — the timed-assessment domain's typed state seams.
// The owning stores (papers, sessions, protected keys, reference distributions,
// assessed-evidence readiness inputs) implement these at integration; the
// in-memory implementation is contract-true and fails closed.
import type {
  AssessmentPaper,
  AssessmentSession,
  AssessmentOwner,
  ProfessionalOutcome,
  ReadinessReport,
  ReferenceDistribution,
  SessionResult,
} from './assessment-types';

export interface AssessmentStore {
  savePaper(paper: AssessmentPaper): Promise<void>;
  paper(paperId: string): Promise<AssessmentPaper | undefined>;
  /** PROTECTED per-question answer key — server-side only, never echoed. */
  saveAnswerKey(paperId: string, questionId: string, key: unknown): Promise<void>;
  answerKey(paperId: string, questionId: string): Promise<unknown | undefined>;
  saveSession(session: AssessmentSession): Promise<void>;
  session(sessionId: string): Promise<AssessmentSession | undefined>;
  saveResult(result: SessionResult): Promise<void>;
  result(sessionId: string): Promise<SessionResult | undefined>;
  saveReferenceDistribution(distribution: ReferenceDistribution): Promise<void>;
  referenceDistribution(paperRef: string): Promise<ReferenceDistribution | undefined>;
  saveReadiness(report: ReadinessReport): Promise<void>;
  readinessFor(owner: AssessmentOwner, paperId: string): Promise<ReadinessReport | undefined>;
  saveProfessionalOutcome(outcome: ProfessionalOutcome): Promise<void>;
  /** Immutable assessed evidence per concept (readiness input). */
  recordAssessedEvidence(owner: AssessmentOwner, conceptId: string, fraction: number): Promise<void>;
  assessedEvidence(owner: AssessmentOwner, conceptId: string): Promise<number | undefined>;
  commandPayload(commandKey: string): Promise<string | undefined>;
  recordCommand(commandKey: string, payloadHash: string, resultRef?: string): Promise<void>;
  commandResult(commandKey: string): Promise<string | undefined>;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function ownerKey(owner: AssessmentOwner, suffix: string): string {
  return `${owner.uid}|${owner.workspaceId}|${suffix}`;
}

/** Contract-true in-memory store; tests drive the full domain without a DB. */
export class InMemoryAssessmentStore implements AssessmentStore {
  private papers = new Map<string, AssessmentPaper>();
  private keys = new Map<string, unknown>();
  private sessions = new Map<string, AssessmentSession>();
  private results = new Map<string, SessionResult>();
  private distributions = new Map<string, ReferenceDistribution>();
  private readinessReports = new Map<string, ReadinessReport>();
  private professionalOutcomes: ProfessionalOutcome[] = [];
  private evidence = new Map<string, number>();
  private commands = new Map<string, { hash: string; resultRef?: string }>();

  async savePaper(paper: AssessmentPaper): Promise<void> {
    this.papers.set(paper.paperId, clone(paper));
  }
  async paper(paperId: string): Promise<AssessmentPaper | undefined> {
    const found = this.papers.get(paperId);
    return found ? clone(found) : undefined;
  }
  async saveAnswerKey(paperId: string, questionId: string, key: unknown): Promise<void> {
    this.keys.set(`${paperId}|${questionId}`, key);
  }
  async answerKey(paperId: string, questionId: string): Promise<unknown | undefined> {
    const found = this.keys.get(`${paperId}|${questionId}`);
    return found !== undefined ? found : undefined;
  }
  async saveSession(session: AssessmentSession): Promise<void> {
    this.sessions.set(session.sessionId, clone(session));
  }
  async session(sessionId: string): Promise<AssessmentSession | undefined> {
    const found = this.sessions.get(sessionId);
    return found ? clone(found) : undefined;
  }
  async saveResult(result: SessionResult): Promise<void> {
    this.results.set(result.sessionId, clone(result));
  }
  async result(sessionId: string): Promise<SessionResult | undefined> {
    const found = this.results.get(sessionId);
    return found ? clone(found) : undefined;
  }
  async saveReferenceDistribution(distribution: ReferenceDistribution): Promise<void> {
    this.distributions.set(distribution.paperRef, clone(distribution));
  }
  async referenceDistribution(paperRef: string): Promise<ReferenceDistribution | undefined> {
    const found = this.distributions.get(paperRef);
    return found ? clone(found) : undefined;
  }
  async saveReadiness(report: ReadinessReport): Promise<void> {
    this.readinessReports.set(ownerKey(report.owner, report.paperId), clone(report));
  }
  async readinessFor(owner: AssessmentOwner, paperId: string): Promise<ReadinessReport | undefined> {
    const found = this.readinessReports.get(ownerKey(owner, paperId));
    return found ? clone(found) : undefined;
  }
  async saveProfessionalOutcome(outcome: ProfessionalOutcome): Promise<void> {
    this.professionalOutcomes.push(clone(outcome));
  }
  async recordAssessedEvidence(owner: AssessmentOwner, conceptId: string, fraction: number): Promise<void> {
    this.evidence.set(ownerKey(owner, conceptId), fraction);
  }
  async assessedEvidence(owner: AssessmentOwner, conceptId: string): Promise<number | undefined> {
    const found = this.evidence.get(ownerKey(owner, conceptId));
    return found !== undefined ? found : undefined;
  }
  async commandPayload(commandKey: string): Promise<string | undefined> {
    return this.commands.get(commandKey)?.hash;
  }
  async recordCommand(commandKey: string, payloadHash: string, resultRef?: string): Promise<void> {
    const prior = this.commands.get(commandKey);
    this.commands.set(commandKey, { hash: payloadHash, resultRef: resultRef ?? prior?.resultRef });
  }
  async commandResult(commandKey: string): Promise<string | undefined> {
    return this.commands.get(commandKey)?.resultRef;
  }
}
