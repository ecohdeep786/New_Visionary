import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Globe, Monitor, Apple, Laptop, Smartphone, TabletSmartphone,
  Download, ShieldCheck,
} from "lucide-react";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

/* ═══ DESIGN TOKENS (same system) ═══ */
const COLORS = {
  ink: "#121317",
  surface: "#ffffffff",
  blue: "#4285F4",
  grey: "#5f6368",
  lightGrey: "#9AA0A6",
  mist: "#dadce0",
  chipBg: "#D2E3FC",
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
    <section ref={ref} className="relative overflow-hidden px-6 pb-24 pt-40 lg:pt-48" style={{ backgroundColor: COLORS.surface, fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <p className="text-center font-normal uppercase tracking-[0.43px] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>Download</p>
        <h1 className="mx-auto mt-4 max-w-[1080px] text-center font-medium tracking-[0] leading-[1.05] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          One intelligence. <span style={{ color: COLORS.blue }}>Every device.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-[760px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          Use Visionary in your browser with nothing to install — or take it with you on the devices you already use. Your account keeps everything connected.
        </p>

        {/* The choice — Web or App */}
        <div className="mx-auto mt-14 grid w-full max-w-[880px] grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="flex flex-col rounded-[24px] border bg-white p-8" style={{ borderColor: COLORS.mist }}>
            <span className="flex h-12 w-12 items-center justify-center rounded-[16px] border bg-white" style={{ borderColor: COLORS.mist, color: COLORS.blue }}>
              <Globe className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <h2 className="mt-6 font-medium tracking-[0] leading-[1.15] text-[clamp(20px,2vw,26px)]" style={{ color: COLORS.ink }}>Continue on web</h2>
            <p className="mt-3 font-normal tracking-[0] leading-[1.6] text-[14px]" style={{ color: COLORS.grey }}>
              Full Visionary in your browser. Nothing to install, always up to date, works on any computer.
            </p>
            <Link
              to="/register"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-full px-8 font-medium tracking-[0.24px] text-[15px] text-white transition-all hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#121317]"
              style={{ backgroundColor: COLORS.blue }}
            >
              Open Visionary
            </Link>
          </div>

          <div className="flex flex-col rounded-[24px] border bg-white p-8" style={{ borderColor: COLORS.mist }}>
            <span className="flex h-12 w-12 items-center justify-center rounded-[16px] border bg-white" style={{ borderColor: COLORS.mist, color: COLORS.blue }}>
              <Download className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <h2 className="mt-6 font-medium tracking-[0] leading-[1.15] text-[clamp(20px,2vw,26px)]" style={{ color: COLORS.ink }}>Get the app</h2>
            <p className="mt-3 font-normal tracking-[0] leading-[1.6] text-[14px]" style={{ color: COLORS.grey }}>
              Native apps for desktop and mobile — faster, offline-friendly, and synced to your account.
            </p>
            <button
              type="button"
              onClick={scrollToPlatforms}
              className="mt-8 inline-flex h-12 items-center justify-center rounded-full border px-8 font-medium tracking-[0.24px] text-[15px] transition-colors hover:bg-[#121317]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
              style={{ borderColor: `${COLORS.ink}4D`, color: COLORS.ink }}
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
    <section ref={ref} id="platforms" className="relative scroll-mt-24 bg-white px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <p className="text-center font-normal uppercase tracking-[0.43px] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>Supported platforms</p>
        <h2 className="mt-4 text-center font-medium tracking-[0] leading-[1.05] text-[clamp(30px,4vw,56px)]" style={{ color: COLORS.ink }}>Choose your platform.</h2>
        <p className="mx-auto mt-4 max-w-[640px] text-center font-normal tracking-[0] leading-[1.6] text-[15px]" style={{ color: COLORS.grey }}>
          Version {APP_VERSION} · Updated this week ·{" "}
          {detected ? (
            <>Recommended for your device: <span style={{ color: COLORS.blue }}>{PLATFORMS.find((p) => p.id === detected)?.name}</span></>
          ) : (
            <>Works everywhere you do</>
          )}
        </p>

        <div className="mx-auto mt-14 grid w-full max-w-[1240px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PLATFORMS.map((p) => {
            const isRecommended = detected === p.id;
            const ButtonTag = p.kind === "web" ? Link : "a";
            return (
              <div
                key={p.id}
                id={p.id}
                className="relative flex flex-col scroll-mt-24 rounded-[24px] border bg-white p-7 transition-all duration-300"
                style={{
                  borderColor: isRecommended ? COLORS.blue : COLORS.mist,
                  /*boxShadow: isRecommended ? "0 12px 32px rgba(66,133,244,0.14)" : "0 8px 24px rgba(60,64,67,0.06)",*/
                }}
              >
                {isRecommended && (
                  <span className="absolute right-5 top-5 rounded-full px-3 py-1 font-normal uppercase tracking-[0.43px] text-[10px]" style={{ backgroundColor: COLORS.chipBg, color: COLORS.ink }}>
                    Recommended
                  </span>
                )}
                <span className="flex h-12 w-12 items-center justify-center rounded-[16px] border bg-white" style={{ borderColor: COLORS.mist, color: COLORS.blue }}>
                  <p.Icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <h3 className="mt-5 font-medium tracking-[0] leading-[1.15] text-[20px]" style={{ color: COLORS.ink }}>{p.name}</h3>
                <p className="mt-2 font-normal tracking-[0] leading-[1.5] text-[13px]" style={{ color: COLORS.grey }}>{p.meta}</p>
                {p.kind === "web" ? (
                  <Link
                    to={p.href}
                      aria-disabled="true"
                   title="Available at launch"
                  onClick={(e) => e.preventDefault()} 
                    className="mt-6 inline-flex h-11 items-center justify-center rounded-full px-6 font-medium tracking-[0.24px] text-[14px] text-white transition-all hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#121317]"
                    style={{ backgroundColor: COLORS.blue }}
                  >
                    {p.action}
                  </Link>
                ) : (
                  <a
                    href={p.href}
                      aria-disabled="true"
                   title="Available at launch"
                  onClick={(e) => e.preventDefault()} 
                    className="mt-6 inline-flex h-11 items-center justify-center rounded-full border px-6 font-medium tracking-[0.24px] text-[14px] transition-colors hover:bg-[#121317]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                    style={{ borderColor: `${COLORS.ink}4D`, color: COLORS.ink }}
                  >
                    {p.action}
                  </a>
                )}
              </div>
            );
          })}
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
    <section ref={ref} className="relative px-6 py-24 lg:py-32" style={{ backgroundColor: COLORS.surface, fontFamily: FONT_FAMILY }}>
      <p className={`mx-auto max-w-[1400px] text-center font-normal tracking-[0] leading-[1.075] text-[clamp(24px,2.78vw,40px)] transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`} style={{ color: COLORS.ink }}>
        Start on one device.{" "}
        <span key={index} className="hero-fade-up inline-block capitalize" style={{ color: COLORS.blue }}>{SYNC_WORDS[index]}</span>{" "}
        on every other.
      </p>
      <p className={`mx-auto mt-6 max-w-[700px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px] transition-all duration-700 ease-google delay-100 ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`} style={{ color: COLORS.grey }}>
        Conversations, progress, and context sync across web, desktop, and mobile — automatically, and privately.
      </p>
    </section>
  );
}

