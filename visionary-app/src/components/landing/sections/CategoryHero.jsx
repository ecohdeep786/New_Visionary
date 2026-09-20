import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

/**
 * Google-style premium hero decoration:
 * - Four soft Google-color blobs anchored in the top-right (blurred, low opacity)
 * - Parallelogram stack preserved for brand continuity
 * - CTA uses Google Blue (#1a73e8), matching the rest of the premium pages
 */
function HeroDecor({ color = "#1a73e8" }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Parallelogram stack on right — refined size, softer opacity */}
      <div className="absolute" style={{ right: "3%", top: "50%", transform: "translateY(-50%) scaleX(-1)" }}>
        {[0.46, 0.34, 0.22, 0.13, 0.07].map((op, i) => (
          <div
            key={i}
            style={{
              width: 128,
              height: 340,
              backgroundColor: "#1a73e8",
              opacity: op,
              transform: "skewX(-14deg)",
              marginLeft: i === 0 ? 0 : -48,
              borderRadius: 18,
              display: "inline-block",
              verticalAlign: "middle",
            }}
          />
        ))}
      </div>

      {/* Google four-color soft blobs (signature of premium Google pages) */}
      <div
        className="absolute rounded-full blur-3xl"
        style={{ width: 380, height: 380, right: -80, top: -80, background: "radial-gradient(circle, rgba(66,133,244,0.18) 0%, rgba(66,133,244,0) 70%)" }}
      />
      <div
        className="absolute rounded-full blur-3xl"
        style={{ width: 260, height: 260, right: 180, top: 60, background: "radial-gradient(circle, rgba(234,67,53,0.10) 0%, rgba(234,67,53,0) 70%)" }}
      />
      <div
        className="absolute rounded-full blur-3xl"
        style={{ width: 240, height: 240, right: 280, top: 260, background: "radial-gradient(circle, rgba(52,168,83,0.10) 0%, rgba(52,168,83,0) 70%)" }}
      />
      <div
        className="absolute rounded-full blur-3xl"
        style={{ width: 200, height: 200, right: 60, top: 320, background: "radial-gradient(circle, rgba(251,188,4,0.10) 0%, rgba(251,188,4,0) 70%)" }}
      />
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
  const accentColor = category?.color || "#1a73e8";
  return (
    <section className="relative overflow-hidden pt-36 pb-28 px-6 bg-white">
      <HeroDecor color={accentColor} />
      <div className="relative z-10 max-w-[1240px] mx-auto">
        <div className="max-w-[680px]">
          {eyebrow && (
            <div
              className="inline-flex items-center gap-2 text-[11px] font-medium mb-7 px-3.5 py-1.5 rounded-full tracking-[0.4px] uppercase"
              style={{ backgroundColor: `${accentColor}14`, color: accentColor }}
            >
              {eyebrow}
            </div>
          )}
          <h1
            className="text-[48px] sm:text-[60px] lg:text-[72px] leading-[1.02] text-[#202124] mb-7 tracking-[-0.03em]"
            style={{ fontWeight: 500 }}
          >
            {accentWord ? (
              <>
                <span style={{ color: accentColor }}>{accentWord}</span>{" "}
                {headline.replace(accentWord + " ", "")}
              </>
            ) : (
              headline
            )}
          </h1>
          <p className="text-[17px] sm:text-[18px] text-[#5f6368] mb-10 max-w-[620px] leading-[1.65]">
            {description}
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 h-12 px-8 bg-[#1a73e8] text-white rounded-full text-[14px] font-medium hover:bg-[#1557b0] hover:shadow-[0_4px_12px_rgba(26,115,232,0.3)] transition-all active:scale-[0.98]"
            >
              {primaryLabel} <ArrowRight className="w-4 h-4" />
            </Link>
            {secondaryLabel && (
              <Link
                to="/login"
                className="inline-flex items-center gap-1 h-12 px-6 text-[14px] font-medium text-[#3c4043] hover:text-[#1a73e8] transition-colors rounded-full hover:bg-[#f8f9fa]"
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
