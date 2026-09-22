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
            onClick={() => onChange(opt.id)}
            className={`relative flex items-start ${innerGap} ${padding} rounded-2xl border-2 transition-all text-left ${
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
              <p className={`font-medium text-[#121317] ${dense ? "text-xs" : "text-sm"}`}>{opt.label}</p>
              {opt.desc && <p className={`text-[#5f6368] mt-0.5 ${dense ? "text-xs" : "text-xs"}`}>{opt.desc}</p>}
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
