import { Link, useLocation } from "react-router-dom";

/**
 * PolicyTabs — the policies.google.com merge pattern: one shared tab bar
 * across the Privacy / Terms / Cookies / Security policy pages. Each policy
 * keeps its own URL (deep links, breadcrumb, footer links all preserved)
 * while the centered pills make the four read as a single multi-section
 * policy experience. Quiet house grammar: the current policy is an ink pill
 * on the grey-fill track (values-strip current-marker law); pt-6/pb-2 give
 * balanced breathing room around
 * the breadcrumb above and the policy content below.
 */
const POLICIES = [
  { to: "/privacy", label: "Privacy policy" },
  { to: "/terms", label: "Terms of service" },
  { to: "/cookies", label: "Cookies" },
  { to: "/security", label: "Security" },
];

export default function PolicyTabs() {
  const { pathname } = useLocation();
  return (
    <nav aria-label="Visionary policies" className="bg-white">
      <div className="mx-auto max-w-[1240px] px-6 sm:px-8 lg:px-10">
        <div className="flex justify-center pt-6 pb-10">
          <div
            role="group"
            aria-label="Policy sections"
            className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full bg-[#f5f5f7] p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {POLICIES.map(({ to, label }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  aria-current={active ? "page" : undefined}
                  className={`shrink-0 whitespace-nowrap rounded-full px-5 py-2.5 text-[14px] font-medium tracking-[0.01em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] ${
                    active
                      ? "bg-[#1d1d1f] text-white"
                      : "text-[#6e6e73] hover:text-[#1d1d1f]"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
