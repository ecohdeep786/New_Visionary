import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as workspace from '../src/services/workspaceService.ts';
import { bootstrapPerson } from '../src/services/workspaceService.ts';
import { deriveStageTier, getStagePresentation, tierForPerson, stageForPerson } from '../src/services/stagePresentation.ts';
import { getHome } from '../src/services/homeService.ts';
import { configureTeachingInterface, getTeachingInterface } from '../src/services/teachingInterface.ts';

const memory = new Map();
globalThis.localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, String(value)), removeItem: key => memory.delete(key) };
globalThis.window = { dispatchEvent() {} };
globalThis.CustomEvent ??= class { constructor(type) { this.type = type; } };
const ctxFor = user => ({ personId: user.id, workspaceId: `${user.id}:student`, role: 'student', locale: 'en' });
const onboard = overrides => {
  const user = { id: 'tier-learner', email: 'tier@visionary.test', full_name: 'Tier Learner', identity: 'student', age_band: 'minor', onboarding_complete: true, ...overrides };
  workspace.bootstrapPerson(user);
  return ctxFor(user);
};
beforeEach(() => { memory.clear(); configureTeachingInterface(null); workspace.configureMock({ latency: 0, fault: 'none', now: () => new Date('2026-09-26T12:00:00Z') }); workspace.seedDemo('adult'); });

test('demo category labels retain their stage without inventing curricula or rolling back a later change', () => {
 for (const [id, expected] of [['exam','competitive'],['college','higher-education'],['professional','professional'],['employee','professional']]) {
  const person=workspace.seedDemo(id);
  assert.equal(stageForPerson(person),expected);
  assert.deepEqual(person.learningContext.subjects,[]);
 }
 const request={personId:'demo-exam',workspaceId:'demo-exam:student',role:'student',locale:'en'};
 workspace.updateStageProfile(request,{stage:'vocational'});
 assert.equal(stageForPerson(workspace.seedDemo('exam')),'vocational');
});

test('onboarding decides the stage tier: class 3 is foundational, 7 developing, 10 secondary', () => {
 assert.equal(deriveStageTier(onboard({ id: 'tier-class-3', board: 'CBSE', grade_level: 'Class 3', subjects: ['Mathematics'] })), 'foundational');
 assert.equal(deriveStageTier(onboard({ id: 'tier-class-7', board: 'CBSE', grade_level: 'Class 7', subjects: ['Mathematics'] })), 'developing');
 assert.equal(deriveStageTier(onboard({ id: 'tier-class-10', board: 'CBSE', grade_level: 'Class 10', subjects: ['Mathematics'] })), 'secondary');
});

test('adults and professionals get the full presentation; a minor without a recorded class gets the simplest', () => {
 assert.equal(deriveStageTier(onboard({ age_band: 'adult' })), 'higher');
 const proUser = { id: 'tier-pro', email: 'pro@visionary.test', full_name: 'Pro Learner', identity: 'professional', age_band: 'adult', onboarding_complete: true };
 workspace.bootstrapPerson(proUser);
 assert.equal(deriveStageTier({ personId: proUser.id, workspaceId: 'tier-pro:professional', role: 'professional', locale: 'en' }), 'higher');
 assert.equal(deriveStageTier(onboard({ id: 'tier-minor', age_band: 'minor' })), 'foundational');
});

test('the foundational Home is simplified: fewer modules, plain details, no jargon', async () => {
 const request = onboard({ board: 'CBSE', grade_level: 'Class 3', subjects: ['Mathematics'] });
 const home = await getHome(request);
 assert.ok(home.modules.length <= 2, 'fewer modules for the youngest tier');
 assert.match(home.priority.detail, /step by step/);
 assert.equal(home.setupNote, undefined, 'no jargon setup note for the youngest tier');
 const adultUser = { id: 'tier-adult', email: 'adult@visionary.test', full_name: 'Adult Learner', identity: 'student', age_band: 'adult', onboarding_complete: true };
 workspace.bootstrapPerson(adultUser);
 const full = await getHome({ personId: adultUser.id, workspaceId: `${adultUser.id}:student`, role: 'student', locale: 'en' });
 assert.notEqual(full.priority.detail, home.priority.detail, 'tiers present differently');
});

test('competitive exam is a student sub-category: a minor JEE aspirant never gets the foundational presentation', async () => {
 const request = onboard({ id: 'tier-jee', age_band: 'minor', education_stage: 'competitive', target_exam: 'JEE Advanced' });
 const profile = workspace.workspaceIdentity(request).person.learningContext;
 assert.equal(profile.stage, 'competitive', 'onboarding recorded the stage');
 assert.equal(profile.exam, 'JEE Advanced', 'onboarding recorded the exam target');
 assert.equal(deriveStageTier(request), 'secondary', 'the exam aspirant is never the foundational tier');
 assert.equal(tierForPerson(workspace.stageProfileByEmail('tier@visionary.test')), 'secondary', 'the teacher sees the same tier');
 const home = await getHome(request);
 assert.notEqual(home.setupNote, undefined, 'the standard student experience, not the simplified one');
});

