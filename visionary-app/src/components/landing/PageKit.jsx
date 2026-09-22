import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import SpotIllustration from "@/components/landing/SpotIllustration";

/**
 * PageKit — the shared Google-style page construction system.
 *
 * One source of truth for the Google marketing-page grammar:
 *   · consistent vertical rhythm on the 8px grid (section py-16 lg:py-24)
 *   · alternating surfaces (white ↔ canvas) so pages group content in bands
 *   · every section pairs copy with a visual anchor (illustration / photo /
 *     icon chip) — never a text wall
 *   · one type scale, one radius scale, one accent blue
 *
 * Palette is the site's own (ink #121317 / slate #5f6368 / mist #dadce0 /
 * canvas #f8f9fa / blue #4285F4) — Google's vibe, not Google's brand sheet.
 */

export const PK = {
  ink: "#121317",
  graphite: "#3c4043",
  slate: "#5f6368",
  lightGrey: "#9AA0A6",
  mist: "#dadce0",
  canvas: "#f8f9fa",
  surface: "#f8f9fa",
  white: "#ffffff",
  blue: "#4285F4",
  blueDark: "#0b57d2",
  blueTint: "#D2E3FC",
};
export const PK_FONT = "'Google Sans Flex', 'Google Sans', system-ui, sans-serif";

