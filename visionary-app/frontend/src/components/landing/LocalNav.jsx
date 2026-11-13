import { Link, useLocation } from "react-router-dom";
import { fontStack } from "@/components/landing/system/tokens";

/**
 * LocalNav — the apple.com/in/privacy local-nav bar, single-sourced (FAP-59
 * phase 3, founder directive: "use the Apple privacy page nav bar on these
 * pages, not on research"). Measured from apple.com/in/privacy (2026-11-02):
 * a slim sticky bar pinned under the global nav — page title on the left
 * (21px/600 — their wordmark), quiet 12px/400 items on the right, hairline
 * rule at the bottom, ~52px tall overall. Dark there; ours is the light
 * system: white bar, ink title, grey items, ink active item.
 *
 * Anatomy law (one source; pages compose title/items, never re-declare):
 *   - Sticky at top:56px (LandingNav is fixed 56px tall) with a white
 *     surface; z-30 stays under the nav's z-50 and flyouts.
 *   - Title 21px/600 ink — Apple's measured local-nav wordmark size.
 *   - Items 12px/400 quiet grey, hover→ink, active→ink + 500 weight with
 *     aria-current="page"; every item keeps the full 44px tap target
 *     (h-11) on a 56px bar, so the Apple cadence and the taps law hold
 *     together — the same marriage the audience rail already uses.
 *   - The items row over-scrolls horizontally on narrow screens with the
 *     scrollbar hidden (PolicyTabs precedent); the page never grows.
 *
 * Default items are the four Visionary policy pages — the exact set the
 * old PolicyTabs switched between, relocated into the Apple bar shape
 * (their receipts live in git history). Accessibility composes its own
 * item list over the same default family.
 */
const DEFAULT_ITEMS = [
  { to: "/privacy", label: "Privacy policy" },
  { to: "/terms", label: "Terms of service" },
  { to: "/cookies", label: "Cookies" },
  { to: "/security", label: "Security" },
];

export default function LocalNav({ title, items = DEFAULT_ITEMS, className = "" }) {
  const { pathname } = useLocation();
  return (
    <nav
      aria-label={`${title} local bar`}
      className={`sticky z-30 bg-white ${className}`}
      style={{ top: 56, fontFamily: fontStack }}
    >
      {/* public-frame — the SAME container the LandingNav composes, so the
         bar's title, items and hairline align exactly with the main nav's
         content edges (founder directive 2026-11-03); the old
         max-w-[1240px] px-10 wrapper inset the content 40px further than
         the nav above it. */}
      <div className="public-frame">
        <div className="flex h-14 items-center justify-between gap-6 border-b border-[rgba(18,19,23,0.12)]">
          <span className="shrink-0 whitespace-nowrap text-[21px] font-semibold leading-none tracking-[-0.01em] text-[#1d1d1f]">
            {title}
          </span>
          <div className="flex max-w-full items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {items.map(({ to, label }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  aria-current={active ? "page" : undefined}
                  className={`group inline-flex h-11 shrink-0 items-center whitespace-nowrap px-3 text-[12px] tracking-[-0.005em] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2 motion-reduce:transition-none ${
                    active
                      ? "font-medium text-[#1d1d1f]"
                      : "font-normal text-[#6e6e73] hover:text-[#1d1d1f]"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
