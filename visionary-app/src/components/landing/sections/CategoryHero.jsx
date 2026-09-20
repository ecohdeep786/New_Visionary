import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

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
    <section className="pt-36 pb-28 px-6 bg-white">
      <div className="max-w-[1240px] mx-auto">
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
            style={{ fontWeight: 400 }}
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
                className="inline-flex items-center gap-1 h-12 px-7 text-[14px] font-medium text-[#3c4043] hover:text-[#1a73e8] transition-colors rounded-full hover:bg-[#f8f9fa]"
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