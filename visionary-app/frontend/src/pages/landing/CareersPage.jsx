import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Compass,
  Home,
  Lightbulb,
  ListChecks,
  Mail,
  UsersRound,
  Code2,
} from "lucide-react";

import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import QuietLink from "@/components/landing/QuietLink";
import { ChevronIcon } from "@/components/landing/persona/PersonaSections";
import imgHero from "@/assets/pro-face-main-1600w.webp";
import imgStory from "@/assets/student-competitive.webp";
import imgStrip1 from "@/assets/problem-revision.webp";
import imgStrip2 from "@/assets/organization-problem-2-1600w.webp";
import imgStrip3 from "@/assets/student-vocational.webp";
import imgStrip4 from "@/assets/student-higher.webp";
import imgEngineering from "@/assets/professional-problem-1-1600w.webp";
import imgProduct from "@/assets/organization-problem-1-1600w.webp";
import imgDesign from "@/assets/problem-practice.webp";
import imgEvidence from "@/assets/problem-understanding.webp";
import imgEducation from "@/assets/teacher-problem-2.webp";
import imgOperations from "@/assets/organization-problem-3-1600w.webp";
import { fontStack } from "@/components/landing/system/tokens";

/* ═══ Tokens — careers-product dialect: Material geometry (8–12px cards,
   pill inputs/buttons), Material blue for actions and selection only ═══ */
const C = {
  ink: "#1d1d1f",
  graphite: "#1d1d1f",
  slate: "#6e6e73",
  mist: "#d2d2d7",
  line: "rgba(18, 19, 23, 0.12)",
  hover: "#f5f5f7",
  selBg: "rgba(0,102,204,0.10)",
  blue: "#0066cc",
  darkblue: "#0066cc",
};

const CAREERS_EMAIL = "careers@visionary.org.in";
const SECTION_IDS = ["overview", "why", "teams", "hiring", "roles", "contact"];

/* ═══ TEAMS — careers.google.com card grammar: photo, title, one grey line,
   two blue links. Areas of work, honestly framed (not vacancies). ═══ */
const AREAS = [
  { title: "Engineering", photo: imgEngineering, alt: "An engineer working across screens and systems", desc: "Build the application experiences and the systems learners use every day." },
  { title: "Product and strategy", photo: imgProduct, alt: "Teammates talking through a product decision at a desk", desc: "Turn learner needs and open questions into useful product decisions." },
  { title: "Design", photo: imgDesign, alt: "A designer shaping a learning exercise on paper", desc: "Make learning tools clear, usable, and more accessible." },
  { title: "Learning and evaluation", photo: imgEvidence, alt: "A teammate reading closely to evaluate an idea", desc: "Explore learning approaches carefully; distinguish design intent from measured results." },
  { title: "Teaching and curriculum", photo: imgEducation, alt: "A teacher explaining an idea at a whiteboard", desc: "Bring classroom practice and content expertise into product work." },
  { title: "Company operations", photo: imgOperations, alt: "Teammates coordinating work in a shared workspace", desc: "Help coordinate the practical work of building an education product." },
];

const STRIP = [
  { img: imgStrip1, alt: "A student pausing to think through a problem" },
  { img: imgStrip2, alt: "A team discussing work in an organization meeting" },
  { img: imgStrip3, alt: "A learner practising a vocational skill" },
  { img: imgStrip4, alt: "A student moving forward into higher education" },
];

/* What to expect — framed honestly for a small team: four steps,
   no invented process claims. */
const HIRING_STEPS = [
  { n: "01", title: "Choose a listed role.", copy: "Read the role carefully and decide whether the work and requirements fit your experience." },
  { n: "02", title: "Share your work.", copy: "Send a concise introduction with the links or examples requested in the role description." },
  { n: "03", title: "Work through the role.", copy: "If selected, conversations focus on the work, the team, and the problems the role will help solve." },
  { n: "04", title: "Decide with context.", copy: "We explain the role, process, and next steps clearly so both sides can make an informed decision." },
];

