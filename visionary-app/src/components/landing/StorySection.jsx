import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import SpotIllustration from "@/components/landing/SpotIllustration";

/**
 * StorySection — the blog.google capture's section grammar as one component:
 *   light H2 (≤4 words) → optional right-aligned "SEE ALL →" → featured
 *   illustrated panel (caps label + title + one-line dek + optional link)
 *   beside hairline label+title rows. `flip` swaps sides down the page.
 * A section list converted to this is a section list that "shows itself".
 */
export default function StorySection({
  id,
  title,
  seeAll,
  onSeeAll,
  featured,
  rows,
  flip = false,
  className = "",
}) {
  return (
    <section id={id} className={`px-6 py-16 sm:px-8 lg:px-10 lg:py-24 ${className}`}>
      <div className="mx-auto max-w-[1240px]">
        <div className="mb-10 sm:mb-12">
          <h2 className="text-[30px] font-normal leading-[1.15] tracking-[-0.025em] sm:text-[36px] lg:text-[42px]" style={{ color: "#121317" }}>
            {title}
          </h2>
          {seeAll && (
            <div className="mt-4 flex justify-end">
              {onSeeAll ? (
                <button type="button" onClick={onSeeAll}
                  className="inline-flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.12em] transition-colors hover:text-[#4285F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-sm"
                  style={{ color: "#121317" }}>
                  {seeAll}
                  <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
                </button>
              ) : (
                <Link to={seeAll.to}
                  className="inline-flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.12em] transition-colors hover:text-[#4285F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-sm"
                  style={{ color: "#121317" }}>
                  {seeAll.label}
                  <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          {/* Featured story block */}
          <div className={flip ? "lg:order-2" : ""}>
            <div className="overflow-hidden rounded-[24px] border" style={{ borderColor: "#dadce0" }}>
              <SpotIllustration subject={featured.subject} className="aspect-[4/3] w-full" />
            </div>
            <p className="mt-8 text-[12px] uppercase tracking-[0.43px]" style={{ color: "#5f6368" }}>{featured.label}</p>
            <h3 className="mt-3 text-[22px] font-normal leading-[1.3] tracking-[-0.01em] sm:text-[26px]" style={{ color: "#121317" }}>
              {featured.title}
            </h3>
            <p className="mt-3 max-w-[480px] text-[15px] leading-[1.65]" style={{ color: "#5f6368" }}>{featured.dek}</p>
            {featured.link && (
              <Link to={featured.link.to}
                className="mt-5 inline-flex items-center gap-2 text-[15px] transition-colors hover:text-[#4285F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-sm"
                style={{ color: "#4285F4" }}>
                {featured.link.label}
                <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
              </Link>
            )}
          </div>

          {/* Hairline label+title rows */}
          <div className={`border-t ${flip ? "lg:order-1" : ""}`} style={{ borderColor: "#dadce0" }}>
            {rows.map((r) => (
              <div key={r.label + r.title} className="border-b py-5" style={{ borderColor: "#dadce0" }}>
                <p className="text-[12px] uppercase tracking-[0.43px]" style={{ color: "#9aa0a6" }}>{r.label}</p>
                <p className="mt-1.5 text-[16px] font-medium leading-[1.45]" style={{ color: "#121317" }}>{r.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
