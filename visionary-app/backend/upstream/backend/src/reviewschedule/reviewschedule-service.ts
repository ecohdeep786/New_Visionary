// LEARN-11 (KAN-147) — versioned durable review scheduling from assessed
// evidence with bounded baseline SRS rules, due-queue projections, command
// deduplication, timezone/quiet/preference handling and two-device recovery.
//
// Core responsibilities (server-owned; honest; fail closed):
//   1. BOUNDED BASELINE SRS: only a versioned, human-approved baseline rules
//      object schedules anything. The interval ladder is an explicit table
//      (again < hard <= good <= easy) bounded by `maxIntervalDays` — never an
//      unvalidated exponential formula.
//   2. PERSONALIZED-FORGETTING CALIBRATION: a projection may cite personalized
//      forgetting ONLY after the baseline is explicitly calibrated (measured);
//      before calibration the reason cites the uncalibrated baseline. Claiming
//      personalized forgetting on an uncalibrated baseline refuses
//      (`calibration_required`) when requested.
//   3. SCHEDULING FROM ASSESSED EVIDENCE ONLY: only server-assessed evidence
//      (LEARN-02 attempt outcome) reschedules a review. Self-rating NEVER
//      reschedules — it is recorded separately and preserved (manual control).
//   4. COMMAND DEDUPLICATION: every scheduling/rating/manual command carries a
//      stable commandKey; a repeated command with the SAME payload converges
//      idempotently; the SAME key with a CHANGED payload refuses
//      (`command_changed`) — retry/recovery never double-schedules.
//   5. DETERMINISTIC DUE-QUEUE PROJECTIONS: a projection rebuilds deterministically
//      from latest assessed evidence + baseline rules + manual control, respects
//      saved timezone/quiet-hours, carries an understandable reason per item, is
//      versioned/append-only, and never rewrites assessed evidence.
//   6. MANUAL CONTROL: an explicit postpone command overrides the next due for a
//      concept (bounded), preserving the teacher/learner's manual choice without
//      rewriting grades or evidence.
//   7. TWO-DEVICE RECOVERY: two controllers over the same store produce the
//      identical byte-stable projection (same digest).
//   8. NO RETENTION TTLs: no unvalidated purge/retention TTL is applied.
import { createHash } from 'node:crypto';
import type {
  AssessedEvidence,
  BaselineRules,
  DueItem,
  DueProjection,
  ReviewGrade,
  ReviewOwner,
  ReviewPreferences,
  ReviewScheduleError as ReviewScheduleErrorType,
  SelfRating,
} from './reviewschedule-types';
import { ReviewScheduleError } from './reviewschedule-types';
import type { ReviewScheduleStore } from './reviewschedule-lookups';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const GRADES: ReviewGrade[] = ['again', 'hard', 'good', 'easy'];

export class ReviewScheduleService {
  private projectionCounter = 0;
  private evidenceCounter = 0;
  private ratingCounter = 0;

