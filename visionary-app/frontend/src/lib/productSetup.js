export const setupRoles = { student: 'Learner', professional: 'Professional', teacher: 'Teacher', parent: 'Parent or guardian', organization: 'Organization' };
export function productSetupSteps(data) {
  const about = { id: 'about', title: 'A little about you', subtitle: 'Your name personalizes Visionary. Your age range helps us apply the right account protections.', illustration: 'handshake' };
  const preferences = { id: 'preferences', title: 'Make Visionary work for you', subtitle: 'Start with the essentials. You can add more details as you use Visionary.', illustration: { professional: 'briefcase', teacher: 'teacher', parent: 'parent', organization: 'team' }[data.identity] || 'compass' };
  if (data.identity !== 'student') return [about, { ...preferences, optional: ['professional', 'parent'].includes(data.identity) }];
  return [about,
    { id: 'focus', title: 'What are you learning?', subtitle: 'Choose the starting point that fits you. Learning language and content availability are separate.', illustration: 'learn' },
    { id: 'context', title: { school: 'Choose your school context', higher_ed: 'What would you like to study?', competitive: 'Which exam are you preparing for?', professional: 'What would you like to explore?' }[data.education_stage] || 'Choose a starting point', subtitle: ['higher_ed', 'professional'].includes(data.education_stage) ? 'Add a course or interest if you have one in mind. You can also choose later.' : 'These details help you find relevant material. They do not connect you to an institution.', illustration: 'growth', optional: ['higher_ed', 'professional'].includes(data.education_stage) }];
}
export function setupStepReady(step, data, live = false) {
  const text = (key, maximum = 2000) => typeof data[key] === 'string' && !!data[key].trim() && data[key].trim().length <= maximum;
  if (step.id === 'about') return text('full_name', 80) && ['adult', 'minor'].includes(data.age_band) && (!live || data.age_band === 'adult') && (data.identity === 'student' || data.age_band === 'adult');
  if (step.id === 'focus') return ['school', 'higher_ed', 'competitive', 'professional'].includes(data.education_stage);
  if (step.id === 'context') {
    if (data.education_stage === 'school') return text('board') && text('grade_level') && (data.board !== 'State' || text('state'));
    if (data.education_stage === 'competitive') return text('target_exam');
    return true;
  }
  if (step.id === 'preferences') {
    if (data.identity === 'teacher') return ['school', 'higher_ed', 'university', 'coaching', 'independent'].includes(data.teacher_category);
    if (data.identity === 'organization') return ['school', 'college', 'university', 'coaching', 'training'].includes(data.org_type) && text('org_name', 120);
    return ['professional', 'parent'].includes(data.identity);
  }
  return false;
}
export function setupPayload(data) {
  const language = data.preferred_language || data.medium || 'English';
  return { ...data, preferred_language: language,
    ...(['teacher', 'parent'].includes(data.identity) || data.identity === 'student' && data.education_stage === 'school' ? { medium: language } : {}),
    ...(data.identity === 'professional' ? { education_stage: 'professional' } : {}) };
}
