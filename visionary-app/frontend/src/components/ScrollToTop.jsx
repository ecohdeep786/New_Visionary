import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const getHashId = (hash) => {
  const rawId = hash.slice(1);

  try {
    return decodeURIComponent(rawId);
  } catch {
    return rawId;
  }
};

const prefersReducedMotion = () =>
  typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function ScrollToTop() {
  const { pathname, hash, key } = useLocation();
  const navigationType = useNavigationType();
  /* F-09-D1: the browser's native anchor scroll on a direct URL load runs
   * against the pre-hydration layout; fonts and images then grow the page
   * above the target, leaving it above the viewport (measured: /download#platforms
   * landed at -110px and never corrected, while a post-settle scrollIntoView
   * landed correctly). Re-land the hash target once after the first content
   * paint, honoring the user's motion preference. */
  const pendingHashLanding = useRef(Boolean(hash));

  useEffect(() => {
    if (pathname === "/" && (hash === "#lesson-example" || hash === "#audiences")) {
      pendingHashLanding.current = false;
      const focusSection = () => {
        const section = document.getElementById(getHashId(hash));
        if (!section) return false;
        section.focus({ preventScroll: true });
        section.scrollIntoView({ block: "start", behavior: prefersReducedMotion() ? "instant" : "smooth" });
        return true;
      };
      if (focusSection()) return;
      // A direct link may arrive before the audience gallery's chunk has mounted.
      const observer = new MutationObserver(() => {
        if (focusSection()) observer.disconnect();
      });
      observer.observe(document.getElementById("root"), { childList: true, subtree: true });
      return () => observer.disconnect();
    }
    if (pendingHashLanding.current && hash) {
      pendingHashLanding.current = false;
      const id = getHashId(hash);
      const timer = window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
      }, 350);
      return () => window.clearTimeout(timer);
    }
    pendingHashLanding.current = false;

    if (navigationType === "POP") return;

    if (hash) {
      const id = getHashId(hash);
      const timer = window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
      }, 50);
      return () => window.clearTimeout(timer);
    }

    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash, key, navigationType]);

  return null;
}
