import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Globe, Monitor, Apple, Laptop, Smartphone, TabletSmartphone,
  Download, ShieldCheck,
} from "lucide-react";
import LandingNav from "@/components/landing/LandingNav";
import Breadcrumb from "@/components/landing/Breadcrumb";
import LandingFooter from "@/components/landing/LandingFooter";
import SpotIllustration from "@/components/landing/SpotIllustration";

/* ═══ DESIGN TOKENS (same system) ═══ */
const COLORS = {
  ink: "#121317",
  surface: "#ffffffff",
  blue: "#4285F4",
  grey: "#5f6368",
  lightGrey: "#9AA0A6",
  mist: "#dadce0",
  white: "#ffffff",
};
const FONT_FAMILY = "'Google Sans Flex', 'Google Sans', system-ui, sans-serif";
const APP_VERSION = "1.4.2";

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

/* Detect the visitor's OS client-side — SSR-safe, graceful fallback */
function useDetectedPlatform() {
  const [platform, setPlatform] = useState(null);
  useEffect(() => {
    if (typeof navigator === "undefined") return undefined;
    const ua = navigator.userAgent || "";
    let os = null;
    if (/Android/i.test(ua)) os = "android";
    else if (/iPhone|iPad|iPod/i.test(ua)) os = "ios";
    else if (/Mac OS X|Macintosh/i.test(ua)) os = "mac";
    else if (/Windows/i.test(ua)) os = "windows";
    else if (/Linux/i.test(ua)) os = "linux";
    setPlatform(os);
    return undefined;
  }, []);
  return platform;
}

const FadeReveal = React.memo(function FadeReveal({ visible, children, className = "" }) {
  return (
    <div className={`transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"} ${className}`}>
      {children}
    </div>
  );
});

/* ═══ MODELS ═══ */
const PLATFORMS = [
  { id: "web", Icon: Globe, name: "Web", meta: "No install · Always up to date", action: "Open in browser", href: "/register", kind: "web" },
  { id: "windows", Icon: Monitor, name: "Windows", meta: "Windows 10 or later · 84 MB", action: "Download for Windows", href: "#", kind: "desktop" },
  { id: "mac", Icon: Apple, name: "Mac", meta: "macOS 12 or later · 96 MB · Universal", action: "Download for Mac", href: "#", kind: "desktop" },
  { id: "linux", Icon: Laptop, name: "Linux", meta: "Ubuntu 20.04+ · .deb / .AppImage · 78 MB", action: "Download for Linux", href: "#", kind: "desktop" },
  { id: "ios", Icon: Smartphone, name: "iOS", meta: "iPhone & iPad · iOS 16 or later", action: "Get it on the App Store", href: "#", kind: "store" },
  { id: "android", Icon: TabletSmartphone, name: "Android", meta: "Android 9 or later · 62 MB", action: "Get it on Google Play", href: "#", kind: "store" },
];

const REQUIREMENTS = [
  { platform: "Web", req: "Any modern browser — Chrome, Edge, Safari, or Firefox. No install required." },
  { platform: "Windows", req: "Windows 10 or later · 4 GB RAM · 250 MB free space" },
  { platform: "Mac", req: "macOS 12 (Monterey) or later · Apple Silicon or Intel" },
  { platform: "Linux", req: "Ubuntu 20.04+ / Fedora 36+ · .deb, .rpm, or .AppImage" },
  { platform: "iOS", req: "iOS 16 or later · iPhone and iPad" },
  { platform: "Android", req: "Android 9 or later · ARM or x86" },
];

const SYNC_WORDS = ["continue", "pick up", "learn"];

