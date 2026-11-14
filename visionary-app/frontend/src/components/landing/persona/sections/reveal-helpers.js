import { useEffect, useRef, useState } from "react";

/* Apple's scroll reveal — after the hero, sections enter the viewport and
   their type/photography rise in place, one element at a time, on Apple's
   resolve-out curve. Blocks keep their layout while hidden (no collapse),
   the observer fires once, and the global reduced-motion contract snaps the
   transition to instant. This is the "scroll, then the text appears" beat.
   Shared reveal helpers for the persona section modules (F10 split: the
   helpers live beside their consumers, one copy, no side effects). */

export function revealStyle(entered, delay) {
  return {
    opacity: entered ? 1 : 0,
    transform: entered ? "none" : "translateY(26px)",
    transition: `opacity var(--motion-duration-cinematic) var(--ease-out-apple), transform var(--motion-duration-cinematic) var(--ease-out-apple)`,
    transitionDelay: `${delay}ms`,
    willChange: "opacity, transform",
  };
}

/* Apple's hero→next scroll-linked reveal (measured on the education-
   initiative page): the chapter that directly follows the full-view hero
   starts pinned invisible, then fades in as a continuous function of how
   far the hero has scrolled — the copy begins entering at 30% of the hero's
   height and completes at 90% (tween `opacity: [0,1]` over
   `css(--hero-scroll-distance) * 0.3 → * 0.9`, disabled when the hero is
   not full-viewport). No observer, no trigger: the reveal tracks the
   scrollbar, so any scroll gesture reads as one motion — the premium beat
   Apple uses between a hero and its story. Reduced motion shows the copy
   instantly, exactly like Apple's `disabledWhen` contract. `active=false`
   keeps the chapter always visible when the section above has no hero. */
export function useAppleLinkedReveal(active = true) {
  const ref = useRef(null);
  const [style, setStyle] = useState({ opacity: 0, transform: "translateY(12px)" });
  useEffect(() => {
    const el = ref.current;
    if (!active || !el || typeof window === "undefined") {
      if (!active) setStyle({ opacity: 1, transform: "none" });
      return undefined;
    }
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setStyle({ opacity: 1, transform: "none" });
      return undefined;
    }
    /* the section top in document coordinates = the height of the hero that
       immediately precedes it, since the persona hero fills the first viewport */
    const heroSpan = () => el.getBoundingClientRect().top + window.scrollY;
    let raf = 0;
    const update = () => {
      raf = 0;
      const H = heroSpan();
      let p = (window.scrollY - H * 0.3) / (H * 0.6);
      p = Math.min(1, Math.max(0, p));
      setStyle({ opacity: p, transform: `translateY(${(1 - p) * 12}px)` });
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [active]);
  return { ref, style };
}

/* The problem chapter's photograph mask — edge-dissolve recipe shared with
   the hero's floor (see the persona pages' Constitution). */
export const STRUGGLE_MASK = {
  WebkitMaskImage:
    "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%), linear-gradient(to bottom, black 78%, transparent 97%)",
  WebkitMaskComposite: "source-in",
  maskImage:
    "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%), linear-gradient(to bottom, black 78%, transparent 97%)",
  maskComposite: "intersect",
};
