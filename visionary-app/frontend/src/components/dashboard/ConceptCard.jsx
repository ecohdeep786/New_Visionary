import { ArrowRight, Box } from "lucide-react";

const stateStyles = {
  "in-progress": {
    badge: "bg-[#e8f0fd] text-[#4285F4]",
    label: "In Progress",
    ring: "ring-[#4285F4]-200",
  },
  "not-started": {
    badge: "bg-[#e8f0fd] text-[#5f6368]",
    label: "Not Started",
    ring: "ring-[#dadce0]",
  },
  mastered: {
    badge: "bg-[#e6f4ea] text-[#137333]",
    label: "Mastered",
    ring: "ring-green-200",
  },
};

export default function ConceptCard({ title, subject, mastery, state, hasVisualization }) {
  const style = stateStyles[state] || stateStyles["not-started"];

  return (
    <div className={`flex flex-col gap-4 p-5 bg-white rounded-2xl border border-[#dadce0] ring-1 ${style.ring} flex-1 min-w-[240px]`}>
      <div className="flex items-center justify-between">
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${style.badge}`}>
          {style.label}
        </span>
        {hasVisualization && (
          <div className="flex items-center gap-1 text-xs text-[#5f6368]">
            <Box className="w-3.5 h-3.5" /> 3D
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-[#5f6368]">{subject}</span>
        <h3 className="text-base font-semibold text-[#121317] leading-snug">{title}</h3>
      </div>

      {state !== "not-started" && (
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-[#5f6368]">Confidence</span>
            <span className="font-semibold text-[#121317]">{mastery}%</span>
          </div>
          <div className="h-1.5 bg-[#e8f0fd] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                mastery >= 80 ? "bg-[#e6f4ea]0" : mastery >= 50 ? "bg-[#e8f0fd]0" : "bg-[#ffffff]0"
              }`}
              style={{ width: `${mastery}%` }}
            />
          </div>
        </div>
      )}

      <button className="flex items-center gap-2 self-start text-sm font-medium text-[#4285F4] hover:text-[#4285F4] transition-colors mt-auto">
        {state === "not-started" ? "Start Concept" : state === "mastered" ? "Review" : "Continue"}
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}