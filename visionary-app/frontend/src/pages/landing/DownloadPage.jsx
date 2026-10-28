import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Globe, Monitor, Apple, Laptop, Smartphone, TabletSmartphone,
  Download, ShieldCheck,
} from "lucide-react";
import LandingNav from "@/components/landing/LandingNav";
import Breadcrumb from "@/components/landing/Breadcrumb";
import LandingFooter from "@/components/landing/LandingFooter";
import { ChevronIcon } from "@/components/landing/persona/PersonaSections";
import QuietLink from "@/components/landing/QuietLink";
import { fontStack } from "@/components/landing/system/tokens";

/* ═══ DESIGN TOKENS (same system) ═══ */
const COLORS = {
  ink: "#1d1d1f",
  surface: "#f5f5f7",
  blue: "#0066cc",
  grey: "#6e6e73",
  lightGrey: "#86868b",
  mist: "rgba(18,19,23,0.12)",
  white: "#ffffff",
};

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
    <div className={`transition-all duration-700 ease-apple ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"} ${className}`}>
      {children}
    </div>
  );
});

/* ═══ MODELS ═══ */
const PLATFORMS = [
  { id: "web", Icon: Globe, name: "Web", meta: "No install · Always up to date", action: "Open in browser", href: "/register", kind: "web" },
  { id: "windows", Icon: Monitor, name: "Windows", meta: "Windows 10 or later", action: "Windows app coming soon", kind: "desktop" },
  { id: "mac", Icon: Apple, name: "Mac", meta: "macOS 12 or later · Apple Silicon or Intel", action: "Mac app coming soon", kind: "desktop" },
  { id: "linux", Icon: Laptop, name: "Linux", meta: "Ubuntu 20.04+ · .deb / .AppImage planned", action: "Linux app coming soon", kind: "desktop" },
  { id: "ios", Icon: Smartphone, name: "iOS", meta: "iPhone & iPad · iOS 16 or later", action: "iOS app coming soon", kind: "store" },
  { id: "android", Icon: TabletSmartphone, name: "Android", meta: "Android 9 or later", action: "Android app coming soon", kind: "store" },
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
    <section ref={ref} data-section="01-hero" className="relative overflow-hidden px-6 pb-24 pt-24 lg:pt-28" style={{ fontFamily: fontStack }}>
      <FadeReveal visible={visible}>
        <p data-type="label" className="text-center" style={{ color: COLORS.grey }}>Download</p>
        <h1 className="mx-auto mt-4 max-w-[1080px] text-center font-normal tracking-[-0.045em] leading-[1.06] text-[48px] sm:text-[64px] lg:text-[76px]" style={{ color: COLORS.ink }}>
          Get <span className="accent-gradient">Visionary</span> on every device.
        </h1>
        <p className="mx-auto max-w-[760px] text-center font-normal tracking-[0] leading-[25px] text-[17px]" style={{ color: COLORS.grey, marginTop: "var(--gap-title-sub-display)" }}>
          On the phone, tablet or laptop you already own.
        </p>

        {/* The choice — Web or App */}
        <div className="mx-auto mt-12 w-full max-w-[880px] rounded-[30px] bg-[#f5f5f7] p-4 sm:p-6 lg:p-10">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="relative flex flex-col overflow-hidden rounded-[20px] bg-white p-8 pb-20">
            <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#f5f5f7]" style={{ color: COLORS.blue }}>
              <Globe className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <h2 className="mt-[calc(clamp(20px,2vw,26px)*1.2)] font-medium tracking-[0] leading-[1.15] text-[clamp(20px,2vw,26px)]" style={{ color: COLORS.ink }}>Continue on web</h2>
            <p className="mt-[calc(clamp(20px,2vw,26px)*0.6)] font-normal tracking-[0] leading-[1.6] text-[14px]" style={{ color: COLORS.grey }}>
              Full Visionary in your browser. Nothing to install, always up to date, works on any computer.
            </p>
            {/* google.com card curve — tint sweeps into the corner and the card's action floats in it with breath */}
            <div aria-hidden="true" className="absolute bottom-0 right-0 h-[72px] w-[220px] rounded-tl-[24px] bg-white" />
            <Link
              to="/register"
              className="absolute bottom-3 right-3 inline-flex h-11 items-center justify-center rounded-full bg-[#1d1d1f] px-[21px] font-medium leading-[1.176] tracking-[-0.011em] text-[17px] text-white transition-all duration-200 hover:scale-[1.01] hover:bg-[#272729] active:scale-[0.98] active:bg-[#18181a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
            >
              Open Visionary
            </Link>
          </div>

          <div className="relative flex flex-col overflow-hidden rounded-[20px] bg-white p-8 pb-20">
            <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#f5f5f7]" style={{ color: COLORS.blue }}>
              <Download className="h-5 w-5" strokeWidth={1.8} />
            </span>
            <h2 className="mt-[calc(clamp(20px,2vw,26px)*1.2)] font-medium tracking-[0] leading-[1.15] text-[clamp(20px,2vw,26px)]" style={{ color: COLORS.ink }}>Get the app</h2>
            <p className="mt-[calc(clamp(20px,2vw,26px)*0.6)] font-normal tracking-[0] leading-[1.6] text-[14px]" style={{ color: COLORS.grey }}>
              Native apps for desktop and mobile: faster, offline-friendly, and synced to your account.
            </p>
            <div aria-hidden="true" className="absolute bottom-0 right-0 h-[72px] w-[220px] rounded-tl-[24px] bg-white" />
            <button
              type="button"
              onClick={scrollToPlatforms}
              className="absolute bottom-3 right-3 inline-flex h-11 items-center justify-center rounded-full bg-[rgba(0,0,0,0.08)] px-[21px] font-medium leading-[1.176] tracking-[-0.011em] text-[17px] text-[#1d1d1f] transition-all duration-200 hover:scale-[1.01] hover:bg-[rgba(0,0,0,0.13)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
            >
              See platforms
            </button>
          </div>
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
    <section ref={ref} id="platforms" data-section="02-platforms" className="relative scroll-mt-24 bg-white px-6" style={{ fontFamily: fontStack }}>
      <FadeReveal visible={visible}>
        <p className="text-center apple-eyebrow" style={{ color: COLORS.grey }}>Supported platforms</p>
        <h2 className="text-center font-normal tracking-[-0.025em] leading-[1.15] text-[30px] sm:text-[36px] lg:text-[42px]" style={{ color: COLORS.ink, marginTop: "var(--gap-eyebrow-title-display)" }}>Choose your platform.</h2>
        <p className="mx-auto mt-[16px] sm:mt-[19px] lg:mt-[22px] max-w-[640px] text-center font-normal tracking-[0] leading-[1.6] text-[16px]" style={{ color: COLORS.grey }}>
          Use Visionary on the web today. Native apps are being prepared
          {detected ? (
            <> for your device, including <span style={{ color: COLORS.blue }}>{PLATFORMS.find((p) => p.id === detected)?.name}</span>.</>
          ) : (
            <> for desktop and mobile.</>
          )}
        </p>

        <div className="mx-auto mt-12 w-full max-w-[1240px] rounded-[30px] bg-[#f5f5f7] p-4 sm:p-6 lg:p-10">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PLATFORMS.map((p) => {
            const isRecommended = detected === p.id;
            return (
              <div
                key={p.id}
                id={p.id}
                className="relative flex flex-col scroll-mt-24 rounded-[20px] bg-white p-7"
              >
                {isRecommended && (
                  <span className="absolute right-5 top-5 rounded-full bg-[#1d1d1f] px-2.5 py-1 text-[12px] font-medium leading-none text-white">
                    Recommended
                  </span>
                )}
                <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#f5f5f7]" style={{ color: COLORS.blue }}>
                  <p.Icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <h3 className="mt-5 font-medium tracking-[0] leading-[1.15] text-[20px]" style={{ color: COLORS.ink }}>{p.name}</h3>
                <p className="mt-2 font-normal tracking-[0] leading-[1.5] text-[13px]" style={{ color: COLORS.grey }}>{p.meta}</p>
                {p.kind === "web" ? (
                  <Link
                    to={p.href}
                    className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#1d1d1f] px-[21px] font-medium leading-[1.176] tracking-[-0.011em] text-[17px] text-white transition-all duration-200 hover:scale-[1.01] hover:bg-[#272729] active:scale-[0.98] active:bg-[#18181a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
                  >
                    {p.action}
                  </Link>
                ) : (
                  /* Store links are not live yet — a disabled button, never a fabricated badge (L3 01-PM). */
                  <button
                    type="button"
                    aria-disabled="true"
                    title="Available at launch"
                    className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[rgba(0,0,0,0.08)] px-[21px] font-medium leading-[1.176] tracking-[-0.011em] text-[17px] text-[#1d1d1f] transition-all duration-200 hover:scale-[1.01] hover:bg-[rgba(0,0,0,0.13)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
                  >
                    {p.action}
                  </button>
                )}
              </div>
            );
          })}
          </div>
        </div>
        <div className="mt-10 flex justify-center">
          <QuietLink to="/how-it-works">
            See how the product works first <ChevronIcon className="h-4 w-4" aria-hidden="true" />
          </QuietLink>
        </div>
      </FadeReveal>
    </section>
  );
}


