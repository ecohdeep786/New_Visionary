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
    <section className="py-28 lg:py-36 px-6 bg-[#f8f9fa]">
      <div className="max-w-[760px] mx-auto text-center">
        <ScrollReveal>
          <h2
            className="text-[32px] sm:text-[44px] lg:text-[52px] text-[#202124] mb-5 leading-[1.06] tracking-[-0.025em]"
            style={{ fontWeight: 400 }}
          >
            {title}
          </h2>
          <p className="text-[16.5px] text-[#5f6368] mb-10 max-w-[600px] mx-auto leading-[1.65]">
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