import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Breadcrumb from "@/components/landing/Breadcrumb";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import SpotIllustration from "@/components/landing/SpotIllustration";

/* ═══ DESIGN TOKENS — shared across all About sub-pages ═══ */
export const COLORS = {
  ink: "#121317",
  surface: "#f8f9fa",
  blue: "#4285F4",
  grey: "#5f6368",
  lightGrey: "#9AA0A6",
  mist: "#dadce0",
  white: "#ffffff",
};
export const FONT_FAMILY = "'Google Sans Flex', 'Google Sans', system-ui, sans-serif";

/* ═══ CONTROLLER ═══ */
export function useRevealOnce(rootMargin = "0px 0px -10% 0px") {
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
        if (entry.isIntersecting && !hasRevealed.current) {
          setVisible(true);
          hasRevealed.current = true;
          observer.disconnect();
        }
      },
      { threshold: 0, rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);
  return { ref, visible };
}

/* ═══ SHARED VIEWS ═══ */
export const FadeReveal = React.memo(function FadeReveal({ visible, children, className = "" }) {
  return (
    <div className={`transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"} ${className}`}>
      {children}
    </div>
  );
});

export const GreyTag = React.memo(function GreyTag({ children, className = "" }) {
  return (
    <p className={`text-[12px] font-medium uppercase tracking-[0.16em] leading-[16px] ${className}`} style={{ color: COLORS.grey }}>
      {children}
    </p>
  );
});

/* Google-style tinted icon chip — replaces the old bordered tile look */
const TONES = {
  blue: { bg: "#E8F0FE", fg: "#1967D2" },
  green: { bg: "#E6F4EA", fg: "#188038" },
  yellow: { bg: "#FEF7E0", fg: "#B06000" },
  red: { bg: "#FCE8E6", fg: "#C5221F" },
};
export const IconTile = React.memo(function IconTile({ Icon, size = "lg", tone = "blue" }) {
  const dim = size === "lg" ? "h-12 w-12" : "h-10 w-10";
  const icon = size === "lg" ? "h-5 w-5" : "h-[18px] w-[18px]";
  const t = TONES[tone] || TONES.blue;
  return (
    <span className={`flex ${dim} shrink-0 items-center justify-center rounded-[14px]`} style={{ backgroundColor: t.bg, color: t.fg }}>
      <Icon className={icon} strokeWidth={1.8} aria-hidden="true" />
    </span>
  );
});

/* ═══ HERO — shared across all About sub-pages ═══
   Google grammar: eyebrow → display headline → sub → optional visual anchor.
   Top offset tuned to land the H1 ~190px below the top of the viewport
   (breadcrumb band + one breath) — no more 340px of dead air. */
export function AboutHero({ eyebrow, titleParts, intro, illustration, image, alt, meta }) {
  const { ref, visible } = useRevealOnce();
  const hasVisual = Boolean(illustration || image);
  return (
    <section ref={ref} className="relative scroll-mt-44 overflow-hidden px-6 pb-14 pt-16 sm:px-8 lg:pb-16 lg:pt-20" style={{ fontFamily: FONT_FAMILY, backgroundColor: COLORS.white }}>
      <FadeReveal visible={visible}>
        <div className="mx-auto max-w-[880px]">
          {eyebrow && <GreyTag className="text-center">{eyebrow}</GreyTag>}
          <h1 className="mx-auto mt-5 max-w-[16ch] text-balance text-center font-normal tracking-[-0.04em] leading-[1.06] text-[clamp(40px,5.6vw,64px)]" style={{ color: COLORS.ink }}>
            {titleParts.map((p, i) => (
              <React.Fragment key={i}>
                {p.accent ? <span style={{ color: COLORS.blue }}>{p.text}</span> : p.text}
              </React.Fragment>
            ))}
          </h1>
          {intro && (
            <p className="mx-auto mt-6 max-w-[640px] text-pretty text-center font-normal tracking-[0.1px] leading-[1.65] text-[17px] sm:text-[18px]" style={{ color: COLORS.grey }}>
              {intro}
            </p>
          )}
          {meta && (
            <p className="mt-5 text-center text-[13px] tracking-[0.1px]" style={{ color: COLORS.grey }}>
              {meta}
            </p>
          )}
        </div>
        {hasVisual && (
          <div className="mx-auto mt-12 w-full max-w-[760px]">
            <div className="overflow-hidden rounded-[28px] border bg-[#f8f9fa]" style={{ borderColor: COLORS.mist }}>
              {image ? (
                <img src={image} alt={alt || ""} loading="eager" decoding="async" className="aspect-[16/9] w-full object-cover" />
              ) : (
                <SpotIllustration subject={illustration} title={alt} className="aspect-[16/9] w-full" />
              )}
            </div>
          </div>
        )}
      </FadeReveal>
    </section>
  );
}

