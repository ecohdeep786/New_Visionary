import ScrollReveal from "@/components/landing/ScrollReveal";

export default function StatsBar({ stats, color = "#1a73e8" }) {
  return (
    <section className="py-20 px-6 bg-[#f8f9fa]">
      <div className="max-w-[1240px] mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {stats.map((stat, idx) => (
            <ScrollReveal key={idx} delay={idx * 60}>
              <div className="text-center lg:text-left">
                <div
                  className="text-[44px] sm:text-[52px] mb-2 leading-none tracking-[-0.03em]"
                  style={{ fontWeight: 500, color }}
                >
                  {stat.value}
                </div>
                <div className="text-[14px] text-[#5f6368] leading-[1.5]">{stat.label}</div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
