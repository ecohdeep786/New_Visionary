import { Link } from "react-router-dom";
import { ArrowRight, Star, Box, Clock, TrendingUp } from "lucide-react";
import SubjectIllustration from "@/components/dashboard/SubjectIllustration";
import { useThemeColor } from "@/hooks/useThemeColor";

const subjectDescriptions = {
  physics: "Forces, energy, and the fundamental laws of nature",
  chemistry: "Matter, reactions, and molecular interactions",
  math: "Numbers, patterns, and logical reasoning",
  mathematics: "Numbers, patterns, and logical reasoning",
  biology: "Life sciences and living organisms",
  english: "Language, literature, and communication",
  default: "Explore concepts and build mastery step by step",
};

function getProgressLabel(mastery) {
  if (mastery === 0) return "Not started";
  if (mastery >= 100) return "Mastered";
  if (mastery >= 70) return "Nearly there";
  if (mastery >= 30) return "Making progress";
  return "Getting started";
}

export default function SubjectHeroBanner({ subject, topics, continueTopic }) {
  const themeColor = useThemeColor();
  if (!subject) return null;

  const mastery = subject.overall_mastery || 0;
  const mastered = subject.topics_mastered || 0;
  const total = subject.topics_total || topics.length || 0;
  const has3d = topics.some((t) => t.has_3d);
  const totalMinutes = topics.reduce((sum, t) => sum + (t.has_3d ? 20 : 15), 0);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const durationText = hours > 0 ? `${hours} hr ${mins} min` : `${mins} min`;
  const progressLabel = getProgressLabel(mastery);

  const subjectKey = (subject.name || "").toLowerCase().trim();
  const description = subjectDescriptions[subjectKey] || subjectDescriptions.default;

  const continuePath = continueTopic ? `/dashboard/learn/${continueTopic.id}` : "/dashboard/learn";

  const metaPills = [
    { icon: Clock, label: durationText },
    { icon: TrendingUp, label: progressLabel },
    ...(has3d ? [{ icon: Box, label: "3D lessons" }] : []),
  ];

  return (
    <div
      className="relative overflow-hidden rounded-[28px] flex flex-col lg:flex-row"
      style={{ backgroundColor: themeColor.light }}
    >
      {/* Left: Content */}
      <div className="relative z-10 flex flex-col gap-6 p-8 lg:p-10 flex-1">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium self-start"
          style={{ backgroundColor: "rgba(255,255,255,0.7)", color: themeColor.accent }}
        >
          Subject
        </span>

        <div>
          <h1 className="text-[28px] lg:text-[36px] font-medium text-[#202124] tracking-tight leading-tight">
            {subject.name}
          </h1>
          <p className="text-[15px] font-normal text-[#3c4043] mt-2">{description}</p>
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            {metaPills.map((pill, i) => {
              const Icon = pill.icon;
              return (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white"
                  style={{ color: themeColor.accent }}
                >
                  <Icon className="w-[14px] h-[14px]" />
                  {pill.label}
                </span>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <Link
              to={continuePath}
              className="inline-flex items-center gap-2 h-11 px-7 text-white rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
              style={{ backgroundColor: themeColor.accent }}
            >
              Continue <ArrowRight className="w-[18px] h-[18px]" />
            </Link>

            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white">
              <Star className="w-[16px] h-[16px] text-amber-400" style={{ fill: "#fbbf24" }} />
              <span className="text-sm font-medium text-[#202124]">{mastered}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-2.5 rounded-full overflow-hidden bg-white/60">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${mastery}%`, backgroundColor: themeColor.accent }}
              />
            </div>
            <span className="text-sm font-medium text-[#3c4043]">{mastered}/{total}</span>
          </div>
        </div>
      </div>

      {/* Right: Illustration */}
      <div className="w-full lg:w-[280px] h-32 lg:h-auto shrink-0">
        <SubjectIllustration subject={subject.name} className="w-full h-full rounded-r-[28px]" />
      </div>
    </div>
  );
}