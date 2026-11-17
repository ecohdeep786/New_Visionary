import { Link } from "react-router-dom";

/**
 * Guided empty state — follows the guideline: in empty/zero states,
 * guide the user ("Try X to get started") rather than showing blank metrics.
 */
export default function EmptyState({ icon: Icon, title, description, actionLabel, actionTo = "/dashboard/subscription", accent = "#0071E3" }) {
  return (
    <div className="bg-white rounded-2xl border border-[#d2d2d7]/60 p-10 text-center flex flex-col items-center">
      <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: `${accent}12` }}>
        {Icon ? <Icon className="w-7 h-7" style={{ color: accent }} /> : null}
      </div>
      <h3 className="text-[18px] font-medium text-[#1d1d1f] mb-2">{title}</h3>
      <p className="text-sm text-[#6e6e73] leading-relaxed max-w-sm mb-6">{description}</p>
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="inline-flex items-center h-10 px-6 rounded-full text-sm font-medium transition-colors"
          style={{ backgroundColor: accent, color: "#fff" }}
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}