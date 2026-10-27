import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useRevealOnce } from "@/components/landing/system/hooks";
import ScrollReveal from "../sections/ScrollReveal.jsx";
import RevealItem from "../sections/RevealItem.jsx";
import { color } from "@/components/landing/system/tokens";
import LazyImage from "@/components/landing/LazyImage";

/* ═══════════════════════ 09 · ACHIEVEMENT ═══════════════════════
   Apple's Watch-page closing module ("Made for each other."), measured live
   Oct 2026: the statement IS the chapter opener (no eyebrow, no subhead — type
   is the hero), set on the same left spine as the one module below it. One
   rounded container on the flat white ground holds the whole chapter: an
   accordion column left (statement-size titles, hairline separators, compact
   dark chevrons, 18px body) beside the visual where all color lives. No links
   — the page's CTAs live in their own chapters. */
function PremiumAchievementSection({ heading, tabs, images }) {
  const { ref } = useRevealOnce();
  const [active, setActive] = useState(0);

  return (
    <section ref={ref} data-section="09-achievement" className="relative isolate bg-white py-24 lg:py-32 [overflow-x:clip]">
      <ScrollReveal>
        <div className="mx-auto w-full max-w-[1265px] px-6 lg:px-[80px]">
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
          <div className="mt-14 overflow-hidden rounded-[30px] bg-[#f5f5f7] lg:mt-24 lg:h-[760px]">
            <div className="grid h-full grid-cols-1 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:items-stretch">
              <ul className="flex flex-col justify-center px-6 py-6 lg:px-0 lg:py-10 lg:pl-[80px] lg:pr-[44px]">
                {tabs.map((tab, i) => {
                  const isOpen = active === i;
                  return (
                    <li key={tab.title} className="border-t first:border-t-0 lg:first:border-t-0" style={{ borderColor: `${color.ink}29` }}>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => setActive(i)}
                        className="flex w-full items-start justify-between gap-4 py-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-4 lg:py-8"
                      >
                        <span
                          data-type="feature"
                          style={{ color: color.ink, maxWidth: "28ch" }}
                        >
                          {tab.title}
                        </span>
                        <ChevronDown
                          aria-hidden="true"
                          className={`mt-2 h-4 w-4 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                          style={{ color: "#6e6e73" }}
                          strokeWidth={2.5}
                        />
                      </button>
                      <div className={`grid transition-all duration-500 ease-apple ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                        <div className="overflow-hidden">
                          <p
                            className="pb-9 text-balance font-normal tracking-[0] leading-[1.4] text-[18px]"
                            style={{ color: color.ink, maxWidth: "35ch" }}
                          >
                            {tab.copy}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="relative min-h-[420px] lg:min-h-0">
                {/* the visual — a white media card inset on the grey ground
                    (Apple's card-in-module treatment): the full photo shows,
                    nothing cropped, its own white studio field merging into
                    the card so no frame edge ever reads */}
                <div key={active} className="hero-fade-up absolute inset-4 overflow-hidden rounded-[20px] bg-white sm:inset-6 lg:inset-10">
                  <LazyImage
                    key={active}
                    src={images[active]}
                    alt={tabs[active].title}
                    decoding="async"
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </RevealItem>
        </div>
      </ScrollReveal>
    </section>
  );
}
export default PremiumAchievementSection;
