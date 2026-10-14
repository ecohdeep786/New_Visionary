import test from 'node:test';
import assert from 'node:assert/strict';
import { productSetupSteps, setupStepReady, setupPayload } from '../src/lib/productSetup.js';
import { changeOnboardingField } from '../src/lib/onboardingDraft.js';

test('entry stays short for every role and school needs its source context', () => {
  for (const identity of ['student', 'professional', 'teacher', 'parent', 'organization']) assert.ok(productSetupSteps({ identity }).length + 2 <= 5);
  assert.equal(setupStepReady({id:'context'}, {education_stage:'school',board:'State',grade_level:'Class 12'}), false);
  assert.equal(setupStepReady({id:'context'}, {education_stage:'school',board:'State',state:'West Bengal',grade_level:'Class 12'}), true);
  assert.equal(setupStepReady({id:'context'}, {education_stage:'competitive'}), false);
});
test('guardian admission is checked before preferences and optional goals never block entry', () => {
  assert.equal(setupStepReady({id:'about'}, {full_name:'Learner',age_band:'minor',identity:'student'}, true), false);
  assert.equal(setupStepReady({id:'about'}, {full_name:'Adult',age_band:'adult',identity:'student'}, true), true);
  for (const identity of ['professional','parent']) assert.equal(setupStepReady({id:'preferences'}, {identity}), true);
  assert.equal(setupStepReady({id:'context'}, {education_stage:'higher_ed'}), true);
});
test('language projection uses the declared preference without fabricating goals or child relationships', () => {
  const parent = setupPayload({identity:'parent',preferred_language:'Hindi'});
  assert.equal(parent.medium, 'Hindi'); assert.equal(parent.child_stage, undefined); assert.equal(parent.parent_relation, undefined);
  const professional = setupPayload({identity:'professional'});
  assert.equal(professional.education_stage, 'professional'); assert.equal(professional.career_goal, undefined);
});
test('organization category changes keep its name while discarding obsolete program answers', () => {
  const changed = changeOnboardingField({identity:'organization',full_name:'Adult',org_name:'Example',org_type:'school',org_board:'CBSE',org_classes:['Class 1']}, 'org_type', 'training');
  assert.equal(changed.org_name, 'Example'); assert.equal(changed.org_board, undefined); assert.equal(changed.org_classes, undefined);
});
