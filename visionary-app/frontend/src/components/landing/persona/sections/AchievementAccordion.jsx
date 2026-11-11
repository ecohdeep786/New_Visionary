import React from "react";
import { ChevronDown } from "lucide-react";
import { color } from "@/components/landing/system/tokens";

const AchievementAccordion = React.memo(function AchievementAccordion({ tabs, open, onToggle }) {
  return (
    <div>
      {tabs.map((tab, i) => {
        const isOpen = open === i;
        return (
          <div key={tab.black} className="border-b py-10 first:pt-0 lg:py-12" style={{ borderColor: `${color.ink}26` }}>

            <button type="button" aria-expanded={isOpen} onClick={() => onToggle(i)} className="flex w-full items-start justify-between gap-4 text-left">
              <h3 data-type="feature" className="max-w-[460px] flex-1" style={{ color: color.ink }}>
                {tab.black} <span className="accent-gradient">{tab.blue}</span>
              </h3>
              <ChevronDown
                aria-hidden="true"
                className={`mt-2 h-4 w-4 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                style={{ color: "#6e6e73" }}
                strokeWidth={2.5}
              />
            </button>
            <div className={`grid transition-all duration-500 ease-apple ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
              <div className="overflow-hidden">
                <p className="max-w-[520px] pt-6 font-normal tracking-[0] leading-[1.5] text-[18px]" style={{ color: color.slate }}>
                  {tab.copy}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});
export default AchievementAccordion;
