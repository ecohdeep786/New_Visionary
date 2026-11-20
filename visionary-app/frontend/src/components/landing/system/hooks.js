import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Reports prefers-reduced-motion reactively (matchMedia change aware).
 * Landing and the premium sections each carried identical locals — this is
 * the one shared implementation for the landing system.
 */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

/**
 * Cycles an index through `total` slides every `intervalMs`. Pass a falsy
 * interval to pause the rotation. Returns the index plus a manual goTo().
 * Auto-rotation must not gate on prefers-reduced-motion: environments that
 * report reduce without user intent (RDP/VM sessions, headless captures)
 * froze every persona ticker while the hero kept running. Motion itself is
 * already neutralised by the global reduced-motion CSS — swaps render
 * instantly, so only the text content advances.
 */
export function useCycleIndex(total, intervalMs) {
  const [index, setIndex] = useState(0);
  const goTo = useCallback(
    (i) => setIndex(((i % total) + total) % total),
    [total]
  );

  useEffect(() => {
    if (!intervalMs || intervalMs <= 0) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % total), intervalMs);
    return () => clearInterval(id);
  }, [total, intervalMs]);
  return { index, goTo };
}

/**
 * Reveals content once when it enters the viewport. Pairs with the
 * `.hero-fade-up` classes on the children for the rise transition.
 * Reveal law (KAN-210): starts visible — only a below-the-fold chapter is
 * hidden (after paint) until it scrolls into view.
 */
export function useRevealOnce(rootMargin = "0px 0px -10% 0px") {
  const ref = useRef(null);
  // Reveal law (KAN-210): content is in the visible first paint; the reveal
  // only animates. We start visible and, after mount, hide a chapter ONLY if
  // its top is still below the viewport (so nothing visible ever blinks) and
  // reveal it when the observer fires. No-JS, pre-hydration, print and
  // above-fold chapters stay visible throughout.
  const [visible, setVisible] = useState(true);
  const hasRevealed = useRef(false);
  useEffect(() => {
    const node = ref.current;
    if (hasRevealed.current) {
      setVisible(true);
      return undefined;
    }
    if (!node) {
      setVisible(true);
      return undefined;
    }
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      hasRevealed.current = true;
      return undefined;
    }
    let belowFold = false;
    try {
      belowFold = node.getBoundingClientRect().top > (window.innerHeight || document.documentElement.clientHeight || 0);
    } catch {
      belowFold = false;
    }
    if (!belowFold) {
      hasRevealed.current = true;
      setVisible(true);
      return undefined;
    }
    setVisible(false);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasRevealed.current) {
          setVisible(true);
          hasRevealed.current = true;
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);
  return { ref, visible };
}

/**
 * Tracks whether an element is currently in view (enters AND leaves), for
 * content that should animate every time it scrolls into frame. Under
 * prefers-reduced-motion the story stays present: no hiding.
 * IO can batch queued entries in one callback — entries[0] may be stale, so
 * the LATEST entry always wins (this is what makes the exit wipe actually
 * land after a fast scroll; consolidated from the landing page's local
 * implementation at A5 activation).
 */
export function useRevealContinuous(rootMargin = "-40% 0px -10% 0px") {
  const ref = useRef(null);
  const reduced = usePrefersReducedMotion();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (reduced) { setVisible(true); return undefined; }
    if (!node) { setVisible(true); return undefined; }
    if (typeof IntersectionObserver === "undefined") { setVisible(true); return undefined; }
    const observer = new IntersectionObserver(
      (entries) => setVisible(entries[entries.length - 1].isIntersecting),
      { threshold: 0, rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, reduced]);
  return { ref, visible };
}

/**
 * Watches up to `total` registered step nodes and reports the index of the
 * one nearest the viewport center. Register nodes with the returned setStepRef.
 */
export function useActiveStep(total) {
  const nodes = useRef([]);
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const i = Number(entry.target.dataset.step);
            if (!isNaN(i)) setActive(i);
          }
        }),
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    nodes.current.slice(0, total).forEach((n) => n && observer.observe(n));
    return () => observer.disconnect();
  }, [total]);
  const setStepRef = useCallback(
    (i) => (node) => {
      nodes.current[i] = node;
    },
    []
  );
  return { active, setStepRef };
}

/**
 * State + helpers for a snap carousel track: canPrev/canNext flags and
 * scrollByCard(direction) which advances exactly one card.
 */
export function useHorizontalTrack() {
  const trackRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const update = useCallback(() => {
    const t = trackRef.current;
    if (!t) return;
    setCanPrev(t.scrollLeft > 4);
    setCanNext(t.scrollLeft < t.scrollWidth - t.clientWidth - 4);
  }, []);
  useEffect(() => {
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, [update]);
  const scrollByCard = useCallback((dir) => {
    const t = trackRef.current;
    if (!t) return;
    const card = t.querySelector("[data-card]");
    if (!card) return;
    const gap = parseFloat(getComputedStyle(t).columnGap) || 0;
    t.scrollBy({
      left: dir * (card.getBoundingClientRect().width + gap),
      behavior: "smooth",
    });
  }, []);
  return { trackRef, canPrev, canNext, scrollByCard, update };
}

/** Index state for a stage switcher: goTo(i) with wraparound and step(±1). */
export function useStageIndex(total) {
  const [index, setIndex] = useState(0);
  const goTo = useCallback(
    (i) => setIndex(((i % total) + total) % total),
    [total]
  );
  const step = useCallback(
    (d) => setIndex((i) => (i + d + total) % total),
    [total]
  );
  return { index, goTo, step };
}

/**
 * Reveals content once when it enters the viewport. Pairs with the
 * `.hero-fade-up` classes on the children for the rise transition.
 * Returns { ref, entered } for ScrollReveal/RevealItem API compatibility.
 *
 * Reveal law (KAN-210): content is always in the visible first paint and the
 * reveal only animates. `armed` is set after paint, ONLY when the chapter's
 * top is still below the viewport — so no-JS, pre-hydration, print and
 * above-fold chapters never hide content, and CSS never needs an opacity-0
 * default. The scroll-reveal CSS hides solely `.reveal-armed:not(.in-view)`.
 */
export function useInViewOnce(threshold = 0.2) {
  const ref = useRef(null);
  const [entered, setEntered] = useState(false);
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setEntered(true);
      return undefined;
    }
    let belowFold = false;
    try {
      belowFold = el.getBoundingClientRect().top > (window.innerHeight || document.documentElement.clientHeight || 0);
    } catch {
      belowFold = false;
    }
    if (belowFold) setArmed(true);
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setEntered(true);
        io.disconnect();
      }
    }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, entered, armed };
}
