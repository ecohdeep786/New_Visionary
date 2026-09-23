import { useEffect } from "react";

/**
 * Idle route-chunk prefetch (07-perf, Wave L1b).
 *
 * Every landing route is a lazy chunk, so a first click fetches ~5-55KB before
 * the page can mount. After the browser goes idle we warm those chunks in the
 * background — the exact same dynamic-import specifiers App.jsx uses, so the
 * browser fetches the identical URLs and later navigations mount instantly.
 *
 * Skipped on save-data / slow connections so we never spend a constrained
 * user's bandwidth on pages they may not visit.
 */
const ROUTE_CHUNKS = () => [
  import("@/pages/Landing"),
  import("@/pages/landing/StudentPage"),
  import("@/pages/landing/TeacherPage"),
  import("@/pages/landing/ParentPage"),
  import("@/pages/landing/CollegePage"),
  import("@/pages/landing/CoachingPage"),
  import("@/pages/landing/OrganizationPage"),
  import("@/pages/landing/AboutUsPage"),
  import("@/pages/landing/AILearningPage"),
  import("@/pages/landing/DownloadPage"),
  import("@/pages/landing/CareersPage"),
  import("@/pages/landing/ResearchNewsPage"),
  import("@/pages/landing/CommunityPage"),
  import("@/pages/landing/ContactPage"),
  import("@/pages/landing/PartnersPage"),
  import("@/pages/landing/UpdatesPage"),
  import("@/pages/landing/ReferralPage"),
  import("@/pages/landing/SafetyPage"),
  import("@/pages/landing/PrivacyPage"),
  import("@/pages/landing/TermsPage"),
  import("@/pages/landing/SecurityPage"),
  import("@/pages/landing/AccessibilityPage"),
  import("@/pages/landing/CookiesPage"),
  import("@/pages/landing/SchoolPage"),
];

const connectionAllowsPrefetch = () => {
  const c = navigator.connection;
  if (!c) return true;
  if (c.saveData) return false;
  return !["slow-2g", "2g"].includes(c.effectiveType);
};

export function RoutePrefetcher() {
  useEffect(() => {
    if (!("requestIdleCallback" in window) || !connectionAllowsPrefetch()) return undefined;
    const run = () => { for (const load of ROUTE_CHUNKS()) load.catch(() => { }); };
    const id = window.requestIdleCallback(run, { timeout: 3000 });
    return () => window.cancelIdleCallback(id);
  }, []);
  return null;
}
