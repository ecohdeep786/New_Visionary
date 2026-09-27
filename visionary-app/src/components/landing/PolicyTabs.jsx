import { Link, useLocation } from "react-router-dom";

/**
 * PolicyTabs — the policies.google.com merge pattern: one shared tab bar
 * across the Privacy / Terms / Cookies policy pages. Each policy keeps its
 * own URL (deep links, breadcrumb, footer links all preserved) while the
 * pills make the three read as a single multi-section policy experience.
 * Pill style matches the product tab bar (active = white pill on the grey
 * track); the pt-6 gives breathing room after the breadcrumb row.
 */
const POLICIES = [
  { to: "/privacy", label: "Privacy Policy" },
  { to: "/terms", label: "Terms of Service" },
  { to: "/cookies", label: "Cookies" },
];

export default function PolicyTabs() {
  const { pathname } = useLocation();
  return (
    <nav aria-label="Visionary policies" className="bg-white">
      <div className="mx-auto max-w-[1240px] px-6 sm:px-8 lg:px-10">
        <div className="flex justify-start pt-6">
          <div
            role="group"
            aria-label="Policy sections"
            className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full bg-[#f1f3f4] p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {POLICIES.map(({ to, label }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  aria-current={active ? "page" : undefined}
                  className={`shrink-0 whitespace-nowrap rounded-full px-5 py-2.5 text-[14px] font-medium tracking-[0.01em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] ${
                    active
                      ? "bg-white text-[#202124] shadow-[0_1px_3px_rgba(60,64,67,0.2)]"
                      : "text-[#5f6368] hover:text-[#202124]"
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
