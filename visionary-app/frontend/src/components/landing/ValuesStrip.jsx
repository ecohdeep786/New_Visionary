import { Link } from "react-router-dom";
import { ShieldCheck, Lock, Accessibility, Scale } from "lucide-react";
import { fontStack } from "@/components/landing/system/tokens";

/* Shared trust-values strip — closes every trust/legal page above the quiet
   footer. The four commitments cross-link to each other; the page you are on
   is marked, not linked, so the strip reads as a map of the trust family.
   House dialect: #f5f5f7 ground shared with the quiet footer (seamless — the
   footer's hairline is muted for this join), borderless white cards, grey-fill
   icon tiles with #0b57d0 glyphs, and an ink tile marking the current page. */
const VALUES = [
  { to: "/safety", label: "Safety", desc: "Age-aware guidance and human review.", Icon: ShieldCheck },
  { to: "/privacy", label: "Privacy", desc: "Your memory stays yours.", Icon: Lock },
  { to: "/security", label: "Security", desc: "Protected end to end.", Icon: ShieldCheck },
  { to: "/accessibility", label: "Accessibility", desc: "A way in for every learner.", Icon: Accessibility },
  { to: "/terms", label: "Commitments", desc: "What we promise, in plain words.", Icon: Scale },
];

export default function ValuesStrip({ current }) {
  return (
    <aside
      aria-label="Our commitments"
      className="border-t border-[rgba(18,19,23,0.045)] bg-[#f5f5f7]"
      style={{ fontFamily: fontStack }}
    >
      <div className="mx-auto max-w-[1240px] px-6 py-14 sm:px-8 lg:px-10 lg:py-16">
        <p className="text-center text-[12px] font-medium uppercase tracking-[0.12em] text-[#5f6368]">
          Our commitments
        </p>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {VALUES.map(({ to, label, desc, Icon }) => {
            const isCurrent = to === current;
            const inner = (
              <>
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${
                    isCurrent ? "bg-[#121317] text-white" : "bg-[#f5f5f7] text-[#0b57d0]"
                  }`}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold leading-[20px] text-[#121317]">
                    {label}
                  </span>
                  <span className="mt-0.5 block text-[14px] leading-[20px] text-[#5f6368]">
                    {desc}
                  </span>
                </span>
              </>
            );
            return (
              <li key={to} className="min-w-0">
                {isCurrent ? (
                  <div
                    aria-current="page"
                    className="flex h-full items-start gap-3 rounded-[20px] bg-white p-4"
                  >
                    {inner}
                  </div>
                ) : (
                  <Link
                    to={to}
                    className="flex h-full items-start gap-3 rounded-[20px] bg-white p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                  >
                    {inner}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
