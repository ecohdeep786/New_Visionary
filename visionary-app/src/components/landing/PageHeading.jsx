import { Link } from "react-router-dom";
import Breadcrumb from "@/components/landing/Breadcrumb";

/**
 * <PageHeading> — the single heading component for every supporting page
 * (the migration order's Phase-4 contract; Updates was the reference render).
 * Anatomy: breadcrumb row → optional eyebrow (12px caps, grey, wayfinding
 * only) → H1 (48/64/76, font-normal, ≤6 words, sentence case, ONE optional
 * blue accent span) → optional dek (≤12 words, one line) → optional right
 * utility link → optional children (CTA row). No page writes its own hero.
 * Spacing: pt-16/lg-24 after the breadcrumb (the pricing-style hero air).
 */
export function Accent({ children }) {
  return <span style={{ color: "#4285F4" }}>{children}</span>;
}

export default function PageHeading({
  page,
  eyebrow,
  h1,
  dek,
  utilityLabel,
  utilityTo,
  utilityOnClick,
  children,
  className = "",
}) {
  return (
    <>
      <Breadcrumb page={page} />
      <section className={`px-6 pt-10 pb-16 sm:px-8 sm:pb-20 lg:px-10 lg:pb-24 ${className}`}>
        <div className="mx-auto max-w-[1240px]">
          {eyebrow && (
            <p className="text-[12px] font-normal uppercase tracking-[0.16em]" style={{ color: "#5f6368" }}>
              {eyebrow}
            </p>
          )}
          {h1 && (
            <h1 className={`max-w-[960px] text-[48px] font-normal leading-[1.06] tracking-[-0.045em] sm:text-[64px] lg:text-[76px] ${eyebrow ? "mt-4" : ""}`} style={{ color: "#121317" }}>
              {h1}
            </h1>
          )}
          {dek && (
            <p className="mt-6 max-w-[640px] text-[18px] leading-[1.6] sm:text-[20px]" style={{ color: "#5f6368" }}>
              {dek}
            </p>
          )}
          {utilityLabel && (
            <div className="mt-6 flex justify-end">
              {utilityTo ? (
                <Link to={utilityTo}
                  className="inline-flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.12em] transition-colors hover:text-[#4285F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-sm"
                  style={{ color: "#121317" }}>
                  {utilityLabel}
                  <span aria-hidden="true">→</span>
                </Link>
              ) : (
                <button type="button" onClick={utilityOnClick}
                  className="inline-flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.12em] transition-colors hover:text-[#4285F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-sm"
                  style={{ color: "#121317" }}>
                  {utilityLabel}
                  <span aria-hidden="true">→</span>
                </button>
              )}
            </div>
          )}
          {children}
        </div>
      </section>
    </>
  );
}