/* ═══ Motion — the site's shared reveal grammar, kept subtle ═══ */
function useRevealOnce() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const hasRevealed = useRef(false);
  useEffect(() => {
    const node = ref.current;
    if (hasRevealed.current) { setVisible(true); return undefined; }
    if (!node || typeof IntersectionObserver === "undefined") { setVisible(true); hasRevealed.current = true; return undefined; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasRevealed.current) { setVisible(true); hasRevealed.current = true; observer.disconnect(); }
    }, { rootMargin: "0px 0px -8% 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, className = "" }) {
  const { ref, visible } = useRevealOnce();
  return (
    <div ref={ref} className={`${className} transition-all duration-700 ease-apple motion-reduce:transition-none motion-reduce:transform-none ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
      {children}
    </div>
  );
}

function scrollToSection(id) {
  const element = document.getElementById(id);
  if (!element) return;
  element.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.replaceState(null, "", `#${id}`);
}

/* ═══ Scroll-spy — the rail's selected state follows the section in view ═══ */
function useScrollSpy() {
  const [active, setActive] = useState(SECTION_IDS[0]);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => { if (entry.isIntersecting) setActive(entry.target.id); }),
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 },
    );
    SECTION_IDS.forEach((id) => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);
  return active;
}

/* ═══ LEFT RAIL — careers.google.com chrome: icon above a tiny label, the
   selected item takes the light-blue pill. ═══ */
const RAIL_ITEMS = [
  { id: "overview", icon: Home, label: "Home" },
  { id: "why", icon: Compass, label: "Why us" },
  { id: "teams", icon: UsersRound, label: "Teams" },
  { id: "hiring", icon: ListChecks, label: "How we hire" },
  { id: "roles", icon: Briefcase, label: "Open roles" },
  { id: "contact", icon: Mail, label: "Contact" },
];

