import ScrollReveal from "@/components/landing/ScrollReveal";

export default function SectionHeader({ eyebrow, title, subtitle, color = "#1a73e8", align = "left" }) {
  const alignClass = align === "center" ? "text-center mx-auto" : "";
  return (
    <ScrollReveal className={`mb-14 ${alignClass}`}>
      {eyebrow && (
        <div
          className="inline-flex items-center text-xs font-medium mb-4 px-3 py-1.5 rounded-full"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {eyebrow}
        </div>
      )}
      <h2
        className={`text-[26px] lg:text-[36px] text-[#202124] mb-4 leading-tight max-w-2xl ${align === "center" ? "mx-auto" : ""}`}
        style={{ fontWeight: 400 }}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={`text-base text-[#5f6368] max-w-xl ${align === "center" ? "mx-auto" : ""}`} style={{ lineHeight: 1.65 }}>
          {subtitle}
        </p>
      )}
    </ScrollReveal>
  );
}