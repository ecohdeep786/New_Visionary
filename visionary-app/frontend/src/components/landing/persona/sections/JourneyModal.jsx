import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { PillButton } from "@/components/landing/system/ui";
import ChevronIcon from "./ChevronIcon.jsx";
import { color } from "@/components/landing/system/tokens";

/* The stage's story popup — Apple's modal-story anatomy (measured on the
   education-initiative card click-through): a full-screen WHITE blur
   curtain (rgba(255,255,255,0.48) over blur(20px)), the white panel inset
   16px at radius 30px, the media full-bleed at the panel's top edge with
   the stage chip over its own smoke, then the story zone: 48px/600
   heading, 17px body, the canonical black primary pill, and the feature
   blocks. Close is Apple's bare glyph over the media. Escape and the
   backdrop close it; focus is trapped and restored. */
const JourneyModal = React.memo(function JourneyModal({ stage, onClose, modals, stageMeta, fallbackKey, secondaryLabel }) {
  const closeRef = useRef(null);
  useEffect(() => {
    const previouslyFocused = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;
      const dialog = document.querySelector('[role="dialog"][aria-modal="true"]');
      if (!dialog) return;
      const focusables = [...dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((el) => !el.disabled);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  const content = modals[stage.title];
  const meta = stageMeta[stage.title] || stageMeta[fallbackKey];
  if (!content) return null;
  const secondary = content.primary.to === "/how-it-works"
    ? { label: secondaryLabel, to: "/register" }
    : { label: "See how it works", to: "/how-it-works" };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[rgba(255,255,255,0.48)] backdrop-blur-[20px] p-4" role="dialog" aria-modal="true" aria-labelledby="journey-modal-title">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close dialog"
        onClick={onClose}
        className="fixed inset-0 h-full w-full cursor-default"
      />

      <div
        className="relative mx-auto my-4 max-h-[calc(100vh-32px)] w-full max-w-[1080px] overflow-hidden rounded-[30px] bg-white"
        style={{ animation: "heroFadeUp 0.4s var(--ease-out-apple) both" }}
      >
        <div className="max-h-[calc(100vh-32px)] overflow-y-auto">
          {/* the close — Apple's bare modal glyph, top-right over the media */}
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center text-white [filter:drop-shadow(0_1px_4px_rgba(0,0,0,0.45))] transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          {/* media full-bleed to the panel's top/side edges. Apple's story
              modal clips the media by its OWN rounded container (the
              `.modal-contents` overflow:hidden + border-radius:30px), so the
              popup's top border reads cleanly rounded even though the white
              card behind it is separate — we mirror that exactly. */}
          <div className="relative overflow-hidden rounded-[30px]">
            <img src={stage.image} alt={stage.alt} className="aspect-[16/9] w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-[rgba(0,0,0,0.7)] to-transparent" aria-hidden="true" />
            <span
              className="absolute bottom-5 left-6 inline-flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-1.5 text-[14px] font-medium tracking-[0] sm:left-9"
              style={{ color: color.ink }}
            >
              <meta.Icon aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.75} style={{ color: color.ink }} />
              Visionary for {stage.title}
            </span>
          </div>

          {/* the story zone — Apple's measured breath, text inset from the
              panel edges; heading at the 48/600 story tier, body 17px */}
          <div className="px-6 pb-12 pt-10 sm:px-12 sm:pb-14 lg:px-16 lg:pb-[72px] lg:pt-14">
            <h3 id="journey-modal-title" data-type="story" className="max-w-[760px]" style={{ color: color.ink }}>
              {content.top}
              <br />
              <span className="accent-gradient">{content.accent}</span>
            </h3>

            <p className="mt-6 max-w-[680px] font-normal tracking-[0] leading-[25px] text-[17px]" style={{ color: color.ink }}>
              {content.intro}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <PillButton to={content.primary.to}>{content.primary.label}</PillButton>
              <PillButton to={secondary.to} variant="outline">{secondary.label}</PillButton>
            </div>

            <div className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2">
              {content.blocks.map((b) => (
                <div key={b.t} className="border-t pt-6" style={{ borderColor: color.mist }}>
                  <div className="flex items-start gap-4">
                    <b.Icon aria-hidden="true" className="mt-0.5 h-6 w-6 shrink-0" strokeWidth={1.75} style={{ color: color.ink }} />
                    <div className="min-w-0">
                      <h4 className="text-[17px] font-semibold leading-[21px] tracking-[-0.01em]" style={{ color: color.ink }}>
                        {b.t}
                      </h4>
                      <p className="mt-2 font-normal tracking-[0] leading-[1.5] text-[16px]" style={{ color: color.slate }}>
                        {b.c}
                      </p>
                      <Link
                        to={b.to}
                        className="mt-3 inline-flex items-center gap-1.5 text-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc]"
                        style={{ color: color.link }}
                      >
                        {b.l}
                        <ChevronIcon className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
export default JourneyModal;
