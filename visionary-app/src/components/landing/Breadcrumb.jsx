import { Link, useLocation } from "react-router-dom";

/**
 * Shared breadcrumb — the Google wayfinding pattern (blog.google capture,
 * STEP 0): Home › {Section} › {Page}, 13px, current page ink + not a link.
 * Mobile truncates the middle crumb ("Home › … › Page"); never wraps.
 * Founder contract: section = parent hub (Company→About · Product→How it works ·
 * Support→Help · Legal→Privacy); ALL_UNDER_ABOUT flag defaults false.
 */
const CLUSTER = {
  privacy: ["Privacy", "/privacy"], terms: ["Privacy", "/privacy"],
  cookies: ["Privacy", "/privacy"], accessibility: ["Privacy", "/privacy"],
  pricing: ["How it works", "/how-it-works"], download: ["How it works", "/how-it-works"],
  safety: ["How it works", "/how-it-works"], security: ["How it works", "/how-it-works"],
  career: ["How it works", "/how-it-works"], referral: ["How it works", "/how-it-works"],
  updates: ["How it works", "/how-it-works"],
  careers: ["About", "/about"], research: ["About", "/about"],
  partners: ["About", "/about"], community: ["About", "/about"], contact: ["About", "/about"],
  help: null, "how-it-works": null,
};

export default function Breadcrumb({ section, page }) {
  const { pathname } = useLocation();
  const slug = pathname.split("/").filter(Boolean)[0] || "";
  const hub = section ?? CLUSTER[slug]?.[0] ?? null;
  const hubTo = section ? null : CLUSTER[slug]?.[1] ?? null;
  const crumbCls = "text-[13px] tracking-[0.1px] transition-colors hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-sm";
  return (
    <nav aria-label="Breadcrumb" className="w-full bg-white">
      <div className="mx-auto flex w-full max-w-[1240px] items-center gap-2 whitespace-nowrap px-6 pt-24 text-[13px] sm:px-8" style={{ color: "#5f6368" }}>
        <Link to="/" className={crumbCls} style={{ color: "#4285F4" }}>Home</Link>
        <span aria-hidden="true" className="text-[#9AA0A6]">›</span>
        {hub && (
          <>
            {/* middle crumb truncates on mobile; the page name always survives */}
            {hubTo ? (
              <Link to={hubTo} className={`${crumbCls} hidden max-w-[120px] truncate sm:inline`} style={{ color: "#4285F4" }}>{hub}</Link>
            ) : (
              <span className="max-w-[120px] truncate" style={{ color: "#5f6368" }}>{hub}</span>
            )}
            {hubTo && <span className="hidden text-[#9AA0A6] sm:inline" aria-hidden="true">›</span>}
          </>
        )}
        <span className="truncate" style={{ color: "#121317" }} aria-current="page">{page}</span>
      </div>
    </nav>
  );
}
