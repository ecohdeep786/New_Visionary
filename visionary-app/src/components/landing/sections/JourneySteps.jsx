import ScrollReveal from "@/components/landing/ScrollReveal";
import SectionHeader from "./SectionHeader";

export default function JourneySteps({
  eyebrow,
  title,
  subtitle,
  steps,
  variant = "horizontal",
  color = "#1a73e8",
  bg = "muted",
}) {
  const sectionBg = bg === "muted" ? "bg-[#f8f9fa]" : "bg-white";

  if (variant === "vertical") {
    return (
      <section className={`py-28 px-6 ${sectionBg}`}>
        <div className="max-w-[780px] mx-auto">
          <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} color={color} />
          <div className="relative pl-12">
            <div
              className="absolute left-5 top-3 bottom-3 w-px"
              style={{ backgroundColor: `${color}25` }}
            />
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <ScrollReveal key={step.title} delay={idx * 80}>
                  <div className="relative pb-14 last:pb-0">
                    <div
                      className="absolute -left-12 w-10 h-10 rounded-full flex items-center justify-center ring-4 ring-white shadow-sm"
                      style={{ backgroundColor: color }}
                    >
                      <span className="text-white text-xs font-medium">{idx + 1}</span>
                    </div>
                    <div className="flex items-start gap-4">
                      {Icon ? (
                        <Icon
                          className="w-5 h-5 shrink-0 mt-1"
                          style={{ color }}
                          strokeWidth={1.8}
                        />
                      ) : null}
                      <div>
                        <h3 className="text-[20px] font-medium text-[#202124] mb-2">
                          {step.title}
                        </h3>
                        <p className="text-[15px] text-[#5f6368] leading-[1.7]">{step.desc}</p>
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
    <section className={`py-28 px-6 ${sectionBg}`}>
      <div className="max-w-[1240px] mx-auto">
        <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} color={color} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <ScrollReveal key={step.title} delay={idx * 80}>
                <div className="group relative rounded-[28px] p-8 border border-[#e8eaed] bg-white h-full hover:shadow-[0_8px_24px_rgba(60,64,67,0.08)] hover:-translate-y-0.5 transition-all">
                  <div
                    className="text-[40px] mb-5 leading-none tracking-[-0.02em]"
                    style={{ fontWeight: 400, color, opacity: 0.3 }}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </div>
                  {Icon ? (
                    <div
                      className="w-11 h-11 rounded-[14px] flex items-center justify-center mb-5"
                      style={{ backgroundColor: `${color}12`, color }}
                    >
                      <Icon className="w-5 h-5" strokeWidth={1.7} />
                    </div>
                  ) : null}
                  <h3 className="text-[17px] font-medium text-[#202124] mb-2 leading-[1.3]">
                    {step.title}
                  </h3>
                  <p className="text-[14px] text-[#5f6368] leading-[1.65]">{step.desc}</p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
