import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, CircleHelp, X } from "lucide-react";
import { CATEGORIES } from "@/data/landingCategories";
import { color as C } from "@/components/landing/system/tokens";
import { FOCUS_RING } from "./nav-shared.jsx";
import { metaFor } from "./nav-data.js";

const MAIN_LINKS = [
  { label: "How it works", to: "/how-it-works" },
  { label: "For organizations", to: "/organization" },
  { label: "Pricing", to: "/pricing" },
  { label: "Download", to: "/download" },
  { label: "About Visionary", to: "/about" },
];

const FOCUSABLE = "a[href], button:not([disabled])";

export default function MobileNavigation({ open, onClose, pathname, signedIn }) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    const background = [
      document.querySelector("[data-public-nav-bar]"),
      document.querySelector("main"),
      document.querySelector("footer"),
    ].filter(Boolean).map((element) => ({ element, ariaHidden: element.getAttribute("aria-hidden") }));
    document.body.style.overflow = "hidden";
    background.forEach(({ element }) => {
      element.inert = true;
      element.setAttribute("aria-hidden", "true");
    });

    const focusFrame = requestAnimationFrame(() => {
      dialogRef.current?.querySelector(FOCUSABLE)?.focus({ preventScroll: true });
    });

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const items = [...dialogRef.current.querySelectorAll(FOCUSABLE)].filter((item) => item.getClientRects().length);
      const first = items[0];
      const last = items.at(-1);
      if (!first || !last) return;

      if (event.shiftKey && (document.activeElement === first || !dialogRef.current.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      background.forEach(({ element, ariaHidden }) => {
        element.inert = false;
        if (ariaHidden === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", ariaHidden);
      });
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close menu"
        aria-hidden="true"
        tabIndex={-1}
        className="fixed inset-0 top-14 z-40 cursor-default bg-[#1d1d1f]/25 backdrop-blur-[3px] lg:hidden"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        id="public-mobile-navigation"
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        className="safe-b fixed inset-x-3 top-[4.25rem] z-50 mx-auto max-h-[calc(100dvh-5.5rem)] max-w-[560px] overflow-y-auto overscroll-contain rounded-[24px] border border-black/10 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.18)] lg:hidden"
      >
        <div className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-black/[0.07] bg-white/95 pl-5 pr-2 backdrop-blur-xl">
          <p className="text-[15px] font-medium" style={{ color: C.ink }}>Menu</p>
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className={`flex h-11 w-11 items-center justify-center rounded-full hover:bg-black/5 ${FOCUS_RING}`}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Mobile navigation" className="px-4 pb-5 pt-4">
          {signedIn ? (
            <Link
              to="/dashboard/home"
              onClick={onClose}
              className={`flex h-12 items-center justify-center gap-2 rounded-full bg-[#1d1d1f] px-5 text-[16px] font-medium text-white ${FOCUS_RING}`}
            >
              Open Visionary <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/login"
                onClick={onClose}
                className={`flex h-12 items-center justify-center rounded-full border border-[#d2d2d7] px-3 text-[16px] font-medium text-[#1d1d1f] ${FOCUS_RING}`}
              >
                Sign in
              </Link>
              <Link
                to="/register"
                onClick={onClose}
                className={`flex h-12 items-center justify-center rounded-full bg-[#1d1d1f] px-3 text-[16px] font-medium text-white ${FOCUS_RING}`}
              >
                Get started
              </Link>
            </div>
          )}

          <section aria-labelledby="mobile-journeys" className="mt-6">
            <p id="mobile-journeys" className="apple-eyebrow px-3" style={{ color: C.slate }}>
              Find your journey
            </p>
            <div className="mt-2 space-y-1">
              {CATEGORIES.map((cat) => {
                const { Icon, desc } = metaFor(cat);
                return (
                  <Link
                    key={cat.path}
                    to={cat.path}
                    onClick={onClose}
                    aria-current={cat.path === pathname ? "page" : undefined}
                    className={`flex min-h-[64px] items-center gap-3 rounded-[14px] p-3 transition-colors hover:bg-[#f5f5f7] ${FOCUS_RING} ${cat.path === pathname ? "bg-[#f5f5f7]" : ""}`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f5f5f7]" style={{ color: C.ink }}>
                      <Icon className="h-[19px] w-[19px]" strokeWidth={1.8} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[16px] font-medium" style={{ color: C.ink }}>{cat.label}</span>
                      <span className="mt-0.5 block text-[13px] leading-[17px]" style={{ color: C.slate }}>{desc}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#86868b]" aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          </section>

          <div className="mt-4 border-t border-black/[0.08] pt-3">
            {MAIN_LINKS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                aria-current={item.to === pathname ? "page" : undefined}
                className={`flex min-h-11 items-center justify-between rounded-[12px] px-3 py-2.5 text-[16px] ${FOCUS_RING} ${item.to === pathname ? "bg-[#f5f5f7] font-medium" : "font-normal"}`}
                style={{ color: C.ink }}
              >
                {item.label}
                <ChevronRight className="h-4 w-4 text-[#86868b]" aria-hidden="true" />
              </Link>
            ))}
            <Link
              to="/help"
              onClick={onClose}
              aria-current={pathname === "/help" ? "page" : undefined}
              className={`mt-1 flex min-h-11 items-center gap-3 rounded-[12px] px-3 py-2.5 text-[16px] ${FOCUS_RING}`}
              style={{ color: C.ink }}
            >
              <CircleHelp className="h-[18px] w-[18px]" aria-hidden="true" /> Help
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}
