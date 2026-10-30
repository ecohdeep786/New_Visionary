import React from "react";
import { Link } from "react-router-dom";
import { useRevealOnce } from "@/components/landing/system/hooks";
import ScrollReveal from "../sections/ScrollReveal.jsx";
import RevealItem from "../sections/RevealItem.jsx";
import ChevronIcon from "../sections/ChevronIcon.jsx";
import { color } from "@/components/landing/system/tokens";

/* ═══════════════════════ 11 · TRUST ═══════════════════════
   Apple's education-page values anatomy ("Our values lead the way."): the
   statement opens left on the spine with no eyebrow, then the values stand
   directly on the white ground as typographic columns — noun title, one
   supporting sentence in Apple's first-person voice, one quiet link —
   separated by hairline rules. No icons and no cards: the type carries the
   trust. (Icons keep the student page's quiet 20px line, nothing more.) */
function PremiumTrustSection({ heading, sub, values, variant }) {
  const { ref } = useRevealOnce();
  const feature = variant === "feature";

  const headingBlock = (
    <RevealItem idx={0}>
      <h2
        data-type="section"
        className="text-balance font-semibold"
        style={{ color: color.ink, maxWidth: "24ch" }}
      >
        {heading}
      </h2>
    </RevealItem>
  );

  const subBlock = (
    <RevealItem idx={1}>
      <p
        className={`text-balance mt-[var(--gap-title-sub-display)] font-normal tracking-[0] leading-[1.4] text-[18px] ${feature ? "max-w-[52ch]" : "max-w-[40ch]"}`}
        style={{ color: color.slate }}
      >
        {sub}
      </p>
    </RevealItem>
  );

  /* The feature card's supporting line is body copy, not the page's semibold
     lead — the extra wrapper keeps it out of the h2-lead role so the panel's
     statement stays the only loud voice in the card. */
  const featureSubBlock = (
    <RevealItem idx={1}>
      <div>
        <p
          className="text-balance mt-[var(--gap-title-sub-display)] max-w-[34ch] font-normal tracking-[0] leading-[1.5] text-[19px]"
          style={{ color: color.slate }}
        >
          {sub}
        </p>
      </div>
    </RevealItem>
  );

  return (
    <section ref={ref} data-section="11-trust" className="public-values relative isolate bg-white py-24 lg:py-32 [overflow-x:clip] rounded-t-[32px]">
      <ScrollReveal>
        {feature ? (
          /* The landing's feature-card variant — Apple Watch's close-card
             anatomy: the values stop being four columns on the page and become
             one designed panel on the white ground. The statement heads the
             card, then the four marks stand in a 2×2 Why-grid, each in the
             public pages' own icon vocabulary. The persona pages keep the
             typographic anatomy below. */
          <div className="public-editorial-frame mx-auto">
            <div className="rounded-[1.75rem] bg-[#f5f5f7] px-5 py-9 sm:px-10 sm:py-12 lg:px-16 lg:py-16">
              <div className="grid gap-y-0 min-[1069px]:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)] min-[1069px]:items-end min-[1069px]:gap-x-14">
                {headingBlock}
                {featureSubBlock}
              </div>
              <RevealItem idx={2} className="stagger-group">
                <div
                  className="mt-10 grid grid-cols-1 gap-x-10 gap-y-8 border-t pt-9 sm:grid-cols-2 lg:mt-12 lg:gap-x-14 lg:gap-y-10 lg:pt-11"
                  style={{ borderColor: "rgba(18,19,23,0.08)" }}
                >
                  {values.map((value) => (
                    <article key={value.title} className="stagger-child flex items-start gap-4 sm:block">
                      <span
                        aria-hidden="true"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white sm:h-12 sm:w-12"
                        style={{ border: "1px solid rgba(18,19,23,0.05)", boxShadow: "0 1px 2px rgba(18,19,23,0.05)" }}
                      >
                        {value.Icon ? <value.Icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.55} style={{ color: color.ink }} /> : null}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 data-type="value-title" className="mt-0 sm:mt-5" style={{ color: color.ink }}>
                          {value.title}
                        </h3>
                        <p data-type="value-body" className="mt-2 max-w-[36ch] text-balance" style={{ color: color.slate }}>
                          {value.copy}
                        </p>
                        <Link
                          to={value.to}
                          aria-label={`About ${value.title.toLowerCase()}`}
                          className="mt-3 relative after:absolute after:-inset-y-3 after:-inset-x-2 inline-flex items-center gap-1.5 text-[18px] font-medium tracking-[0] text-[#0066cc] transition-colors duration-200 hover:text-[#0071e3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
                        >
                          About {value.title}
                          <ChevronIcon className="h-4 w-4" />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </RevealItem>
            </div>
          </div>
        ) : (
          <div className="public-editorial-frame mx-auto">
            {headingBlock}
            {subBlock}

            {/* the values — typographic columns on the ground, hairline rules.
                Four values (the landing's trust doors) open a fourth column;
                the three-value pages keep their accepted three-up rhythm. */}
            <RevealItem idx={2} className="stagger-group">
              <div className={`mt-14 grid grid-cols-1 lg:mt-20 ${values.length > 3 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
                {values.map((value, i) => (
                  <article
                    key={value.title}
                    className={`stagger-child py-10 first:pt-0 lg:py-0 lg:px-10 lg:first:pl-0 lg:last:pr-0 ${i > 0 ? "border-t lg:border-t-0 lg:border-l" : ""}`}
                    style={{ borderColor: `${color.ink}1A` }}
                  >
                    {value.Icon && <value.Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} style={{ color: color.ink }} />}
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
        )}
      </ScrollReveal>
    </section>
  );
}
export default PremiumTrustSection;
