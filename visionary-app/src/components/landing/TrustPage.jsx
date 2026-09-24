import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import Breadcrumb from "@/components/landing/Breadcrumb";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import { ChevronRight } from "lucide-react";

/** A colored word/phrase inside a heading — matches Google's blue-accented headings */
export function Accent({ children }) {
  return (
    <span style={{ color: "#4285F4" }}>{children}</span>
  );
}

/**
 * TrustPage — the unified wrapper for all legal/trust/support pages
 * (Privacy, Terms, Security, Safety, Cookies, Accessibility, etc.).
 *
 * Matches Google's legal-page layout pattern:
 *   1. LandingNav
 *   2. Breadcrumb (Home › Hub › Page)
 *   3. Hero: eyebrow (small caps) → H1 (huge, sentence case) → optional dek
 *      → optional "Last updated" line → optional on-page nav chips
 *   4. Desktop: sticky left TOC + main article body (numbered sections)
 *      Mobile: collapsible "Contents" dropdown + full-width body
 *   5. Closing CTA band (surface bg, centered)
 *   6. LandingFooter (quiet variant)
 *
 * Usage in each page:
 *   <TrustPage toc={SECTIONS} lastUpdated="..." eyebrow="Privacy"
 *     title={<>Your <Accent>data</Accent>, your control.</>}
 *     dek="See what we keep. Change or remove it anytime."
 *     hero={<CustomHero />}>  {/* optional custom hero slot — overrides TrustHero *}
 *   </TrustPage>
 */

const FONT = "'Google Sans Flex', 'Google Sans', system-ui, sans-serif";
const C = {
  ink: "#121317",
  graphite: "#3c4043",
  slate: "#5f6368",
  lightGrey: "#9aa0a6",
  mist: "#dadce0",
  border: "#e5e7eb",
  canvas: "#f8f9fa",
  soft: "#f5f6f8",
  blue: "#4285F4",
  white: "#ffffff",
};

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.replaceState(null, "", `#${id}`);
}

/** Single heading used inside the sticky TOC and mobile dropdown */
export function SectionHeading({ number, title, href, active, onClick }) {
  const isActive = active === href;
  return (
    <button
      type="button"
      onClick={() => {
        scrollToSection(href);
        onClick?.(href);
      }}
      className={`
        group flex w-full items-start gap-3 rounded-[12px] px-3 py-2 text-left
        transition-colors focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-[#4285F4] focus-visible:ring-inset
        ${isActive ? "bg-[#f8f9fa]" : "hover:bg-[#121317]/5"}
      `}
    >
      {number && (
        <span
          className="mt-0.5 w-6 shrink-0 text-[11px] font-medium"
          style={{ color: isActive ? C.blue : C.slate }}
        >
          {number}
        </span>
      )}
      <span
        className="text-[13px] leading-[1.45]"
        style={{ color: isActive ? C.ink : C.graphite }}
      >
        {title}
      </span>
    </button>
  );
}

/** A reusable paragraph block (Google legal pages use tight, readable bodies) */
export function Paragraph({ children, className = "" }) {
  return (
    <p
      className={`max-w-[760px] text-[16px] leading-[1.78] tracking-[0.005em] ${className}`}
      style={{ color: C.graphite }}
    >
      {children}
    </p>
  );
}

/** A callout / note block */
export function Note({ children, className = "" }) {
  return (
    <div
      className={`mt-6 rounded-[18px] border px-5 py-5 sm:px-6 ${className}`}
      style={{ borderColor: C.border, backgroundColor: C.canvas }}
    >
      <p className="text-[14px] leading-[1.7]" style={{ color: C.graphite }}>
        {children}
      </p>
    </div>
  );
}

