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
    <section className="py-28 px-6 bg-white">
      <div className="max-w-[600px] mx-auto text-center">
        <ScrollReveal>
          <h2
            className="text-[28px] lg:text-[40px] text-[#202124] mb-5"
            style={{ fontWeight: 500, letterSpacing: "-0.02em" }}
          >
            {title}
          </h2>
          <p className="text-base text-[#5f6368] mb-10" style={{ lineHeight: 1.65 }}>
            {description}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to={primaryTo}
              className="inline-flex items-center gap-2 h-11 px-7 bg-[#202124] text-white rounded-full text-sm font-medium hover:bg-[#000] transition-colors"
            >
              {primaryLabel} <ArrowRight className="w-4 h-4" />
            </Link>
            {secondaryLabel && (
              <Link
                to={secondaryTo}
                className="inline-flex items-center gap-1 h-11 px-5 text-sm font-medium text-[#3c4043] hover:text-[#1a73e8] transition-colors"
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