import ScrollReveal from "@/components/landing/ScrollReveal";

export default function TestimonialBlock({ quote, author, role, initials, color = "#4285F4" }) {
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-[720px] mx-auto">
        <ScrollReveal>
          <div
            className="text-5xl mb-6 leading-none"
            style={{ color: `${color}30`, fontWeight: 500 }}
          >
            "
          </div>
          <blockquote
            className="text-[22px] lg:text-[26px] text-[#202124] leading-relaxed mb-10"
            style={{ fontWeight: 400 }}
          >
            {quote}
          </blockquote>
          <div className="flex items-center gap-4">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0"
              style={{ backgroundColor: color }}
            >
              {initials}
            </div>
            <div>
              <div className="text-sm font-medium text-[#202124]">{author}</div>
              <div className="text-sm text-[#5f6368]">{role}</div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}