import { ArrowRight, Clock, Code2, Lock } from "lucide-react";

export default function ProjectCard({ title, concept, difficulty, duration, locked, lockedReason, image }) {
  return (
    <div className={`flex flex-col bg-white rounded-2xl border border-[#d2d2d7] overflow-hidden flex-1 min-w-[280px] ${locked ? "opacity-60" : ""}`}>
      <div className="relative w-full h-36 overflow-hidden bg-[#eef5ff]">
        {image && <img src={image} alt={title} className="w-full h-full object-cover" />}
        {locked && (
          <div className="absolute inset-0 bg-[#1d1d1f]/40 flex items-center justify-center">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 rounded-full text-xs font-medium text-[#6e6e73]">
              <Lock className="w-3.5 h-3.5" /> {lockedReason || "Master concept first"}
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3 p-5 flex-1">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-[#6e6e73]">Applies: {concept}</span>
          <h3 className="text-base font-semibold text-[#1d1d1f]">{title}</h3>
        </div>
        <div className="flex items-center gap-4 text-xs text-[#6e6e73]">
          <span className="flex items-center gap-1">
            <Code2 className="w-3.5 h-3.5" /> {difficulty}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {duration}
          </span>
        </div>
        <button
          disabled={locked}
          className="flex items-center gap-2 self-start text-sm font-medium text-[#0071E3] hover:text-[#0071E3] transition-colors mt-auto disabled:cursor-not-allowed disabled:text-[#6e6e73]"
        >
          {locked ? "Locked" : "Start Building"}
          {!locked && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}