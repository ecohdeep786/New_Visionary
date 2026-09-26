import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as workspace from '../src/services/workspaceService.ts';
import { bootstrapPerson } from '../src/services/workspaceService.ts';
import { deriveStageTier, getStagePresentation } from '../src/services/stagePresentation.ts';
import { getHome } from '../src/services/homeService.ts';

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
beforeEach(() => { memory.clear(); workspace.configureMock({ latency: 0, fault: 'none', now: () => new Date('2026-09-26T12:00:00Z') }); workspace.seedDemo('adult'); });

test('onboarding decides the stage tier: class 3 is foundational, 7 developing, 10 secondary', () => {
 assert.equal(deriveStageTier(onboard({ board: 'CBSE', grade_level: 'Class 3', subjects: ['Mathematics'] })), 'foundational');
 assert.equal(deriveStageTier(onboard({ board: 'CBSE', grade_level: 'Class 7', subjects: ['Mathematics'] })), 'developing');
 assert.equal(deriveStageTier(onboard({ board: 'CBSE', grade_level: 'Class 10', subjects: ['Mathematics'] })), 'secondary');
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
 const home = await getHome(request);
 assert.notEqual(home.setupNote, undefined, 'the standard student experience, not the simplified one');
});
