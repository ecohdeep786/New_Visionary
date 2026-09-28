import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Accessibility, ArrowRight, ChevronDown, Cookie, FileText,
  Globe, Lock, ShieldCheck,
} from "lucide-react";

import LandingNav from "@/components/landing/LandingNav";
import Breadcrumb from "@/components/landing/Breadcrumb";
import LandingFooter from "@/components/landing/LandingFooter";
import PolicyTabs from "@/components/landing/PolicyTabs";
import SpotIllustration from "@/components/landing/SpotIllustration";
import { LEGAL_META } from "@/data/legalMeta";

const COLORS = {
  ink: "#121317",
  grey: "#5f6368",
  lightGrey: "#9AA0A6",
  mist: "#dadce0",
  border: "#dadce0",
  soft: "#f8f9fa",
  canvas: "#f7f8fa",
  blue: "#4285F4",
  navy: "#0b57d0",
  white: "#ffffff",
  graphite: "#5f6368",
};
const FONT_FAMILY = "'Google Sans Flex', 'Google Sans', system-ui, sans-serif";

/* ═══ CONTROLLERS ═══ */
function useRevealOnce(rootMargin = "0px 0px -10% 0px") {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const hasRevealed = useRef(false);
  useEffect(() => {
    const node = ref.current;
    if (hasRevealed.current) { setVisible(true); return undefined; }
    if (!node) { setVisible(true); return undefined; }
    if (typeof IntersectionObserver === "undefined") { setVisible(true); hasRevealed.current = true; return undefined; }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasRevealed.current) { setVisible(true); hasRevealed.current = true; observer.disconnect(); }
      },
      { threshold: 0, rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);
  return { ref, visible };
}
const FadeReveal = React.memo(function FadeReveal({ visible, children, className = "" }) {
  return (
    <div className={`transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"} ${className}`}>
      {children}
    </div>
  );
});

const COOKIE_PROMISES = ["Essential only", "No advertising cookies", "Opt out anytime"];

const AT_A_GLANCE = [
  {
    to: "#principles",
    label: "Know what we use",
    text: "Essential cookies for sign-in and security — no ad networks, no cross-site tracking.",
    Icon: Cookie,
  },
  {
    to: "#types",
    label: "See each type",
    text: "Session, preference, and optional analytics — what each one does, in one line.",
    Icon: Globe,
  },
  {
    to: "#preferences",
    label: "Set your choices",
    text: "Turn optional cookies on or off on this device and save — it takes one tap.",
    Icon: Accessibility,
  },
];

const SECTIONS = [
  { id: "what-cookies-are", number: "01", title: "What cookies are" },
  { id: "principles", number: "02", title: "What we use and why" },
  { id: "types", number: "03", title: "The types we use" },
  { id: "preferences", number: "04", title: "Your choices and controls" },
  { id: "managing", number: "05", title: "Managing cookies" },
  { id: "contact", number: "06", title: "Questions and contact" },
];

function SectionHeading({ number, title }) {
  return (
    <div className="mb-6">
      <div className="mb-3 text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.grey }}>
        {number}
      </div>
      <h2 className="text-[30px] font-normal leading-[1.2] tracking-[-0.025em] sm:text-[36px]" style={{ color: COLORS.ink }}>
        {title}
      </h2>
    </div>
  );
}

function Paragraph({ children }) {
  return (
    <p className="max-w-[760px] text-[16px] leading-[1.78]" style={{ color: COLORS.grey }}>
      {children}
    </p>
  );
}

function IconTile({ Icon }) {
  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e8f0fe]" style={{ color: COLORS.navy }}>
      <Icon className="h-5 w-5" strokeWidth={1.7} aria-hidden="true" />
    </span>
  );
}

function LearnMoreRow({ to, label }) {
  return (
    <Link to={to} className="mt-5 inline-flex items-center gap-2 text-[14.5px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-sm" style={{ color: COLORS.navy }}>
      {label}
      <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
    </Link>
  );
}

