import { Sparkles } from "lucide-react";

/**
 * Personalized AGI greeting — the first thing every user reads.
 * Mirrors the student AITeacherHero pattern but adapts the message per role.
 */
export default function RoleGreeting({ userName = "there", role = "student", subtitle = "", accent = "#1a73e8", children }) {
  const greetings = {
    student: `Hello, ${userName}.`,
    teacher: `Welcome back, ${userName}.`,
    organization: `Good day, ${userName}.`,
    parent: `Hi ${userName}.`,
  };
  const defaultSubtitles = {
    student: "Here's what your learning looks like today.",
    teacher: "Here's how your classrooms are doing.",
    organization: "Here's your institution at a glance.",
    parent: "Here's how your child is learning.",
  };

  return (
    <div className="bg-white rounded-3xl border border-[#dadce0]/60 p-8 lg:p-10">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${accent}15` }}>
          <Sparkles className="w-6 h-6" style={{ color: accent }} />
        </div>
        <div className="flex-1">
          <h1 className="text-[26px] lg:text-[30px] font-medium text-[#202124] leading-tight">
            {greetings[role] || greetings.student}
          </h1>
          <p className="text-base text-[#5f6368] mt-2 leading-relaxed">
            {subtitle || defaultSubtitles[role]}
          </p>
          {children}
        </div>
      </div>
    </div>
  );
}