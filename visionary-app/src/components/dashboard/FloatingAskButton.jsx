import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function FloatingAskButton() {
  return (
    <Link
      to="/dashboard/ask"
      className="fixed bottom-8 right-8 z-50 flex items-center gap-2 pl-3 pr-5 h-12 bg-[#1a73e8] text-white rounded-full hover:bg-[#1557b0] transition-all duration-200 active:scale-95"
    >
      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
        <Sparkles className="w-[18px] h-[18px]" />
      </div>
      <span className="text-sm font-medium tracking-tight">Ask AGI</span>
    </Link>
  );
}