import React from "react";

/**
 * Google-style highlight card — used to break up text walls.
 * Features icon + title + description with optional accent.
 */
export default function HighlightCard({ Icon, title, children, color = "#1a73e8", accent = false }) {
  return (
    <div
      className={`rounded-[24px] border p-7 sm:p-8 transition-all hover:shadow-[0_8px_24px_rgba(60,64,67,0.08)] hover:-translate-y-0.5 ${
        accent ? "border-transparent" : "border-[#e8eaed] bg-white"
      }`}
      style={accent ? { backgroundColor: `${color}08`, borderColor: `${color}20` } : {}}
    >
      {Icon && (
        <div
          className="w-14 h-14 rounded-[18px] flex items-center justify-center mb-6"
          style={{ backgroundColor: `${color}12`, color }}
        >
          <Icon className="w-7 h-7" strokeWidth={1.7} />
        </div>
      )}
      <h3
        className="text-[20px] font-medium text-[#202124] mb-3 leading-[1.25] tracking-[-0.01em]"
      >
        {title}
      </h3>
      <p className="text-[15px] text-[#5f6368] leading-[1.7]">{children}</p>
    </div>
  );
}

/**
 * Google-style key-value row — pairs a small label with a larger value.
 */
export function DataRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between py-4 border-b border-[#e8eaed] last:border-b-0">
      <span className="text-[14px] font-medium text-[#202124]">{label}</span>
      <span className="text-[14px] text-[#5f6368]">{value}</span>
    </div>
  );
}

/**
 * Google-style callout bar — soft background with icon and text inline.
 */
export function CalloutBar({ Icon, children, color = "#1a73e8" }) {
  return (
    <div
      className="flex items-start gap-4 rounded-[20px] px-6 py-5"
      style={{ backgroundColor: `${color}08` }}
    >
      {Icon && (
        <Icon className="w-5 h-5 shrink-0 mt-0.5" strokeWidth={1.8} style={{ color }} />
      )}
      <p className="text-[14px] text-[#5f6368] leading-[1.7]">{children}</p>
    </div>
  );
}