/* ═══ CONTENT SECTION — pillar cards or numbered rows ═══
   Consistent Google rhythm: py-16 (64) mobile / py-24 (96) desktop,
   alternating white ↔ canvas bands, cards with tinted icon chips and
   hover elevation. */
export function AboutContentSection({ id, eyebrow, heading, headingAccent, body, cards, rows, stats, bg = "white", children }) {
  const { ref, visible } = useRevealOnce();
  const surface = bg === "surface";
  return (
    <section ref={ref} id={id} className="relative scroll-mt-44 px-6 py-16 sm:px-8 lg:py-24" style={{ fontFamily: FONT_FAMILY, backgroundColor: surface ? COLORS.surface : COLORS.white }}>
      <FadeReveal visible={visible}>
        {(eyebrow || heading) && (
          <div className="mx-auto max-w-[840px] text-center">
            {eyebrow && <GreyTag>{eyebrow}</GreyTag>}
            {heading && (
              <h2 className="mx-auto mt-4 max-w-[20ch] text-balance font-normal tracking-[-0.03em] leading-[1.12] text-[clamp(30px,3.6vw,44px)]" style={{ color: COLORS.ink }}>
                {heading} {headingAccent && <span style={{ color: COLORS.blue }}>{headingAccent}</span>}
              </h2>
            )}
            {body && (
              <p className="mx-auto mt-5 max-w-[640px] text-pretty font-normal tracking-[0.1px] leading-[1.65] text-[16px] sm:text-[17px]" style={{ color: COLORS.grey }}>
                {body}
              </p>
            )}
          </div>
        )}

        {/* Stat band — the Google numbers strip */}
        {stats && (
          <div className="mx-auto mt-12 grid w-full max-w-[1080px] grid-cols-1 gap-8 sm:grid-cols-3">
            {stats.map((s) => (
              <div key={s.value} className="text-center">
                <p className="font-normal tracking-[-0.03em] leading-[1.05] text-[clamp(38px,4.2vw,52px)]" style={{ color: COLORS.blue }}>{s.value}</p>
                <p className="mx-auto mt-2 max-w-[220px] text-[14px] leading-[1.5]" style={{ color: COLORS.grey }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Pillar cards grid */}
        {cards && (
          <div className="mx-auto mt-12 grid w-full max-w-[1240px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {cards.map((c) => (
              <div
                key={c.title}
                className="rounded-[20px] border p-6 transition-shadow duration-300 hover:shadow-[0_1px_3px_rgba(60,64,67,0.12),0_4px_12px_rgba(60,64,67,0.08)] sm:p-7"
                style={{ borderColor: COLORS.mist, backgroundColor: surface ? COLORS.white : COLORS.white }}
              >
                <IconTile Icon={c.Icon} tone={c.tone} />
                <h3 className="mt-5 font-medium tracking-[0.1px] leading-[1.3] text-[19px]" style={{ color: COLORS.ink }}>{c.title}</h3>
                <p className="mt-2.5 font-normal tracking-[0.1px] leading-[1.6] text-[14.5px]" style={{ color: COLORS.grey }}>{c.copy}</p>
              </div>
            ))}
          </div>
        )}

        {/* Numbered rows */}
        {rows && (
          <div className="mx-auto mt-12 w-full max-w-[880px]">
            {rows.map((r, i) => (
              <div key={r.n} className={`grid grid-cols-1 gap-4 py-8 md:grid-cols-[72px_1fr] md:gap-8 ${i < rows.length - 1 ? "border-b" : ""}`} style={{ borderColor: `${COLORS.ink}12` }}>
                <p className="text-[14px] font-medium leading-[1.9]" style={{ color: COLORS.lightGrey }}>{r.n}</p>
                <div>
                  <h3 className="font-medium tracking-[0.1px] leading-[1.25] text-[22px]" style={{ color: COLORS.ink }}>{r.title}</h3>
                  <p className="mt-3 max-w-[640px] font-normal tracking-[0.1px] leading-[1.65] text-[15px]" style={{ color: COLORS.grey }}>{r.copy}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {children}
      </FadeReveal>
    </section>
  );
}

/* ═══ CTA — shared closing section ═══ */
export function AboutCTA({ title, titleAccent, desc, primaryLabel = "Get started", primaryTo = "/register", secondaryLabel, secondaryTo, illustration = "compass" }) {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative px-6 py-16 sm:px-8 lg:py-24" style={{ fontFamily: FONT_FAMILY, backgroundColor: COLORS.surface }}>
      <div className={`mx-auto max-w-[880px] text-center transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
        <div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-[24px]">
          <SpotIllustration subject={illustration} className="aspect-[16/9] w-full" />
        </div>
        <h2 className="mx-auto mt-8 max-w-[18ch] text-balance font-normal tracking-[-0.03em] leading-[1.12] text-[clamp(30px,3.6vw,44px)]" style={{ color: COLORS.ink }}>
          {title} {titleAccent && <span style={{ color: COLORS.blue }}>{titleAccent}</span>}
        </h2>
        {desc && (
          <p className="mx-auto mt-5 max-w-[600px] text-pretty font-normal tracking-[0.1px] leading-[1.65] text-[16px] sm:text-[17px]" style={{ color: COLORS.grey }}>
            {desc}
          </p>
        )}
        <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link to={primaryTo} className="inline-flex h-12 items-center justify-center rounded-full px-8 font-medium tracking-[0.1px] text-[15px] text-white transition-all hover:shadow-[0_1px_3px_rgba(60,64,67,0.3)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2" style={{ backgroundColor: COLORS.blue }}>
            {primaryLabel}
          </Link>
          {secondaryLabel && (
            <Link to={secondaryTo} className="inline-flex h-12 items-center justify-center rounded-full border px-8 font-medium tracking-[0.1px] text-[15px] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2" style={{ borderColor: COLORS.mist, color: COLORS.ink }}>
              {secondaryLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

/* ═══ LEGAL PAGE — full wrapper for trust/legal pages ═══ */
export function LegalPage({ eyebrow, titleParts, intro, sections, cta, lastUpdated, breadcrumb, heroIllustration }) {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
      {breadcrumb && <Breadcrumb page={breadcrumb} />}
      <main>
        <AboutHero
          eyebrow={eyebrow}
          titleParts={titleParts}
          intro={intro}
          illustration={heroIllustration}
          meta={lastUpdated ? <>Last updated: <strong style={{ color: "#121317" }}>{lastUpdated}</strong></> : undefined}
        />
        {sections.map((s, i) => (
          <AboutContentSection key={s.id || i} {...s} />
        ))}
        <AboutCTA {...(cta || {})} />
      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}

/* ═══ SIMPLE PAGE — wrapper for company/support pages ═══ */
export function SimplePage({ children, footerVariant = "quiet", breadcrumb }) {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
      {breadcrumb && <Breadcrumb page={breadcrumb} />}
      <main>{children}</main>
      <LandingFooter variant={footerVariant} />
    </div>
  );
}
