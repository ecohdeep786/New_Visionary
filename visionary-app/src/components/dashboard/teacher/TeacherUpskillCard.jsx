import { useState } from "react";
import { GraduationCap, ArrowRight, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Teacher upskill — one teaching skill to sharpen each week, with a concrete
 * micro-action and a path to a personalized AI growth plan. Keeps the teacher
 * growing, not just managing.
 */
const SKILLS = [
  { skill: "Ask diagnostic questions", action: "Swap one yes/no question per lesson for an open-ended 'why' prompt." },
  { skill: "Cold-call with care", action: "Pre-warn one quiet student before calling on them, so they're set up to succeed." },
  { skill: "Check for understanding", action: "End each class with a 1-minute exit ticket on today's key concept." },
  { skill: "Model metacognition", action: "Think aloud once this week while solving a problem in front of the class." },
  { skill: "Give specific praise", action: "Praise the strategy, not the student — name exactly what they did well." },
  { skill: "Wait time", action: "After asking a question, wait a full 5 seconds before taking an answer." },
];

export default function TeacherUpskillCard({ accent }) {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * SKILLS.length));
  const skill = SKILLS[idx];

  return (
    <div className="rounded-3xl p-8 bg-white border border-[#dadce0]/60 flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${accent}15` }}>
          <GraduationCap className="w-6 h-6" style={{ color: accent }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-[#202124]">Grow as a teacher</p>
          <p className="text-xs text-[#5f6368] mt-0.5">One skill to sharpen this week</p>
        </div>
        <button
          onClick={() => setIdx((i) => (i + 1) % SKILLS.length)}
          className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center shrink-0"
          aria-label="Another skill"
        >
          <RefreshCw className="w-4 h-4 text-[#5f6368]" />
        </button>
      </div>
      <div>
        <p className="text-base font-medium text-[#202124]">{skill.skill}</p>
        <p className="text-sm text-[#3c4043] mt-1 leading-relaxed">{skill.action}</p>
      </div>
      <Link to="/dashboard/ask" className="inline-flex items-center gap-2 self-start text-sm font-medium" style={{ color: accent }}>
        Get a personalized growth plan <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}