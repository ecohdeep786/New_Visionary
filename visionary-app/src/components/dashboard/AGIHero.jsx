import { Sparkles } from "lucide-react";

export default function AGIHero({ userName, studentData }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const yesterdayProblem = studentData.topics?.find(
    (t) => t.last_studied === yesterday && (t.status === "in-progress" || t.status === "needs-review")
  );
  const allComplete =
    studentData.topics?.length > 0 && studentData.topics.every((t) => t.status === "mastered");

  let teacherMessage;
  if (yesterdayProblem) {
    teacherMessage = `You were working on ${yesterdayProblem.name} yesterday. Let's pick up where you left off — I've kept everything ready for you.`;
  } else if (allComplete) {
    teacherMessage = `You've completed all your lessons! Ready to test your mastery in practice?`;
  } else if (studentData.laggingTopics?.length > 0) {
    teacherMessage = `I noticed you're still building confidence in ${studentData.laggingTopics[0].name}. Let's strengthen that today.`;
  } else if (studentData.resumeTopic) {
    teacherMessage = `Great progress on ${studentData.resumeTopic.name}. Let's continue from there.`;
  } else {
    teacherMessage = `Ready to learn? I've prepared your next lesson based on your curriculum.`;
  }

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#1a73e8] flex items-center justify-center">
          <Sparkles className="w-[18px] h-[18px] text-white" />
        </div>
        <span className="text-sm font-medium text-[#3c4043]">Your AGI teacher</span>
      </div>
      <h1 className="text-[28px] font-medium text-[#202124] tracking-tight leading-tight">
        {greeting}, {userName}
      </h1>
      <p className="text-base font-normal text-[#3c4043] leading-relaxed max-w-2xl">
        {teacherMessage}
      </p>
    </section>
  );
}