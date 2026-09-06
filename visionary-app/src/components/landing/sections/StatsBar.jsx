import ScrollReveal from "@/components/landing/ScrollReveal";

export default function StatsBar({ stats, color = "#4285F4" }) {
  return (
    <section className="py-16 px-6 border-y border-[#e8eaed] bg-white">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <ScrollReveal key={idx} delay={idx * 60}>
              <div className="text-center">
                <div className="text-4xl lg:text-5xl mb-2" style={{ fontWeight: 500, color }}>
                  {stat.value}
                </div>
                <div className="text-sm text-[#5f6368]">{stat.label}</div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}