import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu, X, ChevronDown, CircleHelp,
  GraduationCap, Users, Briefcase, Building2, HeartHandshake, Sparkles,
  BookOpen, UsersRound,
  Monitor, Smartphone, Laptop, Apple, Chrome, TabletSmartphone,
  ShieldCheck, Lock, Accessibility,
  Newspaper, Mail, Handshake, Bell, Gift,
} from "lucide-react";
import VisionaryLogo from "@/components/VisionaryLogo";
import { CATEGORIES } from "@/data/landingCategories";

/* ═══ Tokens ═══ */
const FONT = "'Google Sans Flex', 'Google Sans', 'DM Sans', system-ui, sans-serif";
const C = {
  ink: "#121317",
  graphite: "#3c4043",
  slate: "#5f6368",
  mist: "#dadce0",
  canvas: "#f8f9fa",
  blue: "#4285F4",
  darkblue: "#0b57d2",
};

/* Persona metadata */
const CATEGORY_META = {
  student: { Icon: GraduationCap, desc: "Understand more and keep your place." },
  teacher: { Icon: Users, desc: "See who needs another explanation." },
  parent: { Icon: HeartHandshake, desc: "See where your child needs support." },
  professional: { Icon: Briefcase, desc: "Turn what you know into useful work." },
  organization: { Icon: Building2, desc: "Help teams carry knowledge forward." },
};

const FALLBACK_META = {
  Icon: Sparkles,
  desc: "Explore how Visionary fits your journey.",
};

const metaFor = (cat) => CATEGORY_META[cat.slug] || FALLBACK_META;

/* For organizations — 4 contexts inside /organization */
const ORG_CONTEXTS = [
  { id: "schools", Icon: GraduationCap, title: "Schools", desc: "Roll out learning across K-12." },
  { id: "colleges", Icon: BookOpen, title: "Colleges and universities", desc: "Bring Visionary to higher education." },
  { id: "coaching", Icon: UsersRound, title: "Coaching", desc: "Scale personalized coaching." },
  { id: "workplace", Icon: Briefcase, title: "Workplace learning", desc: "Grow skills across your workforce." },
];

/* Download — 6 platforms */
const DOWNLOAD_PLATFORMS = [
  { id: "web", Icon: Chrome, title: "Web", desc: "Use Visionary in any browser, no install needed." },
  { id: "ios", Icon: Smartphone, title: "iOS", desc: "iPhone and iPad." },
  { id: "android", Icon: TabletSmartphone, title: "Android", desc: "Phones and tablets." },
  { id: "windows", Icon: Monitor, title: "Windows", desc: "Desktop app for PC." },
  { id: "mac", Icon: Apple, title: "Mac", desc: "Native app for Apple Silicon and Intel." },
  { id: "linux", Icon: Laptop, title: "Linux", desc: "For developers and power users." },
];

/* About — company, support, trust/legal */
const ABOUT_GROUPS = [
  {
    title: "Company",
    items: [
      { id: "about", Icon: Sparkles, title: "About Visionary", desc: "Our mission, beliefs, company, and people.", to: "/about" },
      { id: "careers", Icon: Briefcase, title: "Careers", desc: "Help us make understanding last.", to: "/careers" },
      { id: "research", Icon: Newspaper, title: "Research and news", desc: "News from Visionary, product updates, and research.", to: "/research" },
      { id: "community", Icon: UsersRound, title: "Community", desc: "Learners, teachers, and parents growing together.", to: "/community" },
    ],
  },
  {
    title: "Support and programs",
    items: [
      { id: "contact", Icon: Mail, title: "Contact and sales", desc: "Talk to us about schools, teams, and partnerships.", to: "/contact" },
      { id: "partners", Icon: Handshake, title: "Find a partner", desc: "Bring Visionary closer to your region or institution.", to: "/partners" },
      { id: "updates", Icon: Bell, title: "Sign up for updates", desc: "Product news, new languages, and launch updates.", to: "/updates" },
      { id: "referral", Icon: Gift, title: "Referral program", desc: "Invite people and grow with Visionary.", to: "/referral" },
    ],
  },
  {
    title: "Trust and legal",
    items: [
      { id: "safety", Icon: ShieldCheck, title: "Safety", desc: "Age-appropriate answers and human review.", to: "/safety" },
      { id: "privacy", Icon: Lock, title: "Privacy policy", desc: "Your memory is yours.", to: "/privacy" },
      { id: "security", Icon: ShieldCheck, title: "Security", desc: "Protected end to end.", to: "/security" },
      { id: "accessibility", Icon: Accessibility, title: "Accessibility", desc: "Built for every learner, every device.", to: "/accessibility" },
    ],
  },
];

