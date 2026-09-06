import { ArrowRight, Box } from "lucide-react";

const stateStyles = {
  "in-progress": {
    badge: "bg-blue-50 text-blue-600",
    label: "In Progress",
    ring: "ring-blue-200",
  },
  "not-started": {
    badge: "bg-slate-100 text-slate-500",
    label: "Not Started",
    ring: "ring-slate-200",
  },
  mastered: {
    badge: "bg-green-50 text-green-600",
    label: "Mastered",
    ring: "ring-green-200",
  },
};

export default function ConceptCard({ title, subject, mastery, state, hasVisualization }) {
  const style = stateStyles[state] || stateStyles["not-started"];

  return (
    <div className={`flex flex-col gap-4 p-5 bg-white rounded-2xl border border-slate-200 ring-1 ${style.ring} flex-1 min-w-[240px]`}>
      <div className="flex items-center justify-between">
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${style.badge}`}>
          {style.label}
        </span>
        {hasVisualization && (
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Box className="w-3.5 h-3.5" /> 3D
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-slate-500">{subject}</span>
        <h3 className="text-base font-semibold text-slate-900 leading-snug">{title}</h3>
      </div>

      {state !== "not-started" && (
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Confidence</span>
            <span className="font-semibold text-slate-900">{mastery}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                mastery >= 80 ? "bg-green-500" : mastery >= 50 ? "bg-blue-500" : "bg-amber-500"
              }`}
              style={{ width: `${mastery}%` }}
            />
          </div>
        </div>
      )}

      <button className="flex items-center gap-2 self-start text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors mt-auto">
        {state === "not-started" ? "Start Concept" : state === "mastered" ? "Review" : "Continue"}
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}