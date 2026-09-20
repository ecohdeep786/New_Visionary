import ScrollReveal from "@/components/landing/ScrollReveal";

export default function TestimonialBlock({ quote, author, role, initials, color = "#1a73e8" }) {
  return (
    <section className="py-28 px-6 bg-[#f8f9fa]">
      <div className="max-w-[820px] mx-auto">
        <ScrollReveal>
          <div className="rounded-[32px] bg-white border border-[#e8eaed] p-10 sm:p-14">
            <div
              className="text-6xl mb-5 leading-none"
              style={{ color: color, fontWeight: 500, opacity: 0.4 }}
            >
              "
            </div>
            <blockquote
              className="text-[22px] sm:text-[26px] text-[#202124] leading-[1.45] mb-10 tracking-[-0.01em]"
              style={{ fontWeight: 400 }}
            >
              {quote}
            </blockquote>
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-[14px] font-medium shrink-0"
                style={{ backgroundColor: color }}
              >
                {initials}
              </div>
              <div>
                <div className="text-[15px] font-medium text-[#202124]">{author}</div>
                <div className="text-[14px] text-[#5f6368]">{role}</div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