/* ── Reveal-on-scroll (once) ───────────────────────────────── */
export function useRevealOnce(rootMargin = "0px 0px -8% 0px") {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const hasRevealed = useRef(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
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

export const Reveal = React.memo(function Reveal({ visible, children, className = "", delay = 0 }) {
  return (
    <div
      className={`transition-all duration-700 ease-google ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
});

/* ── Buttons (Google pill set) ─────────────────────────────── */
export const ButtonFilled = React.forwardRef(function ButtonFilled(
  { to, href, onClick, children, className = "", small = false }, ref,
) {
  const cls = `inline-flex ${small ? "h-10 px-6 text-[14px]" : "h-12 px-8 text-[15px]"} items-center justify-center gap-2 rounded-full font-medium tracking-[0.1px] text-white transition-all hover:shadow-[0_1px_3px_rgba(60,64,67,0.3)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 ${className}`;
  if (to) return <Link ref={ref} to={to} onClick={onClick} className={cls} style={{ backgroundColor: PK.blue }}>{children}</Link>;
  if (href) return <a ref={ref} href={href} onClick={onClick} className={cls} style={{ backgroundColor: PK.blue }}>{children}</a>;
  return <button ref={ref} type="button" onClick={onClick} className={cls} style={{ backgroundColor: PK.blue }}>{children}</button>;
});

export const ButtonOutlined = React.forwardRef(function ButtonOutlined(
  { to, href, onClick, children, className = "", small = false }, ref,
) {
  const cls = `inline-flex ${small ? "h-10 px-6 text-[14px]" : "h-12 px-8 text-[15px]"} items-center justify-center gap-2 rounded-full border font-medium tracking-[0.1px] transition-colors hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 ${className}`;
  if (to) return <Link ref={ref} to={to} onClick={onClick} className={cls} style={{ borderColor: PK.mist, color: PK.ink }}>{children}</Link>;
  if (href) return <a ref={ref} href={href} onClick={onClick} className={cls} style={{ borderColor: PK.mist, color: PK.ink }}>{children}</a>;
  return <button ref={ref} type="button" onClick={onClick} className={cls} style={{ borderColor: PK.mist, color: PK.ink }}>{children}</button>;
});

export const TextArrowLink = React.forwardRef(function TextArrowLink(
  { to, href, onClick, children, className = "" }, ref,
) {
  const cls = `group inline-flex items-center gap-1.5 text-[15px] font-medium tracking-[0.1px] transition-colors hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-sm ${className}`;
  const inner = (
    <>
      {children}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true">
        <path d="M5 12h14" /><path d="M13 6l6 6-6 6" />
      </svg>
    </>
  );
  if (to) return <Link ref={ref} to={to} onClick={onClick} className={cls} style={{ color: PK.blue }}>{inner}</Link>;
  if (href) return <a ref={ref} href={href} onClick={onClick} className={cls} style={{ color: PK.blue }}>{inner}</a>;
  return <button ref={ref} type="button" onClick={onClick} className={cls} style={{ color: PK.blue }}>{inner}</button>;
});

/* ── IconChip — Google's tinted rounded-square icon tile ───── */
export const IconChip = React.memo(function IconChip({ Icon, tone = "blue", size = 48, className = "" }) {
  const tones = {
    blue: { bg: "#E8F0FE", fg: "#1967D2" },
    green: { bg: "#E6F4EA", fg: "#188038" },
    yellow: { bg: "#FEF7E0", fg: "#B06000" },
    red: { bg: "#FCE8E6", fg: "#C5221F" },
    ink: { bg: "#F1F3F4", fg: "#3c4043" },
  };
  const t = tones[tone] || tones.blue;
  const dim = size === 56 ? "h-14 w-14" : size === 40 ? "h-10 w-10" : "h-12 w-12";
  const icon = size === 56 ? "h-6 w-6" : size === 40 ? "h-[18px] w-[18px]" : "h-5 w-5";
  return (
    <span className={`flex ${dim} shrink-0 items-center justify-center rounded-[14px] ${className}`} style={{ backgroundColor: t.bg, color: t.fg }}>
      {Icon ? <Icon className={icon} strokeWidth={1.8} aria-hidden="true" /> : null}
    </span>
  );
});

/* ── Section — consistent band with tone alternation ───────── */
export function Section({ tone = "white", bleed = false, className = "", container = true, width = "wide", id, children, pad = "normal" }) {
  const bg = tone === "canvas" ? PK.canvas : tone === "ink" ? PK.ink : PK.white;
  const padCls = pad === "tight" ? "py-12 lg:py-16" : pad === "roomy" ? "py-20 lg:py-28" : "py-16 lg:py-24";
  const maxW = width === "narrow" ? "max-w-[880px]" : width === "text" ? "max-w-[760px]" : "max-w-[1240px]";
  return (
    <section id={id} className={`relative ${padCls} ${tone === "ink" ? "text-white" : ""} ${className}`} style={{ backgroundColor: bg }}>
      {container ? <div className={`mx-auto w-full px-6 sm:px-8 ${maxW}`}>{children}</div> : children}
    </section>
  );
}

/* ── SectionHead — eyebrow + display headline + subcopy ────── */
export function SectionHead({ as: Tag = "h2", eyebrow, title, sub, align = "center", accent, tone = "light", className = "" }) {
  const dark = tone === "dark";
  return (
    <div className={`${align === "center" ? "mx-auto max-w-[840px] text-center" : "max-w-[640px]"} ${className}`}>
      {eyebrow && (
        <p className="text-[12px] font-medium uppercase tracking-[0.16em] leading-[16px]" style={{ color: dark ? "#9AA0A6" : PK.slate }}>
          {eyebrow}
        </p>
      )}
      <Tag className={`mt-4 text-balance font-normal tracking-[-0.025em] leading-[1.12] text-[clamp(30px,3.6vw,44px)]`} style={{ color: dark ? PK.white : PK.ink }}>
        {title}
        {accent && <span style={{ color: PK.blue }}> {accent}</span>}
      </Tag>
      {sub && (
        <p className="mt-5 text-pretty text-[16px] sm:text-[17.5px] leading-[1.6] tracking-[0.1px]" style={{ color: dark ? "#c4c7c5" : PK.slate }}>
          {sub}
        </p>
      )}
    </div>
  );
}

/* ── VisualPanel — the consistent media container ──────────── */
/* Ratio/radius maps use literal class names — Tailwind's scanner
   cannot see runtime-interpolated classes. */
const RATIO_CLS = {
  "4/3": "aspect-[4/3]",
  "16/9": "aspect-[16/9]",
  "16/8": "aspect-[16/8]",
  "3/2": "aspect-[3/2]",
  "1/1": "aspect-square",
};
const RADIUS_CLS = {
  "20px": "rounded-[20px]",
  "24px": "rounded-[24px]",
  "28px": "rounded-[28px]",
};
export const VisualPanel = React.memo(function VisualPanel({ image, illustration, alt, ratio = "4/3", className = "", rounded = "24px", caption }) {
  const ratioCls = RATIO_CLS[ratio] || RATIO_CLS["4/3"];
  const radiusCls = RADIUS_CLS[rounded] || RADIUS_CLS["24px"];
  return (
    <figure className={`m-0 overflow-hidden border bg-[#f8f9fa] ${radiusCls} ${className}`} style={{ borderColor: PK.mist }}>
      {image && (
        <img src={image} alt={alt || ""} loading="lazy" decoding="async" className={`${ratioCls} w-full object-cover`} />
      )}
      {illustration && (
        <SpotIllustration subject={illustration} title={alt} className={`${ratioCls} w-full`} />
      )}
      {caption && (
        <figcaption className="px-6 py-4 text-[13px] leading-[1.5]" style={{ color: PK.slate }}>{caption}</figcaption>
      )}
    </figure>
  );
});

/* ── FeatureGrid — Google's signature icon-led 3-up ────────── */
export function FeatureGrid({ items, columns = 3, tone = "light", cardClassName = "" }) {
  const cols = columns === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <div className={`grid grid-cols-1 gap-4 lg:gap-6 ${cols}`}>
      {items.map((item, i) => (
        <div
          key={item.title}
          className={`rounded-[20px] border p-6 sm:p-7 transition-shadow duration-300 hover:shadow-[0_1px_3px_rgba(60,64,67,0.12),0_4px_12px_rgba(60,64,67,0.08)] ${cardClassName}`}
          style={{ borderColor: tone === "dark" ? "#3c4043" : PK.mist, backgroundColor: tone === "dark" ? "rgba(255,255,255,0.04)" : PK.white }}
        >
          <IconChip Icon={item.Icon} tone={item.tone || "blue"} />
          <h3 className="mt-5 text-[19px] font-medium leading-[1.3] tracking-[0.1px]" style={{ color: tone === "dark" ? PK.white : PK.ink }}>
            {item.title}
          </h3>
          <p className="mt-2.5 text-[14.5px] leading-[1.6] tracking-[0.1px]" style={{ color: tone === "dark" ? "#c4c7c5" : PK.slate }}>
            {item.copy}
          </p>
          {item.link && (
            <div className="mt-4">
              <TextArrowLink to={item.link.to}>{item.link.label}</TextArrowLink>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── SplitFeature — headline/copy beside a visual, flip ────── */
export function SplitFeature({ eyebrow, title, accent, copy, bullets, links, image, illustration, alt, flip = false, tone = "light", visualRatio = "4/3" }) {
  const dark = tone === "dark";
  return (
    <div className={`grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16 ${flip ? "" : ""}`}>
      <div className={flip ? "lg:order-2" : ""}>
        {eyebrow && (
          <p className="text-[12px] font-medium uppercase tracking-[0.16em] leading-[16px]" style={{ color: dark ? "#9AA0A6" : PK.slate }}>
            {eyebrow}
          </p>
        )}
        <h2 className="mt-4 text-balance font-normal tracking-[-0.025em] leading-[1.12] text-[clamp(28px,3.4vw,42px)]" style={{ color: dark ? PK.white : PK.ink }}>
          {title}{accent && <span style={{ color: PK.blue }}> {accent}</span>}
        </h2>
        {copy && (
          <p className="mt-5 max-w-[520px] text-[16px] leading-[1.65] tracking-[0.1px]" style={{ color: dark ? "#c4c7c5" : PK.slate }}>
            {copy}
          </p>
        )}
        {bullets && bullets.length > 0 && (
          <ul className="mt-6 flex flex-col gap-3.5">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-[15px] leading-[1.55]" style={{ color: dark ? "#e8eaed" : PK.graphite }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="mt-[3px] h-4 w-4 shrink-0" style={{ color: PK.blue }} aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                {b}
              </li>
            ))}
          </ul>
        )}
        {links && links.length > 0 && (
          <div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-4">
            {links.map((l) => <TextArrowLink key={l.label} to={l.to}>{l.label}</TextArrowLink>)}
          </div>
        )}
      </div>
      <div className={flip ? "lg:order-1" : ""}>
        <VisualPanel image={image} illustration={illustration} alt={alt} ratio={visualRatio} rounded="28px" />
      </div>
    </div>
  );
}

/* ── StatBand — the Google stats strip ─────────────────────── */
export function StatBand({ stats, tone = "canvas" }) {
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <div key={s.value} className="text-center lg:text-left">
          <p className="font-normal tracking-[-0.03em] leading-[1.05] text-[clamp(38px,4.4vw,56px)]" style={{ color: PK.blue }}>{s.value}</p>
          <p className="mx-auto mt-2 max-w-[220px] text-[14px] leading-[1.5] tracking-[0.1px] lg:mx-0" style={{ color: PK.slate }}>{s.label}</p>
        </div>
      ))}
    </div>
  );
}

/* ── FAQList — hairline accordion with circular carets ─────── */
export function FAQList({ items, tone = "light" }) {
  const [open, setOpen] = useState(0);
  return (
    <div>
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className="border-b last:border-b-0" style={{ borderColor: tone === "dark" ? "#3c4043" : "rgba(18,19,23,0.14)" }}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? -1 : i)}
              className="flex w-full items-center justify-between gap-6 py-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-[8px]"
            >
              <span className="text-[17px] sm:text-[19px] font-normal leading-[1.4] tracking-[0.1px]" style={{ color: tone === "dark" ? PK.white : PK.ink }}>{item.q}</span>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors" style={{ backgroundColor: tone === "dark" ? "rgba(255,255,255,0.08)" : "#f1f3f4", color: tone === "dark" ? "#e8eaed" : PK.ink }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} aria-hidden="true">
                  <path d="M6 15l6-6 6 6" />
                </svg>
              </span>
            </button>
            <div className={`grid transition-all duration-300 ease-google ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
              <div className="overflow-hidden">
                <p className="max-w-[720px] pb-7 text-[15px] leading-[1.7] tracking-[0.1px]" style={{ color: tone === "dark" ? "#c4c7c5" : PK.slate }}>{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── PageHero — one standardized hero for every page ───────── */
export function PageHero({ eyebrow, title, accent, sub, primary, secondary, links, image, illustration, alt, visualRatio = "16/8", children }) {
  const { ref, visible } = useRevealOnce("0px 0px -4% 0px");
  const hasVisual = Boolean(image || illustration);
  return (
    <section ref={ref} className="px-6 pb-16 pt-32 sm:px-8 lg:pb-20 lg:pt-40" style={{ fontFamily: PK_FONT, backgroundColor: PK.white }}>
      <div className="mx-auto w-full max-w-[1240px]">
        <Reveal visible={visible}>
          {eyebrow && (
            <p className="text-[12px] font-medium uppercase tracking-[0.16em] leading-[16px]" style={{ color: PK.slate }}>{eyebrow}</p>
          )}
          <h1 className="mt-4 max-w-[15ch] text-balance font-normal tracking-[-0.04em] leading-[1.06] text-[clamp(40px,6vw,68px)]" style={{ color: PK.ink }}>
            {title}{accent && <span style={{ color: PK.blue }}> {accent}</span>}
          </h1>
          {sub && (
            <p className="mt-6 max-w-[640px] text-pretty text-[17px] leading-[1.65] tracking-[0.1px] sm:text-[18px]" style={{ color: PK.slate }}>{sub}</p>
          )}
          {(primary || secondary || links) && (
            <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
              {primary && <ButtonFilled to={primary.to}>{primary.label}</ButtonFilled>}
              {secondary && <ButtonOutlined to={secondary.to}>{secondary.label}</ButtonOutlined>}
              {links?.map((l) => <TextArrowLink key={l.label} to={l.to}>{l.label}</TextArrowLink>)}
            </div>
          )}
          {children}
        </Reveal>
        {hasVisual && (
          <Reveal visible={visible} delay={120} className="mt-14 lg:mt-16">
            <VisualPanel image={image} illustration={illustration} alt={alt} ratio={visualRatio} rounded="28px" />
          </Reveal>
        )}
      </div>
    </section>
  );
}

/* ── CTABand — consistent closing band on canvas ───────────── */
export function CTABand({ title, accent, sub, primary, secondary, tone = "canvas" }) {
  const { ref, visible } = useRevealOnce();
  const dark = tone === "ink";
  return (
    <section ref={ref} className="px-6 py-20 sm:px-8 lg:py-24" style={{ backgroundColor: dark ? PK.ink : PK.canvas }}>
      <Reveal visible={visible} className="mx-auto max-w-[840px] text-center">
        <h2 className="text-balance font-normal tracking-[-0.03em] leading-[1.12] text-[clamp(30px,3.6vw,44px)]" style={{ color: dark ? PK.white : PK.ink }}>
          {title}{accent && <span style={{ color: PK.blue }}> {accent}</span>}
        </h2>
        {sub && <p className="mx-auto mt-5 max-w-[600px] text-[16px] leading-[1.65] tracking-[0.1px]" style={{ color: dark ? "#c4c7c5" : PK.slate }}>{sub}</p>}
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          {primary && <ButtonFilled to={primary.to}>{primary.label}</ButtonFilled>}
          {secondary && <ButtonOutlined to={secondary.to}>{secondary.label}</ButtonOutlined>}
        </div>
      </Reveal>
    </section>
  );
}
