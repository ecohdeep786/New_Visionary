const roles = ['student', 'professional', 'teacher', 'parent', 'organization'];
const shared = ['full_name', 'age_band', 'preferred_language', 'learning_language', 'medium'];
const lists = ['learning_goals', 'notifications', 'teacher_classes', 'teacher_subjects', 'teaching_goals', 'parent_track_goals', 'org_medium', 'org_classes', 'org_programs', 'subjects', 'reference_books'];
const branches = {
  education_stage: ['identity', ...shared],
  teacher_category: ['identity', ...shared],
  child_stage: ['identity', 'parent_relation', ...shared],
  org_type: ['identity', 'org_name', ...shared],
};
export function changeOnboardingRole(data, identity) {
  if (data.identity === identity) return data;
  return { ...Object.fromEntries(shared.filter(key => data[key] !== undefined).map(key => [key, data[key]])), identity,
    ...(identity === 'professional' ? { education_stage: 'professional' } : {}) };
}
export function changeOnboardingField(data, field, value) {
  if (branches[field] && data[field] !== value) {
    return { ...Object.fromEntries(branches[field].filter(key => data[key] !== undefined).map(key => [key, data[key]])), [field]: value };
  }
  return { ...data, [field]: value };
}
export function parseOnboardingDraft(raw) {
  try {
    if (!raw || raw.length > 20000) return null;
    const draft = JSON.parse(raw);
    if (!draft || !['identity', 'flow', 'review'].includes(draft.phase) || !draft.data || typeof draft.data !== 'object' || Array.isArray(draft.data)) return null;
    if (draft.phase !== 'identity' && !roles.includes(draft.data.identity)) return null;
    // Local drafts may be edited or belong to an older build. Only primitive,
    // string-list and shallow preference-map shapes used by the UI are resumed.
    if (Object.entries(draft.data).some(([key, value]) => {
      if (value === null) return false;
      if (lists.includes(key)) return !Array.isArray(value) || value.length > 50 || value.some(item => typeof item !== 'string');
      if (['study_routine', 'subject_confidence'].includes(key)) return typeof value !== 'object' || Array.isArray(value) || Object.values(value).some(item => !['string', 'number', 'boolean'].includes(typeof item));
      return typeof value !== 'string';
    })) return null;
    return { phase: draft.phase, data: draft.data, currentStepId: typeof draft.currentStepId === 'string' ? draft.currentStepId : null };
  } catch { return null; }
}
