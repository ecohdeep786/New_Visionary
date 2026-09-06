import { Check, X } from "lucide-react";

export default function PricingCard({ plan, billing, isCurrent, accent = "#1a73e8" }) {
  const price = billing === "yearly" ? plan.yearly : plan.monthly;
  const period = billing === "yearly" ? "/year" : "/month";
  const monthlyEquiv = billing === "yearly" && plan.yearly > 0 ? Math.round(plan.yearly / 12) : null;

  return (
    <div
      className={`flex flex-col gap-6 p-8 rounded-3xl bg-white transition-all duration-200 relative ${
        plan.popular ? "border-2" : "border border-[#dadce0]/60"
      }`}
      style={plan.popular ? { borderColor: accent } : undefined}
    >
      {plan.badge && (
        <span
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap"
          style={plan.popular ? { backgroundColor: accent, color: "#fff" } : { backgroundColor: "#f1f3f4", color: "#5f6368" }}
        >
          {plan.badge}
        </span>
      )}

      <div>
        <h3 className="text-sm font-medium text-[#5f6368]">{plan.tagline}</h3>
        <div className="flex items-baseline gap-1.5 mt-2">
          <span className="text-[34px] font-medium text-[#202124] tracking-tight leading-none">
            {price === 0 ? "Free" : `₹${price.toLocaleString("en-IN")}`}
          </span>
          {price > 0 && <span className="text-sm font-normal text-[#5f6368]">{period}</span>}
        </div>
        {plan.perPerson && (
          <p className="text-xs text-[#5f6368] mt-2">
            ₹{billing === "yearly" ? plan.perPersonYearly : plan.perPerson}/person · up to 6 accounts
          </p>
        )}
        {monthlyEquiv && !plan.perPerson && (
          <p className="text-xs text-[#5f6368] mt-2">₹{monthlyEquiv}/month · 2 months free</p>
        )}
      </div>

      <p className="text-sm font-medium text-[#3c4043] leading-relaxed">{plan.outcome}</p>

      <div className="flex flex-col gap-3 flex-1">
        {plan.features.map((f, i) => (
          <div key={i} className="flex items-start gap-2.5">
            {f.included ? (
              <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: accent }} />
            ) : (
              <X className="w-4 h-4 mt-0.5 shrink-0 text-[#dadce0]" />
            )}
            <span className={`text-sm leading-snug ${f.included ? "text-[#3c4043]" : "text-[#5f6368]"}`}>
              {f.text}
            </span>
          </div>
        ))}
      </div>

      <button
        className="w-full h-11 rounded-full text-sm font-medium transition-colors"
        style={
          isCurrent
            ? { backgroundColor: "#f1f3f4", color: "#5f6368", cursor: "default" }
            : plan.popular
            ? { backgroundColor: accent, color: "#fff" }
            : { backgroundColor: "#fff", color: accent, border: `1px solid ${accent}` }
        }
      >
        {isCurrent ? "Current plan" : plan.cta}
      </button>
    </div>
  );
}