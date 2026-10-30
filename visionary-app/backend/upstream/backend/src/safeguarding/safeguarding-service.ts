// SAFE-01 (KAN-151) — safeguarding input/output checks, journey eligibility and
// truthful escalation. Checks run on a SEPARATE reviewed route with a configured
// contextual risk model seam; a score is never compliance, an alleged abuser is never
// auto-notified, and a guardian receives a truthful summary, never raw learner text.
import type {
  AgeGroup,
  EscalationRecord,
  JourneyType,
  RiskAssessment,
  SafeguardError as SafeguardErrorType,
  SafeguardOwner,
  RiskInput,
} from './safeguarding-types';
import { SafeguardError } from './safeguarding-types';
import type { SafeguardStore } from './safeguarding-lookups';

export class SafeguardRouteService {
  private recordCounter = 0;
  constructor(
    private readonly store: SafeguardStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Configure an approval for a journey × age group (recorded consent/admission). */
  async setEligibility(journeyType: JourneyType, ageGroup: AgeGroup, approved: boolean): Promise<void> {
    await this.store.setApproved(journeyType, ageGroup, approved);
  }

  /** Configure the reviewed escalation channel for truthful support/reporting. */
  async setEscalationChannel(channel: { channelId: string; contact: string; supportRoute: string }): Promise<void> {
    await this.store.setChannel(channel);
  }

  /** Eligibility gate: unsupported minor/adult journeys stay blocked until approved. */
  async checkEligibility(journeyType: JourneyType, ageGroup: AgeGroup): Promise<{ allowed: boolean; reason: string }> {
    const approved = await this.store.isApproved(journeyType, ageGroup);
    if (approved) return { allowed: true, reason: 'approved' };
    const unsupported = journeyType !== 'professional' && (ageGroup === 'child' || ageGroup === 'minor');
    return {
      allowed: false,
      reason: unsupported ? 'blocked_unsupported_minor' : 'blocked_consent_missing',
    };
  }

  /** INPUT check (separate route from teaching): assess learner input. */
  async checkInput(input: RiskInput): Promise<RiskAssessment> {
    const model = await this.store.riskModel();
    return model.assess(input);
  }

  /** OUTPUT check: assistant output is assessed before delivery, fail closed. */
  async checkOutput(input: RiskInput): Promise<RiskAssessment> {
    const assessment = await this.checkInput(input);
    if (assessment.riskLabel === 'critical') throw new SafeguardError('output_blocked');
    return assessment;
  }

  /**
   * Truthful escalation: route a CONCERN to the configured channel. The alleged
   * abuser is never auto-notified; a guardian receives only a truthful summary
   * with a support route (raw learner text is never included). The reporter
   * cannot be the alleged subject (otherwise the route would be self-serving).
   */
  async reportConcern(input: {
    reporter: SafeguardOwner;
    subjectUid: string;
    journeyType: JourneyType;
    ageGroup: AgeGroup;
    text: string;
    context: string;
    allegedAbuserUid?: string;
  }): Promise<EscalationRecord> {
    const eligibility = await this.checkEligibility(input.journeyType, input.ageGroup);
    if (!eligibility.allowed) throw new SafeguardError('journey_not_eligible');

    const assessment = await this.checkInput({
      text: input.text,
      context: input.context,
      journeyType: input.journeyType,
      ageGroup: input.ageGroup,
    });

    const channel = await this.store.escalationChannel();
    if (!channel) throw new SafeguardError('escalation_channel_unconfigured');
    if (input.allegedAbuserUid && input.allegedAbuserUid === input.subjectUid) {
      throw new SafeguardError('reporter_is_subject_alleged_abuser');
    }
    if (input.allegedAbuserUid && input.allegedAbuserUid === input.reporter.uid) {
      throw new SafeguardError('reporter_is_subject_alleged_abuser');
    }

    const record: EscalationRecord = {
      recordId: `sg_${++this.recordCounter}`,
      reporter: { ...input.reporter },
      subjectUid: input.subjectUid,
      journeyType: input.journeyType,
      ageGroup: input.ageGroup,
      riskLabel: assessment.riskLabel,
      score: assessment.score,
      confidence: assessment.confidence,
      flags: [...assessment.flags],
      channelId: channel.channelId,
      allegedAbuserNotified: false,
      guardianNotice: {
        summary: `A concern (${assessment.riskLabel} risk) was raised in the ${input.journeyType} journey. A reviewed specialist will follow up.`,
        supportRoute: channel.supportRoute,
        escalationContact: channel.contact,
        rawTextIncluded: false,
      },
      recordedAt: this.now().toISOString(),
    };
    await this.store.recordConcern(record);
    return record;
  }
}

export type { SafeguardErrorType };
