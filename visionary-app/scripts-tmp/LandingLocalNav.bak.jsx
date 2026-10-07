import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const FONT = "'Google Sans Flex', 'Google Sans', 'DM Sans', system-ui, sans-serif";

/* Landing chapter anchors — the page's table of contents, mirroring its
   data-section ids. Apple's product localnav pattern: the page title left,
   chapter anchors center-right, one solid CTA far right. */
const CHAPTERS = [
  { id: "02-problem", label: "Why Visionary exists" },
  { id: "04-meet", label: "Meet Visionary" },
  { id: "05-one-intelligence", label: "One Intelligence" },
  { id: "08-trust", label: "Trust and safety" },
  { id: "11-faq", label: "FAQ" },
];

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2";

/**
 * The second tier of the public nav (measured from apple.com product and
 * education pages, Oct 2026): a 48px sticky bar that sits under the global
 * nav, reveals once the hero has scrolled away, and carries the page's
 * chapters + the single conversion CTA. Desktop only — mobile keeps the
 * global bar and drawer.
 */
export default function LandingLocalNav() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > window.innerHeight * 0.55);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (id) => {
    document
      .querySelector(`[data-section="${id}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div
      className={`fixed inset-x-0 top-14 z-40 hidden h-12 border-b transition-all duration-500 [transition-timing-function:var(--ease-out-apple)] lg:flex ${
        shown
          ? "translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-2 opacity-0"
      } bg-[#fbfbfd]/85 backdrop-blur-xl backdrop-saturate-[1.8]`}
      style={{ borderColor: "rgba(218,220,224,0.6)", fontFamily: FONT }}
      aria-hidden={!shown}
    >
      <style>{`[data-section] { scroll-margin-top: 120px; }`}</style>
      <div className="public-frame public-frame-wide mx-auto flex h-full w-full max-w-[1756px] items-center justify-between px-6 sm:px-8 lg:px-10">
        <span className="text-[15px] font-medium tracking-[0] text-[#121317]">
          One Intelligence
        </span>

        <nav aria-label="Page chapters" className="flex items-center gap-0.5">
          {CHAPTERS.map((c) => (
            <button
              key={c.id}
              type="button"
              tabIndex={shown ? 0 : -1}
              onClick={() => go(c.id)}
              className={`flex h-9 items-center whitespace-nowrap rounded-full px-3 text-[13px] font-normal text-[#3c4043]/90 transition-colors duration-200 hover:text-[#121317] ${FOCUS_RING}`}
            >
              {c.label}
            </button>
          ))}
        </nav>

        <Link
          to="/register"
          tabIndex={shown ? 0 : -1}
          className={`btn-premium btn-premium-blue flex h-9 items-center rounded-full px-5 text-[13.5px] font-medium text-white ${FOCUS_RING}`}
          style={{ backgroundColor: "#0b57d2" }}
        >
          Get started
        </Link>
      </div>
    </div>
  );
}
