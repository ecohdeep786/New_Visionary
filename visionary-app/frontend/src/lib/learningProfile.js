/**
 * Temporary client-side bootstrap for the local prototype store. The record
 * shape is owner-scoped so replacing this with a Firebase/GCP repository is
 * isolated to one small boundary.
 */
export async function initializeLearningWorkspace(client, user, profile) {
  if (profile.identity !== "student" || !user?.email) return;

  const existingSubjects = await client.entities.Subject.filter({ owner_email: user.email });

  // Onboarding labels are user-entered. Curriculum comes from ContentRepository
  // after workspace creation; no exam or board subject list is inferred here.
  const subjects = Array.isArray(profile.subjects) ? profile.subjects : [];
  await Promise.all(
    subjects.filter(name => !existingSubjects.some(subject => subject.name === name)).map((name) => {
      const confidence = profile.subject_confidence?.[name];
      return client.entities.Subject.create({
        owner_email: user.email,
        name,
        board: profile.board || profile.target_exam || profile.degree_program || "Personal learning plan",
        overall_mastery: 0,
        self_confidence: confidence || null,
        topics_mastered: 0,
        topics_total: 0,
      });
    })
  );
}