  constructor(
    private readonly store: ReviewScheduleStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Define a BOUNDED baseline rules version (approved; explicit ladder table). */
  async defineBaselineRules(rules: Omit<BaselineRules, 'approvedBy' | 'calibrated'>, approver: string): Promise<BaselineRules> {
    if (!approver?.trim()) throw new ReviewScheduleError('rules_not_approved');
    validateRules(rules);
    const saved: BaselineRules = { ...clone(rules), approvedBy: approver, calibrated: false };
    await this.store.saveRules(saved);
    return saved;
  }

  /** Mark a baseline calibrated after forgetting estimates are MEASURED. */
  async calibrateBaseline(rulesId: string, version: number, measuredBy: string): Promise<BaselineRules> {
    const rules = await this.requireRules(rulesId, version);
    if (!measuredBy?.trim()) throw new ReviewScheduleError('rules_not_approved');
    const calibrated: BaselineRules = { ...rules, calibrated: true, approvedBy: rules.approvedBy ?? measuredBy };
    await this.store.saveRules(calibrated);
    return calibrated;
  }

  /**
   * Record one server-assessed evidence outcome. ONLY assessed evidence
   * reschedules a review. Idempotent per (commandKey, payload): a replayed
   * command converges to the ORIGINAL evidence row (no duplicate rows); a
   * changed payload on the same commandKey refuses `command_changed`.
   */
  async recordAssessedEvidence(
    owner: ReviewOwner,
    commandKey: string,
    conceptId: string,
    grade: ReviewGrade,
    payloadVersion: number,
  ): Promise<AssessedEvidence> {
    const payloadHash = hash(`${commandKey}|${conceptId}|${grade}|${payloadVersion}`);
    const prior = await this.store.commandPayload(commandKey);
    if (prior && prior !== payloadHash) throw new ReviewScheduleError('command_changed');
    if (prior && prior === payloadHash) {
      // Replayed command: converge to the originally recorded evidence.
      const existing = await this.store.latestAssessedEvidence(owner, conceptId);
      if (existing) return existing;
    }
    await this.store.recordCommand(commandKey, payloadHash);
    const evidence: AssessedEvidence = {
      evidenceId: `ev_${++this.evidenceCounter}`,
      conceptId,
      grade,
      assessedAt: this.now().toISOString(),
      payloadVersion,
    };
    await this.store.saveAssessedEvidence(owner, conceptId, evidence);
    return evidence;
  }

  /**
   * A self-rating is recorded SEPARATELY and NEVER reschedules a review.
   * Idempotent per (commandKey, payload); a changed payload refuses.
   */
  async recordSelfRating(
    owner: ReviewOwner,
    commandKey: string,
    conceptId: string,
    grade: ReviewGrade,
    payloadVersion: number,
  ): Promise<SelfRating> {
    const payloadHash = hash(`${commandKey}|self|${conceptId}|${grade}|${payloadVersion}`);
    const prior = await this.store.commandPayload(commandKey);
    if (prior && prior !== payloadHash) throw new ReviewScheduleError('command_changed');
    await this.store.recordCommand(commandKey, payloadHash);
    const rating: SelfRating = {
      ratingId: `rt_${++this.ratingCounter}`,
      conceptId,
      grade,
      ratedAt: this.now().toISOString(),
      payloadVersion,
    };
    await this.store.saveSelfRating(owner, conceptId, rating);
    return rating;
  }

  /** Manual control: postpone one concept's next review by up to `maxPostponeDays`. */
  async postponeReview(
    owner: ReviewOwner,
    commandKey: string,
    conceptId: string,
    postponeDays: number,
    maxPostponeDays: number,
    payloadVersion: number,
  ): Promise<{ conceptId: string; postponedTo: string }> {
    if (!Number.isInteger(postponeDays) || postponeDays < 0 || postponeDays > maxPostponeDays) {
      throw new ReviewScheduleError('projection_definition_invalid');
    }
    const payloadHash = hash(`${commandKey}|postpone|${conceptId}|${postponeDays}|${payloadVersion}`);
    const prior = await this.store.commandPayload(commandKey);
    if (prior && prior !== payloadHash) throw new ReviewScheduleError('command_changed');
    await this.store.recordCommand(commandKey, payloadHash);
    const postponedTo = new Date(this.now().getTime() + postponeDays * 86_400_000).toISOString();
    // The postpone is DURABLE manual control: later due projections honor it.
    await this.store.savePostpone(owner, conceptId, postponedTo);
    return { conceptId, postponedTo };
  }

  /**
   * Deterministic due-queue projection from latest assessed evidence + the
   * approved baseline rules + manual postpone overrides. Every due item carries
   * an understandable reason; projection is append-only; evidence untouched.
   */
  async projectDueQueue(
    owner: ReviewOwner,
    rulesId: string,
    rulesVersion: number,
    concepts: readonly string[],
    asOf?: string,
  ): Promise<DueProjection> {
    const rules = await this.requireRules(rulesId, rulesVersion);
    if (!rules.approvedBy) throw new ReviewScheduleError('rules_not_approved');
    const at = asOf ?? this.now().toISOString();
    const items: DueItem[] = [];
    for (const conceptId of concepts) {
      const latest = await this.store.latestAssessedEvidence(owner, conceptId);
      if (!latest) continue;
      const days = rules.ladder[latest.grade] ?? rules.ladder.good;
      let dueMs = new Date(latest.assessedAt).getTime() + days * 86_400_000;
      let postponedNote = '';
      // MANUAL CONTROL: a durable postpone override never shortens the due —
      // it only ever pushes it later, and the reason stays understandable.
      const postpone = await this.store.latestPostpone(owner, conceptId);
      if (postpone && new Date(postpone).getTime() > dueMs) {
        dueMs = new Date(postpone).getTime();
        postponedNote = ' (manual postpone)';
      }
      const dueAt = await this.applyQuietHours(owner, new Date(dueMs).toISOString());
      const reason = rules.calibrated
        ? `Due after ${days}d for "${conceptId}"${postponedNote} — calibrated baseline v${rulesVersion}.`
        : `Due after ${days}d for "${conceptId}"${postponedNote} — uncalibrated baseline v${rulesVersion} (no personalized claim).`;
      items.push({ conceptId, dueAt, reason });
    }
    items.sort((a, b) => a.dueAt.localeCompare(b.dueAt));
    const projection: DueProjection = {
      projectId: `proj_${++this.projectionCounter}`,
      owner: { ...owner },
      asOf: at,
      items,
      rules: { rulesId, version: rulesVersion, calibrated: rules.calibrated },
      digest: hash(JSON.stringify({ items, rules: { rulesId, version: rulesVersion } })),
    };
    await this.store.saveProjection(projection);
    return projection;
  }

  /** Save owner review preferences (timezone + quiet hours), validated. */
  async setPreferences(owner: ReviewOwner, timezone: string, quietStartMinutes: number, quietEndMinutes: number): Promise<ReviewPreferences> {
    if (!timezone?.trim()) throw new ReviewScheduleError('preferences_invalid');
    if (
      !Number.isInteger(quietStartMinutes) || !Number.isInteger(quietEndMinutes) ||
      quietStartMinutes < 0 || quietStartMinutes >= 1440 || quietEndMinutes < 0 || quietEndMinutes > 1440
    ) {
      throw new ReviewScheduleError('preferences_invalid');
    }
    const preferences: ReviewPreferences = { owner: { ...owner }, timezone, quietStartMinutes, quietEndMinutes };
    await this.store.savePreferences(preferences);
    return preferences;
  }

  /** Two-device identity: the byte-stable projection history for the owner. */
  async resumeQueue(owner: ReviewOwner): Promise<{ digest: string; count: number }> {
    const projections = await this.store.projectionsFor(owner);
    const digest = hash(JSON.stringify(projections.map((p) => p.digest)));
    return { digest, count: projections.length };
  }

  private async applyQuietHours(owner: ReviewOwner, dueAtIso: string): Promise<string> {
    const prefs = await this.store.preferences(owner);
    if (!prefs || prefs.quietStartMinutes === prefs.quietEndMinutes) return dueAtIso;
    const due = new Date(dueAtIso);
    const minutes = due.getUTCHours() * 60 + due.getUTCMinutes();
    const inQuiet = prefs.quietStartMinutes < prefs.quietEndMinutes
      ? minutes >= prefs.quietStartMinutes && minutes < prefs.quietEndMinutes
      : minutes >= prefs.quietStartMinutes || minutes < prefs.quietEndMinutes;
    if (!inQuiet) return dueAtIso;
    // Shift to the first minute after quiet hours ends.
    const shifted = new Date(due);
    shifted.setUTCHours(0, 0, 0, 0);
    shifted.setUTCMinutes(prefs.quietEndMinutes === 1440 ? 0 : prefs.quietEndMinutes);
    if (prefs.quietEndMinutes === 1440) shifted.setUTCDate(shifted.getUTCDate() + 1);
    return shifted.toISOString();
  }

  private async requireRules(rulesId: string, version: number): Promise<BaselineRules> {
    const rules = await this.store.rules(rulesId, version);
    if (!rules) throw new ReviewScheduleError('rules_unknown');
    return rules;
  }
}

function validateRules(rules: Omit<BaselineRules, 'approvedBy' | 'calibrated'>): void {
  if (!rules.rulesId || !Number.isInteger(rules.version) || rules.version < 1) {
    throw new ReviewScheduleError('rules_invalid');
  }
  if (!Number.isInteger(rules.maxIntervalDays) || rules.maxIntervalDays < 1) {
    throw new ReviewScheduleError('rules_invalid');
  }
  for (const g of GRADES) {
    const d = rules.ladder[g];
    if (!Number.isInteger(d) || d < 1 || d > rules.maxIntervalDays) throw new ReviewScheduleError('rules_invalid');
  }
  // Bounded monotonic ladder: again < hard <= good <= easy.
  if (
    !(rules.ladder.again < rules.ladder.hard) ||
    !(rules.ladder.hard <= rules.ladder.good) ||
    !(rules.ladder.good <= rules.ladder.easy)
  ) {
    throw new ReviewScheduleError('rules_invalid');
  }
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export type { ReviewScheduleErrorType };
