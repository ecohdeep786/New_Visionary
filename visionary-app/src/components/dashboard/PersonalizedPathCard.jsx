import { ArrowRight, BookOpen, Clock } from "lucide-react";

export default function PersonalizedPathCard({ image, heading, description, lessons, duration }) {
  return (
    <div className="flex flex-col bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden flex-1 min-w-[260px]">
      <div className="w-full h-40 overflow-hidden">
        <img src={image} alt={heading} className="w-full h-full object-cover" />
      </div>
      <div className="flex flex-col gap-3 p-5 flex-1">
        <h3 className="text-lg font-semibold text-[#0f172a]">{heading}</h3>
        <p className="text-sm text-[#64748b] leading-relaxed flex-1">{description}</p>
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-4 text-xs text-[#64748b]">
            <span className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" /> {lessons}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" /> {duration}
            </span>
          </div>
          <button className="w-9 h-9 flex items-center justify-center bg-[#0055d4] text-white rounded-full hover:bg-[#0044b0] transition-colors shrink-0">
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}