import { BadRequestException, ForbiddenException } from '@nestjs/common';

// Preferences are user statements, never proof of organization membership or guardian consent.
const fields = new Set(`full_name identity age_band education_stage institution_type institution_name degree_program department semester preferred_language learning_language career_goal learning_goals notifications target_exam attempt_year prep_stage daily_hours coaching_enrolled teacher_category board state medium teacher_classes teacher_institution teacher_course_level teacher_exam teacher_subjects experience teacher_role teaching_goals parent_relation child_stage grade_level child_context parent_track_goals org_type org_name org_board org_medium org_classes org_programs org_focus subjects subject_confidence study_days study_time study_duration curriculum_notes`.split(' '));
const roles = ['student', 'professional', 'teacher', 'parent', 'organization'];

function boundedValue(value: unknown, depth = 0): unknown {
  if (depth > 3) throw new BadRequestException('Profile preferences are too deeply nested.');
  if (typeof value === 'string') {
    if (value.length > 2000) throw new BadRequestException('A profile value is too long.');
    return value.trim();
  }
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (Array.isArray(value) && value.length <= 50) return value.map(item => boundedValue(item, depth + 1));
  if (value && typeof value === 'object' && Object.keys(value).length <= 50) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => {
      if (key.length > 100 || ['__proto__', 'constructor', 'prototype'].includes(key)) throw new BadRequestException('Invalid preference key.');
      return [key, boundedValue(item, depth + 1)];
    }));
  }
  throw new BadRequestException('Unsupported profile value.');
}

