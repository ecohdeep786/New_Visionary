import { Check } from "lucide-react";

export default function ChipMultiSelect({ options, selected = [], onChange, maxSelection }) {
  const toggle = (id) => {
    if (selected.includes(id)) {
      if (maxSelection !== 1) {
        onChange(selected.filter((s) => s !== id));
      }
    } else if (maxSelection === 1 || !maxSelection || selected.length < maxSelection) {
      onChange(maxSelection === 1 ? [id] : [...selected, id]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 w-full">
      {options.map((opt) => {
        const id = opt.id || opt;
        const label = opt.label || opt;
        const isSelected = selected.includes(id);
        return (
          <button
            type="button"
            key={id}
            aria-pressed={isSelected}
            onClick={() => toggle(id)}
            className={`flex min-h-11 items-center gap-1.5 px-4 py-2.5 rounded-full border text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066cc] ${
              isSelected
                ? "border-[#1d1d1f] bg-[#f5f5f7] text-[#1d1d1f]"
                : "border-[#d2d2d7] text-[#1d1d1f] hover:border-[#86868b]"
            }`}
          >
            {isSelected && <Check className="w-3.5 h-3.5" />}
            {label}
          </button>
        );
      })}
    </div>
  );
}
