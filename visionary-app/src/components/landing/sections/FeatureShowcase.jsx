import ScrollReveal from "@/components/landing/ScrollReveal";
import SectionHeader from "./SectionHeader";

/**
 * Google-style soft illustration placeholder — uses a gradient blob + icon,
 * avoiding the "empty gray box" feel while remaining content-agnostic.
 */
function FeatureVisual({ Icon, color }) {
  return (
    <div
      className="relative rounded-[28px] p-12 min-h-[260px] flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: "#f8f9fa" }}
    >
      {/* Soft colored blobs */}
      <div
        className="absolute rounded-full blur-3xl"
        style={{
          width: 260, height: 260, top: -60, left: -40,
          background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`,
        }}
      />
      <div
        className="absolute rounded-full blur-3xl"
        style={{
          width: 200, height: 200, bottom: -40, right: -20,
          background: "radial-gradient(circle, rgba(52,168,83,0.10) 0%, transparent 70%)",
        }}
      />
      <div className="relative z-10 flex flex-col items-center">
        <div
          className="w-20 h-20 rounded-[24px] bg-white shadow-[0_12px_32px_rgba(60,64,67,0.08)] flex items-center justify-center mb-5"
          style={{ color }}
        >
          {Icon ? <Icon className="w-9 h-9" strokeWidth={1.7} /> : null}
        </div>
        <div className="h-1.5 w-24 rounded-full bg-white shadow-sm mb-2" />
        <div className="h-1.5 w-16 rounded-full bg-white shadow-sm opacity-70" />
      </div>
    </div>
  );
}

export default function FeatureShowcase({
  eyebrow,
  title,
  subtitle,
  features,
  variant = "grid",
  color = "#1a73e8",
  bg = "white",
}) {
  const sectionBg = bg === "muted" ? "bg-[#f8f9fa]" : "bg-white";

  if (variant === "alternating") {
    return (
      <section className={`py-28 px-6 ${sectionBg}`}>
        <div className="max-w-[1200px] mx-auto">
          <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} color={color} />
          <div className="space-y-24">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <ScrollReveal key={feat.title} delay={idx * 60}>
                  <div
                    className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${
                      idx % 2 === 1 ? "lg:[direction:rtl]" : ""
                    }`}
                  >
                    <div className="[direction:ltr]">
                      <div
                        className="w-14 h-14 rounded-[18px] flex items-center justify-center mb-7"
                        style={{ backgroundColor: `${color}12`, color }}
                      >
                        {Icon ? <Icon className="w-7 h-7" strokeWidth={1.7} /> : null}
                      </div>
                      <h3
                        className="text-[28px] lg:text-[32px] text-[#202124] mb-4 leading-[1.15] tracking-[-0.02em]"
                        style={{ fontWeight: 400 }}
                      >
                        {feat.title}
                      </h3>
                      <p className="text-[16px] text-[#5f6368] leading-[1.7] max-w-[520px]">
                        {feat.desc}
                      </p>
                    </div>
                    <div className="[direction:ltr]">
                      <FeatureVisual Icon={Icon} color={color} />
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  const cols = variant === "cards" ? "lg:grid-cols-3" : "md:grid-cols-2";

  return (
    <section className={`py-28 px-6 ${sectionBg}`}>
      <div className="max-w-[1240px] mx-auto">
        <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} color={color} />
        <div className={`grid grid-cols-1 ${cols} gap-6`}>
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <ScrollReveal key={feat.title} delay={idx * 60}>
                <div
                  className="group rounded-[28px] p-8 border border-[#e8eaed] h-full bg-white hover:shadow-[0_8px_24px_rgba(60,64,67,0.08)] hover:border-[#dadce0] transition-all"
                >
                  <div
                    className="w-12 h-12 rounded-[16px] flex items-center justify-center mb-7"
                    style={{ backgroundColor: `${color}12`, color }}
                  >
                    {Icon ? <Icon className="w-6 h-6" strokeWidth={1.7} /> : null}
                  </div>
                  <h3 className="text-[18px] font-medium text-[#202124] mb-3 leading-[1.3]">
                    {feat.title}
                  </h3>
                  <p className="text-[14.5px] text-[#5f6368] leading-[1.65]">{feat.desc}</p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
