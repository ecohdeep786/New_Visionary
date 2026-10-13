import { useEffect, useState } from "react";

const readReducedMotionPreference = () => {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * Decorative motion is disabled when the operating system requests it and
 * paused while the tab is in the background. Interactive controls still work.
 */
export function useCanAnimate() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(readReducedMotionPreference);
  const [isDocumentVisible, setIsDocumentVisible] = useState(() =>
    typeof document === "undefined" ? true : !document.hidden,
  );

  useEffect(() => {
    if (!window.matchMedia) return undefined;

    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(query.matches);
    updatePreference();
    query.addEventListener?.("change", updatePreference);

    return () => query.removeEventListener?.("change", updatePreference);
  }, []);

  useEffect(() => {
    const updateVisibility = () => setIsDocumentVisible(!document.hidden);
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);

    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  return !prefersReducedMotion && isDocumentVisible;
}
