import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, CircleHelp } from "lucide-react";
import VisionaryLogo from "@/components/VisionaryLogo";
import { CATEGORIES } from "@/data/landingCategories";
import { color as C, fontStack } from "@/components/landing/system/tokens";
import { useAuth } from "@/lib/AuthContext";

import { metaFor, ORG_CONTEXTS, DOWNLOAD_PLATFORMS, ABOUT_GROUPS } from "./nav-data.js";
import { FOCUS_RING, navLink, iconBtn, MegaTile, HOVER_OPEN_MS, HOVER_CLOSE_MS } from "./nav-shared.jsx";
import MobileNavigation from "./MobileNavigation.jsx";

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMega, setOpenMega] = useState(null); // "who" | "org" | "download" | "about" | null
  /* Cross-team review (2026-11-16): the nav rendered "Sign in"/"Get started"
     to a signed-in visitor — misleading affordances that only self-healed
     after the auth page bounced them. The signed-in state offers the real
     next action instead: open the workspace. */
  const { authChecked, isAuthenticated } = useAuth();
  const signedIn = authChecked && isAuthenticated;

  const whoRef = useRef(null);
  const orgRef = useRef(null);
  const downloadRef = useRef(null);
  const aboutRef = useRef(null);

  const refs = {
    who: whoRef,
    org: orgRef,
    download: downloadRef,
    about: aboutRef,
  };

  const openTimer = useRef(null);
  const closeTimer = useRef(null);
  const menuBtnRef = useRef(null);

  const { pathname } = useLocation();
  const activeCategory = CATEGORIES.find((cat) => cat.path === pathname);

  /* Frosted glass after first scroll */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Close the navigation that belongs to the previous layout. */
  useEffect(() => {
    const onResize = () => {
      clearTimeout(openTimer.current);
      clearTimeout(closeTimer.current);
      if (window.innerWidth < 1024) setOpenMega(null);
      else setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => () => {
    clearTimeout(openTimer.current);
    clearTimeout(closeTimer.current);
  }, []);

  const requestOpen = (key) => {
    clearTimeout(closeTimer.current);
    clearTimeout(openTimer.current);
    openTimer.current = setTimeout(() => setOpenMega(key), HOVER_OPEN_MS);
  };

  const requestClose = () => {
    clearTimeout(openTimer.current);
    closeTimer.current = setTimeout(() => {
      setOpenMega(current => refs[current]?.current?.contains(document.activeElement) ? current : null);
    }, HOVER_CLOSE_MS);
  };

  /* Escape closes megamenu */
  useEffect(() => {
    if (!openMega) return undefined;

    const onDown = (e) => {
      const activeRef = refs[openMega]?.current;
      if (activeRef && !activeRef.contains(e.target)) {
        clearTimeout(openTimer.current);
        clearTimeout(closeTimer.current);
        setOpenMega(null);
      }
    };

    const onKey = (e) => {
      if (e.key !== "Escape") return;
      clearTimeout(openTimer.current);
      clearTimeout(closeTimer.current);
      const activeRef = refs[openMega]?.current;
      if (activeRef?.contains(document.activeElement)) activeRef.querySelector("a")?.focus();
      clearTimeout(openTimer.current);
      setOpenMega(null);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openMega]);

  /* Close everything on route change */
  useEffect(() => {
    setOpenMega(null);
    setMobileOpen(false);
  }, [pathname]);

  /* Focus restores at the first frame the trigger is actually visible. The
     single setTimeout(0) raced React's commit under prefers-reduced-motion:
     the drawer unmounted while the trigger still carried the closing
     "invisible" class, so focus() hit a visibility:hidden button and fell
     to <body> (the quality gate caught it: Escape restored scroll but not
     focus). Retrying per frame until the button paints is deterministic —
     the class removal and the focus land in the same frame, every time. */
  const closeMobile = () => {
    setMobileOpen(false);
    let frames = 0;
    const restoreFocus = () => {
      const btn = menuBtnRef.current;
      if (!btn || frames++ > 12) return;
      if (btn.offsetWidth > 0 && getComputedStyle(btn).visibility !== "hidden") {
        btn.focus({ preventScroll: true });
        return;
      }
      requestAnimationFrame(restoreFocus);
    };
    requestAnimationFrame(restoreFocus);
  };

  const megaTrigger = (key, pageActive = false) =>
    `${navLink(openMega === key || pageActive)} justify-center gap-1.5`;

  /* the selected page marks its nav item black — menu triggers included */
  const aboutPaths = ABOUT_GROUPS.flatMap((g) => g.items.map((i) => i.to));
  const pageActive = {
    who: !!activeCategory,
    org: pathname === "/organization",
    download: pathname === "/download",
    about: aboutPaths.includes(pathname),
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-14" style={{ fontFamily: fontStack }}>
      {/* the Apple-state bar: always a frosted strip — translucent white,
          saturate + 20px blur, hairline beneath — deepening one step once
          the page scrolls. The frosted layer is an inner element on purpose
          (a backdrop-filter on the header itself would become the containing
          block for the fixed flyout panels below). */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 -z-10 border-b backdrop-blur-[20px] backdrop-saturate-150 transition-all duration-500 [transition-timing-function:var(--ease-out-apple)] ${
          scrolled ? "border-[#1d1d1f]/10 bg-white/90" : "border-[#1d1d1f]/[0.06] bg-[rgba(251,251,253,0.8)]"
        }`}
      />
        <div data-public-nav-bar className="public-frame relative flex h-full items-center justify-between">
        {/* LEFT: logo + primary nav */}
        <div className="flex min-w-0 items-center gap-4 lg:gap-6">
          <Link
            to="/"
            data-public-brand
            className={`shrink-0 relative rounded-full after:absolute after:-inset-y-2 after:-inset-x-7 ${FOCUS_RING}`}
          >
            <VisionaryLogo />
            <span className="sr-only"> home</span>
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-0.5 lg:flex" onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              clearTimeout(openTimer.current);
              setOpenMega(null);
            }
          }}>
            {/* WHO YOU ARE — Apple global-nav pattern: the item is a link
               (click navigates to the page), hover or keyboard focus opens
               the megamenu. Reference basis: Apple HIG — Navigation and
               search; consistent hit targets and predictable activation. */}
            <div
              ref={whoRef}
              className="relative"
              onMouseEnter={() => requestOpen("who")}
              onMouseLeave={requestClose}
            >
              <Link
                to={activeCategory ? activeCategory.path : "/#audiences"}
                aria-haspopup="true"
                aria-expanded={openMega === "who"}
                aria-controls="mega-who"
                onFocus={() => requestOpen("who")}
                onClick={() => {
                  clearTimeout(openTimer.current);
                  clearTimeout(closeTimer.current);
                  setOpenMega(null);
                }}
                className={`${megaTrigger("who", pageActive.who)} min-w-0`}
              >
                {activeCategory ? activeCategory.label : "For you"}
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${openMega === "who" ? "rotate-180" : ""}`} />
              </Link>

              {openMega === "who" && (
                <div id="mega-who" className="pointer-events-none fixed inset-x-0 top-[64px] z-10 flex justify-center px-3">
                  <div className="mega-sheet pointer-events-auto w-full max-w-[1240px] rounded-[24px] border border-[#d2d2d7]">
                    <div className="px-6 py-9 sm:px-8">
                    <p className="text-[24px] font-medium tracking-[-0.01em] leading-[1.15]" style={{ color: C.ink }}>
                      One connected journey. Five ways to begin.
                    </p>

                    <div className="mt-5 grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                      {CATEGORIES.map((cat) => {
                        const { Icon, desc } = metaFor(cat);
                        return (
                          <MegaTile
                            key={cat.path}
                            to={cat.path}
                            onClick={() => setOpenMega(null)}
                            Icon={Icon}
                            title={cat.label}
                            desc={desc}
                            active={cat.path === pathname}
                          />
                        );
                      })}
                    </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* HOW IT WORKS */}
            <Link to="/how-it-works" className={navLink(pathname === "/how-it-works")}>
              How it works
            </Link>

            {/* FOR ORGANIZATIONS — link trigger, same pattern as above */}
            <div
              ref={orgRef}
              className="relative"
              onMouseEnter={() => requestOpen("org")}
              onMouseLeave={requestClose}
            >
              <Link
                to="/organization"
                aria-haspopup="true"
                aria-expanded={openMega === "org"}
                aria-controls="mega-org"
                onFocus={() => requestOpen("org")}
                onClick={() => setOpenMega(null)}
                className={megaTrigger("org", pageActive.org)}
              >
                For organizations
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${openMega === "org" ? "rotate-180" : ""}`} />
              </Link>

              {openMega === "org" && (
                <div id="mega-org" className="pointer-events-none fixed inset-x-0 top-[64px] z-10 flex justify-center px-3">
                  <div className="mega-sheet pointer-events-auto w-full max-w-[1240px] rounded-[24px] border border-[#d2d2d7]">
                    <div className="px-6 py-9 sm:px-8">
                    <p className="text-[24px] font-medium tracking-[-0.01em] leading-[1.15]" style={{ color: C.ink }}>
                      For organizations
                    </p>
                    <p className="mt-1 text-[14px] tracking-[0.24px]" style={{ color: C.slate }}>
                      Bring Visionary to your institution.
                    </p>

                    <div className="mt-5 grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
                      {ORG_CONTEXTS.map((ctx) => (
                        <MegaTile
                          key={ctx.id}
                          to={`/organization#${ctx.id}`}
                          onClick={() => setOpenMega(null)}
                          Icon={ctx.Icon}
                          title={ctx.title}
                          desc={ctx.desc}
                        />
                      ))}
                    </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* PRICING */}
            <Link to="/pricing" className={navLink(pathname === "/pricing")}>
              Pricing
            </Link>

            {/* DOWNLOAD — link trigger, same pattern as above */}
            <div
              ref={downloadRef}
              className="relative"
              onMouseEnter={() => requestOpen("download")}
              onMouseLeave={requestClose}
            >
              <Link
                to="/download"
                aria-haspopup="true"
                aria-expanded={openMega === "download"}
                aria-controls="mega-download"
                onFocus={() => requestOpen("download")}
                onClick={() => setOpenMega(null)}
                className={megaTrigger("download", pageActive.download)}
              >
                Download
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${openMega === "download" ? "rotate-180" : ""}`} />
              </Link>

              {openMega === "download" && (
                <div id="mega-download" className="pointer-events-none fixed inset-x-0 top-[64px] z-10 flex justify-center px-3">
                  <div className="mega-sheet pointer-events-auto w-full max-w-[1240px] rounded-[24px] border border-[#d2d2d7]">
                    <div className="px-6 py-9 sm:px-8">
                    <p className="text-[24px] font-medium tracking-[-0.01em] leading-[1.15]" style={{ color: C.ink }}>
                      Download Visionary
                    </p>
                    <p className="mt-1 text-[14px] tracking-[0.24px]" style={{ color: C.slate }}>
                      Available on every device you use.
                    </p>

                    <div className="mt-5 grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                      {DOWNLOAD_PLATFORMS.map((p) => (
                        <MegaTile
                          key={p.id}
                          to={`/download#${p.id}`}
                          onClick={() => setOpenMega(null)}
                          Icon={p.Icon}
                          title={p.title}
                          desc={p.desc}
                        />
                      ))}
                    </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ABOUT — link trigger, same pattern as above */}
            <div
              ref={aboutRef}
              className="relative"
              onMouseEnter={() => requestOpen("about")}
              onMouseLeave={requestClose}
            >
              <Link
                to="/about"
                aria-haspopup="true"
                aria-expanded={openMega === "about"}
                aria-controls="mega-about"
                onFocus={() => requestOpen("about")}
                onClick={() => setOpenMega(null)}
                className={megaTrigger("about", pageActive.about)}
              >
                About
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${openMega === "about" ? "rotate-180" : ""}`} />
              </Link>

              {openMega === "about" && (
                <div id="mega-about" className="pointer-events-none fixed inset-x-0 top-[64px] z-10 flex justify-center px-3">
                  <div className="mega-sheet pointer-events-auto max-h-[calc(100dvh-100px)] w-full max-w-[1240px] overflow-y-auto rounded-[24px] border border-[#d2d2d7]">
                    <div className="px-6 py-9 sm:px-8">
                    <p className="text-[24px] font-medium tracking-[-0.01em] leading-[1.15]" style={{ color: C.ink }}>
                      About Visionary
                    </p>
                    <p className="mt-1 text-[14px] tracking-[0.24px]" style={{ color: C.slate }}>
                      Company, support, programs, trust, and legal information.
                    </p>

                    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                      {ABOUT_GROUPS.map((group) => (
                        <div key={group.title}>
                          <p className="mb-2 text-[13px] font-medium tracking-[0.24px]" style={{ color: C.slate }}>
                            {group.title}
                          </p>

                          <div className="space-y-1">
                            {group.items.map((item) => (
                              <MegaTile
                                key={item.id}
                                to={item.to}
                                onClick={() => setOpenMega(null)}
                                Icon={item.Icon}
                                title={item.title}
                                desc={item.desc}
                                active={pathname === item.to}
                                compact
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* RIGHT: utilities — roomy gap so the cluster breathes like
            Apple's icon cluster instead of hugging the edge */}
        <div className={`flex items-center gap-2 ${mobileOpen ? "invisible" : ""}`}>
          <Link
            to="/help"
            className={`${navLink(pathname === "/help")} hidden gap-1.5 xl:flex`}
          >
            <CircleHelp className="h-[18px] w-[18px]" strokeWidth={1.8} />
            Help
          </Link>

          <Link to={signedIn ? "/dashboard/home" : "/login"} className={`${navLink(false)} ${pathname === "/" && !scrolled ? "flex" : pathname === "/" && signedIn ? "hidden" : "hidden sm:flex"}`}>
            {signedIn ? "Open Visionary" : "Sign in"}
          </Link>

          {/* the nav CTA stays quiet while the page hero's own start button
              is on screen, and fades in once the page scrolls — one start
              action in view at a time. Apple-black, the product's action
              color, matching every primary pill on the page. */}
          <Link
            to={signedIn ? "/dashboard/home" : "/register"}
            className={`ml-2 flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#1d1d1f] px-[21px] text-[17px] font-medium leading-[1.176] tracking-[-0.011em] text-white transition-all duration-500 [transition-timing-function:var(--ease-out-apple)] hover:bg-[#272729] hover:scale-[1.01] active:scale-[0.98] active:bg-[#18181a] focus:outline-none ${FOCUS_RING} ${
              scrolled
                ? "visible translate-y-0 opacity-100"
                : "pointer-events-none invisible -translate-y-1 opacity-0"
            }`}
            data-scroll-action
            tabIndex={scrolled ? 0 : -1}
            aria-hidden={scrolled ? undefined : "true"}
          >
            {signedIn ? "Open Visionary" : "Get started"}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-arrow h-3.5 w-3.5" aria-hidden="true">
              <path d="M5 12h14" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          </Link>

          <button
            ref={menuBtnRef}
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls={mobileOpen ? "public-mobile-navigation" : undefined}
            onClick={() => setMobileOpen((o) => !o)}
            className={iconBtn(false) + ` lg:hidden ${mobileOpen ? "invisible" : ""}`}
            style={{ color: C.graphite }}
            tabIndex={mobileOpen ? -1 : undefined}
          >
            {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* flyout scrim — dims and blocks the page behind an open panel */}
      {openMega && (
        <div
          aria-hidden="true"
          className="mega-scrim fixed inset-x-0 bottom-0 top-14"
          onClick={() => setOpenMega(null)}
        />
      )}

      <MobileNavigation
        open={mobileOpen}
        onClose={closeMobile}
        pathname={pathname}
        signedIn={signedIn}
      />
    </header>
  );
}
