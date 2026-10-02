import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Cycles an index through `total` slides every `intervalMs`. Pass a falsy
 * interval to pause the rotation. Returns the index plus a manual goTo().
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
  }, [total, intervalMs, index]);
  return { index, goTo };
}

/**
 * Reveals content once when it enters the viewport. Pairs with the
 * `.hero-fade-up` classes on the children for the rise transition.
 */
export function useRevealOnce(rootMargin = "0px 0px -10% 0px") {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
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
 * content that should animate every time it scrolls into frame.
 */
export function useRevealContinuous(rootMargin = "-40% 0px -10% 0px") {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) {
      setVisible(true);
      return undefined;
    }
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0, rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);
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
