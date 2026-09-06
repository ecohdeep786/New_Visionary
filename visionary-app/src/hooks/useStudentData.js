import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export function useStudentData() {
  const [data, setData] = useState({
    subjects: [],
    topics: [],
    exams: [],
    studyLogs: [],
    laggingTopics: [],
    todayPlan: [],
    activeTopics: [],
    resumeTopic: null,
    upNext: null,
    upNextList: [],
    dailyStats: { topicsToday: 0, minutesToday: 0, avgConfidenceToday: 0, streak: 0 },
    loading: true,
    error: null,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [subjects, topics, exams, studyLogs, submissions, allAssignments] = await Promise.all([
          base44.entities.Subject.list(),
          base44.entities.Topic.list(),
          base44.entities.Exam.list("days_left"),
          base44.entities.StudyLog.list("-date", 30),
          base44.entities.Submission.list().catch(() => []),
          base44.entities.Assignment.list().catch(() => []),
        ]);

        const topicList = topics || [];
        const examList = exams || [];
        const logList = studyLogs || [];
        const submissionList = submissions || [];

        // Daily check-in — create a StudyLog for today if none exists, so streak increments on each daily visit
        const todayStr = new Date().toISOString().split("T")[0];
        if (!logList.some((l) => l.date === todayStr && !l.submission_id)) {
          try {
            await base44.entities.StudyLog.create({
              date: todayStr,
              subject: "Daily",
              topic: "Dashboard check-in",
              duration_minutes: 0,
              confidence: 0,
            });
            logList.unshift({ date: todayStr, subject: "Daily", topic: "Dashboard check-in", duration_minutes: 0, confidence: 0 });
          } catch {}
        }

        // The invisible engine — fold graded teacher work into the mastery map.
        // For each newly-graded submission, record a StudyLog (deduped by submission_id)
        // and nudge matching Topic mastery toward the grade.
        const assignmentMap = {};
        (allAssignments || []).forEach((a) => (assignmentMap[a.id] = a));
        const syncedIds = new Set(logList.map((l) => l.submission_id).filter(Boolean));
        const toSync = submissionList.filter((s) => s.status === "graded" && !syncedIds.has(s.id));
        if (toSync.length) {
          const newLogs = [];
          for (const s of toSync) {
            const a = assignmentMap[s.assignment_id];
            const concepts = (a && a.topics) || [];
            const topicLabel = concepts[0] || (a && a.title) || "Classwork";
            const subject = (a && a.subject) || "Classwork";
            const grade = s.grade || 0;
            newLogs.push({ date: todayStr, subject, topic: topicLabel, duration_minutes: 0, confidence: grade, submission_id: s.id });
            for (const c of concepts) {
              const t = topicList.find((x) => x.name === c && (!x.subject || x.subject === subject));
              if (t) {
                const newMastery = Math.min(100, Math.round(((t.mastery || 0) + grade) / 2));
                const newStatus = grade >= 70 ? "mastered" : grade >= 40 ? "in-progress" : "needs-review";
                try {
                  await base44.entities.Topic.update(t.id, {
                    mastery: newMastery,
                    status: newStatus,
                    practice_count: (t.practice_count || 0) + 1,
                    last_studied: todayStr,
                  });
                } catch {}
                t.mastery = newMastery;
                t.status = newStatus;
                t.practice_count = (t.practice_count || 0) + 1;
                t.last_studied = todayStr;
              }
            }
          }
          if (newLogs.length) {
            try {
              await base44.entities.StudyLog.bulkCreate(newLogs);
              logList.unshift(...newLogs);
            } catch {}
          }
        }

        const laggingTopics = topicList
          .filter((t) => t.mastery < 50 && t.status !== "not-started")
          .sort((a, b) => (a.mastery || 0) - (b.mastery || 0));

        const todayPlan = topicList
          .filter((t) => t.status === "in-progress" || t.status === "needs-review")
          .sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
          })
          .slice(0, 3);

        const activeTopics = topicList.filter((t) => t.status === "in-progress").slice(0, 5);

        const upcomingExams = examList.filter((e) => e.days_left >= 0).slice(0, 3);

        const resumeTopic =
          topicList
            .filter((t) => (t.status === "in-progress" || t.status === "needs-review") && t.last_studied)
            .sort((a, b) => new Date(b.last_studied) - new Date(a.last_studied))[0] ||
          topicList.find((t) => t.status === "in-progress") ||
          null;

        const upNextSubject = resumeTopic?.subject;
        const subjectTopics = topicList.filter((t) => t.subject === upNextSubject);
        let upNext = subjectTopics.find((t) => t.status === "not-started");
        if (!upNext) upNext = topicList.find((t) => t.status === "not-started");

        const upNextList = topicList.filter((t) => t.status === "not-started").slice(0, 3);

        const today = new Date().toISOString().split("T")[0];
        const todayLogs = logList.filter((l) => l.date === today);
        const topicsToday = new Set(todayLogs.map((l) => l.topic)).size;
        const minutesToday = todayLogs.reduce((sum, l) => sum + (l.duration_minutes || 0), 0);
        const avgConfidenceToday = todayLogs.length > 0
          ? Math.round(todayLogs.reduce((sum, l) => sum + (l.confidence || 0), 0) / todayLogs.length)
          : 0;

        const logDates = [...new Set(logList.map((l) => l.date))].sort().reverse();
        let streak = 0;
        if (logDates.length > 0) {
          let checkDate = new Date(today);
          if (logDates[0] !== today) checkDate.setDate(checkDate.getDate() - 1);
          for (const d of logDates) {
            const checkStr = checkDate.toISOString().split("T")[0];
            if (d === checkStr) {
              streak++;
              checkDate.setDate(checkDate.getDate() - 1);
            } else break;
          }
        }

        setData({
          subjects: subjects || [],
          topics: topicList,
          exams: upcomingExams,
          studyLogs: logList,
          laggingTopics,
          todayPlan,
          activeTopics,
          resumeTopic,
          upNext,
          upNextList,
          dailyStats: { topicsToday, minutesToday, avgConfidenceToday, streak },
          loading: false,
          error: null,
        });
      } catch (err) {
        setData((prev) => ({ ...prev, loading: false, error: err }));
      }
    };
    loadData();
  }, []);

  return data;
}

export function buildStudentContext(data, userName) {
  if (!data || data.loading) return `Student: ${userName}`;

  const subjects = (data.subjects || [])
    .map((s) => `- ${s.name}: ${s.overall_mastery || 0}% mastery${s.exam_date ? ` (exam: ${s.exam_date})` : ""}`)
    .join("\n");

  const lagging = (data.laggingTopics || [])
    .map((t) => `- ${t.name} (${t.subject}): ${t.mastery || 0}% mastery — ${t.status}`)
    .join("\n");

  const exams = (data.exams || [])
    .map((e) => `- ${e.title} (${e.subject}): ${e.days_left} days away, ${e.readiness || 0}% ready`)
    .join("\n");

  const recent = (data.studyLogs || [])
    .map((l) => `- ${l.topic} (${l.subject}): ${l.duration_minutes} min, confidence ${l.confidence}%`)
    .join("\n");

  return `Student: ${userName}

Current subjects and mastery levels:
${subjects || "None yet"}

Topics needing attention (mastery below 50%):
${lagging || "None currently"}

Upcoming exams:
${exams || "None scheduled"}

Recent study activity (last 7 days):
${recent || "No recent activity"}`;
}