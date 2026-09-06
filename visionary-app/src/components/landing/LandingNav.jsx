import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu, X, ChevronDown, CircleHelp,
  GraduationCap, Users, Briefcase, Building2, HeartHandshake, Sparkles,
  BookOpen, UsersRound,
  Monitor, Smartphone, Laptop, Apple, Chrome, TabletSmartphone,
  ShieldCheck, Lock, FileText, Accessibility, Cookie,
  Newspaper, Mail, Handshake, Bell, Gift,
} from "lucide-react";
import VisionaryLogo from "@/components/VisionaryLogo";
import { CATEGORIES } from "@/data/landingCategories";

/* ═══ Tokens ═══ */
const FONT = "'Google Sans Flex', 'Google Sans', system-ui, sans-serif";
const C = {
  ink: "#121317",
  graphite: "#3c4043",
  slate: "#5f6368",
  mist: "#dadce0",
  canvas: "#f8f9fa",
  blue: "#4285F4",
};

/* Persona metadata */
const CATEGORY_META = {
  student: { Icon: GraduationCap, desc: "Learn with a companion that keeps your place." },
  teacher: { Icon: Users, desc: "See every learner and teach in your language." },
  parent: { Icon: HeartHandshake, desc: "Follow your child's journey with confidence." },
  professional: { Icon: Briefcase, desc: "Grow the skills your work demands next." },
  organization: { Icon: Building2, desc: "Build understanding that stays across your institution." },
};

const FALLBACK_META = {
  Icon: Sparkles,
  desc: "Explore how Visionary fits your journey.",
};

const metaFor = (cat) => CATEGORY_META[cat.slug] || FALLBACK_META;

/* For organizations — 4 contexts inside /organization */
const ORG_CONTEXTS = [
  { id: "schools", Icon: GraduationCap, title: "Schools", desc: "Roll out learning across K-12." },
  { id: "colleges", Icon: BookOpen, title: "Colleges & Universities", desc: "Bring Visionary to higher education." },
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
      { id: "research", Icon: Newspaper, title: "Research & News", desc: "News from Visionary, product updates, and research.", to: "/research" },
      { id: "community", Icon: UsersRound, title: "Community", desc: "Learners, teachers, and parents growing together.", to: "/community" },
    ],
  },
  {
    title: "Support & programs",
    items: [
      { id: "contact", Icon: Mail, title: "Contact & Sales", desc: "Talk to us about schools, teams, and partnerships.", to: "/contact" },
      { id: "partners", Icon: Handshake, title: "Find a Partner", desc: "Bring Visionary closer to your region or institution.", to: "/partners" },
      { id: "updates", Icon: Bell, title: "Sign up for updates", desc: "Product news, new languages, and launch updates.", to: "/updates" },
      { id: "referral", Icon: Gift, title: "Referral Program", desc: "Invite people and grow with Visionary.", to: "/referral" },
    ],
  },
  {
    title: "Trust & legal",
    items: [
      { id: "safety", Icon: ShieldCheck, title: "Safety", desc: "Age-appropriate answers and human review.", to: "/safety" },
      { id: "privacy", Icon: Lock, title: "Privacy Policy", desc: "Your memory is yours. Private by design.", to: "/privacy" },
      { id: "terms", Icon: FileText, title: "Terms & Conditions", desc: "Fair rules, written clearly.", to: "/terms" },
      { id: "security", Icon: ShieldCheck, title: "Security", desc: "Protected end to end.", to: "/security" },
      { id: "accessibility", Icon: Accessibility, title: "Accessibility", desc: "Built for every learner, every device.", to: "/accessibility" },
      { id: "cookies", Icon: Cookie, title: "Cookies", desc: "Only what is needed.", to: "/cookies" },
    ],
  },
];

/* Shared pill style */
const pillLink = (active) =>
  `flex h-11 items-center whitespace-nowrap rounded-full border px-4 text-[15px] font-normal tracking-[0.24px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] ${
    active ? "border-[#dadce0] bg-white" : "border-transparent hover:border-[#dadce0]"
  }`;

/* Icon-only button */
const iconBtn = (active = false) =>
  `flex h-11 w-11 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] ${
    active ? "border-[#dadce0] bg-white" : "border-transparent hover:border-[#dadce0]"
  }`;

