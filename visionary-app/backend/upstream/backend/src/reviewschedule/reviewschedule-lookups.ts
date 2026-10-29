// LEARN-11 (KAN-147) — the review-scheduling domain's typed state seams.
// The owning stores (baseline rules, assessed evidence, self-ratings,
// projections, preferences, command dedup) implement these at integration; the
// in-memory implementation is contract-true and fails closed.
import type {
  AssessedEvidence,
  BaselineRules,
  DueProjection,
  ReviewOwner,
  ReviewPreferences,
  SelfRating,
} from './reviewschedule-types';

export interface ReviewScheduleStore {
  saveRules(rules: BaselineRules): Promise<void>;
  rules(rulesId: string, version: number): Promise<BaselineRules | undefined>;
  /** Assessed evidence (LEARN-02 attempt outcome) for one concept. */
  saveAssessedEvidence(owner: ReviewOwner, conceptId: string, evidence: AssessedEvidence): Promise<void>;
  /** Latest assessed evidence per (owner, concept) — the only reschedule input. */
  latestAssessedEvidence(owner: ReviewOwner, conceptId: string): Promise<AssessedEvidence | undefined>;
  /** A separate self-rating — recorded, NEVER reschedules. */
  saveSelfRating(owner: ReviewOwner, conceptId: string, rating: SelfRating): Promise<void>;
  selfRatings(owner: ReviewOwner, conceptId: string): Promise<SelfRating[]>;
  /** Manual control: the latest postpone override for one concept (durable). */
  savePostpone(owner: ReviewOwner, conceptId: string, postponedTo: string): Promise<void>;
  latestPostpone(owner: ReviewOwner, conceptId: string): Promise<string | undefined>;
  saveProjection(projection: DueProjection): Promise<void>;
  projectionsFor(owner: ReviewOwner): Promise<DueProjection[]>;
  savePreferences(preferences: ReviewPreferences): Promise<void>;
  preferences(owner: ReviewOwner): Promise<ReviewPreferences | undefined>;
  /** Command dedup ledger: commandKey -> payloadHash (stable mutation identity). */
  commandPayload(commandKey: string): Promise<string | undefined>;
  recordCommand(commandKey: string, payloadHash: string): Promise<void>;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function ownerKey(owner: ReviewOwner, suffix: string): string {
  return `${owner.uid}|${owner.workspaceId}|${suffix}`;
}

/** Contract-true in-memory store; tests drive the full domain without a DB. */
export class InMemoryReviewScheduleStore implements ReviewScheduleStore {
  private rulesMap = new Map<string, BaselineRules>();
  private evidence = new Map<string, AssessedEvidence>();
  private selfRatingsMap = new Map<string, SelfRating[]>();
  private postpones = new Map<string, string>();
  private projections: DueProjection[] = [];
  private prefsMap = new Map<string, ReviewPreferences>();
  private commands = new Map<string, string>();

  async saveRules(rules: BaselineRules): Promise<void> {
    this.rulesMap.set(`${rules.rulesId}@${rules.version}`, clone(rules));
  }
  async rules(rulesId: string, version: number): Promise<BaselineRules | undefined> {
    const found = this.rulesMap.get(`${rulesId}@${version}`);
    return found ? clone(found) : undefined;
  }

  async saveAssessedEvidence(owner: ReviewOwner, conceptId: string, evidence: AssessedEvidence): Promise<void> {
    const key = `${ownerKey(owner, conceptId)}:${evidence.evidenceId}`;
    this.evidence.set(key, clone(evidence));
  }
  async latestAssessedEvidence(owner: ReviewOwner, conceptId: string): Promise<AssessedEvidence | undefined> {
    let latest: AssessedEvidence | undefined;
    const prefix = ownerKey(owner, conceptId);
    for (const [key, ev] of this.evidence.entries()) {
      if (key.startsWith(prefix) && ev.conceptId === conceptId) {
        if (!latest || ev.assessedAt > latest.assessedAt) latest = ev;
      }
    }
    return latest ? clone(latest) : undefined;
  }

  async saveSelfRating(owner: ReviewOwner, conceptId: string, rating: SelfRating): Promise<void> {
    const key = ownerKey(owner, conceptId);
    const list = this.selfRatingsMap.get(key) ?? [];
    list.push(clone(rating));
    this.selfRatingsMap.set(key, list);
  }
  async selfRatings(owner: ReviewOwner, conceptId: string): Promise<SelfRating[]> {
    const list = this.selfRatingsMap.get(ownerKey(owner, conceptId));
    return list ? clone(list) : [];
  }

  async savePostpone(owner: ReviewOwner, conceptId: string, postponedTo: string): Promise<void> {
    this.postpones.set(ownerKey(owner, conceptId), postponedTo);
  }
  async latestPostpone(owner: ReviewOwner, conceptId: string): Promise<string | undefined> {
    return this.postpones.get(ownerKey(owner, conceptId));
  }

  async saveProjection(projection: DueProjection): Promise<void> {
    this.projections.push(clone(projection));
  }
  async projectionsFor(owner: ReviewOwner): Promise<DueProjection[]> {
    return this.projections
      .filter((p) => p.owner.uid === owner.uid && p.owner.workspaceId === owner.workspaceId)
      .map((p) => clone(p));
  }

  async savePreferences(preferences: ReviewPreferences): Promise<void> {
    this.prefsMap.set(ownerKey(preferences.owner, 'prefs'), clone(preferences));
  }
  async preferences(owner: ReviewOwner): Promise<ReviewPreferences | undefined> {
    const found = this.prefsMap.get(ownerKey(owner, 'prefs'));
    return found ? clone(found) : undefined;
  }

  async commandPayload(commandKey: string): Promise<string | undefined> {
    return this.commands.get(commandKey);
  }
  async recordCommand(commandKey: string, payloadHash: string): Promise<void> {
    this.commands.set(commandKey, payloadHash);
  }
}
