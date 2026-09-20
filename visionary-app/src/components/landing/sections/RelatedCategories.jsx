import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ScrollReveal from "@/components/landing/ScrollReveal";
import { CATEGORIES } from "@/data/landingCategories";

export default function RelatedCategories({ currentSlug }) {
  const related = CATEGORIES.filter((c) => c.slug !== currentSlug).slice(0, 3);

  return (
    <section className="py-28 px-6 bg-[#f8f9fa]">
      <div className="max-w-[1240px] mx-auto">
        <ScrollReveal className="mb-12">
          <h2
            className="text-[30px] lg:text-[38px] text-[#202124] tracking-[-0.02em]"
            style={{ fontWeight: 400 }}
          >
            Explore who you are
          </h2>
        </ScrollReveal>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {related.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <ScrollReveal key={cat.slug} delay={idx * 80}>
                <Link
                  to={cat.path}
                  className="group block bg-white rounded-[28px] p-8 border border-[#e8eaed] hover:shadow-[0_12px_32px_rgba(60,64,67,0.08)] hover:-translate-y-1 hover:border-[#dadce0] transition-all"
                >
                  <div
                    className="w-12 h-12 rounded-[16px] flex items-center justify-center mb-6"
                    style={{ backgroundColor: `${cat.color}12`, color: cat.color }}
                  >
                    <Icon className="w-6 h-6" strokeWidth={1.7} />
                  </div>
                  <h3 className="text-[18px] font-medium text-[#202124] mb-2 leading-[1.3]">
                    {cat.label}
                  </h3>
                  <p className="text-[14px] text-[#5f6368] mb-6 leading-[1.6]">{cat.tagline}</p>
                  <div className="flex items-center gap-1 text-[14px] font-medium text-[#1a73e8] group-hover:gap-2 transition-all">
                    Explore <ArrowRight className="w-4 h-4" strokeWidth={2} />
                  </div>
                </Link>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
