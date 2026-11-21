import React from "react";
import { Link } from "react-router-dom";
import { useRevealOnce } from "@/components/landing/system/hooks";
import ScrollReveal from "../sections/ScrollReveal.jsx";
import RevealItem from "../sections/RevealItem.jsx";
import ChevronIcon from "../sections/ChevronIcon.jsx";
import { color } from "@/components/landing/system/tokens";

/* ═══════════════════════ 11 · TRUST ═══════════════════════
   Apple's education-page values anatomy ("Our values lead the way.",
   measured 2026-11-21): the statement opens left on the spine, then the
   values stand directly on the ground as typographic columns — bare mark,
   noun title, one supporting sentence, one quiet link — separated by
   hairline rules. No panel, no chips, no cards: the type carries the trust.
   The landing and every persona page render this one anatomy, so the
   product reads as a single family (the retired "feature" panel variant
   was the landing-only deviation from the measured grammar). */
function PremiumTrustSection({ heading, sub, values }) {
  const { ref } = useRevealOnce();

  return (
    <section ref={ref} data-section="11-trust" className="public-values relative isolate bg-white py-24 lg:py-32 [overflow-x:clip] rounded-t-[32px]">
      <ScrollReveal>
        <div className="public-editorial-frame mx-auto">
          <RevealItem idx={0}>
            <h2
              data-type="section"
              className="text-balance font-semibold"
              style={{ color: color.ink, maxWidth: "24ch" }}
            >
              {heading}
            </h2>
          </RevealItem>
          <RevealItem idx={1}>
            <p
              className="text-balance mt-[var(--gap-title-sub-display)] max-w-[40ch] font-normal tracking-[0] leading-[1.4] text-[18px]"
              style={{ color: color.slate }}
            >
              {sub}
            </p>
          </RevealItem>

          {/* the values — typographic columns on the ground, hairline rules.
              Four values (the landing's trust doors) open a fourth column;
              the three-value pages keep their accepted three-up rhythm. */}
          <RevealItem idx={2} className="stagger-group">
            <div className={`mt-14 grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2 lg:mt-20 lg:gap-x-14 ${values.length > 3 ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}>
              {values.map((value, i) => (
                <article
                  key={value.title}
                  className={`stagger-child py-10 first:pt-0 lg:py-0 lg:px-10 lg:first:pl-0 lg:last:pr-0 ${i > 0 ? "border-t lg:border-t-0 lg:border-l" : ""}`}
                  style={{ borderColor: `${color.ink}1A` }}
                >
                  {value.Icon && <value.Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} style={{ color: color.ink }} />}
                  <h3 data-type="value-title" className={value.Icon ? "mt-4" : "mt-0"} style={{ color: color.ink }}>
                    {value.title}
                  </h3>
                  <p data-type="value-body" className="mt-2 max-w-[35ch] text-balance" style={{ color: color.slate }}>
                    {value.copy}
                  </p>
                  <Link
                    to={value.to}
                    aria-label={`About ${value.title.toLowerCase()}`}
                    className="mt-4 relative after:absolute after:-inset-y-3 after:-inset-x-2 inline-flex items-center gap-1.5 text-[18px] font-medium tracking-[0] text-[#0066cc] transition-colors duration-200 hover:text-[#0071e3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
                  >
                    About {value.title}
                    <ChevronIcon className="h-4 w-4" />
                  </Link>
                </article>
              ))}
            </div>
          </RevealItem>
        </div>
      </ScrollReveal>
    </section>
  );
}
export default PremiumTrustSection;
