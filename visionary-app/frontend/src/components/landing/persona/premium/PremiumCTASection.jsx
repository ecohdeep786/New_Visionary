import React from "react";
import { Link } from "react-router-dom";
import { useRevealOnce } from "@/components/landing/system/hooks";
import ScrollReveal from "../sections/ScrollReveal.jsx";
import RevealItem from "../sections/RevealItem.jsx";
import ChevronIcon from "../sections/ChevronIcon.jsx";
import { color } from "@/components/landing/system/tokens";

/* ═══════════════════════ 12 · CTA ═══════════════════════
   The closer bookends the hero on Apple's product-hero anatomy: the statement
   opens the chapter (no eyebrow), one text-only primary pill with one quiet
   path beside it, and the small print beneath — the way Apple's product
   heroes pair "Learn more" with a quiet "Buy". An optional routeLinks row re-offers the page's forks under the actions — Apple's tail mini-router. */
function PremiumCTASection({ heading, sub, routeLinks, variant }) {
  const { ref } = useRevealOnce();
  const closing = variant === "closing";
  return (
    <section
      ref={ref}
      data-section="12-cta"
      className={
        closing
          ? "scene-dark relative isolate overflow-hidden px-6 py-24 lg:py-32"
          : "relative isolate bg-[#f5f5f7] px-6 py-24 lg:py-32 rounded-t-[32px]"
      }
    >
      {/* The landing's ceremonial close — Beats'/Apple's black closing band:
          one line, one pair of actions, the product's own breath of light
          beneath, and the orbit's two faint rings crossing the lower third.
          No grid, no columns: the page ends on a moment, not another reading
          task. */}
      {closing ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div
            className="absolute left-1/2 top-[-16%] -translate-x-1/2 rounded-full"
            style={{
              width: "min(115vw, 820px)",
              height: "min(115vw, 820px)",
              background: "radial-gradient(circle at 50% 48%, rgba(0,102,204,0.20) 0%, rgba(0,102,204,0.06) 44%, rgba(10,13,20,0) 72%)",
            }}
          />
          <div
            className="absolute left-1/2 top-[64%] -translate-x-1/2 rounded-full border"
            style={{
              width: "min(140vw, 1240px)",
              height: "min(140vw, 1240px)",
              borderColor: "rgba(138,180,248,0.12)",
            }}
          />
          <div
            className="absolute left-1/2 top-[64%] -translate-x-1/2 rounded-full border"
            style={{
              width: "min(104vw, 900px)",
              height: "min(104vw, 900px)",
              borderColor: "rgba(138,180,248,0.07)",
            }}
          />
        </div>
      ) : null}
      <ScrollReveal>
        <div
          className={`mx-auto max-w-[1500px] text-center ${
            closing ? "relative flex min-h-[clamp(280px,36svh,420px)] flex-col justify-center" : ""
          }`}
        >
          <RevealItem idx={0}>
            <h2
              data-type="section"
              className={`text-balance font-semibold ${closing ? "text-white" : ""}`}
              style={{ color: closing ? "#f5f5f7" : color.ink, maxWidth: "24ch", marginInline: "auto" }}
            >
              {heading}
            </h2>
          </RevealItem>
          <RevealItem idx={1}>
          {closing ? (
            /* body copy, not the page lead — the close keeps one loud voice */
            <div>
              <p className="text-balance mx-auto mt-[var(--gap-title-sub-display)] max-w-[46ch] font-normal tracking-[0] leading-[1.5] text-[19px] text-white/70">
                {sub}
              </p>
            </div>
          ) : (
            <p
              className="text-balance mx-auto mt-[var(--gap-title-sub-display)] max-w-[40ch] font-normal tracking-[0] leading-[1.4] text-[18px]"
              style={{ color: color.slate }}
            >
              {sub}
            </p>
          )}
          </RevealItem>
          <RevealItem idx={2}>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/register"
              className={`inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full px-[21px] font-medium text-[17px] leading-[1.176] tracking-[-0.011em] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2 max-[390px]:w-full max-[390px]:max-w-[320px] ${
                closing ? "bg-white text-[#1d1d1f] hover:bg-[#f5f5f7]" : "bg-[#1d1d1f] text-white hover:bg-[#272729]"
              }`}
            >
              Get started
            </Link>
            <Link
              to="/contact"
              className={`inline-flex h-12 items-center justify-center gap-1.5 whitespace-nowrap px-4 text-[18px] font-medium tracking-[0] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2 max-[390px]:w-full max-[390px]:max-w-[320px] ${
                closing ? "text-[#2997ff] hover:text-[#6bb6ff]" : "text-[#0066cc] hover:text-[#0071e3]"
              }`}
            >
              Talk to our team
              <ChevronIcon className="h-4 w-4" />
            </Link>
          </div>
          </RevealItem>
          <RevealItem idx={3}>
          {routeLinks?.length ? (
            <p
              className={`mt-8 text-center font-normal tracking-[0] text-[16px] leading-[1.5] ${closing ? "text-white/50" : ""}`}
              style={closing ? undefined : { color: color.slate }}
            >
              See how it works for{" "}
              {routeLinks.map((route, i) => (
                <React.Fragment key={route.to}>
                  <Link
                    to={route.to}
                    className={`relative after:absolute after:-inset-y-3 after:-inset-x-1.5 rounded font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2 ${
                      closing ? "text-[#2997ff] hover:text-[#6bb6ff]" : "text-[#0066cc] hover:text-[#0071e3]"
                    }`}
                  >
                    {route.label}
                  </Link>
                  {i < routeLinks.length - 1 ? <span aria-hidden="true">{"\u00A0· "}</span> : null}
                </React.Fragment>
              ))}
            </p>
          ) : null}
          <p
            className={`mt-8 text-center font-normal tracking-[0] text-[14px] leading-[1.5] ${closing ? "text-white/45" : ""}`}
            style={closing ? undefined : { color: color.slate }}
          >
            Free to start. Private by design.
          </p>
          </RevealItem>
        </div>
      </ScrollReveal>
    </section>
  );
}
export default PremiumCTASection;
