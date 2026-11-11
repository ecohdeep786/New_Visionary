import React from "react";
import { color } from "@/components/landing/system/tokens";

const LanguageChips = React.memo(function LanguageChips({ active, onSelect, chips }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3" role="group" aria-label="Language selection">
      {chips.map((lang) => (
        <button
          key={lang.code}
          type="button"
          aria-pressed={active === lang.code}
          onClick={() => onSelect(lang.code)}
          className={`rounded-full px-5 py-2 tracking-[0] leading-[20px] text-[14px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] ${active === lang.code ? "font-medium" : "font-normal border hover:bg-[#1d1d1f]/5"}`}
          style={{
            backgroundColor: active === lang.code ? color.wash : "transparent",
            color: color.ink,
            borderColor: active === lang.code ? "transparent" : `${color.ink}40`,
          }}
        >
          {lang.label}
        </button>
      ))}
      <span className="ml-1 font-normal tracking-[0] leading-[20px] text-[14px]" style={{ color: color.slate }}>
        +20 languages
      </span>
    </div>
  );
});
export default LanguageChips;
