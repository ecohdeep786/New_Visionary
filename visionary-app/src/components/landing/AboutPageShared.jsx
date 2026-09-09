import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

/* ═══ DESIGN TOKENS — shared across all About sub-pages ═══ */
export const COLORS = {
  ink: "#121317",
  surface: "#F5F6F8",
  blue: "#4285F4",
  grey: "#5f6368",
  lightGrey: "#9AA0A6",
  mist: "#dadce0",
  chipBg: "#D2E3FC",
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
      { threshold: 0, rootMargin }
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
    <p className={`font-normal uppercase tracking-[0.43px] leading-[14px] text-[12px] ${className}`} style={{ color: COLORS.grey }}>
      {children}
    </p>
  );
});

export const IconTile = React.memo(function IconTile({ Icon, size = "lg" }) {
  const dim = size === "lg" ? "h-14 w-14" : "h-12 w-12";
  const icon = size === "lg" ? "h-6 w-6" : "h-5 w-5";
  return (
    <span className={`flex ${dim} items-center justify-center rounded-[16px] border bg-white`} style={{ borderColor: COLORS.mist, color: COLORS.blue }}>
      <Icon className={icon} strokeWidth={1.8} />
    </span>
  );
});

/* ═══ HERO — shared across all About sub-pages ═══ */
export function AboutHero({ eyebrow, titleParts, intro }) {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative scroll-mt-44 overflow-hidden px-6 pb-10 pt-40 lg:pt-48" style={{ fontFamily: FONT_FAMILY }}>
      <FadeReveal visible={visible}>
        {eyebrow && <GreyTag className="text-center">{eyebrow}</GreyTag>}
        <h1 className="mx-auto mt-4 max-w-[1080px] text-center font-medium tracking-[0] leading-[1.05] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          {titleParts.map((p, i) => (
            <React.Fragment key={i}>
              {p.accent ? <span style={{ color: COLORS.blue }}>{p.text}</span> : p.text}
            </React.Fragment>
          ))}
        </h1>
        {intro && (
          <p className="mx-auto mt-6 max-w-[760px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
            {intro}
          </p>
        )}
      </FadeReveal>
    </section>
  );
}

/* ═══ CONTENT SECTION — pillar cards or numbered rows ═══ */
export function AboutContentSection({ id, eyebrow, heading, headingAccent, body, cards, rows, bg = "white", children }) {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} id={id} className="relative scroll-mt-44 px-6 py-24 lg:py-32" style={{ fontFamily: FONT_FAMILY, backgroundColor: bg === "surface" ? COLORS.surface : COLORS.white }}>
      <FadeReveal visible={visible}>
        {eyebrow && <GreyTag className="text-center">{eyebrow}</GreyTag>}
        {heading && (
          <h2 className="mx-auto mt-4 max-w-[1080px] text-center font-medium tracking-[0] leading-[1.05] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
            {heading} {headingAccent && <span style={{ color: COLORS.blue }}>{headingAccent}</span>}
          </h2>
        )}
        {body && (
          <p className="mx-auto mt-6 max-w-[760px] text-center font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
            {body}
          </p>
        )}

        {/* Pillar cards grid */}
        {cards && (
          <div className="mx-auto mt-16 grid w-full max-w-[1400px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((c) => (
              <div key={c.title} className="rounded-[24px] border p-7" style={{ borderColor: COLORS.mist, backgroundColor: bg === "surface" ? COLORS.white : COLORS.surface }}>
                <IconTile Icon={c.Icon} />
                <h3 className="mt-6 font-medium tracking-[0] leading-[1.25] text-[20px]" style={{ color: COLORS.ink }}>{c.title}</h3>
                <p className="mt-3 font-normal tracking-[0] leading-[1.6] text-[15px]" style={{ color: COLORS.grey }}>{c.copy}</p>
              </div>
            ))}
          </div>
        )}

        {/* Numbered rows */}
        {rows && (
          <div className="mx-auto mt-16 w-full max-w-[1080px]">
            {rows.map((r, i) => (
              <div key={r.n} className={`grid grid-cols-1 gap-4 py-10 md:grid-cols-[120px_1fr] md:gap-10 ${i < rows.length - 1 ? "border-b" : ""}`} style={{ borderColor: `${COLORS.ink}14` }}>
                <p className="font-medium tracking-[0] text-[14px]" style={{ color: COLORS.blue }}>{r.n}</p>
                <div>
                  <h3 className="font-medium tracking-[0] leading-[1.2] text-[clamp(22px,2.4vw,32px)]" style={{ color: COLORS.ink }}>{r.title}</h3>
                  <p className="mt-3 max-w-[640px] font-normal tracking-[0] leading-[1.6] text-[15px]" style={{ color: COLORS.grey }}>{r.copy}</p>
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
export function AboutCTA({ title, titleAccent, desc, primaryLabel = "Get started", primaryTo = "/register", secondaryLabel, secondaryTo }) {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative px-6 py-28 lg:py-36" style={{ fontFamily: FONT_FAMILY, backgroundColor: COLORS.surface }}>
      <div className={`mx-auto max-w-[1500px] text-center transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
        <h2 className="font-medium tracking-[0] leading-[1.03] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
          {title} {titleAccent && <span style={{ color: COLORS.blue }}>{titleAccent}</span>}
        </h2>
        {desc && (
          <p className="mx-auto mt-6 max-w-[760px] font-normal tracking-[0] leading-[25px] text-[17.5px]" style={{ color: COLORS.grey }}>
            {desc}
          </p>
        )}
        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link to={primaryTo} className="inline-flex h-14 items-center justify-center rounded-full px-12 font-medium tracking-[0] text-[16px] text-white transition-all hover:opacity-90 active:scale-[0.98]" style={{ backgroundColor: COLORS.blue }}>
            {primaryLabel}
          </Link>
          {secondaryLabel && (
            <Link to={secondaryTo} className="inline-flex h-14 items-center justify-center rounded-full border px-10 font-medium tracking-[0] text-[16px] transition-colors hover:bg-[#121317]/5" style={{ borderColor: `${COLORS.ink}4D`, color: COLORS.ink }}>
              {secondaryLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

/* ═══ LEGAL PAGE — full wrapper for trust/legal pages ═══ */
export function LegalPage({ eyebrow, titleParts, intro, sections, cta }) {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
      <main>
        <AboutHero eyebrow={eyebrow} titleParts={titleParts} intro={intro} />
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
export function SimplePage({ children, footerVariant = "quiet" }) {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
      <main>{children}</main>
      <LandingFooter variant={footerVariant} />
    </div>
  );
}