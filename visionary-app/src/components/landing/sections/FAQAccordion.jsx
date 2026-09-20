import { useState } from "react";
import { ChevronDown } from "lucide-react";
import ScrollReveal from "@/components/landing/ScrollReveal";
import SectionHeader from "./SectionHeader";

export default function FAQAccordion({ eyebrow, title, subtitle, faqs, color = "#1a73e8" }) {
  const [open, setOpen] = useState(0);

  return (
    <section className="py-28 px-6 bg-white">
      <div className="max-w-[820px] mx-auto">
        <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} color={color} align="center" />
        <ScrollReveal>
          <div className="space-y-3 mt-4">
            {faqs.map((faq, idx) => {
              const isOpen = open === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-[#e8eaed] bg-white overflow-hidden transition-shadow hover:shadow-[0_2px_8px_rgba(60,64,67,0.05)]"
                >
                  <button
                    onClick={() => setOpen(isOpen ? -1 : idx)}
                    className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-[#f8f9fa] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]"
                  >
                    <span className="text-[15px] font-medium text-[#202124] leading-[1.4]">
                      {faq.q}
                    </span>
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all"
                      style={{
                        backgroundColor: isOpen ? color : "#f8f9fa",
                        color: isOpen ? "#fff" : "#5f6368",
                        transform: isOpen ? "rotate(180deg)" : "rotate(0)",
                      }}
                    >
                      <ChevronDown className="w-4 h-4" strokeWidth={2} />
                    </span>
                  </button>
                  <div
                    className="grid transition-all duration-300 ease-google"
                    style={{
                      gridTemplateRows: isOpen ? "1fr" : "0fr",
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    <div className="overflow-hidden">
                      <p className="px-6 pb-6 text-[14.5px] text-[#5f6368] leading-[1.7]">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