/* ═══ 04 · REQUIREMENTS ═══ */
function DownloadRequirementsSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative bg-white px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <p className="text-center font-normal uppercase tracking-[0.43px] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>System requirements</p>
        <h2 className="mt-4 text-center font-medium tracking-[0] leading-[1.05] text-[clamp(30px,4vw,56px)]" style={{ color: COLORS.ink }}>What you need to run Visionary.</h2>
        <div className="mx-auto mt-14 grid w-full max-w-[1240px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {REQUIREMENTS.map((r) => (
            <div key={r.platform} className="rounded-[24px] border bg-white p-7" style={{ borderColor: COLORS.mist }}>
              <h3 className="font-medium tracking-[0] leading-[1.15] text-[18px]" style={{ color: COLORS.ink }}>{r.platform}</h3>
              <p className="mt-3 font-normal tracking-[0] leading-[1.6] text-[14px]" style={{ color: COLORS.grey }}>{r.req}</p>
            </div>
          ))}
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
    <section ref={ref} className="relative px-6 py-28 lg:py-36" style={{ backgroundColor: COLORS.surface, fontFamily: FONT_FAMILY }}>
      <div className={`mx-auto max-w-[1500px] text-center transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
        <h2 className="font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          Still deciding? The web is one click away.
        </h2>
        <p className="mx-auto mt-6 max-w-[760px] font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
          No install, no waiting. Open Visionary in your browser and pick up the app whenever you're ready.
        </p>
        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/register"
            className="inline-flex h-14 items-center justify-center rounded-full px-12 font-medium tracking-[0] text-[16px] text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: COLORS.blue }}
          >
            Continue on web
          </Link>
          <Link
            to="/how-it-works"
            className="inline-flex h-14 items-center justify-center rounded-full border px-10 font-medium tracking-[0] text-[16px] transition-colors hover:bg-[#121317]/5"
            style={{ borderColor: `${COLORS.ink}4D`, color: COLORS.ink }}
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
      <main>
      
        <DownloadHeroSection />
        <DownloadPlatformsSection />
        <DownloadSyncSection />
        <DownloadRequirementsSection />
        <DownloadTrustBand />
        <DownloadCTASection />
      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}