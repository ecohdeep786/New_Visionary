import { useState, useEffect, useMemo } from "react";
import { Sparkles, ChevronRight } from "lucide-react";
import VisionaryLogo from "@/components/VisionaryLogo";

function buildMessage(data, userName) {
  const name = userName || "there";
  const lines = [{ text: `Welcome, ${name}.`, delay: 800 }];

  if (data.identity === "student") {
    if (data.education_stage === "school" && data.grade_level) {
      const boardLabel = data.board === "State" ? data.state || "State Board" : data.board;
      lines.push({
        text: `I've prepared your ${data.grade_level} ${boardLabel} curriculum.`,
        delay: 1200,
      });
    } else if (data.education_stage === "higher_ed" && data.degree_program) {
      lines.push({
        text: `I've prepared your ${data.degree_program} curriculum.`,
        delay: 1200,
      });
    } else if (data.education_stage === "competitive" && data.target_exam) {
      lines.push({
        text: `I've prepared your ${data.target_exam} preparation roadmap.`,
        delay: 1200,
      });
    }

    if (data.subject_confidence) {
      const entries = Object.entries(data.subject_confidence).filter(([, v]) => v > 0);
      if (entries.length > 0) {
        const weakest = entries.sort(([, a], [, b]) => a - b)[0];
        if (weakest[1] <= 3) {
          lines.push({
            text: `I noticed you rated ${weakest[0]} ${weakest[1]} out of 5 — I've already marked it as a priority.`,
            delay: 1400,
          });
        }
      }
    }

    if (data.study_routine?.duration) {
      lines.push({
        text: `Your daily study plan is ready. I'll remind you when it's time.`,
        delay: 1200,
      });
    }
  } else if (data.identity === "teacher") {
    lines.push({ text: `I've set up your teaching workspace.`, delay: 1200 });
    if (data.teacher_subjects?.length > 0) {
      lines.push({
        text: `Your ${data.teacher_subjects.slice(0, 3).join(", ")} classes are ready to go.`,
        delay: 1200,
      });
    }
  } else if (data.identity === "organization") {
    if (data.org_name) {
      lines.push({
        text: `I've created the workspace for ${data.org_name}.`,
        delay: 1200,
      });
    }
    lines.push({
      text: `You can now invite teachers and students to join your institution.`,
      delay: 1200,
    });
  }

  lines.push({ text: `Let's begin.`, delay: 1000 });
  return lines;
}

export default function AGIIntro({ data, userName, onComplete }) {
  const lines = useMemo(() => buildMessage(data, userName), [data, userName]);
  const [visibleCount, setVisibleCount] = useState(0);
  const allShown = visibleCount >= lines.length;

  useEffect(() => {
    if (visibleCount < lines.length) {
      const timer = setTimeout(
        () => setVisibleCount((c) => c + 1),
        lines[visibleCount].delay || 1000
      );
      return () => clearTimeout(timer);
    }
  }, [visibleCount, lines]);

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-white">
      <header className="shrink-0 px-6 lg:px-10 py-4">
        <VisionaryLogo />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1a73e8] to-[#4285f4] flex items-center justify-center mb-8 shadow-lg">
          <Sparkles className="w-10 h-10 text-white" />
        </div>

        <div className="max-w-[600px] text-center space-y-4">
          {lines.slice(0, visibleCount).map((line, i) => (
            <p
              key={i}
              className={`text-base lg:text-lg text-[#202124] ${
                i === 0 ? "font-medium text-[24px]" : "font-normal"
              }`}
              style={{
                opacity: 1,
                transition: "opacity 0.5s ease-in",
              }}
            >
              {line.text}
            </p>
          ))}
        </div>

        {allShown && (
          <button
            onClick={onComplete}
            className="mt-10 flex items-center gap-2 h-12 px-8 bg-[#1a73e8] text-white rounded-full text-sm font-medium hover:bg-[#1557b0] transition-colors"
            style={{ opacity: 1, transition: "opacity 0.5s ease-in" }}
          >
            Enter Visionary <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}