import React, { useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { useRevealOnce, useHorizontalTrack as useScrollTrack } from "@/components/landing/system/hooks";
import ScrollReveal from "../sections/ScrollReveal.jsx";
import RevealItem from "../sections/RevealItem.jsx";
import ChevronIcon from "../sections/ChevronIcon.jsx";
import { color } from "@/components/landing/system/tokens";
import LazyImage from "@/components/landing/LazyImage";

const LANDING_AUDIENCE_SLUGS = ["student", "teacher", "parent", "professional", "organization"];

/* The shared persona pages keep their image-led sliding gallery. On the
   front door, people need to find their own path without swiping first, so
   the same destinations become a compact, responsive directory. */
function LandingAudienceDirectory({ categories, images }) {
  return (
    <div className="relative mt-12 lg:mt-16">
      <div className="mx-auto grid w-full max-w-[1265px] grid-cols-1 gap-3 px-6 sm:grid-cols-2 sm:gap-4 lg:grid-cols-6 lg:gap-5 lg:px-[80px] xl:grid-cols-10">
        {categories.map((category, index) => {
          const placement = index === 3
            ? "lg:col-start-2 xl:col-start-auto"
            : index === 4
              ? "lg:col-start-4 xl:col-start-auto"
              : "";
          return (
            <Link
              key={category.slug}
              to={`/${category.slug}`}
              className={`group flex min-h-24 items-center gap-4 rounded-[18px] border bg-white p-3 transition-colors duration-200 hover:bg-[#f5f5f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2 lg:col-span-2 ${placement} xl:flex-col xl:items-stretch xl:gap-0 xl:p-0`}
              style={{ borderColor: `${color.ink}14` }}
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[12px] bg-[#f5f5f7] xl:h-auto xl:w-full xl:aspect-[4/3] xl:rounded-b-none">
                <LazyImage
                  src={images[index]}
                  alt={category.alt}
                  decoding="async"
                  draggable="false"
                  className="absolute inset-0 h-full w-full select-none object-cover transition-transform duration-300 ease-apple group-hover:scale-[1.03]"
                />
              </div>
              <div className="min-w-0 flex-1 xl:p-4">
                <h3 data-type="feature" className="text-balance" style={{ color: color.ink }}>
                  {category.chip}
                </h3>
                <p className="mt-1 text-[14px] leading-5" style={{ color: color.slate }}>
                  {category.copy}
                </p>
                <span className="mt-2 inline-flex min-h-11 items-center gap-1 text-[14px] font-medium" style={{ color: color.link }}>
                  Explore this path
                  <ChevronIcon className="h-4 w-4" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* The image-led gallery remains available to persona pages; the landing
   directory below is intentionally not an automatic or drag-only control. */
function ExploreGallery({ categories, images, trackRef, update, onTrackPointerDown, onTrackPointerMove, onTrackPointerEnd, onTrackClickCapture, onDragStart, scrollByCard, canPrev, canNext }) {
  return (
    <div className="relative mt-12 lg:mt-16">
      <div
        ref={trackRef}
        onScroll={update}
        onPointerDown={onTrackPointerDown}
        onPointerMove={onTrackPointerMove}
        onPointerUp={onTrackPointerEnd}
        onPointerCancel={onTrackPointerEnd}
        onClickCapture={onTrackClickCapture}
        onDragStart={onDragStart}
        className="flex cursor-grab snap-x snap-mandatory gap-5 overflow-x-auto pb-2 pl-6 pr-6 select-none [scrollbar-width:none] active:cursor-grabbing [&::-webkit-scrollbar]:hidden lg:gap-6 lg:scroll-pl-[max(24px,calc((100vw-1265px)/2+80px))] lg:pl-[max(24px,calc((100vw-1265px)/2+80px))]"
      >
        {categories.map((category, index) => (
          <PremiumExploreCard key={category.slug} category={category} image={images[index]} />
        ))}
      </div>

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
  );
}

const PremiumExploreCard = React.memo(function PremiumExploreCard({ category, image }) {
  return (
    <Link
      to={`/${category.slug}`}
      data-card
      aria-label={`Learn more about ${category.chip}`}
      className="stagger-child group relative block w-[82vw] shrink-0 snap-start overflow-hidden rounded-[18px] bg-white transition-transform duration-300 ease-apple hover:-translate-y-1 sm:w-[88vw] sm:rounded-[22px] lg:w-[calc(100vw-315px)] lg:max-w-[1150px] lg:rounded-[28px]"
    >
      <div className="media-settle relative aspect-[4/5] overflow-hidden bg-white sm:aspect-[4/3] lg:aspect-[15/8]">
        <LazyImage
          src={image}
          alt={category.alt}
          decoding="async"
          draggable="false"
          className="absolute left-1/2 top-[15%] h-[112%] w-auto max-w-none -translate-x-1/2 select-none transition-transform duration-500 ease-apple lg:top-[14%] lg:h-[118%] group-hover:scale-[1.03]"
        />
      </div>
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-6 p-6 sm:p-8 lg:p-12">
        <div>
          <h3 data-type="feature" className="text-balance" style={{ color: color.ink, maxWidth: "18ch" }}>
            {category.chip}
          </h3>
        </div>
        <span className="mt-1 inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-[#1d1d1f] px-[21px] text-[17px] font-medium leading-[1.176] tracking-[-0.011em] text-white transition-colors duration-200 hover:bg-[#272729] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2 sm:h-9 lg:h-11 lg:text-[18px]">
          Learn more
        </span>
      </div>
    </Link>
  );
});

/* Props: heading, categories, images. Optional eyebrow + sub render the
   shared chapter header. Only the five real audience destinations on the
   landing switch to the all-at-once directory; persona pages retain the
   existing swipe gallery. */
function PremiumExploreSection({ heading, categories, images, eyebrow, sub, headingRole, subRole, presentation = "gallery", sectionId }) {
  const { ref } = useRevealOnce();
  const { trackRef, canPrev, canNext, scrollByCard, update } = useScrollTrack();
  const isLandingAudienceDirectory = presentation === "directory"
    && categories.length === LANDING_AUDIENCE_SLUGS.length
    && categories.every((category, index) => category.slug === LANDING_AUDIENCE_SLUGS[index]);

  const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: false });
  const onTrackPointerDown = useCallback((event) => {
    if (event.pointerType !== "mouse") return;
    drag.current = { active: true, startX: event.clientX, startLeft: trackRef.current.scrollLeft, moved: false };
  }, [trackRef]);
  const onTrackPointerMove = useCallback((event) => {
    const state = drag.current;
    if (!state.active) return;
    const dx = event.clientX - state.startX;
    if (Math.abs(dx) > 4 && !state.moved) {
      state.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (!state.moved) return;
    trackRef.current.scrollLeft = state.startLeft - dx;
  }, [trackRef]);
  const onTrackPointerEnd = useCallback(() => { drag.current.active = false; }, []);
  const onTrackClickCapture = useCallback((event) => {
    if (drag.current.moved && event.detail > 0) {
      event.preventDefault();
      event.stopPropagation();
      drag.current.moved = false;
    }
  }, []);
  const onDragStart = useCallback((event) => event.preventDefault(), []);

  return (
    <section ref={ref} id={sectionId} data-section="13-explore" className="relative isolate bg-[#f5f5f7] py-16 lg:py-24 [overflow-x:clip] rounded-t-[32px]">
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
              <div className="mt-[var(--gap-title-sub-display)]">
                <p data-type={subRole} className="text-balance max-w-[60ch]" style={{ color: color.slate }}>
                  {sub}
                </p>
              </div>
            ) : (
              <p className="text-balance mt-[var(--gap-title-sub-display)] max-w-[40ch] font-normal tracking-[0] leading-[1.4] text-[18px]" style={{ color: color.slate }}>
                {sub}
              </p>
            ))}
          </div>
        </RevealItem>
        <RevealItem idx={1} className="stagger-group">
          {isLandingAudienceDirectory ? (
            <LandingAudienceDirectory categories={categories} images={images} />
          ) : (
            <ExploreGallery
              categories={categories}
              images={images}
              trackRef={trackRef}
              update={update}
              onTrackPointerDown={onTrackPointerDown}
              onTrackPointerMove={onTrackPointerMove}
              onTrackPointerEnd={onTrackPointerEnd}
              onTrackClickCapture={onTrackClickCapture}
              onDragStart={onDragStart}
              scrollByCard={scrollByCard}
              canPrev={canPrev}
              canNext={canNext}
            />
          )}
        </RevealItem>
      </ScrollReveal>
    </section>
  );
}
export default PremiumExploreSection;