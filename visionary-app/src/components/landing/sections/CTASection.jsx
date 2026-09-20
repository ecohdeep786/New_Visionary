import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ScrollReveal from "@/components/landing/ScrollReveal";

export default function CTASection({
  title,
  description,
  primaryLabel = "Create your account",
  primaryTo = "/register",
  secondaryLabel,
  secondaryTo = "/",
}) {
  return (
    <section className="relative py-32 px-6 overflow-hidden bg-[#f8f9fa]">
      {/* Subtle Google-style decorative blobs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute rounded-full blur-3xl"
          style={{
            width: 420, height: 420, left: "-8%", top: "-30%",
            background: "radial-gradient(circle, rgba(66,133,244,0.12) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute rounded-full blur-3xl"
          style={{
            width: 320, height: 320, right: "-6%", bottom: "-40%",
            background: "radial-gradient(circle, rgba(52,168,83,0.08) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute rounded-full blur-3xl"
          style={{
            width: 220, height: 220, right: "30%", top: "-20%",
            background: "radial-gradient(circle, rgba(251,188,4,0.08) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-[760px] mx-auto text-center">
        <ScrollReveal>
          <h2
            className="text-[36px] sm:text-[48px] lg:text-[56px] text-[#202124] mb-6 leading-[1.05] tracking-[-0.03em]"
            style={{ fontWeight: 500 }}
          >
            {title}
          </h2>
          <p className="text-[17px] text-[#5f6368] mb-10 max-w-[620px] mx-auto leading-[1.65]">
            {description}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to={primaryTo}
              className="inline-flex items-center gap-2 h-12 px-8 bg-[#1a73e8] text-white rounded-full text-[14px] font-medium hover:bg-[#1557b0] hover:shadow-[0_4px_12px_rgba(26,115,232,0.3)] transition-all active:scale-[0.98]"
            >
              {primaryLabel} <ArrowRight className="w-4 h-4" />
            </Link>
            {secondaryLabel && (
              <Link
                to={secondaryTo}
                className="inline-flex items-center gap-1 h-12 px-7 text-[14px] font-medium text-[#3c4043] hover:text-[#1a73e8] transition-colors rounded-full border border-[#dadce0] hover:bg-white"
              >
                {secondaryLabel} <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
