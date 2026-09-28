import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, HeartHandshake, ShieldCheck, UsersRound } from "lucide-react";

import LandingNav from "@/components/landing/LandingNav";
import Breadcrumb from "@/components/landing/Breadcrumb";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingFAQ from "@/components/landing/LandingFAQ";
import SpotIllustration from "@/components/landing/SpotIllustration";
import imgM1 from "@/assets/student-primary.webp";
import imgM2 from "@/assets/student-vocational.webp";
import imgM3 from "@/assets/organization-problem-3-1600w.webp";
import imgM4 from "@/assets/problem-practice.webp";
import imgM5 from "@/assets/teacher-problem-2.webp";
import imgM6 from "@/assets/student-secondary.webp";
import imgM7 from "@/assets/student-competitive.webp";
import imgM8 from "@/assets/problem-understanding.webp";
import imgM9 from "@/assets/organization-problem-2-1600w.webp";
import imgM10 from "@/assets/professional-problem-1-1600w.webp";
import imgM11 from "@/assets/student-higher.webp";
import imgM12 from "@/assets/organization-problem-1-1600w.webp";

/* ═══ Tokens — the shared Material dialect (#202124 ink, #1a73e8/#0b57d0
   actions, #e8eaed hairlines, pill buttons, rounded-2xl cards). ═══ */
const FONT = "'Google Sans Flex', 'Google Sans', system-ui, sans-serif";

/* Dual-row image marquee — the company-info-top pattern: rows circulating
   anticlockwise (top row drifts left, bottom row drifts right). Decorative. */
const MARQUEE_TOP = [
  { img: imgM1, alt: "" }, { img: imgM2, alt: "" }, { img: imgM3, alt: "" },
  { img: imgM4, alt: "" }, { img: imgM5, alt: "" }, { img: imgM6, alt: "" },
];
const MARQUEE_BOTTOM = [
  { img: imgM7, alt: "" }, { img: imgM8, alt: "" }, { img: imgM9, alt: "" },
  { img: imgM10, alt: "" }, { img: imgM11, alt: "" }, { img: imgM12, alt: "" },
];

