import { useLayoutEffect } from "react";

/* useSheetStack — the Apple Vision Pro page-over-page grammar.
   Each main [data-section] sheet scrolls normally until its bottom reaches
   the viewport bottom, then pins in place (transform-only) while the next
   sheet slides up over it. The first sheet (hero) freezes at its natural top
   the moment you scroll. Self-correcting: each frame re-derives the sheet's
   natural position from its live rect minus the current offset, so image and
   font reflows are absorbed without remeasuring. Transform-only: layout and
   total scroll length never change, so every section stays fully reachable.
   Disabled under prefers-reduced-motion (content scrolls statically). */
export default function useSheetStack() {
  useLayoutEffect(() => {
    const sections = Array.from(document.querySelectorAll("main [data-section]"));
    if (!sections.length) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const offsets = new Array(sections.length).fill(0);
    let raf = 0;
    const apply = () => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      for (let i = 0; i < sections.length; i++) {
        const rect = sections[i].getBoundingClientRect();
        const naturalBottom = rect.bottom + scrollY - offsets[i];
        /* pin by bottom once the sheet's bottom passes the viewport bottom;
           the clamp with scrollY makes the first sheet freeze at its top */
        const ty = Math.min(Math.max(0, scrollY - (naturalBottom - vh)), scrollY);
        if (Math.abs(ty - offsets[i]) > 0.5) {
          offsets[i] = ty;
          sections[i].style.transform = ty > 0.5 ? `translate3d(0, ${ty}px, 0)` : "";
        }
      }
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(apply);
    };
    const onResize = () => apply();
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("load", onResize);
    const settle = setTimeout(apply, 1200);
    return () => {
      clearTimeout(settle);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("load", onResize);
      cancelAnimationFrame(raf);
      sections.forEach((el) => { el.style.transform = ""; });
    };
  }, []);
}
