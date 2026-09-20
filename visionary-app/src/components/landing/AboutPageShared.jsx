import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

/* ═══ DESIGN TOKENS — unified Google design system ═══ */
export const COLORS = {
  ink: "#202124",
  surface: "#f8f9fa",
  blue: "#1a73e8",
  grey: "#5f6368",
  lightGrey: "#9aa0a6",
  mist: "#dadce0",
  white: "#ffffff",
};
export const FONT_FAMILY = "'Google Sans Flex', 'Google Sans', system-ui, -apple-system, sans-serif";

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
    <p className={`font-medium uppercase tracking-[0.12em] leading-[14px] text-[12px] ${className}`} style={{ color: COLORS.grey }}>
      {children}
    </p>
  );
});

export const IconTile = React.memo(function IconTile({ Icon, size = "lg" }) {
  const dim = size === "lg" ? "h-14 w-14" : "h-12 w-12";
  const icon = size === "lg" ? "h-6 w-6" : "h-5 w-5";
  return (
    <span className={`flex ${dim} items-center justify-center rounded-[18px] border bg-white`} style={{ borderColor: COLORS.mist, color: COLORS.blue }}>
      <Icon className={icon} strokeWidth={1.7} />
    </span>
  );
});

/* ═══ HERO — clean Google pattern, no decorative blobs ═══ */
export function AboutHero({ eyebrow, titleParts, intro }) {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative scroll-mt-44 overflow-hidden px-6 bg-white" style={{ fontFamily: FONT_FAMILY, paddingTop: 140, paddingBottom: 60 }}>
      <FadeReveal visible={visible}>
        {eyebrow && <GreyTag className="text-center">{eyebrow}</GreyTag>}
        <h1 className="mx-auto mt-6 max-w-[1080px] text-center font-normal tracking-[-0.03em] leading-[1.04] text-[clamp(40px,5.5vw,76px)]" style={{ color: COLORS.ink }}>
          {titleParts.map((p, i) => (
            <React.Fragment key={i}>
              {p.accent ? <span style={{ color: COLORS.blue }}>{p.text}</span> : p.text}
            </React.Fragment>
          ))}
        </h1>
        {intro && (
          <p className="mx-auto mt-6 max-w-[760px] text-center font-normal tracking-[0] leading-[1.65] text-[17.5px]" style={{ color: COLORS.grey }}>
            {intro}
          </p>
        )}
      </FadeReveal>
    </section>
  );
}

