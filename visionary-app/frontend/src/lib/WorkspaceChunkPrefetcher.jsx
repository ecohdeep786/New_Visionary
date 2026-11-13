import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * FAP-73 — workspace idle chunk prefetch (parity with the public
 * RoutePrefetcher, Wave L1b / F-27).
 *
 * The six core workspace routes (/dashboard/learn, /dashboard/ask,
 * /dashboard/practice, /dashboard/build, /dashboard/progress,
 * /dashboard/career) are lazy chunks, so a first click into a workspace
 * fetches ~20-125KB before the route can mount — the window the branded
 * opening shell (WorkspaceOpening) covers. After the workspace shell has
 * settled we warm the SMALL set of most-likely-next chunks in the
 * background, using the exact same dynamic-import specifiers App.jsx and
 * DashboardHome.jsx use, so later navigations mount instantly.
 *
 * Same discipline as RoutePrefetcher: only from the workspace landing
 * (/dashboard or /dashboard/home), skipped on save-data / slow
 * connections, and paced — only after a 2.5s settle, then on an idle
 * callback with a bounded timeout, so it never shares the first-paint
 * wire window with the shell the user is looking at.
 */

/* The most likely next navigations from the workspace home. WorkspaceTools
   covers /dashboard/progress (and the other tool areas); Guide covers
   /dashboard/ask (lazy inside DashboardHome). */
const PRIORITY_WORKSPACE_CHUNKS = () => [
  import("@/pages/dashboard/Learn"),
  import("@/pages/dashboard/Practice"),
  import("@/pages/dashboard/ArtifactStudio"),
  import("@/pages/dashboard/WorkspaceTools"),
  import("@/pages/dashboard/Guide"),
];

const connectionAllowsPrefetch = () => {
  const c = navigator.connection;
  if (!c) return true;
  if (c.saveData) return false;
  return !["slow-2g", "2g"].includes(c.effectiveType);
};

export function WorkspaceChunkPrefetcher() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname !== "/dashboard" && pathname !== "/dashboard/home") return undefined;
    if (!("requestIdleCallback" in window) || !connectionAllowsPrefetch()) return undefined;
    let cancelled = false;
    let idleId = null;
    let settleId = null;
    const run = () => {
      if (cancelled) return;
      for (const load of PRIORITY_WORKSPACE_CHUNKS()) load.catch(() => {});
    };
    const schedule = () => {
      settleId = window.setTimeout(() => {
        if (cancelled) return;
        idleId = window.requestIdleCallback(run, { timeout: 2000 });
      }, 2500);
    };
    schedule();
    return () => {
      cancelled = true;
      if (settleId !== null) window.clearTimeout(settleId);
      if (idleId !== null) window.cancelIdleCallback(idleId);
    };
  }, [pathname]);
  return null;
}