const FOCUS_RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2";

/* Apple-state nav item — quiet borderless text at rest; the selected page's
   item resolves to the brand black at Medium weight. */
const navLink = (active) =>
  `flex h-10 items-center whitespace-nowrap rounded-full px-3 text-[14px] transition-colors duration-200 ${FOCUS_RING} ${
    active
      ? "font-medium text-[#121317]"
      : "font-normal text-[#3c4043]/90 hover:text-[#121317]"
  }`;

/* Icon-only button */
const iconBtn = (active = false) =>
  `flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${FOCUS_RING} ${
    active ? "border-[#dadce0] bg-white" : "border-transparent hover:border-[#dadce0]"
  }`;

/* Megamenu tile — one anatomy for every menu item */
const MEGA_TILE = "flex items-start gap-3.5 rounded-[12px] p-2.5 transition-colors hover:bg-[#f8f9fa]";

function MegaTile({ to, onClick, Icon, title, desc, active, compact }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`${MEGA_TILE} ${FOCUS_RING} ${active ? "bg-[#f8f9fa]" : ""}`}
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-[12px] border bg-white ${compact ? "h-9 w-9" : "h-10 w-10"}`}
        style={{ borderColor: C.mist, color: C.blue }}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
      </span>
      <span className="min-w-0">
        <span className={`block font-medium leading-[20px] ${compact ? "text-[14px]" : "text-[15px]"}`} style={{ color: C.ink }}>
          {title}
        </span>
        <span className="mt-0.5 block text-[13px] leading-[18px] tracking-[0.2px]" style={{ color: C.slate }}>
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

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMega, setOpenMega] = useState(null); // "who" | "org" | "download" | "about" | null

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
  const drawerRef = useRef(null);
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

  /* Close megamenus when the viewport drops below the desktop breakpoint */
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 1024) setOpenMega(null);
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
    closeTimer.current = setTimeout(() => setOpenMega(null), HOVER_CLOSE_MS);
  };

  /* Escape closes megamenu */
  useEffect(() => {
    if (!openMega) return undefined;

    const onDown = (e) => {
      const activeRef = refs[openMega]?.current;
      if (activeRef && !activeRef.contains(e.target)) setOpenMega(null);
    };

    const onKey = (e) => {
      if (e.key === "Escape") setOpenMega(null);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openMega]);

  /* Escape closes the drawer and returns focus to its trigger */
  useEffect(() => {
    if (!mobileOpen) return undefined;

    const onKey = (e) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        menuBtnRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  /* Close everything on route change */
  useEffect(() => {
    setOpenMega(null);
    setMobileOpen(false);
  }, [pathname]);

  /* Lock body scroll and move focus into the drawer while it is open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    if (mobileOpen) {
      const raf = requestAnimationFrame(() => {
        drawerRef.current?.querySelector("a")?.focus({ preventScroll: true });
      });
      return () => {
        cancelAnimationFrame(raf);
        document.body.style.overflow = "";
      };
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const toggleMega = (key) => {
    clearTimeout(openTimer.current);
    clearTimeout(closeTimer.current);
    setOpenMega((cur) => (cur === key ? null : key));
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
    <header className="fixed inset-x-0 top-0 z-50 h-14" style={{ fontFamily: FONT }}>
      {/* Skip link — first focusable element, Google/US-WAG convention */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2.5 focus:z-[60] focus:inline-flex focus:h-10 focus:items-center focus:rounded-full focus:bg-[#121317] focus:px-5 focus:text-[14px] focus:font-medium focus:text-white"
      >
        Skip to main content
      </a>
      {/* the Apple-state bar: invisible at rest, and on scroll a straight
          full-width glass strip — no corners, no border. The frosted layer
          is an inner element on purpose (a backdrop-filter on the header
          itself would become the containing block for the fixed flyout
          panels below). */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 -z-10 transition-all duration-500 [transition-timing-function:var(--ease-out-apple)] ${
          scrolled ? "bg-white/90 backdrop-blur-xl" : "bg-transparent"
        }`}
      />
        <div className="public-frame relative flex h-full items-center justify-between">
        {/* LEFT: logo + primary nav */}
        <div className="flex min-w-0 items-center gap-4 lg:gap-6">
          <Link
            to="/"
            aria-label="Visionary home"
            className={`shrink-0 rounded-full ${FOCUS_RING}`}
          >
            <VisionaryLogo />
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-0.5 lg:flex">
            {/* WHO YOU ARE */}
            <div
              ref={whoRef}
              className="relative"
              onMouseEnter={() => requestOpen("who")}
              onMouseLeave={requestClose}
            >
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded={openMega === "who"}
                aria-controls="mega-who"
                onClick={() => toggleMega("who")}
                className={`${megaTrigger("who", pageActive.who)} min-w-0`}
              >
                {activeCategory ? activeCategory.label : "Who you are"}
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${openMega === "who" ? "rotate-180" : ""}`} />
              </button>

              {openMega === "who" && (
                <div id="mega-who" className="pointer-events-none fixed inset-x-0 top-[64px] z-10 flex justify-center px-3">
                  <div className="mega-sheet pointer-events-auto w-full max-w-[1240px] rounded-[24px] border border-[#dadce0]/70">
                    <div className="px-6 py-9 sm:px-8">
                    <p className="text-[24px] font-medium tracking-[-0.01em] leading-[1.15]" style={{ color: C.ink }}>
                      One intelligence, every learner.
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

            {/* FOR ORGANIZATIONS */}
            <div
              ref={orgRef}
              className="relative"
              onMouseEnter={() => requestOpen("org")}
              onMouseLeave={requestClose}
            >
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded={openMega === "org"}
                aria-controls="mega-org"
                onClick={() => toggleMega("org")}
                className={megaTrigger("org", pageActive.org)}
              >
                For organizations
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${openMega === "org" ? "rotate-180" : ""}`} />
              </button>

              {openMega === "org" && (
                <div id="mega-org" className="pointer-events-none fixed inset-x-0 top-[64px] z-10 flex justify-center px-3">
                  <div className="mega-sheet pointer-events-auto w-full max-w-[1240px] rounded-[24px] border border-[#dadce0]/70">
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

            {/* DOWNLOAD */}
            <div
              ref={downloadRef}
              className="relative"
              onMouseEnter={() => requestOpen("download")}
              onMouseLeave={requestClose}
            >
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded={openMega === "download"}
                aria-controls="mega-download"
                onClick={() => toggleMega("download")}
                className={megaTrigger("download", pageActive.download)}
              >
                Download
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${openMega === "download" ? "rotate-180" : ""}`} />
              </button>

              {openMega === "download" && (
                <div id="mega-download" className="pointer-events-none fixed inset-x-0 top-[64px] z-10 flex justify-center px-3">
                  <div className="mega-sheet pointer-events-auto w-full max-w-[1240px] rounded-[24px] border border-[#dadce0]/70">
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

            {/* ABOUT */}
            <div
              ref={aboutRef}
              className="relative"
              onMouseEnter={() => requestOpen("about")}
              onMouseLeave={requestClose}
            >
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded={openMega === "about"}
                aria-controls="mega-about"
                onClick={() => toggleMega("about")}
                className={megaTrigger("about", pageActive.about)}
              >
                About
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${openMega === "about" ? "rotate-180" : ""}`} />
              </button>

              {openMega === "about" && (
                <div id="mega-about" className="pointer-events-none fixed inset-x-0 top-[64px] z-10 flex justify-center px-3">
                  <div className="mega-sheet pointer-events-auto max-h-[calc(100dvh-100px)] w-full max-w-[1240px] overflow-y-auto rounded-[24px] border border-[#dadce0]/70">
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
                          <p className="mb-2 text-[12px] font-medium tracking-[0.24px]" style={{ color: C.slate }}>
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
        <div className="flex items-center gap-2">
          <Link
            to="/help"
            className={`${navLink(pathname === "/help")} hidden gap-1.5 xl:flex`}
          >
            <CircleHelp className="h-[18px] w-[18px]" strokeWidth={1.8} />
            Help
          </Link>

          <Link to="/login" className={`${navLink(false)} hidden sm:flex`} style={{ color: C.blue }}>
            Sign in
          </Link>

          <Link
            to="/register"
            className={`btn-premium btn-premium-blue ml-2 flex h-10 items-center gap-1.5 rounded-full text-[14px] font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 ${FOCUS_RING}`}
            style={{ backgroundColor: C.darkblue, paddingLeft: 18, paddingRight: 18 }}
          >
            Get started
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
            onClick={() => setMobileOpen((o) => !o)}
            className={iconBtn(false) + " lg:hidden"}
            style={{ color: C.graphite }}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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

      {/* MOBILE DRAWER — a first-class responsive state: a floating rounded
          panel under the bar, compact utility row on top, separated sections,
          safe-area padding, focus moved inside */}
      {mobileOpen && (
        <div
          ref={drawerRef}
          className="safe-b relative mx-3 mt-2 max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-[24px] border bg-white px-5 pb-8 pt-4 lg:hidden"
          style={{ borderColor: C.mist }}
        >
          {/* Compact top utility row */}
          <div className="grid grid-cols-3 gap-2 border-b pb-4" style={{ borderColor: C.mist }}>
            <Link
              to="/help"
              onClick={() => setMobileOpen(false)}
              className={`flex h-10 items-center justify-center gap-1.5 rounded-full border text-[14px] font-normal tracking-[0.24px] ${FOCUS_RING}`}
              style={{ borderColor: C.mist, color: C.ink }}
            >
              <CircleHelp className="h-4 w-4" strokeWidth={1.8} />
              Help
            </Link>
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className={`flex h-10 items-center justify-center rounded-full border text-[14px] font-normal tracking-[0.24px] ${FOCUS_RING}`}
              style={{ borderColor: C.mist, color: C.blue }}
            >
              Sign in
            </Link>
            <Link
              to="/register"
              onClick={() => setMobileOpen(false)}
              className={`flex h-10 items-center justify-center rounded-full text-[14px] font-medium tracking-[0.24px] text-white ${FOCUS_RING}`}
              style={{ backgroundColor: C.darkblue }}
            >
              Get started
            </Link>
          </div>

          {/* WHO YOU ARE */}
          <div className="py-2">
            <p className="mb-2 text-[12px] font-normal uppercase tracking-[0.43px]" style={{ color: C.slate }}>
              Who you are
            </p>

            {CATEGORIES.map((cat) => {
              const { Icon, desc } = metaFor(cat);

              return (
                <Link
                  key={cat.path}
                  to={cat.path}
                  onClick={() => setMobileOpen(false)}
                  aria-current={cat.path === pathname ? "page" : undefined}
                  className={`flex items-start gap-4 rounded-[12px] p-3 transition-colors hover:bg-[#f8f9fa] ${FOCUS_RING} ${cat.path === pathname ? "bg-[#f8f9fa]" : ""}`}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border bg-white"
                    style={{ borderColor: C.mist, color: C.blue }}
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                  </span>

                  <span>
                    <span className="block text-[15px] font-medium" style={{ color: C.ink }}>
                      {cat.label}
                    </span>
                    <span className="mt-0.5 block text-[13px] leading-[18px] tracking-[0.2px]" style={{ color: C.slate }}>
                      {desc}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>

          {/* HOW IT WORKS */}
          <Link
            to="/how-it-works"
            onClick={() => setMobileOpen(false)}
            aria-current={pathname === "/how-it-works" ? "page" : undefined}
            className={`block border-t py-3.5 text-[15px] tracking-[0.24px] ${FOCUS_RING}`}
            style={{ borderColor: C.mist, color: C.ink }}
          >
            How it works
          </Link>

          {/* FOR ORGANIZATIONS */}
          <div className="border-t pt-2" style={{ borderColor: C.mist }}>
            <p className="mb-2 text-[12px] font-normal uppercase tracking-[0.43px]" style={{ color: C.slate }}>
              For organizations
            </p>

            {ORG_CONTEXTS.map((ctx) => (
              <Link
                key={ctx.id}
                to={`/organization#${ctx.id}`}
                onClick={() => setMobileOpen(false)}
                className={`flex items-start gap-4 rounded-[12px] p-3 transition-colors hover:bg-[#f8f9fa] ${FOCUS_RING}`}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border bg-white"
                  style={{ borderColor: C.mist, color: C.blue }}
                >
                  <ctx.Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                </span>

                <span>
                  <span className="block text-[15px] font-medium" style={{ color: C.ink }}>
                    {ctx.title}
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-[18px] tracking-[0.2px]" style={{ color: C.slate }}>
                    {ctx.desc}
                  </span>
                </span>
              </Link>
            ))}
          </div>

          {/* PRICING */}
          <Link
            to="/pricing"
            onClick={() => setMobileOpen(false)}
            aria-current={pathname === "/pricing" ? "page" : undefined}
            className={`block border-t py-3.5 text-[15px] tracking-[0.24px] ${FOCUS_RING}`}
            style={{ borderColor: C.mist, color: C.ink }}
          >
            Pricing
          </Link>

          {/* DOWNLOAD */}
          <div className="border-t pt-2" style={{ borderColor: C.mist }}>
            <p className="mb-2 text-[12px] font-normal uppercase tracking-[0.43px]" style={{ color: C.slate }}>
              Download
            </p>

            {DOWNLOAD_PLATFORMS.map((p) => (
              <Link
                key={p.id}
                to={`/download#${p.id}`}
                onClick={() => setMobileOpen(false)}
                className={`flex items-start gap-4 rounded-[12px] p-3 transition-colors hover:bg-[#f8f9fa] ${FOCUS_RING}`}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border bg-white"
                  style={{ borderColor: C.mist, color: C.blue }}
                >
                  <p.Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                </span>

                <span>
                  <span className="block text-[15px] font-medium" style={{ color: C.ink }}>
                    {p.title}
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-[18px] tracking-[0.2px]" style={{ color: C.slate }}>
                    {p.desc}
                  </span>
                </span>
              </Link>
            ))}
          </div>

          {/* ABOUT */}
          <div className="border-t pt-2" style={{ borderColor: C.mist }}>
            <p className="mb-2 text-[12px] font-normal uppercase tracking-[0.43px]" style={{ color: C.slate }}>
              About
            </p>

            {ABOUT_GROUPS.map((group) => (
              <div key={group.title} className="pb-3">
                <p className="px-3 py-2 text-[12px] font-normal uppercase tracking-[0.43px]" style={{ color: C.slate }}>
                  {group.title}
                </p>

                {group.items.map((item) => (
                  <Link
                    key={item.id}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    aria-current={pathname === item.to ? "page" : undefined}
                    className={`flex items-start gap-4 rounded-[12px] p-3 transition-colors hover:bg-[#f8f9fa] ${FOCUS_RING}`}
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border bg-white"
                      style={{ borderColor: C.mist, color: C.blue }}
                    >
                      <item.Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                    </span>

                    <span>
                      <span className="block text-[15px] font-medium" style={{ color: C.ink }}>
                        {item.title}
                      </span>
                      <span className="mt-0.5 block text-[13px] leading-[18px] tracking-[0.2px]" style={{ color: C.slate }}>
                        {item.desc}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
