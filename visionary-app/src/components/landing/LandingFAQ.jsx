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
            className="inline-flex min-h-11 items-center gap-2 rounded-sm px-2 text-[14px] font-medium text-[#0b57d0] transition-colors hover:text-[#1765cc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
          >
            {allOpen ? collapseAllLabel : expandAllLabel}
            <Plus className={`h-4 w-4 transition-transform duration-200 ${allOpen ? "rotate-45" : ""}`} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className={isHero ? "" : "space-y-3"}>
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
                  className="flex w-full items-center justify-between gap-6 rounded-[8px] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                >
                  <span className="font-normal leading-[1.15] text-[clamp(22px,2.4vw,34px)]" style={{ color: "#121317" }}>
                    {faq.q}
                  </span>
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#e8f0fe] sm:h-16 sm:w-16" style={{ color: "#121317" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`h-6 w-6 transition-transform duration-300 ${open ? "rotate-180" : ""}`}>
                      <path d="M6 15l6-6 6 6" />
                    </svg>
                  </span>
                </button>
                <div
                  id={answerId}
                  role="region"
                  aria-labelledby={triggerId}
                  aria-hidden={!open}
                  className={`grid transition-all duration-500 ease-google ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-[1240px] pt-8 text-[15px] leading-[1.6]" style={{ color: "#121317" }}>{faq.a}</p>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={faq.q || index} className="overflow-hidden rounded-2xl border border-[#e8eaed] bg-white">
              <button
                id={triggerId}
                type="button"
                aria-expanded={open}
                aria-controls={answerId}
                onClick={() => toggle(index)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
              >
                <span className="text-[16px] font-medium text-[#202124]">{faq.q}</span>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${open ? "bg-[#1a73e8] text-white" : "bg-[#e8f0fe] text-[#0b57d0]"}`}>
                  <Plus className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-45" : ""}`} aria-hidden="true" />
                </span>
              </button>
              <div id={answerId} role="region" aria-labelledby={triggerId} hidden={!open} className="px-6 pb-6">
                <p className="text-[15px] leading-[1.65] text-[#5f6368]">{faq.a}</p>
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
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#dadce0] bg-white px-6 text-[14px] font-medium text-[#0b57d0] transition-colors hover:bg-[#f1f3f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
          >
            {showMoreLabel}
          </button>
        </div>
      )}
    </div>
  );
}