export default function CookiesPage() {
  const [activeId, setActiveId] = useState("what-cookies-are");
  const [showMobileContents, setShowMobileContents] = useState(false);
  const heroReveal = useRevealOnce();
  const heroVisible = heroReveal.visible;

  const readChoice = (key, fallback) => {
    try {
      const choice = localStorage.getItem(key);
      return choice === null ? fallback : choice === "on";
    } catch { return fallback; }
  };
  const [preferences, setPreferences] = useState(() => readChoice("visionary_cookie_preferences", true));
  const [analytics, setAnalytics] = useState(() => readChoice("visionary_cookie_analytics", false));
  const [saved, setSaved] = useState(false);
  function savePreferences() {
    try {
      localStorage.setItem("visionary_cookie_preferences", preferences ? "on" : "off");
      localStorage.setItem("visionary_cookie_analytics", analytics ? "on" : "off");
    } catch { /* Preferences remain active for this session when storage is unavailable. */ }
    setSaved(true);
  }

  const activeSection = useMemo(
    () => SECTIONS.find((section) => section.id === activeId),
    [activeId]
  );

  useEffect(() => {
    const observers = [];
    SECTIONS.forEach((section) => {
      const element = document.getElementById(section.id);
      if (!element) return;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setActiveId(section.id);
          });
        },
        { rootMargin: "-18% 0px -65% 0px", threshold: 0.01 }
      );
      observer.observe(element);
      observers.push(observer);
    });
    return () => observers.forEach((observer) => observer.disconnect());
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash && SECTIONS.some((section) => section.id === hash)) {
      requestAnimationFrame(() => {
        const element = document.getElementById(hash);
        element?.scrollIntoView({ behavior: "auto", block: "start" });
        setActiveId(hash);
      });
    }
  }, []);

  function scrollToSection(id) {
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `#${id}`);
  }

  const preferenceRows = [
    { label: "Essential", description: "Required for sign-in, security, and core service behavior.", value: true, disabled: true, onChange: () => {} },
    { label: "Preferences", description: "Remember choices such as language and appearance on this device.", value: preferences, onChange: () => { setPreferences((value) => !value); setSaved(false); } },
    { label: "Analytics", description: "Allow product measurement that helps us understand and improve the experience.", value: analytics, onChange: () => { setAnalytics((value) => !value); setSaved(false); } },
  ];

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
      <Breadcrumb page="Cookies" />
      <PolicyTabs />

      <main id="main">
        <div className="mx-auto w-full max-w-[1240px] px-6 sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-14">
            {/* SIDEBAR TOC — starts at the top, beside the policy hero */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 py-10">
                <div className="mb-4 text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.grey }}>In this policy</div>
                <nav aria-label="Cookie policy sections">
                  <div className="space-y-1">
                    {SECTIONS.map((section) => {
                      const active = activeId === section.id;
                      return (
                        <button
                          key={section.id}
                          type="button"
                          onClick={() => scrollToSection(section.id)}
                          aria-current={active ? "location" : undefined}
                          className="group flex w-full items-start gap-3 rounded-full px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                          style={{ backgroundColor: active ? COLORS.canvas : "transparent" }}
                        >
                          <span className="mt-0.5 w-6 shrink-0 text-[11px] font-medium tabular-nums" style={{ color: active ? COLORS.navy : COLORS.grey }}>{section.number}</span>
                          <span className="text-[13px] leading-[1.45]" style={{ color: active ? COLORS.ink : COLORS.graphite }}>{section.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </nav>
                <div className="mt-8 border-t pt-6">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.7} style={{ color: COLORS.navy }} />
                    <p className="text-[13px] leading-[1.6]" style={{ color: COLORS.grey }}>
                      For how personal information is handled, see the Privacy Policy.
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            {/* CONTENT COLUMN */}
            <div className="min-w-0">
              {/* POLICY HERO — the same policies.google.com opening as Privacy */}
              <FadeReveal visible={heroVisible}>
                <div className="pb-12 pt-2">
                  <div className="flex justify-center"><SpotIllustration subject="cookie" className="h-28 w-28 lg:h-36 lg:w-36" /></div>
                  <p className="mt-10 text-[12px] font-medium uppercase tracking-[0.15em]" style={{ color: COLORS.grey }}>Cookie policy</p>
                  <h1 className="mt-4 max-w-[720px] text-[36px] font-normal leading-[1.12] tracking-[-0.035em] sm:text-[48px] lg:text-[56px]" style={{ color: COLORS.ink }}>
                    How we use cookies. And how you control them.
                  </h1>
                  <p className="mt-6 max-w-[640px] text-[17px] leading-[1.7] sm:text-[18px]" style={{ color: COLORS.grey }}>
                    The short version, then the full list. Only what's needed — nothing extra, nothing sold.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
                    {COOKIE_PROMISES.map((p) => (
                      <span key={p} className="flex items-center gap-1.5 text-[13.5px] font-medium" style={{ color: COLORS.ink }}>
                        <ShieldCheck className="h-4 w-4" strokeWidth={1.8} style={{ color: COLORS.navy }} aria-hidden="true" />
                        {p}
                      </span>
                    ))}
                  </div>

                  {/* Action row */}
                  <div className="mt-10 flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[#e8f0fe]" style={{ color: COLORS.navy }}>
                      <Cookie className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-[16px] font-medium" style={{ color: COLORS.ink }}>Manage cookies on this device</p>
                      <p className="mt-0.5 text-[14.5px]" style={{ color: COLORS.grey }}>Optional choices are saved in this browser only.</p>
                      <button type="button" onClick={() => scrollToSection("preferences")} className="mt-1.5 inline-flex items-center gap-1.5 text-[14px] font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-sm" style={{ color: COLORS.navy }}>
                        Set your cookie choices
                        <ArrowRight className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <p className="mt-10 border-t pt-5 text-[13px] leading-5" style={{ borderColor: COLORS.mist, color: COLORS.grey }}>
                    Effective {LEGAL_META.cookies.lastUpdated}
                  </p>
                </div>

                {/* Mobile TOC */}
                <div className="border-b pb-4 lg:hidden">
                  <button
                    type="button"
                    onClick={() => setShowMobileContents((value) => !value)}
                    aria-expanded={showMobileContents}
                    aria-controls="cookies-mobile-contents"
                    className="flex min-h-[64px] w-full items-center justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                  >
                    <span>
                      <span className="block text-[11px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.grey }}>In this policy</span>
                      <span className="mt-1 block text-[15px]" style={{ color: COLORS.ink }}>{activeSection?.title ?? "Choose a section"}</span>
                    </span>
                    <ChevronDown className={`h-5 w-5 shrink-0 transition-transform duration-200 ${showMobileContents ? "rotate-180" : ""}`} strokeWidth={1.8} style={{ color: COLORS.grey }} aria-hidden="true" />
                  </button>
                  {showMobileContents && (
                    <div id="cookies-mobile-contents" className="pt-4">
                      <div className="overflow-hidden rounded-[16px] border">
                        {SECTIONS.map((section) => {
                          const active = activeId === section.id;
                          return (
                            <button
                              key={section.id}
                              type="button"
                              onClick={() => { scrollToSection(section.id); setActiveId(section.id); setShowMobileContents(false); }}
                              aria-current={active ? "location" : undefined}
                              className="flex min-h-12 w-full items-start gap-4 border-b px-4 py-3 text-left last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                              style={{ borderColor: COLORS.mist, backgroundColor: active ? COLORS.canvas : COLORS.white }}
                            >
                              <span className="mt-0.5 text-[11px] font-medium tabular-nums" style={{ color: active ? COLORS.navy : COLORS.grey }}>{section.number}</span>
                              <span className="text-[14px] leading-[1.45]" style={{ color: active ? COLORS.ink : COLORS.graphite }}>{section.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* AT A GLANCE */}
                <section className="py-12" aria-labelledby="cookies-summary-title">
                  <p className="text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.grey }}>Start here</p>
                  <h2 id="cookies-summary-title" className="mt-2 text-[24px] font-normal tracking-[-0.02em] sm:text-[30px]" style={{ color: COLORS.ink }}>The essentials, at a glance</h2>
                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    {AT_A_GLANCE.map(({ to, label, text, Icon }, index) => (
                      <a key={to} href={to} className="group relative flex min-h-[174px] flex-col overflow-hidden rounded-[20px] g-card bg-white p-5 transition-colors hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] sm:p-6">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f0fe]" style={{ color: COLORS.navy }}><Icon className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden="true" /></span>
                        <span className="mt-5 flex items-center gap-2 text-[15px] font-medium" style={{ color: COLORS.ink }}><span className="text-[12px] font-normal tabular-nums" style={{ color: COLORS.grey }}>0{index + 1}</span>{label}</span>
                        <span className="mt-2 text-[14px] leading-[1.65]" style={{ color: COLORS.grey }}>{text}</span>
                        {/* google.com card curve — tint sweeps into the corner with the card's arrow nested in it */}
                        <div aria-hidden="true" className="absolute bottom-0 right-0 h-[44px] w-[76px] rounded-tl-[20px] bg-[#e8f0fe]" />
                        <div className="absolute bottom-0 right-0 flex h-[44px] w-[76px] items-center justify-center"><ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1 motion-reduce:transform-none" style={{ color: COLORS.navy }} aria-hidden="true" /></div>
                      </a>
                    ))}
                  </div>
                </section>
              </FadeReveal>

              {/* LEGAL CONTENT */}
              <article className="divide-y divide-[#dadce0]">
                {/* 01 — WHAT COOKIES ARE */}
                <section id="what-cookies-are" className="scroll-mt-24 py-14 sm:py-16">
                  <SectionHeading number="01" title="What cookies are" />
                  <Paragraph>
                    Cookies are small files a website saves in your browser. They let the site recognize your session, remember your choices, and keep things working the way you expect between visits.
                  </Paragraph>
                  <div className="mt-8 max-w-[760px] rounded-[16px] bg-[#f8f9fa] px-5 py-5 sm:px-6">
                    <p className="text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>
                      Visionary uses them to keep you signed in and remember your preferences — never to follow you around the internet or sell what it learns.
                    </p>
                  </div>
                </section>

                {/* 02 — WHAT WE USE AND WHY */}
                <section id="principles" className="scroll-mt-24 py-14 sm:py-16">
                  <SectionHeading number="02" title="What we use and why" />
                  <Paragraph>
                    No advertising cookies. No tracking across other sites. Just what keeps Visionary running for you.
                  </Paragraph>
                  <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      { Icon: Cookie, title: "Essential cookies.", text: "These support sign-in, security, and core service behavior. Without them, Visionary cannot work as expected, so they cannot be turned off." },
                      { Icon: Lock, title: "No advertising cookies.", text: "We don't use cookies to show you ads. Ever. There are no ad networks watching what you do here. Your attention is not for sale." },
                      { Icon: Globe, title: "Analytics with consent.", text: "If we use analytics cookies, we ask first. You can say no, and Visionary still works perfectly. We only measure what you explicitly allow." },
                    ].map(({ Icon, title, text }) => (
                      <div key={title} className="rounded-[16px] g-card p-6">
                        <IconTile Icon={Icon} />
                        <h3 className="mt-5 text-[16px] font-medium" style={{ color: COLORS.ink }}>{title}</h3>
                        <p className="mt-2 text-[14px] leading-[1.65]" style={{ color: COLORS.grey }}>{text}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 03 — THE TYPES WE USE */}
                <section id="types" className="scroll-mt-24 py-14 sm:py-16">
                  <SectionHeading number="03" title="The types we use" />
                  <Paragraph>
                    Each type does one job. Here is the full list.
                  </Paragraph>
                  <div className="mt-10 max-w-[880px] overflow-hidden rounded-[16px] border">
                    {[
                      ["Session cookies", "Keep you signed in while you use Visionary. Deleted when you close your browser."],
                      ["Preference cookies", "Remember things like your language and theme so you don't have to set them every time."],
                      ["Analytics (optional)", "Help us understand what's working so we can improve. Only with your consent — and you can opt out anytime."],
                    ].map(([who, what], i, arr) => (
                      <div key={who} className={`px-5 py-4 sm:px-6 ${i < arr.length - 1 ? "border-b" : ""}`}>
                        <p className="text-[14.5px] font-medium" style={{ color: COLORS.ink }}>{who}</p>
                        <p className="mt-1 text-[14px] leading-[1.65]" style={{ color: COLORS.grey }}>{what}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 04 — YOUR CHOICES AND CONTROLS */}
                <section id="preferences" className="scroll-mt-24 py-14 sm:py-16">
                  <SectionHeading number="04" title="Your choices and controls" />
                  <Paragraph>
                    Optional choices are saved in this browser. They do not change settings on your other devices.
                  </Paragraph>
                  <div className="mt-8 max-w-[720px] rounded-[24px] g-card bg-white p-6 sm:p-8">
                    <div className="divide-y">
                      {preferenceRows.map((row) => (
                        <div key={row.label} className="flex items-center gap-5 py-5 first:pt-0">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-[17px] font-medium" style={{ color: COLORS.ink }}>{row.label}</h3>
                            <p className="mt-1 text-[14px] leading-[1.6]" style={{ color: COLORS.grey }}>{row.description}</p>
                          </div>
                          <button
                            type="button" role="switch" aria-label={`${row.label} cookies`} aria-checked={row.value} disabled={row.disabled} onClick={row.onChange}
                            className="relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] disabled:cursor-not-allowed"
                            style={{ backgroundColor: row.value ? COLORS.navy : "#bdc1c6" }}
                          >
                            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${row.value ? "left-6" : "left-1"}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 flex items-center gap-4">
                      <button
                        type="button" onClick={savePreferences}
                        className="inline-flex min-h-11 items-center justify-center rounded-full px-6 text-[14px] font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
                        style={{ backgroundColor: COLORS.navy }}
                      >
                        Save choices
                      </button>
                      <p role="status" aria-live="polite" className="text-[13px]" style={{ color: COLORS.navy }}>{saved ? "Choices saved on this device." : ""}</p>
                    </div>
                  </div>
                </section>

                {/* 05 — MANAGING COOKIES */}
                <section id="managing" className="scroll-mt-24 py-14 sm:py-16">
                  <SectionHeading number="05" title="Managing cookies" />
                  <Paragraph>
                    You control them, always. Clear them anytime from your browser or your Visionary settings — no emails, no waiting.
                  </Paragraph>
                  <div className="mt-10 max-w-[880px] rounded-[16px] g-card p-6 sm:p-7">
                    <p className="text-[16px] font-medium" style={{ color: COLORS.ink }}>Your cookie options.</p>
                    <ul className="mt-4 space-y-2.5">
                      {[
                        "Essential cookies cannot be turned off — they're what make Visionary work.",
                        "Preference and analytics cookies are optional, and you can change your choices at any time from your Visionary settings (Settings → Privacy & cookies).",
                        "Clear or block cookies anytime from your browser's site settings.",
                        "Optional choices apply to this device only — set them again on devices you use.",
                      ].map((t) => (
                        <li key={t} className="flex items-start gap-3">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: COLORS.navy }} />
                          <span className="text-[14.5px] leading-[1.65]" style={{ color: COLORS.grey }}>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>

                {/* 06 — QUESTIONS AND CONTACT */}
                <section id="contact" className="scroll-mt-24 py-14 sm:py-16">
                  <SectionHeading number="06" title="Questions and contact" />
                  <Paragraph>
                    We're transparent about every cookie we use and why. If something isn't clear, reach out.
                  </Paragraph>
                  <div className="mt-8 max-w-[640px] rounded-[16px] g-card p-6 sm:p-7">
                    <p className="text-[15px] font-medium" style={{ color: COLORS.ink }}>Write to the team</p>
                    <p className="mt-3">
                      <a href="mailto:hello@visionary.org.in?subject=Cookie%20question" className="inline-flex items-center gap-2 text-[15px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-sm" style={{ color: COLORS.navy }}>
                        hello@visionary.org.in
                        <ArrowRight className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                      </a>
                    </p>
                    <p className="mt-3 text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>
                      For how personal information is handled, read the Privacy Policy — it sits under the same tab bar as this page.
                    </p>
                  </div>
                  <LearnMoreRow to="/privacy" label="Read the Privacy Policy" />
                </section>
              </article>
            </div>
          </div>
        </div>

        {/* KEY TERMS — the policies.google.com glossary pattern */}
        <section aria-labelledby="key-terms-title" className="px-6 py-16 sm:px-8 lg:px-10 lg:py-20">
          <div className="mx-auto w-full max-w-[1240px]">
            <h2 id="key-terms-title" className="text-[24px] font-normal tracking-[-0.02em] sm:text-[30px]" style={{ color: COLORS.ink }}>Key terms</h2>
            <div className="mt-8 grid gap-x-14 gap-y-8 border-t pt-10 sm:grid-cols-2">
              {[
                { term: "Cookies", def: "Small files a website saves in your browser to recognize your session and remember your choices." },
                { term: "Essential cookies", def: "The cookies required for sign-in, security, and core service behavior. They cannot be turned off." },
                { term: "Preference cookies", def: "Cookies that remember choices such as language and appearance on the device you use." },
                { term: "Analytics cookies", def: "Optional cookies that measure what works so we can improve. Used only with your consent." },
                { term: "Browser storage", def: "Where cookies and on-device records live. Clearing your browser's site data removes them." },
                { term: "Consent", def: "Your explicit yes before optional cookies are used — and your ability to say no without losing the product." },
              ].map(({ term, def }) => (
                <div key={term}>
                  <p className="text-[16px] font-medium" style={{ color: COLORS.ink }}>{term}</p>
                  <p className="mt-1.5 max-w-[520px] text-[14.5px] leading-[1.7]" style={{ color: COLORS.grey }}>{def}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RELATED */}
        <section aria-label="Related policies" className="border-t px-6 py-20 sm:px-8 lg:px-10">
          <div className="mx-auto w-full max-w-[1240px]">
            <h2 className="text-[22px] font-normal leading-[1.3] tracking-[-0.01em]" style={{ color: COLORS.ink }}>Read them together</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { to: "/privacy", label: "Privacy Policy", desc: "Your learning is personal.", Icon: Lock },
                { to: "/terms", label: "Terms of service", desc: "Clear rules, written to be understood.", Icon: FileText },
                { to: "/security", label: "Security", desc: "How your information is protected.", Icon: ShieldCheck },
                { to: "/accessibility", label: "Accessibility", desc: "Built for every kind of learner.", Icon: Accessibility },
              ].map(({ to, label, desc, Icon }) => (
                <Link key={to} to={to} className="group relative overflow-hidden rounded-[12px] g-card p-5 pb-12 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]">
                  <div className="flex items-center gap-3">
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} style={{ color: COLORS.navy }} />
                    <span className="text-[15px] font-medium" style={{ color: COLORS.ink }}>{label}</span>
                  </div>
                  <p className="mt-2 text-[13.5px] leading-[1.6]" style={{ color: COLORS.grey }}>{desc}</p>
                  {/* google.com card curve — tint sweeps into the corner with the card's arrow nested in it */}
                  <div aria-hidden="true" className="absolute bottom-0 right-0 h-[40px] w-[68px] rounded-tl-[12px] bg-[#e8f0fe]" />
                  <div className="absolute bottom-0 right-0 flex h-[40px] w-[68px] items-center justify-center"><ArrowRight className="h-[18px] w-[18px] transition-transform group-hover:translate-x-1 motion-reduce:transform-none" style={{ color: COLORS.navy }} aria-hidden="true" /></div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}