function CareersRail({ active }) {
  return (
    <nav aria-label="Careers sections" className="hidden w-[96px] shrink-0 border-r lg:block" style={{ borderColor: C.line }}>
      <div className="sticky top-14 flex h-[calc(100vh-4rem)] flex-col items-center gap-2 overflow-y-auto px-3.5 pt-6">
        {RAIL_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <a key={item.id} href={`#${item.id}`} aria-current={isActive ? "true" : undefined}
              onClick={(event) => { event.preventDefault(); scrollToSection(item.id); }}
              className={`flex w-[68px] flex-col items-center gap-1.5 rounded-[14px] px-1 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] ${
                isActive ? "bg-[#f5f5f7] text-[#0066cc]" : "text-[#1d1d1f] hover:text-[#1d1d1f]"
              }`}>
              <Icon className="h-[22px] w-[22px]" strokeWidth={1.8} aria-hidden="true" />
              <span className="text-[12px] leading-none">{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}

function MobileRail({ active }) {
  return (
    <nav aria-label="Careers sections" className="sticky top-14 z-40 border-b bg-white lg:hidden" style={{ borderColor: C.line }}>
      <div className="flex gap-1 overflow-x-auto px-3 py-2">
        {RAIL_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <a key={item.id} href={`#${item.id}`} aria-current={isActive ? "true" : undefined}
              onClick={(event) => { event.preventDefault(); scrollToSection(item.id); }}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-3 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] ${
                isActive ? "bg-[#f5f5f7] font-medium text-[#0066cc]" : "text-[#1d1d1f] hover:text-[#1d1d1f]"
              }`}>
              <Icon className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
              {item.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}

/* ═══ HERO SEARCH CARD — Google's overlapping card with the blue action.
   Honest adaptation: with no vacancies to search, the two fields compose a
   real introduction (area + email → the careers mailbox). ═══ */
function HeroCard({ idPrefix = "hero" }) {
  const [area, setArea] = useState(AREAS[0].title);
  const [email, setEmail] = useState("");

  const submit = (event) => {
    event.preventDefault();
    const subject = encodeURIComponent(`Careers — ${area}`);
    const body = encodeURIComponent(
      `Hello Visionary team,\n\nI am interested in ${area}.\n\n${email ? `Reply to: ${email}\n` : ""}\n— sent from the Visionary careers page`,
    );
    window.location.href = `mailto:${CAREERS_EMAIL}?subject=${subject}&body=${body}`;
  };

  const field = "h-12 w-full rounded-full bg-[#f5f5f7] px-5 text-[16px] text-[#1d1d1f] outline-none transition-colors placeholder:text-[#86868b] focus:bg-white focus:ring-2 focus:ring-[#0066cc]/30";

  return (
    <form onSubmit={submit} noValidate>
      <h1 className="max-w-[700px] text-[48px] font-normal leading-[1.06] tracking-[-0.045em] text-[#1d1d1f] sm:text-[64px] lg:text-[76px]">
        Search for <span className="accent-gradient">your place</span> at Visionary.
      </h1>
      <div className="mt-8 space-y-5">
        <div>
          <label htmlFor={`${idPrefix}-area`} className="mb-2 block text-[14px] text-[#6e6e73]">Interested in</label>
          <div className="relative">
            <select id={`${idPrefix}-area`} value={area} onChange={(event) => setArea(event.target.value)}
              className={`${field} appearance-none pr-12`}>
              {AREAS.map((a) => <option key={a.title} value={a.title}>{a.title}</option>)}
              <option value="Something else">Something else</option>
            </select>
            <ChevronIcon className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-[#6e6e73]" />
          </div>
        </div>
        <div>
          <label htmlFor={`${idPrefix}-email`} className="mb-2 block text-[14px] text-[#6e6e73]">Your email</label>
          <input id={`${idPrefix}-email`} type="email" autoComplete="email" value={email}
            onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com"
            className={field} />
        </div>
      </div>
      <div className="mt-8">
        <button type="submit"
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1d1d1f] px-8 font-medium tracking-[0.24px] text-[16px] text-white transition-all duration-200 hover:scale-[1.01] hover:bg-[#272729] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2 sm:w-auto">
          Introduce yourself <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}

export default function CareersPage() {
  const active = useScrollSpy();

  return (
    <div className="page-careers min-h-screen bg-white" style={{ fontFamily: fontStack }}>
      <LandingNav />
      <div className="lg:flex">
        <CareersRail active={active} />
        <div className="min-w-0 flex-1">
          <MobileRail active={active} />
          <main id="main">

            {/* HERO — full-bleed photograph with the overlapping white card
                (Google careers home). Desktop: card floats left over the photo.
                Mobile: card drops below the photo with the same overlap. */}
            <section id="overview" data-section="01-hero" className="scroll-mt-32">
              <div className="relative h-[380px] overflow-hidden sm:h-[480px] lg:h-[600px]">
                <img src={imgHero} alt="A Visionary team member at work"
                  loading="eager" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
                <div aria-hidden="true" className="absolute inset-0 hidden bg-gradient-to-r from-black/10 to-transparent lg:block" />
                {/* Desktop card */}
                <div className="absolute left-10 top-1/2 hidden w-[640px] -translate-y-1/2 rounded-[30px] bg-white p-8 shadow-[0_20px_50px_rgba(18,19,23,0.16)] lg:block xl:left-16 xl:w-[700px]">
                  <HeroCard idPrefix="hero-desktop" />
                </div>
              </div>
              {/* Mobile card */}
              <div className="relative z-10 mx-auto -mt-40 max-w-[680px] px-4 sm:px-6 lg:hidden">
                <div className="rounded-[30px] bg-white p-6 sm:p-8 shadow-[0_20px_50px_rgba(18,19,23,0.16)]">
                  <HeroCard idPrefix="hero-mobile" />
                </div>
              </div>
            </section>

            {/* PHOTO STRIP — the "life here" cards row under the hero */}
            <section aria-label="Life at Visionary" className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
              <Reveal>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
                  {STRIP.map((photo) => (
                    <div key={photo.alt} className="overflow-hidden rounded-xl">
                      <img src={photo.img} alt={photo.alt} loading="lazy" decoding="async"
                        className="aspect-[4/3] w-full object-cover transition-transform duration-500 hover:scale-[1.03] motion-reduce:transform-none" />
                    </div>
                  ))}
                </div>
              </Reveal>
            </section>

            {/* WHY US — centered header (Teams-page pattern) + three cards */}
            <section id="why" data-section="02-why" className="scroll-mt-32 px-4 sm:px-6 lg:px-10">
              <Reveal className="mx-auto max-w-[1240px]">
                <div className="mx-auto max-w-[760px] text-center">
                  <h2 className="text-[36px] font-normal leading-[1.12] tracking-[-0.03em] text-[#1d1d1f] sm:text-[48px]">
                    Why Visionary
                  </h2>
                  <p className="mx-auto mt-4 max-w-[620px] text-[16px] leading-[1.65] text-[#6e6e73] sm:text-[16px]">
                    We are a small team solving a real learning problem: helping someone turn confusion into understanding.
                  </p>
                </div>
                <div className="mt-12 rounded-[30px] bg-[#f5f5f7] p-4 sm:p-6 lg:p-10">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      { icon: Code2, title: "Meaningful problems", copy: "Work tied to helping learners get through difficult ideas and apply what they learn." },
                      { icon: Lightbulb, title: "Early-stage impact", copy: "Your decisions ship to real learners quickly, with visible effect." },
                      { icon: UsersRound, title: "Learning-centered", copy: "Product, design, and engineering work shaped by teaching and curriculum expertise." },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <article key={item.title} className="rounded-[20px] bg-white p-6 sm:p-7">
                          <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#f5f5f7] text-[#0066cc]">
                            <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                          </div>
                          <h3 className="mt-5 text-[19px] font-medium leading-[1.3] text-[#1d1d1f]">{item.title}</h3>
                          <p className="mt-2 text-[16px] leading-[1.65] text-[#6e6e73]">{item.copy}</p>
                        </article>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-10 flex justify-center">
                  <QuietLink href="#teams">
                    Meet the areas of work <ChevronIcon className="h-4 w-4" aria-hidden="true" />
                  </QuietLink>
                </div>
              </Reveal>
            </section>

            {/* TEAMS — the careers.google.com photo-card grid */}
            <section id="teams" data-section="03-teams" className="scroll-mt-32 px-4 sm:px-6 lg:px-10">
              <Reveal className="mx-auto max-w-[1240px]">
                <div className="mx-auto max-w-[760px] text-center">
                  <h2 className="text-[36px] font-normal leading-[1.12] tracking-[-0.03em] text-[#1d1d1f] sm:text-[48px]">
                    Teams
                  </h2>
                  <p className="mx-auto mt-4 max-w-[640px] text-[16px] leading-[1.65] text-[#6e6e73] sm:text-[16px]">
                    Together, we build a product that helps people keep what they learn. These are areas of work, not advertised vacancies. Current openings, if any, are listed below.
                  </p>
                </div>
                <div className="mt-12 rounded-[30px] bg-[#f5f5f7] p-4 sm:p-6 lg:p-10">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {AREAS.map((area) => (
                      <article key={area.title} className="group relative flex h-full flex-col overflow-hidden rounded-[20px] bg-white">
                        <img src={area.photo} alt={area.alt} loading="lazy" decoding="async" className="h-[180px] w-full object-cover" />
                        <div className="flex flex-1 flex-col p-7 pb-16">
                          <h3 className="text-[28px] font-normal leading-[1.3] text-[#1d1d1f]">{area.title}</h3>
                          <p className="mt-2 text-[16px] leading-[1.6] text-[#6e6e73]">{area.desc}</p>
                          <div className="mt-auto pt-6">
                            <a href={`mailto:${CAREERS_EMAIL}?subject=${encodeURIComponent(`Careers — ${area.title}`)}`}
                              className="inline-flex min-h-11 items-center gap-1.5 rounded-sm text-[17px] font-normal tracking-[0] text-[#0066cc] transition-colors duration-200 hover:text-[#0066cc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-4">
                              Introduce yourself
                              <ChevronIcon className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                        <Link to="/about" aria-label={`Learn more about ${area.title}`} className="absolute bottom-1.5 right-1.5 flex h-11 w-11 items-center justify-center">
                          <ArrowRight className="h-5 w-5 text-[#0066cc] transition-transform group-hover:translate-x-1 motion-reduce:transform-none" aria-hidden="true" />
                        </Link>
                      </article>
                    ))}
                  </div>
                </div>
                <div className="mt-10 flex justify-center">
                  <QuietLink to="/about">
                    The story behind the work <ChevronIcon className="h-4 w-4" aria-hidden="true" />
                  </QuietLink>
                </div>
              </Reveal>
            </section>
            {/* HOW WE HIRE — the story-page pattern: full-column photograph,
                centered caps eyebrow, huge centered headline, article body */}
            <section id="hiring" data-section="04-hiring" className="scroll-mt-32 bg-[#f5f5f7] px-4 sm:px-6 lg:px-10">
              <Reveal className="mx-auto max-w-[1240px]">
                <div className="overflow-hidden rounded-[20px]">
                  <img src={imgStory} alt="A student writing through a problem at her desk"
                    loading="lazy" decoding="async" className="aspect-[16/8] w-full object-cover" />
                </div>
                <div className="mx-auto max-w-[820px] text-center">
                  <p className="mt-14 apple-eyebrow text-[#6e6e73]">How we hire</p>
                  <h2 className="mt-5 text-[36px] font-normal leading-[1.1] tracking-[-0.035em] text-[#1d1d1f] sm:text-[48px]">
                    How to prepare for our hiring process
                  </h2>
                  <p className="mx-auto mt-6 max-w-[640px] text-[16px] leading-[1.65] text-[#6e6e73] sm:text-[17px]">
                    We are a small, early-stage team, so the process stays simple and honest at every step. Four steps, real people, no tricks.
                  </p>
                </div>
                <ol className="mx-auto mt-12 max-w-[760px] border-t border-[rgba(18,19,23,0.12)]">
                  {HIRING_STEPS.map((step) => (
                    <li key={step.n} className="grid grid-cols-[48px_1fr] gap-4 border-b border-[rgba(18,19,23,0.12)] py-6 sm:grid-cols-[64px_240px_1fr] sm:gap-6">
                      <span className="text-[14px] font-medium tabular-nums text-[#0066cc]">{step.n}</span>
                      <h3 className="text-[19px] font-normal leading-[1.35] text-[#1d1d1f]">{step.title}</h3>
                      <p className="col-start-2 text-[16px] leading-[1.65] text-[#6e6e73] sm:col-start-3">{step.copy}</p>
                    </li>
                  ))}
                </ol>
                <div className="mt-10 flex justify-center">
                  <QuietLink href={`mailto:${CAREERS_EMAIL}?subject=${encodeURIComponent("Hiring process question — Visionary")}`}>
                    Ask a hiring question <ChevronIcon className="h-4 w-4" aria-hidden="true" />
                  </QuietLink>
                </div>
              </Reveal>
            </section>

            {/* OPEN ROLES — the jobs hub, honestly empty */}
            <section id="roles" data-section="05-roles" className="scroll-mt-32 px-4 sm:px-6 lg:px-10">
              <Reveal className="mx-auto max-w-[1240px]">
                <div className="mx-auto max-w-[760px] text-center">
                  <h2 className="text-[36px] font-normal leading-[1.12] tracking-[-0.03em] text-[#1d1d1f] sm:text-[48px]">
                    Open roles
                  </h2>
                  <p className="mx-auto mt-4 max-w-[620px] text-[16px] leading-[1.65] text-[#6e6e73] sm:text-[16px]">
                    This page is the single source for openings. When a role opens, it will be listed here first.
                  </p>
                </div>
                <div className="mx-auto mt-12 max-w-[760px] rounded-[30px] bg-[#f5f5f7] p-4 sm:p-6">
                  <div className="rounded-[20px] bg-white p-8 sm:p-10">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#f5f5f7] text-[#0066cc]">
                      <Briefcase className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                    </div>
                    <h3 className="mt-6 text-[28px] font-normal leading-[1.3] text-[#1d1d1f]">No public roles listed right now.</h3>
                    <p className="mt-3 max-w-[560px] text-[16px] leading-[1.65] text-[#6e6e73]">
                      There are no public vacancies at the moment. You can still introduce yourself: the work you share helps us know who to reach when something opens. Sending an introduction is not an application to a listed vacancy and does not guarantee a response.
                    </p>
                    <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-2">
                      <a href={`mailto:${CAREERS_EMAIL}?subject=${encodeURIComponent("General introduction — Visionary")}`}
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-sm text-[17px] font-normal tracking-[0] text-[#0066cc] transition-colors duration-200 hover:text-[#0066cc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-4">
                        Introduce yourself by email
                        <ChevronIcon className="h-4 w-4" />
                      </a>
                      <a href="#hiring" onClick={(event) => { event.preventDefault(); scrollToSection("hiring"); }}
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-sm text-[17px] font-normal tracking-[0] text-[#0066cc] transition-colors duration-200 hover:text-[#0066cc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-4">
                        How our process works
                        <ChevronIcon className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </Reveal>
            </section>

            {/* CONTACT — fair process, accessibility, and how to reach us */}
            <section id="contact" data-section="06-contact" className="scroll-mt-32 px-4 sm:px-6 lg:px-10">
              <Reveal className="mx-auto grid max-w-[1240px] gap-8 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:items-start">
                <div>
                  <h2 className="text-[30px] font-normal leading-[1.2] tracking-[-0.03em] text-[#1d1d1f] sm:text-[38px]">
                    A fair process starts with clarity.
                  </h2>
                </div>
                <div className="space-y-4 text-[16px] leading-[1.65] text-[#6e6e73]">
                  <p>
                    We want career information and conversations with our team to be clear and respectful. This page does not describe a formal interview process or published accommodation program.
                  </p>
                  <p>
                    If you need an accessible format or an adjustment to a hiring conversation, email{" "}
                    <a className="relative after:absolute after:-inset-y-3 after:-inset-x-2 rounded-sm font-medium text-[#0066cc] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc]"
                      href={`mailto:${CAREERS_EMAIL}?subject=${encodeURIComponent("Accessibility request (Careers)")}`}>
                      careers@visionary.org.in
                    </a>{" "}
                    with the adjustment you need. Please avoid including medical records or other sensitive personal information; we cannot promise that a particular accommodation is available.
                  </p>
                  <p>
                    For accessibility information about the product, visit{" "}
                    <Link className="relative after:absolute after:-inset-y-3 after:-inset-x-2 rounded-sm font-medium text-[#0066cc] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc]" to="/accessibility">
                      Visionary accessibility
                    </Link>.
                  </p>
                </div>
              </Reveal>
            </section>

            {/* CLOSING CTA */}
            <section data-section="07-cta" className="bg-[#f5f5f7] px-4 text-center sm:px-6 lg:px-10">
              <Reveal className="mx-auto max-w-[840px]">
                <h2 className="text-[36px] font-normal leading-[1.12] tracking-[-0.03em] text-[#1d1d1f] sm:text-[48px]">
                  What you learn here should stay with you.
                </h2>
                <p className="mx-auto mt-5 max-w-[620px] text-[16px] leading-[1.65] text-[#6e6e73] sm:text-[17px]">
                  Understand deeply, build from what you know, carry the learning forward.
                </p>
                <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <a href={`mailto:${CAREERS_EMAIL}?subject=${encodeURIComponent("General introduction — Visionary")}`}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1d1d1f] px-8 font-medium tracking-[0.24px] text-[17px] text-white transition-all duration-200 hover:scale-[1.01] hover:bg-[#272729] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2 sm:w-auto">
                    Email the careers team <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                  <Link to="/about" className="inline-flex min-h-11 items-center gap-1.5 rounded-sm text-[17px] font-normal tracking-[0] text-[#0066cc] transition-colors duration-200 hover:text-[#0066cc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-4">
                    About Visionary
                    <ChevronIcon className="h-4 w-4" />
                  </Link>
                </div>
              </Reveal>
            </section>

          </main>
          <LandingFooter variant="quiet" />
        </div>
      </div>
    </div>
  );
}

