import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

// Light blue parallelogram shapes — same as main landing hero
function LightParallelograms({ small = false }) {
  const shapes = [
    { opacity: 0.50 },
    { opacity: 0.38 },
    { opacity: 0.26 },
    { opacity: 0.16 },
    { opacity: 0.09 },
  ];
  const h = small ? 260 : 320;
  const w = small ? 100 : 120;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute flex items-center"
        style={{ right: "4%", top: "50%", transform: "translateY(-50%) scaleX(-1)" }}
      >
        {shapes.map((s, i) => (
          <div
            key={i}
            style={{
              width: w,
              height: h,
              backgroundColor: "#4285F4",
              opacity: s.opacity,
              transform: "skewX(-14deg)",
              marginLeft: i === 0 ? 0 : -40,
              borderRadius: 14,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function CategoryHero({
  category,
  eyebrow,
  headline,
  accentWord,
  description,
  primaryLabel = "Get started free",
  secondaryLabel = "Learn more",
}) {
  return (
    <section className="relative overflow-hidden pt-32 pb-24 px-6 bg-white">
      <LightParallelograms />
      <div className="relative z-10 max-w-[1200px] mx-auto">
        <div className="max-w-[640px]">
          {eyebrow && (
            <div
              className="inline-flex items-center gap-2 text-xs font-medium mb-6 px-3 py-1.5 rounded-full"
              style={{ backgroundColor: `${category.color}15`, color: category.color }}
            >
              {eyebrow}
            </div>
          )}
          <h1
            className="text-[44px] sm:text-[56px] lg:text-[64px] leading-[1.05] text-[#202124] mb-6"
            style={{ fontWeight: 500, letterSpacing: "-0.025em" }}
          >
            {accentWord ? (
              <>
                <span style={{ color: category.color }}>{accentWord}</span>{" "}
                {headline.replace(accentWord + " ", "")}
              </>
            ) : (
              headline
            )}
          </h1>
          <p className="text-base text-[#5f6368] mb-10 max-w-lg" style={{ lineHeight: 1.65 }}>
            {description}
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 h-11 px-7 bg-[#202124] text-white rounded-full text-sm font-medium hover:bg-[#000] transition-colors"
            >
              {primaryLabel} <ArrowRight className="w-4 h-4" />
            </Link>
            {secondaryLabel && (
              <Link
                to="/login"
                className="inline-flex items-center gap-1 h-11 px-5 text-sm font-medium text-[#3c4043] hover:text-[#1a73e8] transition-colors"
              >
                {secondaryLabel} <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}