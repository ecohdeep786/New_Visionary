import ScrollReveal from "@/components/landing/ScrollReveal";
import SectionHeader from "./SectionHeader";

export default function FeatureShowcase({ eyebrow, title, subtitle, features, variant = "grid", color = "#1a73e8", bg = "white" }) {
  const sectionBg = bg === "muted" ? "bg-[#f8f9fa]" : "bg-white";

  if (variant === "alternating") {
    return (
      <section className={`py-24 px-6 ${sectionBg}`}>
        <div className="max-w-[1100px] mx-auto">
          <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} color={color} />
          <div className="space-y-20">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <ScrollReveal key={feat.title} delay={idx * 60}>
                  <div className={`grid lg:grid-cols-2 gap-16 items-center ${idx % 2 === 1 ? "lg:[direction:rtl]" : ""}`}>
                    <div className="[direction:ltr]">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: `${color}12` }}>
                        {Icon ? <Icon className="w-6 h-6" style={{ color }} /> : null}
                      </div>
                      <h3 className="text-2xl text-[#202124] mb-4" style={{ fontWeight: 400 }}>{feat.title}</h3>
                      <p className="text-base text-[#5f6368] leading-relaxed">{feat.desc}</p>
                    </div>
                    <div className="[direction:ltr]">
                      <div className="bg-[#f8f9fa] rounded-[24px] p-10 border border-[#e8eaed] min-h-[220px] flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${color}12` }}>
                            {Icon ? <Icon className="w-8 h-8" style={{ color }} /> : null}
                          </div>
                          <p className="text-sm text-[#5f6368]">{feat.detail || feat.title}</p>
                        </div>
                      </div>
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
    <section className={`py-24 px-6 ${sectionBg}`}>
      <div className="max-w-[1200px] mx-auto">
        <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} color={color} />
        <div className={`grid grid-cols-1 ${cols} gap-6`}>
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <ScrollReveal key={feat.title} delay={idx * 60}>
                <div className="rounded-[24px] p-8 border border-[#e8eaed] h-full bg-white">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-6" style={{ backgroundColor: `${color}12` }}>
                    {Icon ? <Icon className="w-5 h-5" style={{ color }} /> : null}
                  </div>
                  <h3 className="text-base font-medium text-[#202124] mb-3">{feat.title}</h3>
                  <p className="text-sm text-[#5f6368] leading-relaxed">{feat.desc}</p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}