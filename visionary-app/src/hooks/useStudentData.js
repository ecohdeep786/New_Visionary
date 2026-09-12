import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { deriveLearningData } from "@/lib/learningMetrics";

const empty = deriveLearningData({});
export function useStudentData() {
  const { user } = useAuth();
  const enabled = Boolean(user?.email && user?.identity === "student");
  const query = useQuery({
    queryKey: ["workspace", "learning", user?.email],
    enabled,
    staleTime: 15000,
    queryFn: async () => {
      const [subjects, topics, exams, studyLogs, submissions, assignments] = await Promise.all([
        base44.entities.Subject.list(), base44.entities.Topic.list(), base44.entities.Exam.list(),
        base44.entities.StudyLog.list("-date"),
        base44.entities.Submission.filter({ student_email: user.email }),
        base44.entities.Assignment.list(),
      ]);
      return deriveLearningData({ subjects, topics, exams, studyLogs, submissions, assignments });
    },
  });
  return { ...(enabled ? query.data || empty : empty), loading: enabled && query.isPending, error: query.error, refresh: query.refetch };
}

export function buildStudentContext(data, userName) {
  return `Student: ${userName}
Subjects: ${(data?.subjects || []).map(s => s.name).join(", ") || "None selected"}
Topics needing review: ${(data?.laggingTopics || []).map(t => t.name).join(", ") || "None recorded"}
Recent activity: ${(data?.studyLogs || []).slice(0, 7).map(l => l.topic).join(", ") || "None yet"}`;
}