export function onboardingProfile(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new BadRequestException('Enter your setup details.');
  if (JSON.stringify(input).length > 16000) throw new BadRequestException('Setup details are too large.');
  const profile: Record<string, any> = {};
  for (const [key, value] of Object.entries(input)) {
    // A child's name is unnecessary for an adult's account setup. Organization
    // contact fields are handled by a future verified organization service.
    if (['child_name', 'org_email', 'org_phone', 'org_website', 'org_address', 'org_city', 'org_pin'].includes(key)) continue;
    if (['reference_books', 'competitive_exam', 'org_connect', 'study_routine'].includes(key)) { profile[key] = boundedValue(value); continue; }
    if (!fields.has(key)) throw new BadRequestException(`Unsupported setup field: ${key.slice(0, 40)}.`);
    profile[key] = boundedValue(value);
  }
  if (!roles.includes(profile.identity)) throw new BadRequestException('Choose a supported role.');
  if (!['minor', 'adult'].includes(profile.age_band)) throw new BadRequestException('Choose your age range.');
  if (profile.age_band !== 'adult') throw new ForbiddenException('A verified guardian flow is required before an under-18 workspace can be activated.');
  if (typeof profile.full_name !== 'string' || !profile.full_name || profile.full_name.length > 80) throw new BadRequestException('Enter a name of 1 to 80 characters.');
  if (profile.identity === 'student' && !['school', 'higher_ed', 'competitive', 'professional'].includes(profile.education_stage)) throw new BadRequestException('Choose your learning stage.');
  if (profile.identity === 'professional') profile.education_stage = 'professional';
  const lists = ['learning_goals', 'notifications', 'teacher_classes', 'teacher_subjects', 'teaching_goals', 'parent_track_goals', 'org_medium', 'org_classes', 'org_programs', 'subjects', 'reference_books'];
  const maps = ['study_routine', 'subject_confidence'];
  for (const [key, value] of Object.entries(profile)) {
    if (lists.includes(key)) {
      if (!Array.isArray(value) || value.some(item => typeof item !== 'string' || !item || item.length > 120)) throw new BadRequestException('Choose valid setup options.');
      profile[key] = [...new Set(value)];
    } else if (maps.includes(key)) {
      if (!value || typeof value !== 'object' || Array.isArray(value) || Object.values(value).some(item => !['string', 'number', 'boolean'].includes(typeof item))) throw new BadRequestException('Enter valid learning preferences.');
    } else if (value !== null && typeof value !== 'string') throw new BadRequestException('Enter valid setup text.');
  }
  // Branch preferences are not membership claims. Discard stale answers when a
  // role/stage changes, including drafts created by older frontend versions.
  const common = 'full_name identity age_band preferred_language learning_language curriculum_notes notifications';
  const roleFields: Record<string, string> = {
    student: 'education_stage institution_type institution_name degree_program department semester career_goal learning_goals target_exam attempt_year prep_stage daily_hours coaching_enrolled board state medium grade_level subjects subject_confidence study_days study_time study_duration reference_books competitive_exam org_connect study_routine',
    professional: 'education_stage career_goal learning_goals subjects medium',
    teacher: 'teacher_category board state medium teacher_classes teacher_institution teacher_course_level teacher_exam teacher_subjects experience teacher_role teaching_goals',
    parent: 'parent_relation child_stage board grade_level child_context medium parent_track_goals',
    organization: 'org_type org_name org_board org_medium org_classes org_programs org_focus',
  };
  const allowed = new Set(`${common} ${roleFields[profile.identity]}`.split(' '));
  for (const key of Object.keys(profile)) if (!allowed.has(key)) delete profile[key];
  if (profile.identity === 'student' && profile.education_stage !== 'school') {
    for (const key of ['board', 'state', 'grade_level', 'reference_books', 'competitive_exam', 'org_connect']) delete profile[key];
  }
  if (profile.board !== 'State') delete profile.state;
  if (profile.identity === 'teacher' && profile.teacher_category !== 'school') {
    for (const key of ['board', 'state', 'teacher_classes']) delete profile[key];
  }
  if (profile.identity === 'parent' && profile.child_stage !== 'school') {
    for (const key of ['board', 'grade_level']) delete profile[key];
  }
  if (profile.identity === 'organization') {
    if (!['school', 'college', 'university', 'coaching', 'training'].includes(profile.org_type)) throw new BadRequestException('Choose an organization type.');
    if (typeof profile.org_name !== 'string' || !profile.org_name || profile.org_name.length > 120) throw new BadRequestException('Enter an organization name of 1 to 120 characters.');
    if (profile.org_type !== 'school') for (const key of ['org_board', 'org_classes']) delete profile[key];
    if (!['college', 'university'].includes(profile.org_type)) delete profile.org_programs;
  }
  const requireText = (...keys: string[]) => {
    if (keys.some(key => typeof profile[key] !== 'string' || !profile[key])) throw new BadRequestException('Complete the required setup details.');
  };
  // Product entry asks only what is necessary now. Existing richer preferences
  // remain valid; semesters, routines, employment goals and family details are optional.
  if (profile.identity === 'professional') requireText('preferred_language');
  if (profile.identity === 'student') {
    if (profile.education_stage === 'school') { requireText('board', 'medium', 'grade_level'); if (profile.board === 'State') requireText('state'); }
    if (profile.education_stage === 'competitive') requireText('target_exam');
    if (profile.education_stage === 'professional') requireText('preferred_language');
  }
  if (profile.identity === 'teacher') {
    if (!['school', 'higher_ed', 'university', 'coaching', 'independent'].includes(profile.teacher_category)) throw new BadRequestException('Choose a teaching category.');
    requireText('medium');
  }
  if (profile.identity === 'parent') {
    if (profile.child_stage && !['school', 'higher_ed', 'competitive'].includes(profile.child_stage) || profile.parent_relation && !['mother', 'father', 'guardian'].includes(profile.parent_relation)) throw new BadRequestException('Choose valid family preferences.');
    requireText('medium');
  }
  return profile;
}

export function publicProfile(uid: string, data: Record<string, any>) {
  const preferences = data.preferences || {};
  return { id: uid, email: data.email || '', full_name: data.full_name || '', ...data.profile,
    preferences, onboarding_complete: data.onboarding?.status === 'complete',
    getting_started_complete: data.onboarding?.introduction?.status !== 'pending',
    profile_version: data.version || 0, auth_source: 'firebase' };
}
