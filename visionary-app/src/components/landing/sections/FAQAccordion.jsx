import { useState } from "react";
import { ChevronDown } from "lucide-react";
import ScrollReveal from "@/components/landing/ScrollReveal";
import SectionHeader from "./SectionHeader";

export default function FAQAccordion({ eyebrow, title, subtitle, faqs, color = "#1a73e8" }) {
  const [open, setOpen] = useState(0);

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-[760px] mx-auto">
        <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} color={color} />
        <ScrollReveal>
          <div className="space-y-2">
            {faqs.map((faq, idx) => {
              const isOpen = open === idx;
              return (
                <div key={idx} className="rounded-2xl border border-[#e8eaed] overflow-hidden">
                  <button
                    onClick={() => setOpen(isOpen ? -1 : idx)}
                    className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-[#f8f9fa] transition-colors"
                  >
                    <span className="text-sm font-medium text-[#202124]">{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 transition-transform text-[#5f6368] ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5">
                      <p className="text-sm text-[#5f6368] leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}