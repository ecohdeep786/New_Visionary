import { Check } from "lucide-react";

export default function ChoiceGrid({ options, value, onChange, columns = 2 }) {
  const gridClass =
    columns === 1
      ? "grid-cols-1"
      : columns === 3
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      : "grid-cols-1 sm:grid-cols-2";

  return (
    <div className={`grid ${gridClass} gap-3 w-full`}>
      {options.map((opt) => {
        const selected = value === opt.id;
        const Icon = opt.icon;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`relative flex items-start gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
              selected
                ? "border-[#1a73e8] bg-[#e8f0fe]"
                : "border-[#dadce0] hover:border-[#bdc1c6] hover:bg-[#f8f9fa]"
            }`}
          >
            {Icon && (
              <Icon
                className="w-6 h-6 shrink-0 mt-0.5"
                style={{ color: selected ? "#1a73e8" : "#5f6368" }}
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#202124]">{opt.label}</p>
              {opt.desc && <p className="text-xs text-[#5f6368] mt-0.5">{opt.desc}</p>}
            </div>
            {selected && (
              <div className="w-5 h-5 rounded-full bg-[#1a73e8] flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}