import ScrollReveal from "@/components/landing/ScrollReveal";

export default function SectionHeader({ eyebrow, title, subtitle, color = "#1a73e8", align = "left" }) {
  const alignClass = align === "center" ? "text-center mx-auto" : "";
  return (
    <ScrollReveal className={`mb-16 ${alignClass}`}>
      {eyebrow && (
        <div
          className="inline-flex items-center text-[11px] font-medium mb-5 px-3.5 py-1.5 rounded-full tracking-[0.4px] uppercase"
          style={{ backgroundColor: `${color}14`, color }}
        >
          {eyebrow}
        </div>
      )}
      <h2
        className={`text-[30px] lg:text-[42px] text-[#202124] mb-5 leading-[1.1] tracking-[-0.025em] max-w-3xl ${
          align === "center" ? "mx-auto" : ""
        }`}
        style={{ fontWeight: 400 }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`text-[16.5px] text-[#5f6368] max-w-2xl leading-[1.65] ${
            align === "center" ? "mx-auto" : ""
          }`}
        >
          {subtitle}
        </p>
      )}
    </ScrollReveal>
  );
}
