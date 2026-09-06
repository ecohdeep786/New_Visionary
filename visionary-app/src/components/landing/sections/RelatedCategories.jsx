import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ScrollReveal from "@/components/landing/ScrollReveal";
import { CATEGORIES } from "@/data/landingCategories";

export default function RelatedCategories({ currentSlug }) {
  const related = CATEGORIES.filter((c) => c.slug !== currentSlug).slice(0, 3);

  return (
    <section className="py-24 px-6 bg-[#f8f9fa]">
      <div className="max-w-[1200px] mx-auto">
        <ScrollReveal className="mb-12">
          <h2 className="text-[24px] lg:text-[30px] text-[#202124]" style={{ fontWeight: 400 }}>
            Explore who you are
          </h2>
        </ScrollReveal>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {related.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <ScrollReveal key={cat.slug} delay={idx * 80}>
                <Link
                  to={cat.path}
                  className="block bg-white rounded-[24px] p-6 border border-[#e8eaed] hover:shadow-[0_1px_6px_rgba(32,33,36,0.06)] transition-all group"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${cat.color}12` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: cat.color }} />
                  </div>
                  <h3 className="text-sm font-medium text-[#202124] mb-1">{cat.label}</h3>
                  <p className="text-xs text-[#5f6368] mb-4">{cat.tagline}</p>
                  <div className="flex items-center gap-1 text-xs font-medium text-[#1a73e8]">
                    Explore <ArrowRight className="w-3.5 h-3.5" />
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