import React, { useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useRevealOnce, useHorizontalTrack as useScrollTrack } from "@/components/landing/system/hooks";
import ScrollReveal from "../sections/ScrollReveal.jsx";
import RevealItem from "../sections/RevealItem.jsx";
import ChevronIcon from "../sections/ChevronIcon.jsx";
import { color } from "@/components/landing/system/tokens";
import LazyImage from "@/components/landing/LazyImage";

/* ═══════════════════════ 13 · EXPLORE ═══════════════════════
   The page's closing chapter — Apple's line-up gallery ("Explore the
   line-up."): white line-up cards run in one sliding row on the #f5f5f7
   ground — 372px cards at a 24px pitch, the first card opening on the
   statement's spine with the rest peeking past the right edge as the scroll
   affordance, snap points for the swipe, and centred round chevrons beneath. */

/* Apple's line-up card, measured on the Watch "Explore the line-up." module:
   a white card on the #f5f5f7 ground with the photograph full-bleed on top
   and the text band beneath — 24px/600 name, 17px grey line, quiet blue
   "Learn more" link with a trailing chevron. */
const PremiumExploreCard = React.memo(function PremiumExploreCard({ category, image }) {
  return (
    <Link
      to={`/${category.slug}`}
      data-card
      aria-label={`Learn more about ${category.chip}`}
      className="stagger-child group block w-[82vw] max-w-[372px] shrink-0 snap-start overflow-hidden rounded-[18px] bg-white transition-transform duration-300 ease-apple hover:-translate-y-1 sm:w-[372px]"
    >
      <div className="media-settle relative aspect-square overflow-hidden">
        <LazyImage
          src={image}
          alt={category.alt}
          decoding="async"
          draggable="false"
          className="h-full w-full select-none object-cover transition-transform duration-500 ease-apple group-hover:scale-[1.04]"
        />
      </div>
      <div className="p-7 lg:p-8">
        <h3
          data-type="feature"
          className="text-balance"
          style={{ color: color.ink, maxWidth: "18ch" }}
        >
          {category.chip}
        </h3>
        <p
          className="mt-2 text-balance font-normal tracking-[0] leading-[1.4] text-[18px]"
          style={{ color: color.slate, maxWidth: "38ch" }}
        >
          {category.copy}
        </p>
        <span
          className="public-text-link mt-4 inline-flex items-center transition-colors duration-200 group-hover:underline"
        >
          Learn more
          <ChevronIcon className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
});

/* Props: heading (node), categories, images. Optional eyebrow + sub render
   the same left-spined chapter header the site's other chapters carry — the
   landing's router uses them; persona pages pass neither, so their line-up
   header stays exactly the measured "Explore the line-up." anatomy.
   headingRole/subRole let a page bind the header to a measured public type
   role (the landing's router opens at Education's card-chapter tier and reads
   its intro at the editorial-body tier); omitted, nothing changes. */
function PremiumExploreSection({ heading, categories, images, eyebrow, sub, headingRole, subRole }) {
  const { ref } = useRevealOnce();
  const { trackRef, canPrev, canNext, scrollByCard, update } = useScrollTrack();

  /* mouse drag-to-slide — the cursor affordance Apple's galleries assume
     from a trackpad: press and slide, the row follows, links swallow the
     click when a drag actually happened */
  const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: false });
  const onTrackPointerDown = useCallback((e) => {
    if (e.pointerType !== "mouse") return;
    drag.current = { active: true, startX: e.clientX, startLeft: trackRef.current.scrollLeft, moved: false };
  }, [trackRef]);
  const onTrackPointerMove = useCallback((e) => {
    const d = drag.current;
    if (!d.active) return;
    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > 4 && !d.moved) {
      d.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (!d.moved) return;
    trackRef.current.scrollLeft = d.startLeft - dx;
  }, [trackRef]);
  const onTrackPointerEnd = useCallback(() => { drag.current.active = false; }, []);
  const onTrackClickCapture = useCallback((e) => {
    if (drag.current.moved && e.detail > 0) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  }, []);

  return (
    <section ref={ref} data-section="13-explore" className="relative isolate bg-[#f5f5f7] py-16 lg:py-24 [overflow-x:clip] rounded-t-[32px]">
      <ScrollReveal>
        <RevealItem idx={0}>
          <div className="mx-auto w-full max-w-[1265px] px-6 lg:px-[80px]">
            {eyebrow && (
              <p className="text-[17px] font-medium" style={{ color: color.slate }}>
                {eyebrow}
              </p>
            )}
            <h2
              data-type={headingRole}
              className="text-balance font-semibold"
              style={{ color: color.ink, maxWidth: "20ch", marginTop: eyebrow ? "var(--gap-eyebrow-title-display)" : undefined }}
            >
              {heading}
            </h2>
            {sub && (subRole ? (
              /* a bound role (Education's card-chapter intro) is not the
                 h2's semibold lead — the wrapper keeps it out of that role */
              <div className="mt-[var(--gap-title-sub-display)]">
                <p data-type={subRole} className="text-balance max-w-[60ch]" style={{ color: color.slate }}>
                  {sub}
                </p>
              </div>
            ) : (
              <p
                className="text-balance mt-[var(--gap-title-sub-display)] max-w-[40ch] font-normal tracking-[0] leading-[1.4] text-[18px]"
                style={{ color: color.slate }}
              >
                {sub}
              </p>
            ))}
          </div>
        </RevealItem>
        <RevealItem idx={1} className="stagger-group">
          <div className="relative mt-12 lg:mt-16">
            <div
              ref={trackRef}
              onScroll={update}
              onPointerDown={onTrackPointerDown}
              onPointerMove={onTrackPointerMove}
              onPointerUp={onTrackPointerEnd}
              onPointerCancel={onTrackPointerEnd}
              onClickCapture={onTrackClickCapture}
              onDragStart={(e) => e.preventDefault()}
              className="flex cursor-grab snap-x snap-mandatory gap-5 overflow-x-auto pb-2 pl-6 pr-6 select-none [scrollbar-width:none] active:cursor-grabbing [&::-webkit-scrollbar]:hidden lg:gap-6 lg:scroll-pl-[max(24px,calc((100vw-1265px)/2+80px))] lg:pl-[max(24px,calc((100vw-1265px)/2+80px))]"
            >
              {categories.map((c, index) => (
                <PremiumExploreCard key={c.slug} category={c} image={images[index]} />
              ))}
            </div>

            {/* the gallery controls — centred round chevrons under the row */}
            <div className="mt-9 flex items-center justify-center gap-5">
              <button
                type="button"
                aria-label="Previous destinations"
                onClick={() => scrollByCard(-1)}
                disabled={!canPrev}
                className="flex h-11 w-11 items-center justify-center rounded-full border transition-[opacity,transform] duration-200 hover:opacity-100 disabled:opacity-30 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
                style={{ borderColor: `${color.ink}33`, color: `${color.ink}99` }}
              >
                <ChevronIcon direction="left" className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next destinations"
                onClick={() => scrollByCard(1)}
                disabled={!canNext}
                className="flex h-11 w-11 items-center justify-center rounded-full border transition-[opacity,transform] duration-200 hover:opacity-100 disabled:opacity-30 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
                style={{ borderColor: `${color.ink}33`, color: `${color.ink}99` }}
              >
                <ChevronIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </RevealItem>
      </ScrollReveal>
    </section>
  );
}
export default PremiumExploreSection;