function PhotoMarquee() {
  return (
    <div className="w-full overflow-hidden pb-2" aria-hidden="true">
      <style>{`
        @keyframes community-marquee-left { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes community-marquee-right { from { transform: translateX(-50%); } to { transform: translateX(0); } }
        .cm-left { animation: community-marquee-left 60s linear infinite !important; }
        .cm-right { animation: community-marquee-right 60s linear infinite !important; }
      `}</style>
      {[{ cls: "cm-left mb-5", photos: MARQUEE_TOP }, { cls: "cm-right", photos: MARQUEE_BOTTOM }].map((row) => (
        <div key={row.cls} className="overflow-hidden">
          <div className={`flex w-max ${row.cls}`}>
            {[...row.photos, ...row.photos].map((photo, i) => (
              <div key={row.cls + i} className="mr-4 shrink-0 overflow-hidden rounded-2xl">
                <img src={photo.img} alt="" loading="lazy" decoding="async" className="h-[190px] w-[300px] object-cover" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* Anchor chips — pill nav under the hero */
const ANCHORS = [
  { id: "learners", label: "For learners" },
  { id: "teachers", label: "With teachers" },
  { id: "families", label: "Families & organizations" },
  { id: "more", label: "More ways" },
  { id: "faq", label: "FAQ" },
];

/* Community areas — each holds real, shipped capability cards. */
const AREAS = [
  {
    id: "learners",
    icon: UsersRound,
    tint: "#e8f0fe",
    iconColor: "#0b57d0",
    title: "Communities for learners",
    copy: "Class-scoped spaces to discuss, ask, and share what you build — only the people in your class are inside, and nothing leaves it.",
    cards: [
      { title: "Class discussions", copy: "Ask and discuss with the people you learn with every day. The space is scoped to your class and kept separate from private work.", to: "/student", subject: "ask", tint: "#e8f0fe" },
      { title: "Share what you build", copy: "Post artifacts from Build and see classmates' work in the same space — application evidence, not noise.", to: "/student", subject: "build", tint: "#e9f5ef" },
    ],
  },
  {
    id: "teachers",
    icon: ShieldCheck,
    tint: "#e9f5ef",
    iconColor: "#137333",
    title: "Guided by teachers",
    copy: "Teachers keep the space safe with moderation built in — reports and rate limits are part of the space, not bolted on afterwards.",
    cards: [
      { title: "Moderation built in", copy: "Reports reach the teacher with rate limits, so misuse can't flood the space. The teacher reviews and acts.", to: "/teacher", subject: "shield", tint: "#e9f5ef" },
      { title: "Reviewed, then shared", copy: "Reported content is held for the teacher's review — nothing spreads through the class unreviewed.", to: "/teacher", subject: "flag", tint: "#f3edff" },
    ],
    flip: true,
  },
  {
    id: "families",
    icon: HeartHandshake,
    tint: "#fef3df",
    iconColor: "#a15c00",
    title: "For families and organizations",
    copy: "Community visibility follows consent — families and institutions see what their role allows, and never a learner's private work.",
    cards: [
      { title: "Consent-scoped visibility", copy: "Parent and organization views render only what the learner's consent allows — nothing more is rendered anywhere.", to: "/parent", subject: "lock", tint: "#fef3df" },
      { title: "Cohort spaces", copy: "Organization cohorts share institution-scoped spaces — insight across the group without exposing any individual.", to: "/organization", subject: "community", tint: "#fcebe8" },
    ],
  },
];

/* More ways to engage — real destinations. */
const MORE = [
  { title: "Get updates", copy: "Follow what is changing across the product, one honest update at a time.", to: "/updates", subject: "updates", tint: "#fef3df" },
  { title: "Explore how it works", copy: "See the loop the communities grow around — learn, ask, practise, build.", to: "/how-it-works", subject: "loop", tint: "#e8f0fe" },
  { title: "Get help", copy: "Clear answers when something is unclear, from setup to safety.", to: "/help", subject: "help", tint: "#e9f5ef" },
];

/* FAQs — real behavior, no invented policies. */
const FAQS = [
  { q: "Who can see a class community?", a: "Only the people in that class, plus the teacher who keeps it safe. Communities are scoped to the class — they are not public spaces and do not appear in organization-wide views." },
  { q: "What happens when someone reports a post?", a: "The report goes straight to the teacher, with rate limits so misuse can't flood the space. The teacher reviews the reported content and decides what happens next." },
  { q: "Can people outside my class join?", a: "No. Communities are scoped to the class on purpose. Wider institution-level spaces are part of the roadmap, but a class community stays a class community." },
  { q: "Does the community work in my language?", a: "The community follows the product's language journeys — English, Hindi, and Bengali — and a missing language is shown honestly rather than filled with machine-translated content." },
  { q: "Is community available today?", a: "Yes — class communities with teacher moderation, reporting, and rate limits are in the product now. Wider spaces and more languages are what we are building next." },
];

/* ═══ Motion — the shared reveal grammar ═══ */
function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") { setVisible(true); return undefined; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: "0px 0px -8% 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, className = "" }) {
  const { ref, visible } = useReveal();
  return <div ref={ref} className={`${className} transition duration-700 ease-out motion-reduce:transform-none motion-reduce:transition-none ${visible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}`}>{children}</div>;
}

function scrollToSection(id) {
  const element = document.getElementById(id);
  if (!element) return;
  element.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.replaceState(null, "", `#${id}`);
}

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT }}>
      <LandingNav />
      <main id="main">
        <Breadcrumb page="Community" />

        {/* HERO — the communities.google layout: centered statement first,
            then the full-width fanned card strip with paging */}
        <section className="relative overflow-hidden border-b border-[#e8eaed] bg-white" style={{ paddingTop: "calc(64px + 40px)", paddingBottom: "40px" }}>
          <div className="mx-auto max-w-[1240px] px-6 sm:px-8 lg:px-10">
            <p className="text-center text-[12px] font-medium uppercase tracking-[0.15em] text-[#5f6368]">Visionary communities</p>
            <div className="mx-auto mt-6 max-w-[1000px] text-center">
              <h1 className="text-[clamp(32px,5.5vw,60px)] font-normal leading-[1.02] tracking-[-0.045em] text-[#202124]">
                Communities &amp; programs for everyone learning together.
              </h1>
              <p className="mx-auto mt-7 max-w-[720px] text-[19px] leading-[1.55] text-[#3c4043] sm:text-[22px]">
                Class-scoped spaces where learners, teachers, and families grow together — kept safe by teachers, scoped to your class, and honest about what is available.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-4">
                <a href="#learners" onClick={(event) => { event.preventDefault(); scrollToSection("learners"); }}
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#0b57d0] px-7 text-[15px] font-medium text-white hover:bg-[#0842a0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] focus-visible:ring-offset-4">
                  Find your community
                </a>
                <Link to="/safety" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#dadce0] px-6 text-[15px] font-medium text-[#202124] transition-colors hover:bg-[#f1f3f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]">
                  Community safety <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <PhotoMarquee />
          </div>
        </section>

        {/* ANCHOR CHIPS — the reference's pill nav under the hero */}
        <nav aria-label="Community sections" className="sticky top-16 z-30 border-b border-[#e8eaed] bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-[1240px] items-center gap-2 overflow-x-auto px-4 py-3 sm:px-8 lg:justify-center lg:px-10">
            {ANCHORS.map((anchor) => (
              <a key={anchor.id} href={`#${anchor.id}`}
                onClick={(event) => { event.preventDefault(); scrollToSection(anchor.id); }}
                className="shrink-0 rounded-full border border-[#dadce0] bg-white px-4 py-2 text-[13px] font-medium text-[#3c4043] transition-colors hover:bg-[#f1f3f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]">
                {anchor.label}
              </a>
            ))}
          </div>
        </nav>
        {/*__AREAS__*/}

        {/* FIND A COMMUNITY — the reference's alternating label + program-card
            areas, with playful accent strokes beside the heading */}
        <section className="px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <Reveal className="relative mx-auto max-w-[720px] text-center">
            <svg aria-hidden="true" viewBox="0 0 120 60" className="absolute -right-16 -top-8 hidden h-14 w-28 lg:block">
              <path d="M8 50 C 40 12, 78 8, 112 22" fill="none" stroke="#1a73e8" strokeWidth="5" strokeLinecap="round" />
              <path d="M20 56 C 52 30, 88 26, 114 38" fill="none" stroke="#fbbc04" strokeWidth="5" strokeLinecap="round" />
            </svg>
            <h2 className="text-[36px] font-normal leading-[1.12] tracking-[-0.03em] text-[#202124] sm:text-[48px]">
              Find a community that's right for you
            </h2>
          </Reveal>
          <div className="mx-auto mt-16 max-w-[1240px] space-y-20">
            {AREAS.map((area) => (
              <div key={area.id} id={area.id} className="scroll-mt-36 grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
                <div className="lg:sticky lg:top-40 lg:self-start">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: area.tint, color: area.iconColor }}>
                    <area.icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-[28px] font-normal leading-[1.2] tracking-[-0.025em] text-[#202124]">{area.title}</h3>
                  <p className="mt-4 max-w-[380px] text-[16px] leading-[1.7] text-[#5f6368]">{area.copy}</p>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  {area.cards.map((card) => (
                    <Link key={card.title} to={card.to} className="group relative flex h-full flex-col overflow-hidden rounded-2xl g-card bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]">
                      <div className="flex h-[150px] items-center justify-center" style={{ backgroundColor: card.tint }}>
                        <SpotIllustration subject={card.subject} className="h-24 w-24" />
                      </div>
                      <div className="flex flex-1 flex-col p-6 pb-14">
                        <h4 className="text-[18px] font-medium leading-[1.35] text-[#202124]">{card.title}</h4>
                        <p className="mt-2 text-[14px] leading-[1.6] text-[#5f6368]">{card.copy}</p>
                      </div>
                      {/* google.com card curve — the card's own tint sweeps into the corner and its arrow floats in it with breath */}
                      <div aria-hidden="true" className="absolute bottom-0 right-0 h-[56px] w-[92px] rounded-tl-[20px]" style={{ backgroundColor: card.tint }} />
                      <div className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center"><ArrowRight className="h-5 w-5 text-[#1a73e8] transition-transform group-hover:translate-x-1 motion-reduce:transform-none" aria-hidden="true" /></div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* MORE WAYS TO ENGAGE */}
        <section id="more" className="scroll-mt-36 border-t border-[#e8eaed] bg-[#f8f9fa] px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <Reveal className="mx-auto max-w-[1240px]">
            <div className="mx-auto max-w-[720px] text-center">
              <h2 className="text-[36px] font-normal leading-[1.12] tracking-[-0.03em] text-[#202124] sm:text-[48px]">
                More ways to engage and learn
              </h2>
              <p className="mx-auto mt-4 max-w-[560px] text-[15px] leading-[1.65] text-[#5f6368] sm:text-[16px]">
                Keep your journey moving with the product and the people around it.
              </p>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {MORE.map((item) => (
                <Link key={item.title} to={item.to} className="group relative flex h-full flex-col overflow-hidden rounded-2xl g-card bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]">
                  <div className="flex h-[160px] items-center justify-center" style={{ backgroundColor: item.tint }}>
                    <SpotIllustration subject={item.subject} className="h-24 w-24" />
                  </div>
                  <div className="flex flex-1 flex-col p-6 pb-14">
                    <h3 className="text-[20px] font-medium leading-[1.3] text-[#202124]">{item.title}</h3>
                    <p className="mt-2 text-[14px] leading-[1.6] text-[#5f6368]">{item.copy}</p>
                  </div>
                  <div aria-hidden="true" className="absolute bottom-0 right-0 h-[56px] w-[92px] rounded-tl-[20px]" style={{ backgroundColor: item.tint }} />
                  <div className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center"><ArrowRight className="h-5 w-5 text-[#1a73e8] transition-transform group-hover:translate-x-1 motion-reduce:transform-none" aria-hidden="true" /></div>
                </Link>
              ))}
            </div>
          </Reveal>
        </section>

        {/* FAQ — the reference's accordion with circular controls */}
        <section id="faq" className="scroll-mt-36 px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <Reveal className="mx-auto max-w-[840px]">
            <h2 className="text-center text-[36px] font-normal leading-[1.12] tracking-[-0.03em] text-[#202124] sm:text-[48px]">
              Find answers to common questions
            </h2>
            <LandingFAQ faqs={FAQS} defaultOpen={0} />
          </Reveal>
        </section>

        {/* CLOSING CTA */}
        <section className="border-t border-[#e8eaed] px-6 py-20 text-center sm:px-8 lg:px-10 lg:py-28">
          <Reveal className="mx-auto max-w-[720px]">
            <h2 className="text-[36px] font-normal leading-[1.12] tracking-[-0.03em] text-[#202124] sm:text-[48px]">
              Bring your class together.
            </h2>
            <p className="mx-auto mt-5 max-w-[560px] text-[16px] leading-[1.65] text-[#5f6368] sm:text-[17px]">
              Communities grow around real learning. Start with the loop, and the space builds itself around it.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/register" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#0b57d0] px-8 text-[15px] font-medium text-white hover:bg-[#0842a0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] focus-visible:ring-offset-4">
                Get started
              </Link>
              <Link to="/safety" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#dadce0] px-6 text-[15px] font-medium text-[#202124] transition-colors hover:bg-[#f1f3f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]">
                Read community safety <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
        </section>

      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}

