import test from 'node:test';
import assert from 'node:assert/strict';
import { changeOnboardingField, changeOnboardingRole, parseOnboardingDraft } from '../src/lib/onboardingDraft.js';

test('changing roles keeps personal basics without stale organization or child answers', () => {
  assert.deepEqual(changeOnboardingRole({ identity: 'organization', full_name: 'Adult', age_band: 'adult', org_name: 'Old', child_name: 'Old child', preferred_language: 'Hindi' }, 'professional'),
    { identity: 'professional', full_name: 'Adult', age_band: 'adult', preferred_language: 'Hindi', education_stage: 'professional' });
});
test('changing a stage resets branch answers but preserves identity and personal preferences', () => {
  assert.deepEqual(changeOnboardingField({ identity: 'student', full_name: 'Adult', education_stage: 'school', board: 'CBSE', grade_level: 'Class 12', subjects: ['Physics'], medium: 'English' }, 'education_stage', 'higher_ed'),
    { identity: 'student', full_name: 'Adult', medium: 'English', education_stage: 'higher_ed' });
});
test('draft resume rejects invalid phase, role and collection shapes', () => {
  for (const draft of [{ phase: 'agi-intro', data: {} }, { phase: 'review', data: { identity: 'admin' } }, { phase: 'flow', data: [] }, { phase: 'flow', data: { identity: 'student', subjects: [7] } }]) assert.equal(parseOnboardingDraft(JSON.stringify(draft)), null);
  assert.equal(parseOnboardingDraft('{'), null);
  const draft = { phase: 'flow', data: { identity: 'student', subjects: ['Physics'], study_routine: { time: 'evening', days: 'daily' } }, currentStepId: 'goals' };
  assert.deepEqual(parseOnboardingDraft(JSON.stringify(draft)), draft);
});
