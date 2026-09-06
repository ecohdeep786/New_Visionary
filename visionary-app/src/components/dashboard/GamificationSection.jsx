import { useState } from "react";
import { Brain, Lightbulb, ChevronRight, RotateCw } from "lucide-react";
import BreathingExercise from "@/components/dashboard/BreathingExercise";
import { useThemeColor } from "@/hooks/useThemeColor";

const teasers = [
  { q: "I have cities but no houses, mountains but no trees, and water but no fish. What am I?", a: "A map" },
  { q: "The more you take, the more you leave behind. What are they?", a: "Footsteps" },
  { q: "What has hands but cannot clap?", a: "A clock" },
  { q: "I'm tall when I'm young, and short when I'm old. What am I?", a: "A candle" },
  { q: "What gets wetter the more it dries?", a: "A towel" },
];

export default function GamificationSection() {
  const [teaserIdx, setTeaserIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const themeColor = useThemeColor();

  const nextTeaser = () => {
    setRevealed(false);
    setTeaserIdx((i) => (i + 1) % teasers.length);
  };
  const teaser = teasers[teaserIdx];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-8 bg-white rounded-3xl border border-[#dadce0]/60">
      {/* Breathing exercise */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${themeColor.accent}15` }}>
            <Brain className="w-5 h-5" style={{ color: themeColor.accent }} />
          </div>
          <div>
            <h3 className="text-[17px] font-medium text-[#202124]">Breathing exercise</h3>
            <p className="text-sm text-[#5f6368] mt-0.5">Calm your mind in 60 seconds</p>
          </div>
        </div>
        <BreathingExercise />
      </div>

      {/* Brain teaser */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#fef7e0]">
            <Lightbulb className="w-5 h-5 text-[#fbbc05]" />
          </div>
          <div>
            <h3 className="text-[17px] font-medium text-[#202124]">Quick riddle</h3>
            <p className="text-sm text-[#5f6368] mt-0.5">Give your brain a playful break</p>
          </div>
        </div>
        <div className="flex flex-col gap-4 p-6 bg-[#f8f9fa] rounded-2xl flex-1 justify-center">
          <p className="text-base text-[#202124] leading-relaxed">{teaser.q}</p>
          {revealed ? (
            <span className="text-base font-medium" style={{ color: themeColor.accent }}>{teaser.a}</span>
          ) : (
            <button
              onClick={() => setRevealed(true)}
              className="inline-flex items-center gap-2 self-start h-10 px-5 rounded-full text-sm font-medium text-white"
              style={{ backgroundColor: themeColor.accent }}
            >
              Reveal answer <ChevronRight className="w-[18px] h-[18px]" />
            </button>
          )}
          <button
            onClick={nextTeaser}
            className="inline-flex items-center gap-2 self-start text-sm font-medium text-[#5f6368] hover:text-[#202124] transition-colors"
          >
            <RotateCw className="w-4 h-4" /> Next riddle
          </button>
        </div>
      </div>
    </div>
  );
}