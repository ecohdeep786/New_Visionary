export const localDate = (value = new Date()) => {
  const date = new Date(value);
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
};
const clamp = (value) => Math.max(0, Math.min(100, Number(value) || 0));

/** Derive progress without mutating records or creating activity on page visits. */
export function deriveLearningData({ subjects = [], topics = [], exams = [], studyLogs = [], submissions = [], assignments = [] }, now = new Date()) {
  const assignmentMap = new Map(assignments.map(a => [a.id, a]));
  const graded = submissions.filter(s => s.status === "graded" && s.grade != null && Number.isFinite(Number(s.grade)))
    .sort((a, b) => String(b.graded_date || b.created_date).localeCompare(String(a.graded_date || a.created_date)));
  const score = (s) => clamp(Number(s.grade) / (Number(assignmentMap.get(s.assignment_id)?.points) || 100) * 100);
  const topicList = topics.map(topic => {
    const submission = graded.find(s => {
      const assignment = assignmentMap.get(s.assignment_id);
      return assignment?.subject === topic.subject && assignment.topics?.includes(topic.name);
    });
    return submission ? { ...topic, mastery: Math.round(score(submission)), status: score(submission) >= 70 ? "mastered" : "needs-review" } : { ...topic, mastery: clamp(topic.mastery) };
  });
  const subjectList = subjects.map(subject => {
    const ownTopics = topicList.filter(t => t.subject === subject.name);
    return { ...subject, topics_total: ownTopics.length, topics_mastered: ownTopics.filter(t => t.status === "mastered").length,
      overall_mastery: ownTopics.length ? Math.round(ownTopics.reduce((sum, t) => sum + t.mastery, 0) / ownTopics.length) : 0 };
  });
  const logList = studyLogs.filter(l => l.topic !== "Dashboard check-in");
  const synced = new Set(logList.map(l => l.submission_id));
  for (const submission of graded.filter(s => !synced.has(s.id))) {
    const assignment = assignmentMap.get(submission.assignment_id);
    logList.push({ id: "grade-" + submission.id, submission_id: submission.id,
      date: (submission.graded_date || submission.submitted_date || submission.created_date || "").slice(0, 10),
      subject: assignment?.subject || "Classwork", topic: assignment?.title || "Graded classwork", duration_minutes: 0, confidence: score(submission) });
  }
  logList.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const meaningfulLogs = logList.filter(l => Number(l.duration_minutes) > 0 || l.submission_id);
  const today = localDate(now);
  const todayLogs = meaningfulLogs.filter(l => l.date?.slice(0, 10) === today);
  const dates = new Set(meaningfulLogs.map(l => l.date?.slice(0, 10)));
  const checkDate = new Date(now);
  if (!dates.has(today)) checkDate.setDate(checkDate.getDate() - 1);
  let streak = 0;
  while (dates.has(localDate(checkDate))) { streak++; checkDate.setDate(checkDate.getDate() - 1); }
  const priority = { high: 0, medium: 1, low: 2 };
  const todayPlan = topicList.filter(t => ["in-progress", "needs-review"].includes(t.status))
    .sort((a, b) => (priority[a.priority] ?? 1) - (priority[b.priority] ?? 1)).slice(0, 3);
  const resumeTopic = [...topicList].filter(t => ["in-progress", "needs-review"].includes(t.status))
    .sort((a, b) => String(b.last_studied || "").localeCompare(String(a.last_studied || "")))[0] || null;
  const upNextList = topicList.filter(t => t.status === "not-started").slice(0, 3);
  return { subjects: subjectList, topics: topicList, studyLogs: logList,
    exams: exams.map(e => ({ ...e, days_left: e.exam_date ? Math.ceil((new Date(e.exam_date + "T00:00:00") - new Date(today + "T00:00:00")) / 86400000) : e.days_left })).filter(e => e.days_left >= 0).sort((a, b) => a.days_left - b.days_left).slice(0, 3),
    laggingTopics: topicList.filter(t => t.status === "needs-review" || (t.status === "in-progress" && t.mastery < 50)).sort((a, b) => a.mastery - b.mastery),
    todayPlan, activeTopics: topicList.filter(t => t.status === "in-progress").slice(0, 5),
    resumeTopic, upNext: upNextList.find(t => t.subject === resumeTopic?.subject) || upNextList[0] || null, upNextList,
    dailyStats: { topicsToday: new Set(todayLogs.map(l => l.topic)).size, minutesToday: todayLogs.reduce((sum, l) => sum + (Number(l.duration_minutes) || 0), 0),
      avgConfidenceToday: todayLogs.length ? Math.round(todayLogs.reduce((sum, l) => sum + clamp(l.confidence), 0) / todayLogs.length) : 0, streak } };
}