/* ═══ 02b · NATIVE APP LAUNCH REQUEST ═══ */
function DownloadNotifySection() {
  const { ref, visible } = useRevealOnce();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const emailId = "notify-email";

  function handleSubmit(event) {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setStatus("error"); return; }
    const body = `Please let me know when Visionary native apps are available.\n\nEmail: ${email}`;
    window.location.href = `mailto:hello@visionary.org.in?subject=${encodeURIComponent("Visionary native app launch request")}&body=${encodeURIComponent(body)}`;
    setStatus("success");
  }

  return (
    <section ref={ref} className="relative bg-white px-6 pb-24" style={{ fontFamily: fontStack }}>
      <FadeReveal visible={visible}>
        <div className="mx-auto flex w-full max-w-[680px] flex-col items-center rounded-[30px] bg-[#f5f5f7] p-8 text-center lg:p-10">
          <p className="font-medium tracking-[0] leading-[1.25] text-[22px]" style={{ color: COLORS.ink }}>Be first in line at launch.</p>
          <p className="mt-2 font-normal tracking-[0] leading-[1.6] text-[14px]" style={{ color: COLORS.grey }}>
            Native apps are in final testing. We'll email you the moment your platform is ready.
          </p>
          {status === "success" ? (
            <p role="status" className="mt-6 w-full rounded-[14px] bg-white px-5 py-4 font-normal tracking-[0] text-[14px]" style={{ color: COLORS.ink }}>
              Your email app opened a request for <span className="font-medium">{email}</span>. Review it and send when ready.
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
                  className="h-12 w-full rounded-full border px-5 text-[14px] tracking-[0.24px] outline-none transition-colors placeholder:text-[#86868b] focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
                  style={{ borderColor: status === "error" ? "#e30000" : COLORS.mist, color: COLORS.ink }}
                />
                <button
                  type="submit"
                  className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-[#1d1d1f] px-[21px] font-medium leading-[1.176] tracking-[-0.011em] text-[17px] text-white transition-all duration-200 hover:scale-[1.01] hover:bg-[#272729] active:scale-[0.98] active:bg-[#18181a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2 disabled:opacity-70"
                >
                  Prepare email request
                </button>
              </div>
              {status === "error" && (
                <p id="notify-error" role="alert" className="mt-3 text-left text-[13px] tracking-[0.24px]" style={{ color: "#e30000" }}>
                  Please enter a valid email address. We can't notify you without one.
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
    <section ref={ref} data-section="03-sync" className="relative px-6" style={{ backgroundColor: COLORS.surface, fontFamily: fontStack }}>
      <p className={`mx-auto max-w-[1400px] text-center font-normal tracking-[0] leading-[1.075] text-[clamp(24px,2.78vw,40px)] transition-all duration-700 ease-apple ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`} style={{ color: COLORS.ink }}>
        Start on one device.{" "}
        <span key={index} className="hero-fade-up inline-block capitalize" style={{ color: COLORS.blue }}>{SYNC_WORDS[index]}</span>{" "}
        on every other.
      </p>
      <p className={`mx-auto max-w-[700px] text-center font-normal tracking-[0] leading-[25px] text-[17px] transition-all duration-700 ease-apple delay-100 ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`} style={{ color: COLORS.grey }}>
        Conversations, progress, and context sync across web, desktop, and mobile, automatically and privately.
      </p>
      <div className="mt-9 flex justify-center">
        <QuietLink to="/contact">
          Questions about your devices <ChevronIcon className="h-4 w-4" aria-hidden="true" />
        </QuietLink>
      </div>
    </section>
  );
}

/* ═══ 04 · REQUIREMENTS ═══ */
function DownloadRequirementsSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} data-section="04-requirements" className="relative bg-white px-6" style={{ fontFamily: fontStack }}>
      <FadeReveal visible={visible}>
        <p className="text-center apple-eyebrow" style={{ color: COLORS.grey }}>System requirements</p>
        <h2 className="text-center font-normal tracking-[-0.025em] leading-[1.15] text-[30px] sm:text-[36px] lg:text-[42px]" style={{ color: COLORS.ink, marginTop: "calc(var(--fs-h2) * 0.29)" }}>What you need to run Visionary.</h2>
        <div className="mx-auto mt-12 w-full max-w-[1240px] rounded-[30px] bg-[#f5f5f7] p-4 sm:p-6 lg:p-10">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {REQUIREMENTS.map((r) => (
            <div key={r.platform} className="rounded-[20px] bg-white p-7">
              <h3 className="font-medium tracking-[0] leading-[1.15] text-[18px]" style={{ color: COLORS.ink }}>{r.platform}</h3>
              <p className="mt-3 font-normal tracking-[0] leading-[1.6] text-[14px]" style={{ color: COLORS.grey }}>{r.req}</p>
            </div>
          ))}
          </div>
        </div>
        <div className="mt-10 flex justify-center">
          <QuietLink to="/help">
            Setup guides live in the Help center <ChevronIcon className="h-4 w-4" aria-hidden="true" />
          </QuietLink>
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══ 05 · TRUST BAND ═══ */
function DownloadTrustBand() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative px-6 py-12" style={{ backgroundColor: COLORS.white, fontFamily: fontStack }}>
      <FadeReveal visible={visible}>
        <div className="mx-auto flex w-fit max-w-full flex-col items-center gap-4 rounded-full px-10 py-6 sm:flex-row" style={{ backgroundColor: COLORS.surface }}>
          <ShieldCheck className="h-5 w-5 shrink-0" strokeWidth={1.8} style={{ color: COLORS.blue }} />
          <p className="text-center font-normal tracking-[0.24px] text-[16px]" style={{ color: COLORS.ink }}>
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
    <section ref={ref} data-section="05-cta" className="relative rounded-t-[32px] px-6" style={{ backgroundColor: COLORS.surface, fontFamily: fontStack }}>
      <div className={`mx-auto max-w-[1500px] text-center transition-all duration-700 ease-apple ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
        <h2 className="font-normal tracking-[-0.03em] leading-[1.12] text-[36px] sm:text-[48px]" style={{ color: COLORS.ink }}>
          Still deciding? The web is one click away.
        </h2>
        <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/register" className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full bg-[#1d1d1f] px-[21px] font-medium leading-[1.176] tracking-[-0.011em] text-[17px] text-white transition-all duration-200 hover:scale-[1.01] hover:bg-[#272729] active:scale-[0.98] active:bg-[#18181a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2 max-[390px]:w-full max-[390px]:max-w-[320px]">
            Continue on web
          </Link>
          <Link to="/how-it-works" className="inline-flex h-11 items-center justify-center gap-1.5 whitespace-nowrap px-4 text-[17px] font-normal tracking-[-0.011em] text-[#0066cc] transition-colors duration-200 hover:text-[#0071e3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2 max-[390px]:w-full max-[390px]:max-w-[320px]">
            See how it works
            <ChevronIcon className="h-4 w-4" />
          </Link>
        </div>
        <p className="mt-8 text-center font-normal tracking-[0] text-[14px] leading-[1.5]" style={{ color: COLORS.grey }}>
          No install, no waiting. Pick up the app whenever you're ready.
        </p>
      </div>
    </section>
  );
}

/* ═══ PAGE — universal for all users ═══ */
export default function DownloadPage() {
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
    <div className="page-download min-h-screen bg-white" style={{ fontFamily: fontStack }}>
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
