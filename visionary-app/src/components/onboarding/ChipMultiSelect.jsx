import { Check } from "lucide-react";

export default function ChipMultiSelect({ options, selected = [], onChange, maxSelection }) {
  const toggle = (id) => {
    if (selected.includes(id)) {
      if (maxSelection !== 1) {
        onChange(selected.filter((s) => s !== id));
      }
    } else if (!maxSelection || selected.length < maxSelection) {
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
            key={id}
            onClick={() => toggle(id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full border text-sm font-medium transition-all ${
              isSelected
                ? "border-[#1a73e8] bg-[#e8f0fe] text-[#1a73e8]"
                : "border-[#dadce0] text-[#202124] hover:border-[#bdc1c6]"
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