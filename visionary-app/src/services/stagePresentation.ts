import type { RequestContext } from '../domain/workspace.ts';
import { workspaceIdentity } from './workspaceService.ts';

// Stage presentation seam (Part X presentation half): the platform adapts to the
// learner's stage — a class-3 child and a higher-education student use the same
// services and safety model, but never the same presentation. The tier is DERIVED
// from the stage profile that onboarding and the Part W transition engine maintain —
// never a toggle a user can flip, and never a claim about ability. When the stage is
// unknown, the platform presents the simplest form it can for the account's age band.
export type StageTier = 'foundational' | 'developing' | 'secondary' | 'higher';
export interface StagePresentation {
  tier: StageTier;
  /** How many Home modules a learner sees at this tier. */
  maxModules: number;
  /** The youngest tier speaks before it types — the always-on AGI is the primary interface. */
  voiceFirst: boolean;
  /** Short, plain sentences in copy for emerging readers. */
  shortCopy: boolean;
}
export function deriveStageTier(ctx: RequestContext): StageTier {
 return tierForPerson(workspaceIdentity(ctx).person);
}
/** Pure per-person tier: works for the signed-in learner AND for authorized teacher
 * views of one enrolled learner (Gate 5 ownership applies in the caller). */
export function tierForPerson(person: { ageBand?: string; learningContext?: { classLevel?: string; stage?: string; exam?: string } }): StageTier {
 // Competitive-exam preparation (JEE/NEET/UPSC/CAT) is its own student sub-category:
 // the work is advanced regardless of age, so the presentation is never foundational.
 if (person.learningContext?.stage === 'competitive' || person.learningContext?.exam) return 'secondary';
 const level = Number(String(person.learningContext?.classLevel || '').replace(/\D/g, ''));
 if (person.learningContext?.classLevel && Number.isFinite(level) && level >= 1) {
  if (level <= 5) return 'foundational';
  if (level <= 8) return 'developing';
  return 'secondary';
 }
 return person.ageBand === 'minor' ? 'foundational' : 'higher';
}
export const tierLabels: Record<StageTier, string> = {
 foundational: 'Foundational · classes 1–5',
 developing: 'Developing · classes 6–8',
 secondary: 'Secondary · classes 9–12',
 higher: 'Higher education & professional',
};
export function getStagePresentation(ctx: RequestContext): StagePresentation {
 const tier = deriveStageTier(ctx);
 return {
  tier,
  maxModules: tier === 'foundational' ? 2 : tier === 'developing' ? 3 : 5,
  voiceFirst: tier === 'foundational' || tier === 'developing',
  shortCopy: tier !== 'higher',
 };
}
