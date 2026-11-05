import { Link } from "react-router-dom";
import { color as C } from "@/components/landing/system/tokens";
import { ABOUT_GROUPS } from "./nav-data.js";

/* ═══ Tokens ═══ */
/* C now aliases the shared token palette (LandingNav was Google-mapped).      */
/* Legacy keys resolve per tokens.js: ink→#1d1d1f, slate→#6e6e73, mist→hairline. */


const FOCUS_RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2";

/* Apple-state nav item — ink at 75% at rest (Apple's global-nav gray),
   resolving to full ink on hover; the selected page's item sits at Medium */
const navLink = (active) =>
  `flex h-11 items-center whitespace-nowrap rounded-full px-3.5 text-[14px] tracking-[-0.010em] transition-colors duration-200 ${FOCUS_RING} ${
    active
      ? "font-medium text-[#1d1d1f]"
      : "font-normal text-[#1d1d1f]/75 hover:text-[#1d1d1f]"
  }`;

/* Icon-only button — borderless, a quiet gray wash on hover */
const iconBtn = (active = false) =>
  `flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors ${FOCUS_RING} ${
    active ? "bg-[#1d1d1f]/5" : "hover:bg-[#1d1d1f]/5"
  }`;

/* Megamenu tile — one anatomy for every menu item */
const MEGA_TILE = "flex items-start gap-3.5 rounded-[12px] p-2.5 transition-colors hover:bg-[#f5f5f7]";

function MegaTile({ to, onClick, Icon, title, desc, active, compact }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`${MEGA_TILE} ${FOCUS_RING} ${active ? "bg-[#f5f5f7]" : ""}`}
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-[12px] border bg-white ${compact ? "h-9 w-9" : "h-10 w-10"}`}
        style={{ borderColor: C.mist, color: C.link }}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
      </span>
      <span className="min-w-0">
        <span className={`block font-medium leading-[20px] text-[16px]`} style={{ color: C.ink }}>
          {title}
        </span>
        <span className="mt-0.5 block text-[14px] leading-[18px] tracking-[0.2px]" style={{ color: C.slate }}>
          {desc}
        </span>
      </span>
    </Link>
  );
}

function isAboutPath(pathname) {
  return ABOUT_GROUPS.some((group) => group.items.some((item) => item.to === pathname));
}

/* Hover intent: a drive-by across the bar must not throw menus open */
const HOVER_OPEN_MS = 120;
const HOVER_CLOSE_MS = 220;


export { FOCUS_RING, navLink, iconBtn, MEGA_TILE, MegaTile, isAboutPath, HOVER_OPEN_MS, HOVER_CLOSE_MS };
