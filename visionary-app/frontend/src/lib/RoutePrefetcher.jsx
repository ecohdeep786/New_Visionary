import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Idle route-chunk prefetch (07-perf, Wave L1b).
 *
 * Every landing route is a lazy chunk, so a first click fetches ~5-55KB before
 * the page can mount. After the browser goes idle we warm a SMALL set of
 * high-priority chunks in the background — the exact same dynamic-import
 * specifiers App.jsx uses, so the browser fetches the identical URLs and later
 * navigations mount instantly.
 *
 * Only the most likely-next navigation targets are prefetched to avoid
 * downloading 5+MB of content the user may never visit. Skipped on
 * save-data / slow connections so we never spend a constrained user's
 * bandwidth on pages they may not visit.
 */

/* Only prefetch the most common navigation targets — about, privacy, safety,
   and the persona pages. These account for ~95% of landing-page clicks and
   keep the prefetch budget under ~150KB instead of pulling all 23 chunks. */
const PRIORITY_ROUTE_CHUNKS = () => [
  import("@/pages/landing/AboutUsPage"),
  import("@/pages/landing/PrivacyPage"),
  import("@/pages/landing/SafetyPage"),
  import("@/pages/landing/StudentPage"),
  import("@/pages/landing/TeacherPage"),
  import("@/pages/landing/ParentPage"),
  import("@/pages/landing/OrganizationPage"),
];

const connectionAllowsPrefetch = () => {
  const c = navigator.connection;
  if (!c) return true;
  if (c.saveData) return false;
  return !["slow-2g", "2g"].includes(c.effectiveType);
};

export function RoutePrefetcher() {
  const { pathname } = useLocation();
  useEffect(() => {
    // Don't prefetch if we're already on the landing page
    if (pathname !== "/") return;
    if (!("requestIdleCallback" in window) || !connectionAllowsPrefetch()) return undefined;
    /* D3 LCP law (2026-10-27): this prefetch used to fire inside the landing
       LCP window — at ~4.5s under Fast 3G throttle it raced the mount path
       through the shared pipe (observed: 7 route chunks streamed while the
       hero was still being laid out). It now paces itself: only after the
       load event settles for another 3s, and then only on an idle callback,
       so the 2.5s LCP target never shares its wire window. */
    let cancelled = false;
    let idleId = null;
    let settleId = null;
    const run = () => {
      if (cancelled) return;
      for (const load of PRIORITY_ROUTE_CHUNKS()) load.catch(() => {});
    };
    const schedule = () => {
      settleId = window.setTimeout(() => {
        if (cancelled) return;
        idleId = window.requestIdleCallback(run, { timeout: 2000 });
      }, 3000);
    };
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
    return () => {
      cancelled = true;
      if (settleId !== null) window.clearTimeout(settleId);
      if (idleId !== null) window.cancelIdleCallback(idleId);
    };
  }, [pathname]);
  return null;
}
