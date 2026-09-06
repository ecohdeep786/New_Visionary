import ScrollReveal from "@/components/landing/ScrollReveal";
import SectionHeader from "./SectionHeader";

export default function UseCases({ eyebrow, title, subtitle, cases, color = "#1a73e8" }) {
  return (
    <section className="py-24 px-6 bg-[#f8f9fa]">
      <div className="max-w-[1200px] mx-auto">
        <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} color={color} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cases.map((item, idx) => {
            const Icon = item.icon;
            return (
              <ScrollReveal key={item.title} delay={idx * 60}>
                <div className="bg-white rounded-[24px] p-8 border border-[#e8eaed] h-full">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 shrink-0"
                    style={{ backgroundColor: `${color}12` }}
                  >
                    {Icon ? <Icon className="w-5 h-5" style={{ color }} /> : null}
                  </div>
                  <h3 className="text-base font-medium text-[#202124] mb-2">{item.title}</h3>
                  <p className="text-sm text-[#5f6368] leading-relaxed">{item.desc}</p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}