test('higher education has the higher tier even when a school class value is still present', () => {
 const request = onboard({ id: 'tier-higher-ed', age_band: 'adult', education_stage: 'higher_ed', grade_level: 'Class 12' });
 assert.equal(deriveStageTier(request), 'higher');
 const adultExam = onboard({ id: 'tier-adult-exam', age_band: 'adult', education_stage: 'competitive', target_exam: 'UPSC' });
 assert.equal(deriveStageTier(adultExam), 'higher', 'an adult competitive learner without a school class is not demoted');
});

test('saved categories derive different presentation while age safety stays independent', () => {
 const cases=[
  ['school','Class 3','minor','primary','child',5,8],
  ['school','Grade 8','minor','secondary','minor',8,12],
  ['school','Class 12','minor','higher-secondary','older-minor',12,18],
  ['competitive','Class 3','minor','competitive','minor',12,18],
  ['vocational','Class 3','adult','vocational','adult',12,18],
  ['higher_ed','Class 3','minor','higher-education','minor',20,30],
  ['professional','Class 3','adult','professional','adult',12,18],
  [undefined,undefined,'adult','independent','adult',12,18],
  [undefined,undefined,'unknown','primary','unknown',5,8],
 ];
 cases.forEach(([stage,grade,age,expected,safety,min,max],index)=>{
  const ctx=onboard({id:`policy-${index}`,email:`policy-${index}@visionary.test`,education_stage:stage,grade_level:grade,age_band:age});
  if(stage==='professional'){ctx.role='professional';ctx.workspaceId=`policy-${index}:professional`;}
  const result=getStagePresentation(ctx);
  assert.equal(result.stage,expected);assert.equal(result.safetyTier,safety);
  assert.deepEqual(result.sessionMinutes,{minimum:min,maximum:max});
  assert.ok(result.maxModules<=5);assert.equal(result.transitionRule,'AUTO');
 });
 assert.equal(stageForPerson({ageBand:'adult',classLevel:'Diploma 2026'}),'independent');
 assert.equal(stageForPerson({ageBand:'adult',classLevel:'Classes 1–5'}),'independent');
});

test('a professional shell ignores stale school presentation and Home uses the saved subject', async () => {
 const user={id:'stale-pro',email:'stale@visionary.test',full_name:'Pro',identity:'professional',age_band:'adult',grade_level:'Class 3',onboarding_complete:true};
 bootstrapPerson(user);
 const presentation=getStagePresentation({personId:user.id,workspaceId:`${user.id}:professional`,role:'professional',locale:'en'});
 assert.equal(presentation.stage,'professional');assert.equal(presentation.tier,'higher');assert.equal(presentation.voiceFirst,false);
 const home=await getHome(onboard({grade_level:'Class 3',subjects:['Science']}));
 assert.match(home.priority.detail,/Science/);assert.doesNotMatch(home.priority.detail,/Mathematics/);
});

test('all teaching modes receive authorized stage policy instead of forged caller hints', async () => {
 const request=onboard({grade_level:'Class 3',subjects:['Science']});const calls=[];
 configureTeachingInterface({async request(mode,packet){calls.push({mode,packet:structuredClone(packet)});packet.stagePresentation.stage='professional';return {status:'ready',source:'adapter',text:'Authored test response',locale:'en',promptVersion:'test'};}});
 const api=getTeachingInterface(request);const packet={input:'Explain this idea',stagePresentation:{stage:'professional',safetyTier:'adult'}};
 for(const method of ['requestExplanation','requestPracticeQuestion','requestFeedback','requestProjectGuidance'])await api[method](packet);
 assert.equal(calls.length,4);
 for(const {packet:sent} of calls){assert.equal(sent.stagePresentation.stage,'primary');assert.equal(sent.stagePresentation.safetyTier,'child');assert.equal(sent.stagePresentation.sessionMinutes.maximum,8);assert.equal(sent.stagePresentation.personId,undefined);}
 assert.equal(packet.stagePresentation.stage,'professional');
});

test('unconnected teaching status follows the requested language without inventing answers', async () => {
 const request=onboard({age_band:'adult'});
 for(const language of ['en','hi','bn']){
  const reply=await getTeachingInterface(request).requestExplanation({input:'Explain this idea',language});
  assert.equal(reply.status,'not_connected');assert.equal(reply.locale,language);assert.equal(reply.question,undefined);assert.equal(reply.representations,undefined);
 }
});

test('an in-flight teaching response cannot cross a changed age or learning-stage boundary',async()=>{
 for(const change of ['age','stage']){
  const request=onboard({id:`late-${change}`,email:`late-${change}@visionary.test`,age_band:'adult',grade_level:'Class 3'});
  configureTeachingInterface({async request(){
   if(change==='age')workspace.setAgeBand(request.personId,'minor');
   else{const db=JSON.parse(memory.get('visionary_workspace_v2'));db.people.find(p=>p.id===request.personId).learningContext.classLevel='Class 12';memory.set('visionary_workspace_v2',JSON.stringify(db));}
   return {status:'ready',source:'adapter',text:'Old policy response',locale:'en',promptVersion:'test'};
  }});
  const saved=JSON.stringify(workspace.snapshot(request).conversations);
  await assert.rejects(getTeachingInterface(request).requestExplanation({input:'Explain this idea',audience:'adult'}),/stage or age profile changed/);
  assert.equal(JSON.stringify(workspace.snapshot(request).conversations),saved);
 }
});
