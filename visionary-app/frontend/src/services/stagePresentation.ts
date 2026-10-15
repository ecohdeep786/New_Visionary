import type { RequestContext } from '../domain/workspace.ts';
import { workspaceIdentity } from './workspaceService.ts';

// Stage presentation seam (Part X presentation half): the platform adapts to the
// learner's stage — a class-3 child and a higher-education student use the same
// services and safety model, but never the same presentation. The tier is DERIVED
// from the stage profile that onboarding and the Part W transition engine maintain —
// never a toggle a user can flip, and never a claim about ability. When the stage is
// unknown, the platform presents the simplest form it can for the account's age band.
export type StageTier = 'foundational' | 'developing' | 'secondary' | 'higher';
export type LearningStage = 'primary' | 'secondary' | 'higher-secondary' | 'competitive' | 'vocational' | 'higher-education' | 'independent' | 'professional';
type StagePerson = { ageBand?: string; learningContext?: { classLevel?: string; stage?: string }; classLevel?: string; stage?: string };
export interface StagePresentation {
  tier: StageTier;
  /** How many Home modules a learner sees at this tier. */
  maxModules: number;
  /** Offer read-aloud first for emerging readers; never start audio or a microphone. */
  voiceFirst: boolean;
  /** Short, plain sentences in copy for emerging readers. */
  shortCopy: boolean;
  stage: LearningStage;
  abstraction: number;
  intensity: number;
  vocabularyLevel: 'concrete' | 'everyday' | 'subject' | 'technical';
  sessionMinutes: { minimum: number; maximum: number };
  checkFrequency: 'playful' | 'regular' | 'worked-example' | 'check-heavy' | 'applied' | 'save-points';
  representationOrder: string[];
  density: 'comfortable' | 'standard';
  motionTone: 'gentle' | 'minimal';
  illustrationTone: 'concrete' | 'neutral' | 'technical';
  safetyTier: 'child' | 'minor' | 'older-minor' | 'adult' | 'unknown';
  progressLanguage: 'can-explain' | 'recorded-readiness' | 'skill-evidence' | 'rubric';
  transitionRule: 'AUTO';
}
export function deriveStageTier(ctx: RequestContext): StageTier {
 const {person}=workspaceIdentity(ctx);
 return ctx.role==='student'?tierForPerson(person):'higher';
}
/** Pure per-person tier: accepts the full person record (learningContext) OR the flat
 * stage-profile shape returned by stageProfileByEmail, so authorized teacher views of
 * one enrolled learner compute the same tier the learner's own shell shows. */
function schoolLevel(person: StagePerson) {
 const view=person.learningContext||person;
 const match=String(view.classLevel||'').trim().match(/^(?:(?:class|grade)\s*)?(1[0-2]|[1-9])(?:st|nd|rd|th)?$/i);
 return match?Number(match[1]):null;
}
export function stageForPerson(person: StagePerson): LearningStage {
 const view = person.learningContext || person;
 if(view.stage==='higher_ed')return 'higher-education';
 if(view.stage==='professional')return 'professional';
 if(view.stage==='vocational')return 'vocational';
 if(view.stage==='competitive')return 'competitive';
 const level=schoolLevel(person);
 if(level!==null)return level<=5?'primary':level<=10?'secondary':'higher-secondary';
 return person.ageBand==='adult'?'independent':'primary';
}
export function tierForPerson(person: StagePerson): StageTier {
 const view = person.learningContext || person;
 if (['higher_ed','professional'].includes(view.stage||'')) return 'higher';
 if (view.stage==='vocational')return person.ageBand==='adult'?'higher':'secondary';
 const competitive = view.stage === 'competitive';
 const level = schoolLevel(person);
 if (level!==null) {
  if (level <= 5) return competitive ? 'secondary' : 'foundational';
  if (level <= 8) return competitive ? 'secondary' : 'developing';
  return 'secondary';
 }
 if (competitive) return person.ageBand === 'adult' ? 'higher' : 'secondary';
 return person.ageBand === 'adult' ? 'higher' : 'foundational';
}
export const tierLabels: Record<StageTier, string> = {
 foundational: 'Foundational · classes 1–5',
 developing: 'Developing · classes 6–8',
 secondary: 'Secondary · classes 9–12',
 higher: 'Higher education & professional',
};
export function getStagePresentation(ctx: RequestContext): StagePresentation {
 const {person}=workspaceIdentity(ctx);
 const tier = deriveStageTier(ctx);
 const stage=ctx.role==='professional'?'professional':ctx.role==='student'?stageForPerson(person):'independent';
 const profiles:Record<LearningStage,{abstraction:number;intensity:number;minutes:[number,number];vocabulary:StagePresentation['vocabularyLevel'];checks:StagePresentation['checkFrequency'];representations:string[];progress:StagePresentation['progressLanguage']}>= {
  primary:{abstraction:1,intensity:1,minutes:[5,8],vocabulary:'concrete',checks:'playful',representations:['picture','audio','story','text'],progress:'can-explain'},
  secondary:{abstraction:2,intensity:2,minutes:[8,12],vocabulary:'everyday',checks:'regular',representations:['diagram','simulation','text'],progress:'recorded-readiness'},
  'higher-secondary':{abstraction:3,intensity:3,minutes:[12,18],vocabulary:'subject',checks:'worked-example',representations:['worked-example','simulation','text'],progress:'recorded-readiness'},
  competitive:{abstraction:3,intensity:4,minutes:[12,18],vocabulary:'subject',checks:'check-heavy',representations:['worked-example','text','diagram'],progress:'recorded-readiness'},
  vocational:{abstraction:3,intensity:3,minutes:[12,18],vocabulary:'subject',checks:'applied',representations:['project','diagram','text'],progress:'skill-evidence'},
  'higher-education':{abstraction:4,intensity:5,minutes:[20,30],vocabulary:'technical',checks:'save-points',representations:['dataset','model','text'],progress:'rubric'},
  independent:{abstraction:3,intensity:3,minutes:[12,18],vocabulary:'everyday',checks:'regular',representations:['text','diagram','project'],progress:'recorded-readiness'},
  professional:{abstraction:3,intensity:3,minutes:[12,18],vocabulary:'technical',checks:'applied',representations:['project','text','diagram'],progress:'skill-evidence'},
 };
 const profile=profiles[stage];
 const level=schoolLevel(person);
 const safetyTier=person.ageBand==='adult'?'adult':person.ageBand==='minor'?stage==='primary'?'child':level!==null&&level>=11?'older-minor':'minor':'unknown';
 return {
  tier,
  maxModules: tier === 'foundational' ? 2 : tier === 'developing' ? 3 : 5,
  voiceFirst: tier === 'foundational' || tier === 'developing',
  shortCopy: tier !== 'higher',
  stage,abstraction:profile.abstraction,intensity:profile.intensity,
  vocabularyLevel:profile.vocabulary,sessionMinutes:{minimum:profile.minutes[0],maximum:profile.minutes[1]},
  checkFrequency:profile.checks,representationOrder:[...profile.representations],
  density:tier==='foundational'?'comfortable':'standard',motionTone:tier==='foundational'?'gentle':'minimal',
  illustrationTone:stage==='primary'?'concrete':['higher-education','professional'].includes(stage)?'technical':'neutral',
  safetyTier,progressLanguage:profile.progress,transitionRule:'AUTO',
 };
}