/* ═══ 01 · HERO — Web vs App choice ═══ */
function DownloadHeroSection() {
  const { ref, visible } = useRevealOnce();
  const scrollToPlatforms = useCallback(() => {
    document.getElementById("platforms")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);
  return (
    <section ref={ref} className="relative overflow-hidden px-6 pb-16 pt-16 sm:px-8 lg:pb-24 lg:pt-20" style={{ backgroundColor: COLORS.white, fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <p className="text-center font-medium uppercase tracking-[0.16em] leading-[16px] text-[12px]" style={{ color: COLORS.grey }}>Download</p>
        <h1 className="mx-auto mt-4 max-w-[14ch] text-balance text-center font-normal tracking-[-0.04em] leading-[1.06] text-[clamp(40px,5.6vw,64px)]" style={{ color: COLORS.ink }}>
          Get <span style={{ color: COLORS.blue }}>Visionary</span> on every device.
        </h1>
        <p className="mx-auto max-w-[640px] text-pretty text-center font-normal tracking-[0.1px] leading-[1.65] text-[17px] sm:text-[18px]" style={{ color: COLORS.grey }}>
          On the phone, tablet or laptop you already own.
        </p>

        {/* The choice — Web or App */}
        <div className="mx-auto mt-12 grid w-full max-w-[880px] grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col rounded-[20px] border bg-white p-7 transition-shadow duration-300 hover:shadow-[0_1px_3px_rgba(60,64,67,0.12),0_4px_12px_rgba(60,64,67,0.08)] sm:p-8" style={{ borderColor: COLORS.mist }}>
            <span className="flex h-12 w-12 items-center justify-center rounded-[14px]" style={{ backgroundColor: "#E8F0FE", color: "#1967D2" }}>
              <Globe className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <h2 className="mt-6 font-medium tracking-[0.1px] leading-[1.15] text-[22px]" style={{ color: COLORS.ink }}>Continue on web</h2>
            <p className="mt-2.5 font-normal tracking-[0.1px] leading-[1.6] text-[14.5px]" style={{ color: COLORS.grey }}>
              Full Visionary in your browser. Nothing to install, always up to date, works on any computer.
            </p>
            <Link
              to="/register"
              className="mt-7 inline-flex h-12 items-center justify-center rounded-full px-8 font-medium tracking-[0.1px] text-[15px] text-white transition-all hover:shadow-[0_1px_3px_rgba(60,64,67,0.3)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
              style={{ backgroundColor: COLORS.blue }}
            >
              Open Visionary
            </Link>
          </div>

          <div className="flex flex-col rounded-[20px] border bg-white p-7 transition-shadow duration-300 hover:shadow-[0_1px_3px_rgba(60,64,67,0.12),0_4px_12px_rgba(60,64,67,0.08)] sm:p-8" style={{ borderColor: COLORS.mist }}>
            <span className="flex h-12 w-12 items-center justify-center rounded-[14px]" style={{ backgroundColor: "#E6F4EA", color: "#188038" }}>
              <Download className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <h2 className="mt-6 font-medium tracking-[0.1px] leading-[1.15] text-[22px]" style={{ color: COLORS.ink }}>Get the app</h2>
            <p className="mt-2.5 font-normal tracking-[0.1px] leading-[1.6] text-[14.5px]" style={{ color: COLORS.grey }}>
              Native apps for desktop and mobile — faster, offline-friendly, and synced to your account.
            </p>
            <button
              type="button"
              onClick={scrollToPlatforms}
              className="mt-7 inline-flex h-12 items-center justify-center rounded-full border px-8 font-medium tracking-[0.1px] text-[15px] transition-colors hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
              style={{ borderColor: COLORS.mist, color: COLORS.ink }}
            >
              See platforms
            </button>
          </div>
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══ 02 · PLATFORMS — detected OS recommended ═══ */
function DownloadPlatformsSection() {
  const { ref, visible } = useRevealOnce();
  const detected = useDetectedPlatform();
  return (
    <section ref={ref} id="platforms" className="relative scroll-mt-24 px-6 py-16 sm:px-8 lg:py-24" style={{ backgroundColor: "#f8f9fa", fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <p className="text-center font-medium uppercase tracking-[0.16em] leading-[16px] text-[12px]" style={{ color: COLORS.grey }}>Supported platforms</p>
        <h2 className="mx-auto mt-4 max-w-[16ch] text-balance text-center font-normal tracking-[-0.03em] leading-[1.12] text-[clamp(30px,3.6vw,44px)]" style={{ color: COLORS.ink }}>Choose your platform.</h2>
        <p className="mx-auto mt-4 max-w-[640px] text-center font-normal tracking-[0.1px] leading-[1.6] text-[15px]" style={{ color: COLORS.grey }}>
          Version {APP_VERSION} · Updated this week ·{" "}
          {detected ? (
            <>Recommended for your device: <span style={{ color: COLORS.blue }}>{PLATFORMS.find((p) => p.id === detected)?.name}</span></>
          ) : (
            <>Works everywhere you do</>
          )}
        </p>

        <div className="mx-auto mt-12 grid w-full max-w-[1240px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {PLATFORMS.map((p) => {
            const isRecommended = detected === p.id;
            return (
              <div
                key={p.id}
                id={p.id}
                className="relative flex flex-col scroll-mt-24 rounded-[20px] border bg-white p-7 transition-all duration-300 hover:shadow-[0_1px_3px_rgba(60,64,67,0.12),0_4px_12px_rgba(60,64,67,0.08)]"
                style={{
                  borderColor: isRecommended ? COLORS.blue : COLORS.mist,
                  boxShadow: isRecommended ? "0 12px 32px rgba(66,133,244,0.14)" : undefined,
                }}
              >
                {isRecommended && (
                  <span className="absolute right-5 top-5 rounded-full px-3 py-1 font-normal uppercase tracking-[0.43px] text-[10px]" style={{ backgroundColor: COLORS.blue, color: "#ffffff" }}>
                    Recommended
                  </span>
                )}
                <span className="flex h-12 w-12 items-center justify-center rounded-[14px]" style={{ backgroundColor: "#E8F0FE", color: "#1967D2" }}>
                  <p.Icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <h3 className="mt-5 font-medium tracking-[0] leading-[1.15] text-[20px]" style={{ color: COLORS.ink }}>{p.name}</h3>
                <p className="mt-2 font-normal tracking-[0] leading-[1.5] text-[13px]" style={{ color: COLORS.grey }}>{p.meta}</p>
                {p.kind === "web" ? (
                  <Link
                    to={p.href}
                    className="mt-6 inline-flex h-11 items-center justify-center rounded-full px-6 font-medium tracking-[0.24px] text-[14px] text-white transition-all hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#121317]"
                    style={{ backgroundColor: COLORS.blue }}
                  >
                    {p.action}
                  </Link>
                ) : (
                  /* Store links are not live yet — a disabled button, never a fabricated badge (L3 01-PM). */
                  <button
                    type="button"
                    aria-disabled="true"
                    title="Available at launch"
                    className="mt-6 inline-flex h-11 items-center justify-center rounded-full border px-6 font-medium tracking-[0.24px] text-[14px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] opacity-60"
                    style={{ borderColor: `${COLORS.ink}4D`, color: COLORS.ink }}
                  >
                    {p.action}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </FadeReveal>
    </section>
  );
}


/* ═══ 02b · NOTIFY — placeholder form until store links are ready (L3) ═══ */
function DownloadNotifySection() {
  const { ref, visible } = useRevealOnce();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const emailId = "notify-email";

  function handleSubmit(event) {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setStatus("error"); return; }
    setStatus("submitting");
    setTimeout(() => setStatus("success"), 900); // deterministic mock — no backend
  }

  return (
    <section ref={ref} className="relative bg-white px-6 pb-24" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <div className="mx-auto flex w-full max-w-[680px] flex-col items-center rounded-[24px] border p-8 text-center" style={{ borderColor: COLORS.mist }}>
          <p className="font-medium tracking-[0] leading-[1.25] text-[22px]" style={{ color: COLORS.ink }}>Be first in line at launch.</p>
          <p className="mt-2 font-normal tracking-[0] leading-[1.6] text-[14px]" style={{ color: COLORS.grey }}>
            Native apps are in final testing. We'll email you the moment your platform is ready.
          </p>
          {status === "success" ? (
            <p role="status" className="mt-6 w-full rounded-[14px] border px-5 py-4 font-normal tracking-[0] text-[14px]" style={{ borderColor: COLORS.mist, color: COLORS.ink }}>
              You're on the list. We'll write to <span className="font-medium">{email}</span> at launch.
            </p>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="mt-6 w-full">
              <label htmlFor={emailId} className="sr-only">Email address</label>
              <div className="flex flex-col items-center gap-3 sm:flex-row">
                <input
                  id={emailId}
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle"); }}
                  aria-invalid={status === "error"}
                  aria-describedby={status === "error" ? "notify-error" : undefined}
                  placeholder="you@example.com"
                  className="h-12 w-full rounded-full border px-5 text-[14px] tracking-[0.24px] outline-none transition-colors placeholder:text-[#9AA0A6] focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20"
                  style={{ borderColor: status === "error" ? "#EA4335" : COLORS.mist, color: COLORS.ink }}
                />
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="inline-flex h-12 shrink-0 items-center justify-center rounded-full px-8 font-medium tracking-[0.24px] text-[14px] text-white transition-all hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#121317] disabled:opacity-70"
                  style={{ backgroundColor: COLORS.blue }}
                >
                  {status === "submitting" ? "Adding you…" : "Notify me"}
                </button>
              </div>
              {status === "error" && (
                <p id="notify-error" role="alert" className="mt-3 text-left text-[13px] tracking-[0.24px]" style={{ color: "#EA4335" }}>
                  Please enter a valid email address — we can't notify you without one.
                </p>
              )}
            </form>
          )}
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══ 03 · SYNC BAND — continuity across devices ═══ */
function DownloadSyncSection() {
  const { ref, visible } = useRevealOnce();
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % SYNC_WORDS.length), 2500);
    return () => clearInterval(id);
  }, []);
  return (
    <section ref={ref} className="relative px-6 py-16 sm:px-8 lg:py-24" style={{ backgroundColor: COLORS.surface, fontFamily: FONT_FAMILY }}>
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 items-center gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
        <div>
          <p className={`text-balance font-normal tracking-[-0.02em] leading-[1.12] text-[clamp(28px,3.4vw,42px)] transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`} style={{ color: COLORS.ink }}>
            Start on one device.{" "}
            <span key={index} className="hero-fade-up inline-block" style={{ color: COLORS.blue }}>{SYNC_WORDS[index]}</span>{" "}
            on every other.
          </p>
          <p className={`mt-5 max-w-[560px] text-pretty font-normal tracking-[0.1px] leading-[1.65] text-[16px] sm:text-[17px] transition-all duration-700 ease-google delay-100 ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`} style={{ color: COLORS.grey }}>
            Conversations, progress, and context sync across web, desktop, and mobile — automatically, and privately.
          </p>
        </div>
        <div className={`transition-all duration-700 ease-google delay-150 ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
          <div className="overflow-hidden rounded-[28px] border" style={{ borderColor: COLORS.mist }}>
            <SpotIllustration subject="download" title="Illustration of Visionary syncing across devices" className="aspect-[4/3] w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══ 04 · REQUIREMENTS ═══ */
function DownloadRequirementsSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative px-6 py-16 sm:px-8 lg:py-24" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <p className="text-center font-medium uppercase tracking-[0.16em] leading-[16px] text-[12px]" style={{ color: COLORS.grey }}>System requirements</p>
        <h2 className="mx-auto mt-4 max-w-[18ch] text-balance text-center font-normal tracking-[-0.03em] leading-[1.12] text-[clamp(30px,3.6vw,44px)]" style={{ color: COLORS.ink }}>What you need to run Visionary.</h2>
        <div className="mx-auto mt-12 grid w-full max-w-[1240px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {REQUIREMENTS.map((r) => {
            const platform = PLATFORMS.find((p) => p.name === r.platform);
            return (
              <div key={r.platform} className="rounded-[20px] border bg-white p-6 transition-shadow duration-300 hover:shadow-[0_1px_3px_rgba(60,64,67,0.12),0_4px_12px_rgba(60,64,67,0.08)] sm:p-7" style={{ borderColor: COLORS.mist }}>
                {platform && (
                  <span className="flex h-11 w-11 items-center justify-center rounded-[14px]" style={{ backgroundColor: "#E8F0FE", color: "#1967D2" }}>
                    <platform.Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                  </span>
                )}
                <h3 className="mt-4 font-medium tracking-[0.1px] leading-[1.15] text-[18px]" style={{ color: COLORS.ink }}>{r.platform}</h3>
                <p className="mt-2 font-normal tracking-[0.1px] leading-[1.6] text-[14px]" style={{ color: COLORS.grey }}>{r.req}</p>
              </div>
            );
          })}
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══ 05 · TRUST BAND ═══ */
function DownloadTrustBand() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative px-6 pb-24" style={{ backgroundColor: COLORS.white, fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <div className="mx-auto flex w-fit max-w-full flex-col items-center gap-4 rounded-full px-10 py-6 sm:flex-row" style={{ backgroundColor: COLORS.surface }}>
          <ShieldCheck className="h-5 w-5 shrink-0" strokeWidth={1.8} style={{ color: COLORS.blue }} />
          <p className="text-center font-normal tracking-[0.24px] text-[15px]" style={{ color: COLORS.ink }}>
            Signed builds · Automatic updates · Your data stays yours on every device.
          </p>
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══ 06 · FINAL CTA ═══ */
function DownloadCTASection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative px-6 py-16 sm:px-8 lg:py-24" style={{ backgroundColor: COLORS.surface, fontFamily: FONT_FAMILY }}>
      <div className={`mx-auto max-w-[840px] text-center transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
        <h2 className="mx-auto max-w-[16ch] text-balance font-normal tracking-[-0.03em] leading-[1.12] text-[clamp(30px,3.6vw,44px)]" style={{ color: COLORS.ink }}>
          Still deciding? The web is one click away.
        </h2>
        <p className="mx-auto mt-5 max-w-[600px] text-pretty font-normal tracking-[0.1px] leading-[1.65] text-[16px] sm:text-[17px]" style={{ color: COLORS.grey }}>
          No install, no waiting. Open Visionary in your browser and pick up the app whenever you're ready.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/register"
            className="inline-flex h-12 items-center justify-center rounded-full px-8 font-medium tracking-[0.1px] text-[15px] text-white transition-all hover:shadow-[0_1px_3px_rgba(60,64,67,0.3)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
            style={{ backgroundColor: COLORS.blue }}
          >
            Continue on web
          </Link>
          <Link
            to="/how-it-works"
            className="inline-flex h-12 items-center justify-center rounded-full border px-8 font-medium tracking-[0.1px] text-[15px] transition-colors hover:bg-white"
            style={{ borderColor: COLORS.mist, color: COLORS.ink }}
          >
            See how it works
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ═══ PAGE — universal for all users ═══ */
export default function ResearchPage() {
  const { hash } = useLocation();

  /* Scroll to the platform card when arriving from the nav mega-menu */
  useEffect(() => {
    if (!hash) return undefined;
    const t = setTimeout(() => {
      const el = document.getElementById(hash.slice(1));
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
    return () => clearTimeout(t);
  }, [hash]);


  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
      <Breadcrumb page="Download" />
      <main id="main">

        <DownloadHeroSection />
        <DownloadPlatformsSection />
        <DownloadNotifySection />
        <DownloadSyncSection />
        <DownloadRequirementsSection />
        <DownloadTrustBand />
        <DownloadCTASection />
      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}