import ScrollReveal from "@/components/landing/ScrollReveal";

/** Canonical section header — the single header pattern for all landing sections.
 *
 * Visual grammar (matches the main Landing page eyebrows + rhythm.css scale):
 *  - Eyebrow: 12px, font-medium, uppercase, tracking-[0.15em], text-[#5f6368]
 *  - Title: font-normal, tracking-[-0.025em], line-[1.12], responsive clamp
 *  - Subtitle: text-[15px] leading-[1.65], text-[#5f6368]
 *  - Vertical rhythm via rhythm.css gap tokens
 */
export default function SectionHeader({ eyebrow, title, subtitle, color: _color = "#1a73e8", align = "left" }) {
  const alignClass = align === "center" ? "text-center mx-auto" : "";
  return (
    <ScrollReveal className={`mb-14 ${alignClass}`}>
      {eyebrow && (
        <p className="text-[12px] font-medium uppercase tracking-[0.15em] text-[#5f6368]">
          {eyebrow}
        </p>
      )}
      <h2
        className={`${eyebrow ? "mt-[calc(var(--gap-eyebrow-title-display)*0.6)]" : ""} text-[26px] leading-tight font-normal tracking-[-0.025em] text-[#202124] sm:text-[30px] lg:text-[36px] ${align === "center" ? "mx-auto" : ""}`}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-[calc(var(--gap-title-sub-display)*0.6)] max-w-xl text-[15px] leading-[1.65] text-[#5f6368] ${alignClass}`}>
          {subtitle}
        </p>
      )}
    </ScrollReveal>
  );
}
