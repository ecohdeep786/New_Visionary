import { Check } from "lucide-react";

export default function ChoiceGrid({ options, value, onChange, columns = 2, singleSelect = false, dense = false }) {
  const gridClass =
    columns === 1
      ? "grid-cols-1"
      : columns === 3
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      : columns >= 4
      ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
      : "grid-cols-1 sm:grid-cols-2";

  const padding = dense ? "p-3" : "p-5";
  const gapClass = dense ? "gap-2" : "gap-3";
  const innerGap = dense ? "gap-2" : "gap-4";

  return (
    <div className={`grid ${gridClass} ${gapClass} w-full`}>
      {options.map((opt) => {
        const selected = value === opt.id;
        const Icon = opt.icon;
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(opt.id)}
            className={`relative flex min-w-0 items-start ${innerGap} ${padding} rounded-2xl border-2 transition-colors text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b57d0] ${
              selected
                ? "border-[#4285F4] bg-[#e8f0fd]"
                : "border-[#dadce0] hover:border-[#5f6368] hover:bg-[#e8f0fd]/50"
            }`}
          >
            {Icon && (
              <Icon
                className="w-5 h-5 shrink-0 mt-0.5"
                style={{ color: selected ? "#4285F4" : "#5f6368" }}
              />
            )}
            <div className="flex-1 min-w-0">
              <p className={`break-words font-medium leading-6 text-[#121317] ${dense ? "text-xs" : "text-sm"}`}>{opt.label}</p>
              {opt.desc && <p className="mt-1 text-xs leading-5 text-[#5f6368]">{opt.desc}</p>}
            </div>
            {selected && singleSelect && (
              <div className="w-5 h-5 rounded-full bg-[#4285F4] flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
            {selected && !singleSelect && (
              <div className="w-5 h-5 rounded-full bg-[#4285F4] flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
