import { ArrowRight } from "lucide-react";

export default function GetStartedCard({ icon: Icon, accentClass, heading, description, buttonLabel, buttonVariant = "solid" }) {
  return (
    <div className="flex flex-col gap-3 p-5 bg-white rounded-2xl border border-[#e2e8f0] flex-1 min-w-[220px]">
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${accentClass}`}
      >
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-[#0f172a] leading-snug">{heading}</h3>
      <p className="text-sm text-[#64748b] leading-relaxed flex-1">{description}</p>
      <button
        className={`flex items-center gap-1 self-start text-sm font-medium px-4 py-2 rounded-full transition-colors ${
          buttonVariant === "solid"
            ? "bg-[#0055d4] text-white hover:bg-[#0044b0]"
            : "border border-[#0055d4] text-[#0055d4] hover:bg-[#0055d4] hover:text-white"
        }`}
      >
        {buttonLabel} <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}