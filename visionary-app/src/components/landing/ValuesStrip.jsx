import { Link } from "react-router-dom";
import { ShieldCheck, Lock, Accessibility, Scale } from "lucide-react";

/* Shared trust-values strip — closes every trust/legal page above the quiet
   footer. The four commitments cross-link to each other; the page you are on
   is marked, not linked, so the strip reads as a map of the trust family. */
const FONT = "'Google Sans Flex', 'Google Sans', 'DM Sans', system-ui, sans-serif";
const C = { ink: "#121317", slate: "#5f6368", mist: "#dadce0", surface: "#f8f9fa", blue: "#4285F4" };

const VALUES = [
  { to: "/safety", label: "Safety", desc: "Age-aware guidance and human review.", Icon: ShieldCheck },
  { to: "/privacy", label: "Privacy", desc: "Your memory stays yours.", Icon: Lock },
  { to: "/security", label: "Security", desc: "Protected end to end.", Icon: ShieldCheck },
  { to: "/accessibility", label: "Accessibility", desc: "A way in for every learner.", Icon: Accessibility },
  { to: "/terms", label: "Commitments", desc: "What we promise, in plain words.", Icon: Scale },
];

export default function ValuesStrip({ current }) {
  return (
    <aside aria-label="Our commitments" className="border-t bg-[#f8f9fa]" style={{ fontFamily: FONT, borderColor: C.mist }}>
      <div className="public-frame public-frame-wide py-14 lg:py-16">
        <p className="text-center text-[12px] font-normal uppercase tracking-[0.43px]" style={{ color: C.slate }}>
          Our commitments
        </p>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {VALUES.map(({ to, label, desc, Icon }) => {
            const isCurrent = to === current;
            const inner = (
              <>
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: isCurrent ? C.blue : "#e8f0fe", color: isCurrent ? "#ffffff" : C.blue }}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-medium leading-[20px]" style={{ color: C.ink }}>
                    {label}
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-[18px] tracking-[0.2px]" style={{ color: C.slate }}>
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
                    className="flex h-full items-start gap-3 rounded-[16px] border bg-white p-4"
                    style={{ borderColor: `${C.blue}66` }}
                  >
                    {inner}
                  </div>
                ) : (
                  <Link
                    to={to}
                    className="flex h-full items-start gap-3 rounded-[16px] border bg-white p-4 transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                    style={{ borderColor: C.mist }}
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
