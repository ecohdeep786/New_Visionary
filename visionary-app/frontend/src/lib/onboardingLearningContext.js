/** User-entered setup context only; this never supplies an official subject list. */
export function onboardingLearningContext(user) {
  const clean = value => typeof value === 'string' ? value.trim().slice(0, 100) || undefined : undefined;
  const stage = clean(user.education_stage)?.slice(0, 40);
  const higher = stage === 'higher_ed';
  const exam = !['higher_ed', 'professional'].includes(stage) ? clean(user.target_exam)?.slice(0, 60) : undefined;
  const institution = clean(user.institution_name) || (higher ? clean(user.institution_type) : undefined);
  const classLevel = higher
    ? [clean(user.degree_program), clean(user.semester)].filter(Boolean).join(' · ').slice(0, 100) || undefined
    : stage === 'professional' ? undefined : clean(user.grade_level);
  const board = higher ? institution : stage === 'competitive' ? exam : stage === 'professional' ? undefined : clean(user.board);
  const subjects = Array.isArray(user.subjects) ? [...new Set(user.subjects.map(clean).filter(Boolean))] : [];
  if (!stage && !board && !classLevel && !exam && !subjects.length) return undefined;
  return { stage, exam, institution, board, classLevel, subjects };
}
