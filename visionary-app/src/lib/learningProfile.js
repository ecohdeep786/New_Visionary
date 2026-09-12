const competitiveSubjects = {
  "JEE Main": ["Physics", "Chemistry", "Mathematics"],
  "JEE Advanced": ["Physics", "Chemistry", "Mathematics"],
  NEET: ["Physics", "Chemistry", "Biology"],
  UPSC: ["General Studies", "Current Affairs", "CSAT"],
  CAT: ["Quantitative Aptitude", "Verbal Ability", "Data Interpretation"],
  CUET: ["Language", "Domain Subjects", "General Test"],
};

function subjectsForProfile(profile) {
  if (profile.education_stage === "competitive") {
    return competitiveSubjects[profile.target_exam] || profile.subjects || [];
  }

  if (profile.education_stage === "higher_ed") {
    return profile.subjects || [];
  }

  return profile.subjects || [];
}

/**
 * Temporary client-side bootstrap for the local prototype store. The record
 * shape is owner-scoped so replacing this with a Firebase/GCP repository is
 * isolated to one small boundary.
 */
export async function initializeLearningWorkspace(client, user, profile) {
  if (profile.identity !== "student" || !user?.email) return;

  const existingSubjects = await client.entities.Subject.filter({ owner_email: user.email });

  const subjects = subjectsForProfile(profile);
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
