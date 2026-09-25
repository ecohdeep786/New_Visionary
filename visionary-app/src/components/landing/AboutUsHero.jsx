import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import SpotIllustration from "@/components/landing/SpotIllustration";

const FONT = "'Google Sans Flex', 'Google Sans', system-ui, sans-serif";

/* Color tokens matching the shared design system */
const C = {
  ink: "#121317",
  graphite: "#3c4043",
  slate: "#5f6368",
  mist: "#dadce0",
  blue: "#4285F4",
  navy: "#0b57d0",
  white: "#ffffff",
};

/* ── Card strip: categories + sub-categories. Sub-categories link to the
      category page that owns them — no separate sub-pages exist. ── */
const STRIP_CARDS = [
  { to: "/student", label: "Students", subject: "student" },
  { to: "/student", label: "Primary", subject: "math" },
  { to: "/student", label: "Secondary", subject: "physics" },
  { to: "/student", label: "Competitive Exams", subject: "flag" },
  { to: "/student", label: "Higher Education", subject: "research" },
  { to: "/student", label: "Individual Learning", subject: "loop" },
  { to: "/teacher", label: "Teachers", subject: "teacher" },
  { to: "/parent", label: "Parents", subject: "parent" },
  { to: "/professional", label: "Professionals", subject: "briefcase" },
  { to: "/organization", label: "Organizations", subject: "team" },
];
const STRIP_TINTS = ["#fdf3d8", "#e3edfc", "#e0efe4", "#f1e8fb", "#fbe3e1"];

/* ── Category card strip — full page width, straight cards drifting in one
      continuous slow loop, always on. Cards tilt and drop by their distance
      from center, recomputed every frame so the arc holds while they move. ── */
function CategoryStrip() {
  const wrapRef = useRef(null);
  const cards = [...STRIP_CARDS, ...STRIP_CARDS];

  useEffect(() => {
    let raf;
    const update = () => {
      const wrap = wrapRef.current;
      if (wrap) {
        const wr = wrap.getBoundingClientRect();
        const cx = wr.left + wr.width / 2;
        const half = Math.max(200, wr.width / 2);
        wrap.querySelectorAll("[data-card]").forEach((card) => {
          const r = card.getBoundingClientRect();
          const dx = r.left + r.width / 2 - cx;
          const t = Math.max(-1, Math.min(1, dx / half));
          card.style.transform = `rotate(${(t * 9).toFixed(2)}deg) translateY(${(t * t * 44).toFixed(1)}px)`;
        });
      }
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={wrapRef} className="w-full overflow-hidden py-12">
      <style>{`
        @keyframes about-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .about-marquee { animation: about-marquee 75s linear infinite; animation-duration: 75s !important; animation-iteration-count: infinite !important; }
      `}</style>
      <div
        role="region"
        aria-label="Explore Visionary by category"
        className="overflow-hidden"
      >
        <div className="about-marquee flex w-max gap-8">
          {cards.map(({ to, label, subject }, i) => {
            const dup = i >= STRIP_CARDS.length;
            const j = i % STRIP_CARDS.length;
            return (
              <Link
                key={label + "-" + i}
                to={to}
                data-card
                aria-hidden={dup || undefined}
                tabIndex={dup ? -1 : undefined}
                className="group relative flex h-[380px] w-[300px] shrink-0 flex-col overflow-hidden rounded-[28px] p-7 transition-shadow duration-300 hover:shadow-[0_12px_32px_rgba(32,33,36,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] focus-visible:ring-offset-4"
                style={{ backgroundColor: STRIP_TINTS[j % STRIP_TINTS.length] }}
              >
                <span className="text-[22px] font-medium leading-[1.3]" style={{ color: C.ink }}>{label}</span>
                <SpotIllustration subject={subject} className="absolute bottom-4 right-4 h-[58%] w-auto" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Eyebrow (matches original AboutHero) ── */
function Eyebrow({ children }) {
  return (
    <p className="mb-8 text-center text-[12px] font-medium uppercase tracking-[0.15em] text-[#5f6368]">
      {children}
    </p>
  );
}

/* ── ArrowLink (matches original AboutHero) ── */
function ArrowLink({ to, children, className = "" }) {
  return (
    <Link
      to={to}
      className={`group inline-flex min-h-11 items-center gap-2 rounded-sm text-[15px] font-medium text-[#0b57d0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] focus-visible:ring-offset-4 ${className}`}
    >
      {children}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
    </Link>
  );
}

/* ── Main hero section ── */
export default function AboutUsHero() {
  return (
    <section
      className="relative overflow-hidden border-b"
      style={{
        fontFamily: FONT,
        borderColor: C.mist,
        backgroundColor: C.white,
        paddingTop: "calc(64px + 80px)",
        paddingBottom: "64px",
      }}
    >
      {/* Category card strip — full page width, always drifting */}
      <CategoryStrip />

      <div className="mx-auto max-w-[1240px] px-6 sm:px-8 lg:px-10">
        {/* Eyebrow */}
        <Eyebrow>About Visionary</Eyebrow>

        {/* Centered heading, subheading, and button — original content restored exactly */}
        <div className="mx-auto mt-8 max-w-[1120px] text-center">
          <h1 className="text-[clamp(32px,6vw,64px)] font-normal leading-[0.98] tracking-[-0.045em] text-[#202124]">
            Helping people turn questions into <span className="text-[#0b57d0]">understanding.</span>
          </h1>
          <p className="mx-auto mt-8 max-w-[760px] text-[20px] leading-[1.55] text-[#3c4043] sm:text-[24px]">
            Visionary is a learning product for people who want to understand, practise, and apply what they learn—in class, at home, and at work.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/how-it-works"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#0b57d0] px-7 text-[15px] font-medium text-white hover:bg-[#0842a0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] focus-visible:ring-offset-4"
            >
              See how it works
            </Link>
            <ArrowLink to="/research">Explore our approach</ArrowLink>
          </div>
        </div>

        {/* Subtle radial gradient backdrop for the carousel area */}
        <div
          className="pointer-events-none absolute left-1/2 top-[220px] -translate-x-1/2"
          style={{
            width: "520px",
            height: "520px",
            background: "radial-gradient(circle, rgba(66,133,244,0.03) 0%, transparent 70%)",
            filter: "blur(2px)",
          }}
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