/* ═══ CONTENT SECTION ═══ */
export function AboutContentSection({ id, eyebrow, heading, headingAccent, body, cards, rows, bg = "white", children }) {
  const { ref, visible } = useRevealOnce();
  const bgColor = bg === "surface" ? COLORS.surface : COLORS.white;
  return (
    <section ref={ref} id={id} className="relative scroll-mt-44 px-6" style={{ fontFamily: FONT_FAMILY, backgroundColor: bgColor, paddingTop: 100, paddingBottom: 100 }}>
      <FadeReveal visible={visible}>
        <div className="max-w-[1200px] mx-auto">
          {eyebrow && <GreyTag className="text-left mb-4">{eyebrow}</GreyTag>}
          {heading && (
            <h2 className="mt-2 max-w-[800px] font-normal tracking-[-0.025em] leading-[1.08] text-[clamp(30px,4.5vw,48px)]" style={{ color: COLORS.ink }}>
              {heading} {headingAccent && <span style={{ color: COLORS.blue }}>{headingAccent}</span>}
            </h2>
          )}
          {body && (
            <p className="mt-5 max-w-[720px] font-normal tracking-[0] leading-[1.65] text-[16.5px]" style={{ color: COLORS.grey }}>
              {body}
            </p>
          )}
        </div>

        {cards && (
          <div className="max-w-[1200px] mx-auto mt-14 grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((c) => (
              <div key={c.title} className="group rounded-[24px] border p-7 hover:shadow-[0_8px_24px_rgba(60,64,67,0.08)] hover:-translate-y-0.5 transition-all" style={{ borderColor: COLORS.mist, backgroundColor: bg === "surface" ? COLORS.white : COLORS.surface }}>
                <IconTile Icon={c.Icon} />
                <h3 className="mt-6 font-medium tracking-[0] leading-[1.25] text-[20px]" style={{ color: COLORS.ink }}>{c.title}</h3>
                <p className="mt-3 font-normal tracking-[0] leading-[1.65] text-[14.5px]" style={{ color: COLORS.grey }}>{c.copy}</p>
              </div>
            ))}
          </div>
        )}

        {rows && (
          <div className="max-w-[1080px] mx-auto mt-14 w-full">
            {rows.map((r, i) => (
              <div key={r.n} className={`grid grid-cols-1 gap-4 py-8 md:grid-cols-[120px_1fr] md:gap-10 ${i < rows.length - 1 ? "border-b" : ""}`} style={{ borderColor: `${COLORS.ink}14` }}>
                <p className="font-medium tracking-[0] text-[13px]" style={{ color: COLORS.blue }}>{r.n}</p>
                <div>
                  <h3 className="font-normal tracking-[-0.01em] leading-[1.2] text-[clamp(20px,2vw,26px)]" style={{ color: COLORS.ink }}>{r.title}</h3>
                  <p className="mt-3 max-w-[640px] font-normal tracking-[0] leading-[1.7] text-[15px]" style={{ color: COLORS.grey }}>{r.copy}</p>
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

/* ═══ CTA — clean surface band, no blobs ═══ */
export function AboutCTA({ title, titleAccent, desc, primaryLabel = "Get started", primaryTo = "/register", secondaryLabel, secondaryTo }) {
  const { ref, visible } = useRevealOnce();
  return (
    <section ref={ref} className="relative px-6 bg-[#f8f9fa]" style={{ fontFamily: FONT_FAMILY, paddingTop: 100, paddingBottom: 100 }}>
      <div className={`max-w-[900px] mx-auto text-center transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
        <h2 className="font-normal tracking-[-0.025em] leading-[1.06] text-[clamp(32px,5vw,56px)]" style={{ color: COLORS.ink }}>
          {title} {titleAccent && <span style={{ color: COLORS.blue }}>{titleAccent}</span>}
        </h2>
        {desc && (
          <p className="mx-auto mt-5 max-w-[680px] font-normal tracking-[0] leading-[1.65] text-[16.5px]" style={{ color: COLORS.grey }}>
            {desc}
          </p>
        )}
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link to={primaryTo} className="inline-flex h-12 items-center justify-center rounded-full px-9 font-medium tracking-[0] text-[14px] text-white transition-all hover:bg-[#1557b0] hover:shadow-[0_4px_12px_rgba(26,115,232,0.3)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]" style={{ backgroundColor: COLORS.blue }}>
            {primaryLabel}
          </Link>
          {secondaryLabel && (
            <Link to={secondaryTo} className="inline-flex h-12 items-center justify-center rounded-full border px-8 font-medium tracking-[0] text-[14px] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]" style={{ borderColor: `${COLORS.ink}33`, color: COLORS.ink }}>
              {secondaryLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

/* ═══ LEGAL PAGE ═══ */
export function LegalPage({ eyebrow, titleParts, intro, sections, cta, lastUpdated }) {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
      <main>
        <AboutHero eyebrow={eyebrow} titleParts={titleParts} intro={intro} />
        {lastUpdated && (
          <p className="-mt-4 pb-4 text-left max-w-[1080px] mx-auto px-6 text-[13px] tracking-[0.2px]" style={{ color: "#5f6368" }}>
            Last updated: <span style={{ color: "#202124" }}>{lastUpdated}</span>
          </p>
        )}
        {sections.map((s, i) => (
          <AboutContentSection key={s.id || i} {...s} />
        ))}
        <AboutCTA {...(cta || {})} />
      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}

/* ═══ SIMPLE PAGE ═══ */
export function SimplePage({ children, footerVariant = "quiet" }) {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
      <main>{children}</main>
      <LandingFooter variant={footerVariant} />
    </div>
  );
}