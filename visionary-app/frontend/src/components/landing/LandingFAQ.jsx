import { useId, useState } from "react";
import { Plus } from "lucide-react";

/** One FAQ interaction pattern with a preserved landing-page hero treatment. */
export default function LandingFAQ({
  faqs,
  variant = "card",
  defaultOpen = 0,
  multiple = false,
  showExpandAll = false,
  visibleCount,
  expandAllLabel = "Expand all",
  collapseAllLabel = "Collapse all",
  showMoreLabel = "Show more",
  onShowMore,
  className = "",
}) {
  const instanceId = useId().replace(/:/g, "");
  const isHero = variant === "hero";
  const [openItems, setOpenItems] = useState(() =>
    multiple ? new Set(defaultOpen < 0 ? [] : [defaultOpen]) : defaultOpen
  );
  const [expanded, setExpanded] = useState(!visibleCount);
  const visibleFaqs = visibleCount && !expanded ? faqs.slice(0, visibleCount) : faqs;

  const isOpen = (index) =>
    multiple ? openItems instanceof Set && openItems.has(index) : openItems === index;

  const toggle = (index) => {
    if (multiple) {
      setOpenItems((current) => {
        const next = new Set(current instanceof Set ? current : []);
        if (next.has(index)) next.delete(index);
        else next.add(index);
        return next;
      });
      return;
    }
    setOpenItems((current) => (current === index ? -1 : index));
  };

  const allOpen = faqs.length > 0 && faqs.every((_, index) => isOpen(index));
  const toggleAll = () => {
    if (allOpen) {
      setOpenItems(new Set());
      return;
    }
    setExpanded(true);
    setOpenItems(multiple ? new Set(faqs.map((_, index) => index)) : faqs.length - 1);
  };

  const handleShowMore = () => {
    setExpanded(true);
    onShowMore?.();
  };

  return (
    <div className={`landing-faq landing-faq--${variant} ${className}`}>
      {showExpandAll && faqs.length > 0 && (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={toggleAll}
            aria-expanded={allOpen}
            className="inline-flex min-h-11 items-center gap-2 rounded-sm px-2 text-[14px] font-medium text-[#0066cc] transition-colors hover:text-[#0071e3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc]"
          >
            {allOpen ? collapseAllLabel : expandAllLabel}
            <Plus className={`h-4 w-4 transition-transform duration-200 ${allOpen ? "rotate-45" : ""}`} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* the row variant — the product's canonical accordion anatomy (the
          pricing page's): full-width hairline rows, ink question, quiet gray
          chevron that rotates, the answer on the same resolve curve. No card
          boxes, no filled circles — the hairline carries the structure.
          Reference basis: Apple HIG — expanding/collapsing content; quiet
          disclosure controls on hairline rows. */}
      <div className={isHero ? "" : "border-t"} style={isHero ? undefined : { borderColor: "rgba(18,19,23,0.12)" }}>
        {visibleFaqs.map((faq, index) => {
          const open = isOpen(index);
          const triggerId = `${instanceId}-faq-trigger-${index}`;
          const answerId = `${instanceId}-faq-answer-${index}`;

          if (isHero) {
            return (
              <div key={faq.q || index} className="border-b py-10 lg:py-12" style={{ borderColor: "rgba(18,19,23,0.26)" }}>
                <button
                  id={triggerId}
                  type="button"
                  aria-expanded={open}
                  aria-controls={answerId}
                  onClick={() => toggle(index)}
                  className="flex w-full items-center justify-between gap-6 rounded-[8px] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc]"
                >
                  <span className="font-normal leading-[1.15] text-[clamp(22px,2.2vw,32px)]" style={{ color: "#1d1d1f" }}>
                    {faq.q}
                  </span>
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[rgba(0,102,204,0.10)] sm:h-16 sm:w-16" style={{ color: "#1d1d1f" }}>
                    {/* closed points down (open me), open points up (collapse me) */}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`h-6 w-6 transition-transform duration-300 ${open ? "rotate-180" : ""}`}>
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </span>
                </button>
                <div
                  id={answerId}
                  role="region"
                  aria-labelledby={triggerId}
                  /* visibility (not display) keeps the grid-rows animation while
                     removing the closed answer from the a11y tree and selection */
                  className={`grid transition-all duration-500 ease-apple ${open ? "grid-rows-[1fr] opacity-100 visible" : "grid-rows-[0fr] opacity-0 invisible"}`}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-[1240px] pt-8 text-[16px] leading-[1.6]" style={{ color: "#1d1d1f" }}>{faq.a}</p>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={faq.q || index} className="border-b" style={{ borderColor: "rgba(18,19,23,0.12)" }}>
              <button
                id={triggerId}
                type="button"
                aria-expanded={open}
                aria-controls={answerId}
                onClick={() => toggle(index)}
                className="flex w-full items-center justify-between gap-6 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
              >
                <span className="text-[17px] font-normal leading-[1.47] text-[#1d1d1f]">{faq.q}</span>
                <Plus className={`h-5 w-5 shrink-0 text-[#6e6e73] transition-transform duration-300 motion-reduce:transition-none ${open ? "rotate-45" : ""}`} aria-hidden="true" />
              </button>
              <div
                id={answerId}
                role="region"
                aria-labelledby={triggerId}
                /* visibility (not display) keeps the grid-rows resolve while
                   the collapsed answer stays out of the tab/a11y order */
                className={`grid transition-all duration-500 ease-apple motion-reduce:transition-none ${open ? "grid-rows-[1fr] opacity-100 visible" : "grid-rows-[0fr] opacity-0 invisible"}`}
              >
                <div className="overflow-hidden">
                  <p className="max-w-[70ch] pb-5 text-[15px] leading-[1.6] text-[#6e6e73]">{faq.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {visibleCount && !expanded && faqs.length > visibleCount && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={handleShowMore}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#d2d2d7] bg-white px-6 text-[14px] font-medium text-[#0066cc] transition-colors hover:bg-[#f5f5f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc]"
          >
            {showMoreLabel}
          </button>
        </div>
      )}
    </div>
  );
}
