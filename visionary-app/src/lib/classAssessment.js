// Recorded scores are evidence of submitted work, not a mastery judgment.
export function summarizeClassAssessment(assignments = [], submissions = []) {
  const topicsFor = assignment => [...new Set((Array.isArray(assignment?.topics) ? assignment.topics : []).filter(topic => typeof topic === 'string' && topic.trim()))];
  const assignmentMap = new Map(assignments.map(assignment => [assignment.id, assignment]));
  const coverage = new Map();
  const grades = new Map();
  const students = new Map();
  let excluded = 0;
  for (const assignment of assignments) {
    for (const topic of topicsFor(assignment)) coverage.set(topic, (coverage.get(topic) || 0) + 1);
  }
  for (const submission of submissions) {
    if (submission.status !== 'graded') continue;
    const assignment = assignmentMap.get(submission.assignment_id);
    const numeric = value => (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')) && Number.isFinite(Number(value));
    const studentKey = submission.student_id || submission.student_email;
    if (!assignment || !studentKey || !numeric(submission.grade) || !numeric(assignment.points) || Number(assignment.points) <= 0 || Number(submission.grade) < 0 || Number(submission.grade) > Number(assignment.points)) {
      excluded++;
      continue;
    }
    const topics = topicsFor(assignment);
    if (!topics.length) continue;
    const score = Number(submission.grade) / Number(assignment.points) * 100;
    if (!students.has(studentKey)) students.set(studentKey, { id: studentKey, name: submission.student_name || submission.student_email || '', concepts: new Map() });
    const student = students.get(studentKey);
    for (const topic of topics) {
      if (!grades.has(topic)) grades.set(topic, []);
      grades.get(topic).push(score);
      if (!student.concepts.has(topic)) student.concepts.set(topic, []);
      student.concepts.get(topic).push(score);
    }
  }
  const average = values => Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  return {
    excluded,
    concepts: [...coverage.keys()],
    coverageRows: [...coverage.entries()].sort((a, b) => b[1] - a[1]),
    assessmentRows: [...grades.entries()].map(([concept, values]) => ({ concept, avg: average(values), count: values.length })).sort((a, b) => a.avg - b.avg),
    students: [...students.values()].map(student => ({ ...student, concepts: Object.fromEntries([...student.concepts.entries()].map(([topic, values]) => [topic, average(values)])) })),
  };
}