/** A bullet list block */
export function BulletList({ items }) {
  return (
    <ul className="mt-5 max-w-[760px] space-y-3">
      {items.map((item, index) => (
        <li
          key={index}
          className="flex gap-3 text-[16px] leading-[1.7]"
          style={{ color: C.graphite }}
        >
          <span
            aria-hidden="true"
            className="mt-[0.72em] h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: C.blue }}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Hero — matches Google's legal page hero:
 *   eyebrow (12px caps) → H1 (48/64/76, font-normal, ≤6 words)
 *   → optional dek (≤12 words, one line)
 *   → optional "Last updated" line
 *   → optional on-page nav chips
 */
function TrustHero({ eyebrow, title, dek, lastUpdated, navChips }) {
  return (
    <section className="border-b pt-28 sm:pt-32" style={{ borderColor: C.border, fontFamily: FONT }}>
      <div className="mx-auto max-w-[1240px] px-6 pb-16 sm:px-8 sm:pb-20 lg:px-10 lg:pb-24">
        <div className="max-w-[940px]">
          {eyebrow && (
            <p
              className="mb-5 flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.12em]"
              style={{ color: C.slate }}
            >
              {eyebrow}
            </p>
          )}
          {title && (
            <h1
              className="max-w-[900px] text-[48px] font-normal leading-[1.06] tracking-[-0.045em] sm:text-[64px] lg:text-[76px]"
              style={{ color: C.ink }}
            >
              {title}
            </h1>
          )}
          {dek && (
            <p
              className="mt-[calc(48px*0.421)] sm:mt-[calc(64px*0.421)] lg:mt-[calc(76px*0.421)] max-w-[760px] text-[18px] leading-[1.6] tracking-[0.005em] sm:text-[20px]"
              style={{ color: C.graphite }}
            >
              {dek}
            </p>
          )}
          {lastUpdated && (
            <p className="mt-4 text-[13px] tracking-[0.24px]" style={{ color: C.slate }}>
              Last updated: <strong style={{ color: C.ink }}>{lastUpdated}</strong>
            </p>
          )}
          {navChips && (
            <nav
              aria-label="On this page"
              className="mt-6 flex flex-wrap items-center gap-2"
            >
              {navChips.map(([to, label]) => (
                <a
                  key={to}
                  href={to}
                  className="rounded-full border bg-white px-4 py-2 text-[13px] tracking-[0.1px] transition-colors hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                  style={{ borderColor: C.mist, color: C.slate }}
                >
                  {label}
                </a>
              ))}
            </nav>
          )}
        </div>
      </div>
    </section>
  );
}

export default function TrustPage({
  page,
  eyebrow,
  title,
  dek,
  lastUpdated,
  navChips,
  hero,
  toc = [],
  intro,
  trustTOCNote,
  closingCTA,
  children,
}) {
  const location = useLocation();
  const [activeId, setActiveId] = useState(toc[0]?.id ?? null);
  const [showMobileContents, setShowMobileContents] = useState(false);

  const activeSection = useMemo(
    () => toc.find((s) => s.id === activeId),
    [toc, activeId]
  );

  /* Intersection Observer for sticky TOC highlighting */
  useEffect(() => {
    if (!toc.length) return;
    const observers = [];
    toc.forEach((section) => {
      const element = document.getElementById(section.id);
      if (!element) return;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setActiveId(section.id);
          });
        },
        { rootMargin: "-18% 0px -65% 0px", threshold: 0.01 }
      );
      observer.observe(element);
      observers.push(observer);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [toc]);

  /* Hash navigation on mount */
  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (hash && toc.some((s) => s.id === hash)) {
      requestAnimationFrame(() => {
        scrollToSection(hash);
        setActiveId(hash);
      });
    }
  }, [location.hash, toc]);

  const hasToc = toc.length > 0;

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT }}>
      <LandingNav />
      <Breadcrumb page={page} />
      <main id="main">
        {hero ? (
          hero
        ) : (
          <TrustHero
            eyebrow={eyebrow}
            title={title}
            dek={dek}
            lastUpdated={lastUpdated}
            navChips={navChips}
          />
        )}

        {intro && (
          <section className="border-b" style={{ borderColor: C.border }}>
            {intro}
          </section>
        )}

        {hasToc && (
          <>
            {/* Mobile contents dropdown */}
            <section className="border-b lg:hidden" style={{ borderColor: C.border }}>
              <div className="mx-auto max-w-[1240px] px-6 sm:px-8">
                <button
                  type="button"
                  onClick={() => setShowMobileContents((v) => !v)}
                  aria-expanded={showMobileContents}
                  className="flex w-full items-center justify-between py-4 text-left hover:bg-[#121317]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                >
                  <span>
                    <span
                      className="block text-[12px] uppercase tracking-[0.12em]"
                      style={{ color: C.slate }}
                    >
                      Contents
                    </span>
                    <span className="mt-1 block text-[15px]" style={{ color: C.ink }}>
                      {activeSection?.title ?? "Table of contents"}
                    </span>
                  </span>
                  <ChevronRight
                    className={`h-5 w-5 transition-transform duration-200 ${
                      showMobileContents ? "rotate-90" : ""
                    }`}
                    strokeWidth={1.7}
                    style={{ color: C.slate }}
                  />
                </button>
                {showMobileContents && (
                  <div className="pb-5">
                    <div className="overflow-hidden rounded-[18px] border" style={{ borderColor: C.border }}>
                      {toc.map((section) => (
                        <SectionHeading
                          key={section.id}
                          number={section.number}
                          title={section.title}
                          href={section.id}
                          active={activeId}
                          onClick={(id) => {
                            setActiveId(id);
                            setShowMobileContents(false);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Two-column layout: sticky TOC + main content */}
            <section>
              <div className="mx-auto max-w-[1240px] px-6 py-12 sm:px-8 lg:px-10 lg:py-20">
                <div className="grid gap-12 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-20">
                  {/* Desktop sticky TOC */}
                  <aside className="hidden lg:block">
                    <div className="sticky top-24">
                      <div
                        className="mb-4 text-[12px] font-medium uppercase tracking-[0.12em]"
                        style={{ color: C.slate }}
                      >
                        Contents
                      </div>
                      <nav aria-label={`${page} sections`}>
                        <div className="space-y-1">
                          {toc.map((section) => (
                            <SectionHeading
                              key={section.id}
                              number={section.number}
                              title={section.title}
                              href={section.id}
                              active={activeId}
                              onClick={setActiveId}
                            />
                          ))}
                        </div>
                      </nav>
                      {trustTOCNote && (
                        <div className="mt-8 border-t pt-6" style={{ borderColor: C.border }}>
                          {trustTOCNote}
                        </div>
                      )}
                      </div>
                  </aside>

                  {/* Main article content */}
                  <div className="min-w-0">
                    {children}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {!hasToc && (
          <section>
            <div className="mx-auto max-w-[1240px] px-6 py-12 sm:px-8 lg:px-10 lg:py-20">
              <div className="min-w-0">{children}</div>
            </div>
          </section>
        )}
      </main>
      {closingCTA && (
        <section className="border-t" style={{ borderColor: C.border }}>
          <div className="mx-auto max-w-[1240px] px-6 py-16 sm:px-8 lg:px-10 lg:py-24">
            {closingCTA}
          </div>
        </section>
      )}
      <LandingFooter variant="quiet" />
    </div>
  );
}

export { C, FONT, scrollToSection };
