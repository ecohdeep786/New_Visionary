import { Link } from "react-router-dom";
import SpotIllustration from "@/components/landing/SpotIllustration";

/**
 * Guided empty state — follows the guideline: in empty/zero states,
 * guide the user ("Try X to get started") rather than showing blank metrics.
 * Google-style: a flat spot illustration as the visual anchor, icon chip,
 * one clear title, one line of guidance, one action.
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionTo = "/dashboard/subscription",
  accent = "#1a73e8",
  illustration,
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-[#dadce0]/60 bg-white p-10 text-center">
      {illustration ? (
        <div className="mb-5 w-full max-w-[220px] overflow-hidden rounded-[20px]">
          <SpotIllustration subject={illustration} className="aspect-[4/3] w-full" />
        </div>
      ) : (
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: `${accent}12` }}>
          {Icon ? <Icon className="h-7 w-7" style={{ color: accent }} /> : null}
        </div>
      )}
      <h3 className="mb-2 text-[18px] font-medium text-[#202124]">{title}</h3>
      <p className="mb-6 max-w-sm text-sm leading-relaxed text-[#5f6368]">{description}</p>
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="inline-flex h-10 items-center rounded-full px-6 text-sm font-medium transition-colors"
          style={{ backgroundColor: accent, color: "#fff" }}
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
