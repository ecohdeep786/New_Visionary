import { useState } from "react";
import { Cookie, Check, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { COLORS, FONT_FAMILY, useRevealOnce, FadeReveal, GreyTag } from "@/components/landing/AboutPageShared";
import SpotIllustration from "@/components/landing/SpotIllustration";
import Breadcrumb from "@/components/landing/Breadcrumb";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import { LEGAL_META } from "@/data/legalMeta";

/* ═══ COOKIE PRINCIPLES — the "why we use them" cards ═══ */
const COOKIE_PRINCIPLES = [
  { n: "01", Icon: Cookie, subject: "cookie", title: "Essential cookies.", copy: "These support sign-in, security, and core service behavior. Without them, Visionary cannot work as expected, so they cannot be turned off." },
  { n: "02", Icon: Check, subject: "lock", title: "No advertising cookies.", copy: "We don't use cookies to show you ads. Ever. There are no ad networks watching what you do here. Your attention is not for sale." },
  { n: "03", Icon: Globe, subject: "community", title: "Analytics with consent.", copy: "If we use analytics cookies, we ask first. You can say no, and Visionary still works perfectly. We only measure what you explicitly allow." },
];

/* ═══ COOKIE TYPES — numbered rows matching Google's "types of cookies" list ═══ */
const COOKIE_TYPES = [
  { n: "01", title: "Session cookies.", copy: "Keep you signed in while you use Visionary. Deleted when you close your browser." },
  { n: "02", title: "Preference cookies.", copy: "Remember things like your language and theme so you don't have to set them every time." },
  { n: "03", title: "Analytics (optional).", copy: "Help us understand what's working so we can improve. Only with your consent — and you can opt out anytime." },
];

/* ═══ HERO ═══ */
function CookiesHero() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative overflow-hidden px-6 pb-16 pt-40 lg:pb-24 lg:pt-48" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        <GreyTag className="text-center">Cookies</GreyTag>
        <h1 className="mx-auto mt-6 max-w-[1080px] text-center font-normal tracking-[-0.045em] leading-[1.06] text-[48px] sm:text-[64px] lg:text-[76px]" style={{ color: COLORS.ink }}>
          How we use <span style={{ color: COLORS.ink }}>cookies.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-[760px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey, marginTop: "var(--gap-title-sub-display)" }}>
          The short version, then the full list. Only what's needed — nothing extra.
        </p>

        {/* Cookie jar illustration */}
        <div className="mx-auto mt-20 flex justify-center">
          <div className="relative flex h-[200px] w-[200px] items-center justify-center rounded-[32px] border" style={{ borderColor: COLORS.mist }}>
            <SpotIllustration subject="cookie" className="h-[160px] w-[160px]" title="A cookie stores your preferences" />
          </div>
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══ WHAT WE USE & WHY — principle cards with illustrations ═══ */
function CookiePrinciplesSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative bg-white px-6 py-28 lg:py-36">
      <FadeReveal visible={visible}>
        <div className="mx-auto max-w-[1240px]">
          <GreyTag className="text-center">What we use and why</GreyTag>
          <h2 className="mx-auto mt-6 max-w-[1080px] text-center font-normal tracking-[-0.025em] leading-[1.15] text-[30px] sm:text-[36px] lg:text-[42px]" style={{ color: COLORS.ink }}>
            Essential only, <span style={{ color: COLORS.ink }}>nothing extra.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-[760px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey, marginTop: "var(--gap-title-sub-display)" }}>
            No advertising cookies. No tracking across other sites. Just what keeps Visionary running for you.
          </p>

          <div className="mt-20 mx-auto grid w-full max-w-[1240px] gap-16">
            {COOKIE_PRINCIPLES.map((p) => (
              <div key={p.n} className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                <div>
                  <p className="font-medium tracking-[0] text-[13px]" style={{ color: COLORS.lightGrey }}>{p.n}</p>
                  <h3 className="mt-2 font-medium tracking-[0] leading-[1.2] text-[clamp(22px,2.4vw,32px)]" style={{ color: COLORS.ink }}>{p.title}</h3>
                  <p className="mt-[calc(clamp(22px,2.4vw,32px)*0.545)] max-w-[560px] font-normal tracking-[0] leading-[1.6] text-[15px]" style={{ color: COLORS.grey }}>{p.copy}</p>
                </div>
                <div className="flex justify-center">
                  <div className="flex h-[128px] w-[128px] items-center justify-center rounded-[20px] border" style={{ borderColor: COLORS.mist }}>
                    <SpotIllustration subject={p.subject} className="h-[96px] w-[96px]" title={p.title} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══ TYPES WE USE — numbered rows (Google's "types of cookies" list) ═══ */
function CookieTypesSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative bg-white px-6 py-28 lg:py-36">
      <FadeReveal visible={visible}>
        <div className="mx-auto max-w-[1080px]">
          <GreyTag className="text-center">The types we use</GreyTag>
          <h2 className="mx-auto mt-6 max-w-[1080px] text-center font-normal tracking-[-0.025em] leading-[1.15] text-[30px] sm:text-[36px] lg:text-[42px]" style={{ color: COLORS.ink }}>
            What each cookie <span style={{ color: COLORS.ink }}>does.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-[640px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey, marginTop: "var(--gap-title-sub-display)" }}>
          </p>

          <div className="mt-16 mx-auto w-full max-w-[760px]">
            {COOKIE_TYPES.map((r, i) => (
              <div key={r.n} className={`grid grid-cols-1 gap-4 py-10 md:grid-cols-[120px_1fr] md:gap-10 ${i < COOKIE_TYPES.length - 1 ? "border-b" : ""}`} style={{ borderColor: `${COLORS.ink}14` }}>
                <p className="font-medium tracking-[0] text-[14px]" style={{ color: COLORS.lightGrey }}>{r.n}</p>
                <div>
                  <h3 className="font-medium tracking-[0] leading-[1.2] text-[clamp(22px,2.4vw,32px)]" style={{ color: COLORS.ink }}>{r.title}</h3>
                  <p className="mt-[calc(clamp(22px,2.4vw,32px)*0.545)] max-w-[640px] font-normal tracking-[0] leading-[1.6] text-[15px]" style={{ color: COLORS.grey }}>{r.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeReveal>
    </section>
  );
}

function CookiePreferencesSection() {
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
  const rows = [
    { label: "Essential", description: "Required for sign-in, security, and core service behavior.", value: true, disabled: true, onChange: () => {} },
    { label: "Preferences", description: "Remember choices such as language and appearance on this device.", value: preferences, onChange: () => { setPreferences((value) => !value); setSaved(false); } },
    { label: "Analytics", description: "Allow product measurement that helps us understand and improve the experience.", value: analytics, onChange: () => { setAnalytics((value) => !value); setSaved(false); } },
  ];
  return (
    <section id="cookie-preferences" className="scroll-mt-24 border-y border-[#dadce0] bg-[#f8f9fa] px-6 py-20 lg:py-28">
      <div className="mx-auto grid max-w-[1080px] gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div><GreyTag>Your choices</GreyTag><h2 className="mt-4 text-[32px] font-normal leading-[1.15] tracking-[-0.03em] text-[#121317] sm:text-[42px]">Manage cookies on this device.</h2><p className="mt-5 text-[15px] leading-[1.7] text-[#5f6368]">Optional choices are saved in this browser. They do not change settings on your other devices.</p></div>
        <div className="rounded-[24px] border border-[#dadce0] bg-white p-6 sm:p-8">
          <div className="divide-y divide-[#dadce0]">{rows.map((row) => <div key={row.label} className="flex items-center gap-5 py-5 first:pt-0"><div className="min-w-0 flex-1"><h3 className="text-[17px] font-medium text-[#121317]">{row.label}</h3><p className="mt-1 text-[14px] leading-[1.6] text-[#5f6368]">{row.description}</p></div><button type="button" role="switch" aria-label={`${row.label} cookies`} aria-checked={row.value} disabled={row.disabled} onClick={row.onChange} className="relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] disabled:cursor-not-allowed" style={{ backgroundColor: row.value ? "#0b57d0" : "#bdc1c6" }}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${row.value ? "left-6" : "left-1"}`} /></button></div>)}</div>
          <div className="mt-6 flex items-center gap-4"><button type="button" onClick={savePreferences} className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#0b57d0] px-6 text-[14px] font-medium text-white hover:bg-[#0842a0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2">Save choices</button><p role="status" aria-live="polite" className="text-[13px] text-[#1967d2]">{saved ? "Choices saved on this device." : ""}</p></div>
        </div>
      </div>
    </section>
  );
}

/* ═══ MANAGING COOKIES ═══ */
function CookieManageSection() {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative bg-white px-6 py-28 lg:py-36">
      <FadeReveal visible={visible}>
        <div className="mx-auto flex max-w-[1240px] flex-col items-center gap-12 lg:flex-row lg:items-start lg:gap-16">
          <div className="flex h-[120px] w-[120px] shrink-0 items-center justify-center rounded-[20px] border" style={{ borderColor: COLORS.mist }}>
            <SpotIllustration subject="help" className="h-[80px] w-[80px]" title="Manage your cookies" />
          </div>
          <div className="max-w-[640px]">
            <GreyTag>Manage them</GreyTag>
            <h2 className="mt-4 font-normal tracking-[-0.025em] leading-[1.15] text-[30px] sm:text-[36px] lg:text-[42px]" style={{ color: COLORS.ink }}>
              You control them. <span style={{ color: COLORS.ink }}>Always.</span>
            </h2>
            <p className="mt-5 font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey, marginTop: "var(--gap-title-sub-display)" }}>
              Clear your cookies anytime from your browser or your Visionary settings. Your call, always. No emails, no waiting.
            </p>
            <p className="mt-6 font-normal tracking-[0] leading-[1.6] text-[15px]" style={{ color: COLORS.grey }}>
              Essential cookies cannot be turned off — they're what make Visionary work. Preference and analytics cookies are optional, and you can change your choices at any time from your Visionary settings (Settings → Privacy & cookies).
            </p>
          </div>
        </div>
      </FadeReveal>
    </section>
  );
}

/* ═══ CTA ═══ */
function CookiesCTA() {
  return (
    <section className="relative border-t bg-white px-6 py-28 lg:py-36" style={{ borderColor: COLORS.mist, fontFamily: FONT_FAMILY }}>
      <div className="mx-auto flex max-w-[1080px] flex-col items-center gap-10 text-center">
        <div>
          <GreyTag>Questions</GreyTag>
          <h2 className="mt-4 font-normal tracking-[-0.03em] leading-[1.12] text-[36px] sm:text-[48px]" style={{ color: COLORS.ink }}>
            Questions about <span style={{ color: COLORS.ink }}>cookies?</span>
          </h2>
          <p className="mx-auto mt-6 max-w-[760px] font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey, marginTop: "var(--gap-title-sub-display)" }}>
            We're transparent about every cookie we use and why. Reach out if something isn't clear.
          </p>
        </div>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link to="/contact" className="inline-flex h-14 items-center justify-center rounded-full px-12 font-medium tracking-[0] text-[16px] text-white transition-all hover:opacity-90 active:scale-[0.98]" style={{ backgroundColor: COLORS.blue }}>
            Contact us
          </Link>
          <Link to="/privacy" className="inline-flex h-14 items-center justify-center rounded-full border px-10 font-medium tracking-[0] text-[16px] transition-colors hover:bg-[#121317]/5" style={{ borderColor: `${COLORS.ink}4D`, color: COLORS.ink }}>
            Read privacy policy
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ═══ PAGE ═══ */
export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
      <Breadcrumb page="Cookies" />
      <main id="main">
        <CookiesHero />
        <CookiePrinciplesSection />
        <CookieTypesSection />
        <CookiePreferencesSection />
        <CookieManageSection />
        <p className="pb-6 text-center text-[13px] tracking-[0.24px]" style={{ color: "#5f6368" }}>
          Last updated: <strong style={{ color: "#121317" }}>{LEGAL_META.cookies.lastUpdated}</strong>
        </p>
        <CookiesCTA />
      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
};

export { CookiesHero, CookiePrinciplesSection, CookieTypesSection, CookiePreferencesSection, CookieManageSection, CookiesCTA, COOKIE_PRINCIPLES, COOKIE_TYPES };