function isAboutPath(pathname) {
  return ABOUT_GROUPS.some((group) => group.items.some((item) => item.to === pathname));
}

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

  const { pathname } = useLocation();
  const activeCategory = CATEGORIES.find((cat) => cat.path === pathname);

  /* Frosted glass after first scroll */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Close on outside click / Escape */
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

  /* Escape closes mobile drawer */
  useEffect(() => {
    if (!mobileOpen) return undefined;

    const onKey = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  /* Close everything on route change */
  useEffect(() => {
    setOpenMega(null);
    setMobileOpen(false);
  }, [pathname]);

  /* Lock body scroll only while mobile drawer is open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const toggleMega = (key) => setOpenMega((cur) => (cur === key ? null : key));

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 h-16 transition-all duration-200 ${
        scrolled ? "border-b bg-white/90 backdrop-blur-md" : "border-b border-transparent bg-white"
      }`}
      style={{ fontFamily: FONT, borderColor: scrolled ? C.mist : "transparent" }}
    >
      <div className="flex h-full w-full items-center justify-between px-6 lg:px-10">
        {/* LEFT: logo + primary nav */}
        <div className="flex min-w-0 items-center gap-4 lg:gap-6">
          <Link
            to="/"
            aria-label="Visionary home"
            className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
          >
            <VisionaryLogo />
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-1 xl:flex">
            {/* WHO YOU ARE */}
            <div
              ref={whoRef}
              className="relative"
              onMouseEnter={() => setOpenMega("who")}
              onMouseLeave={() => setOpenMega((cur) => (cur === "who" ? null : cur))}
            >
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded={openMega === "who"}
                onClick={() => toggleMega("who")}
                className={`${pillLink(openMega === "who" || Boolean(activeCategory))} min-w-[148px] justify-center gap-1.5 whitespace-nowrap`}
                style={{ color: C.ink }}
              >
                {activeCategory ? activeCategory.label : "Who you are"}
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${openMega === "who" ? "rotate-180" : ""}`} />
              </button>

              {openMega === "who" && (
                <div className="absolute left-0 top-full w-[min(760px,calc(100vw-32px))] pt-3">
                  <div className="rounded-[24px] border bg-white/95 p-8 backdrop-blur-md" style={{ borderColor: C.mist }}>
                    <p className="text-[20px] font-medium tracking-[-0.12px]" style={{ color: C.ink }}>
                      One intelligence, every learner.
                    </p>

                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {CATEGORIES.map((cat) => {
                        const { Icon, desc } = metaFor(cat);
                        const isActive = cat.path === pathname;

                        return (
                          <Link
                            key={cat.path}
                            to={cat.path}
                            onClick={() => setOpenMega(null)}
                            className={`flex items-start gap-4 rounded-[16px] p-3 transition-colors hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] ${
                              isActive ? "bg-[#f8f9fa]" : ""
                            }`}
                          >
                            <span
                              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border bg-white"
                              style={{ borderColor: C.mist, color: C.blue }}
                            >
                              <Icon className="h-5 w-5" strokeWidth={1.8} />
                            </span>

                            <span>
                              <span className="block text-[16px] font-medium tracking-[0.1px]" style={{ color: C.ink }}>
                                {cat.label}
                              </span>
                              <span className="mt-1 block text-[14px] leading-[20px] tracking-[0.24px]" style={{ color: C.slate }}>
                                {desc}
                              </span>
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* HOW IT WORKS */}
            <Link to="/how-it-works" className={pillLink(pathname === "/how-it-works")} style={{ color: C.ink }}>
              How it works
            </Link>

            {/* FOR ORGANIZATIONS */}
            <div
              ref={orgRef}
              className="relative"
              onMouseEnter={() => setOpenMega("org")}
              onMouseLeave={() => setOpenMega((cur) => (cur === "org" ? null : cur))}
            >
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded={openMega === "org"}
                onClick={() => toggleMega("org")}
                className={`${pillLink(openMega === "org" || pathname === "/organization")} gap-1.5`}
                style={{ color: C.ink }}
              >
                For organizations
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${openMega === "org" ? "rotate-180" : ""}`} />
              </button>

              {openMega === "org" && (
                <div className="absolute left-1/2 top-full w-[min(640px,calc(100vw-32px))] -translate-x-1/2 pt-3">
                  <div className="rounded-[24px] border bg-white/95 p-8 backdrop-blur-md" style={{ borderColor: C.mist }}>
                    <p className="text-[20px] font-medium tracking-[-0.12px]" style={{ color: C.ink }}>
                      For organizations
                    </p>
                    <p className="mt-1 text-[14px] tracking-[0.24px]" style={{ color: C.slate }}>
                      Bring Visionary to your institution.
                    </p>

                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {ORG_CONTEXTS.map((ctx) => (
                        <Link
                          key={ctx.id}
                          to={`/organization#${ctx.id}`}
                          onClick={() => setOpenMega(null)}
                          className="flex items-start gap-4 rounded-[16px] p-3 transition-colors hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                        >
                          <span
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border bg-white"
                            style={{ borderColor: C.mist, color: C.blue }}
                          >
                            <ctx.Icon className="h-5 w-5" strokeWidth={1.8} />
                          </span>

                          <span>
                            <span className="block text-[16px] font-medium tracking-[0.1px]" style={{ color: C.ink }}>
                              {ctx.title}
                            </span>
                            <span className="mt-1 block text-[14px] leading-[20px] tracking-[0.24px]" style={{ color: C.slate }}>
                              {ctx.desc}
                            </span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* PRICING */}
            <Link to="/pricing" className={pillLink(pathname === "/pricing")} style={{ color: C.ink }}>
              Pricing
            </Link>

            {/* DOWNLOAD */}
            <div
              ref={downloadRef}
              className="relative"
              onMouseEnter={() => setOpenMega("download")}
              onMouseLeave={() => setOpenMega((cur) => (cur === "download" ? null : cur))}
            >
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded={openMega === "download"}
                onClick={() => toggleMega("download")}
                className={`${pillLink(openMega === "download" || pathname === "/download")} gap-1.5`}
                style={{ color: C.ink }}
              >
                Download
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${openMega === "download" ? "rotate-180" : ""}`} />
              </button>

              {openMega === "download" && (
                <div className="absolute left-1/2 top-full w-[min(760px,calc(100vw-32px))] -translate-x-1/2 pt-3">
                  <div className="rounded-[24px] border bg-white/95 p-8 backdrop-blur-md" style={{ borderColor: C.mist }}>
                    <p className="text-[20px] font-medium tracking-[-0.12px]" style={{ color: C.ink }}>
                      Download Visionary
                    </p>
                    <p className="mt-1 text-[14px] tracking-[0.24px]" style={{ color: C.slate }}>
                      Available on every device you use.
                    </p>

                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {DOWNLOAD_PLATFORMS.map((p) => (
                        <Link
                          key={p.id}
                          to={`/download#${p.id}`}
                          onClick={() => setOpenMega(null)}
                          className="flex items-start gap-4 rounded-[16px] p-3 transition-colors hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                        >
                          <span
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border bg-white"
                            style={{ borderColor: C.mist, color: C.blue }}
                          >
                            <p.Icon className="h-5 w-5" strokeWidth={1.8} />
                          </span>

                          <span>
                            <span className="block text-[16px] font-medium tracking-[0.1px]" style={{ color: C.ink }}>
                              {p.title}
                            </span>
                            <span className="mt-1 block text-[14px] leading-[20px] tracking-[0.24px]" style={{ color: C.slate }}>
                              {p.desc}
                            </span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ABOUT */}
            <div
              ref={aboutRef}
              className="relative"
              onMouseEnter={() => setOpenMega("about")}
              onMouseLeave={() => setOpenMega((cur) => (cur === "about" ? null : cur))}
            >
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded={openMega === "about"}
                onClick={() => toggleMega("about")}
                className={`${pillLink(openMega === "about" || isAboutPath(pathname))} gap-1.5`}
                style={{ color: C.ink }}
              >
                About
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${openMega === "about" ? "rotate-180" : ""}`} />
              </button>

              {openMega === "about" && (
                <div className="absolute right-0 top-full w-[min(860px,calc(100vw-32px))] pt-3">
                  <div className="max-h-[calc(100dvh-96px)] overflow-y-auto rounded-[24px] border bg-white/95 p-8 backdrop-blur-md" style={{ borderColor: C.mist }}>
                    <p className="text-[20px] font-medium tracking-[-0.12px]" style={{ color: C.ink }}>
                      About Visionary
                    </p>
                    <p className="mt-1 text-[14px] tracking-[0.24px]" style={{ color: C.slate }}>
                      Company, support, programs, trust, and legal information.
                    </p>

                    <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
                      {ABOUT_GROUPS.map((group) => (
                        <div key={group.title}>
                          <p className="mb-3 text-[12px] font-normal uppercase tracking-[0.43px]" style={{ color: C.slate }}>
                            {group.title}
                          </p>

                          <div className="space-y-2">
                            {group.items.map((item) => {
                              const active = pathname === item.to;

                              return (
                                <Link
                                  key={item.id}
                                  to={item.to}
                                  onClick={() => setOpenMega(null)}
                                  className={`flex items-start gap-3 rounded-[16px] p-3 transition-colors hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] ${
                                    active ? "bg-[#f8f9fa]" : ""
                                  }`}
                                >
                                  <span
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border bg-white"
                                    style={{ borderColor: C.mist, color: C.blue }}
                                  >
                                    <item.Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                                  </span>

                                  <span>
                                    <span className="block text-[15px] font-medium leading-[20px]" style={{ color: C.ink }}>
                                      {item.title}
                                    </span>
                                    <span className="mt-0.5 block text-[13px] leading-[18px] tracking-[0.2px]" style={{ color: C.slate }}>
                                      {item.desc}
                                    </span>
                                  </span>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* RIGHT: utilities */}
        <div className="flex items-center gap-2">
          <Link
            to="/help"
            className={`${pillLink(pathname === "/help")} hidden gap-1.5 sm:flex`}
            style={{ color: C.ink }}
          >
            <CircleHelp className="h-5 w-5" strokeWidth={1.8} />
            Help
          </Link>

          <Link to="/login" className={`${pillLink(false)} hidden sm:flex`} style={{ color: C.blue }}>
            Sign in
          </Link>

          <Link
            to="/register"
            className="flex h-11 items-center rounded-full px-5 text-[15px] font-medium tracking-[0.24px] text-white transition-all hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#121317]"
            style={{ backgroundColor: C.blue }}
          >
            Get Started
          </Link>

          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((o) => !o)}
            className={iconBtn(false) + " xl:hidden"}
            style={{ color: C.graphite }}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {mobileOpen && (
        <div className="safe-b max-h-[calc(100dvh-4rem)] overflow-y-auto border-t bg-white px-6 pb-8 pt-4 xl:hidden" style={{ borderColor: C.mist }}>
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
                  className="flex items-start gap-4 rounded-[16px] p-3 transition-colors hover:bg-[#f8f9fa]"
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border bg-white"
                    style={{ borderColor: C.mist, color: C.blue }}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.8} />
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
            className="block border-t py-3 text-[15px] tracking-[0.24px]"
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
                className="flex items-start gap-4 rounded-[16px] p-3 transition-colors hover:bg-[#f8f9fa]"
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border bg-white"
                  style={{ borderColor: C.mist, color: C.blue }}
                >
                  <ctx.Icon className="h-5 w-5" strokeWidth={1.8} />
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
            className="block border-t py-3 text-[15px] tracking-[0.24px]"
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
                className="flex items-start gap-4 rounded-[16px] p-3 transition-colors hover:bg-[#f8f9fa]"
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border bg-white"
                  style={{ borderColor: C.mist, color: C.blue }}
                >
                  <p.Icon className="h-5 w-5" strokeWidth={1.8} />
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
                <p className="px-3 py-2 text-[11px] font-normal uppercase tracking-[0.43px]" style={{ color: C.slate }}>
                  {group.title}
                </p>

                {group.items.map((item) => (
                  <Link
                    key={item.id}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-start gap-4 rounded-[16px] p-3 transition-colors hover:bg-[#f8f9fa]"
                  >
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border bg-white"
                      style={{ borderColor: C.mist, color: C.blue }}
                    >
                      <item.Icon className="h-5 w-5" strokeWidth={1.8} />
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

          {/* Utility actions */}
          <div className="mt-4 flex flex-col gap-3 border-t pt-5" style={{ borderColor: C.mist }}>
            <Link
              to="/help"
              onClick={() => setMobileOpen(false)}
              className="flex h-11 items-center justify-center gap-2 rounded-full border text-[15px] font-normal tracking-[0.24px]"
              style={{ borderColor: C.mist, color: C.ink }}
            >
              <CircleHelp className="h-4 w-4" strokeWidth={1.8} />
              Get help
            </Link>

            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="flex h-11 items-center justify-center rounded-full border text-[15px] font-normal tracking-[0.24px]"
              style={{ borderColor: C.mist, color: C.blue }}
            >
              Sign in
            </Link>

            <Link
              to="/register"
              onClick={() => setMobileOpen(false)}
              className="flex h-11 items-center justify-center rounded-full text-[15px] font-medium tracking-[0.24px] text-white"
              style={{ backgroundColor: C.blue }}
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}