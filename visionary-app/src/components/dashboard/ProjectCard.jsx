import { ArrowRight, Clock, Code2, Lock } from "lucide-react";

export default function ProjectCard({ title, concept, difficulty, duration, locked, lockedReason, image }) {
  return (
    <div className={`flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden flex-1 min-w-[280px] ${locked ? "opacity-60" : ""}`}>
      <div className="relative w-full h-36 overflow-hidden bg-slate-100">
        {image && <img src={image} alt={title} className="w-full h-full object-cover" />}
        {locked && (
          <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 rounded-full text-xs font-medium text-slate-600">
              <Lock className="w-3.5 h-3.5" /> {lockedReason || "Master concept first"}
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3 p-5 flex-1">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">Applies: {concept}</span>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Code2 className="w-3.5 h-3.5" /> {difficulty}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {duration}
          </span>
        </div>
        <button
          disabled={locked}
          className="flex items-center gap-2 self-start text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors mt-auto disabled:cursor-not-allowed disabled:text-slate-400"
        >
          {locked ? "Locked" : "Start Building"}
          {!locked && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}