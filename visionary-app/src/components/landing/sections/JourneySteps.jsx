import ScrollReveal from "@/components/landing/ScrollReveal";
import SectionHeader from "./SectionHeader";

export default function JourneySteps({ eyebrow, title, subtitle, steps, variant = "horizontal", color = "#1a73e8", bg = "muted" }) {
  const sectionBg = bg === "muted" ? "bg-[#f8f9fa]" : "bg-white";

  if (variant === "vertical") {
    return (
      <section className={`py-24 px-6 ${sectionBg}`}>
        <div className="max-w-[720px] mx-auto">
          <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} color={color} />
          <div className="relative pl-8">
            <div className="absolute left-3 top-2 bottom-2 w-px" style={{ backgroundColor: `${color}25` }} />
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <ScrollReveal key={step.title} delay={idx * 80}>
                  <div className="relative pb-12 last:pb-0">
                    <div className="absolute -left-8 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white" style={{ backgroundColor: color }}>
                      <span className="text-white text-xs font-medium">{idx + 1}</span>
                    </div>
                    <div className="flex items-start gap-4">
                      {Icon ? <Icon className="w-5 h-5 shrink-0 mt-0.5" style={{ color }} /> : null}
                      <div>
                        <h3 className="text-base font-medium text-[#202124] mb-1">{step.title}</h3>
                        <p className="text-sm text-[#5f6368] leading-relaxed">{step.desc}</p>
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

  return (
    <section className={`py-24 px-6 ${sectionBg}`}>
      <div className="max-w-[1200px] mx-auto">
        <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} color={color} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <ScrollReveal key={step.title} delay={idx * 80}>
                <div className="rounded-[24px] p-8 border border-[#e8eaed] bg-white h-full">
                  <div className="text-4xl mb-4" style={{ fontWeight: 500, color, opacity: 0.35 }}>
                    {String(idx + 1).padStart(2, "0")}
                  </div>
                  <h3 className="text-base font-medium text-[#202124] mb-2">{step.title}</h3>
                  <p className="text-sm text-[#5f6368] leading-relaxed">{step.desc}</p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}