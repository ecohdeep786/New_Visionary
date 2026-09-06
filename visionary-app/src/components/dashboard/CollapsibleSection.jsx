import { useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Collapsible dashboard section — Google-style progressive disclosure.
 * Header (with chevron) toggles the body; optional action sits on the right.
 */
export default function CollapsibleSection({ title, subtitle, action, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 text-left"
          aria-expanded={open}
        >
          <ChevronDown
            className={`w-5 h-5 text-[#5f6368] transition-transform duration-200 ${open ? "" : "-rotate-90"}`}
          />
          <div>
            <h2 className="text-[22px] font-medium text-[#202124]">{title}</h2>
            {subtitle && <p className="text-sm font-normal text-[#5f6368] mt-1">{subtitle}</p>}
          </div>
        </button>
        {action}
      </div>
      {open && children}
    </div>
  );
}