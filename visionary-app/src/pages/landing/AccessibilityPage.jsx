import { Link } from "react-router-dom";
import {
  Accessibility as AccessibilityIcon, ArrowUpRight,
  Lock, Monitor, Smartphone, Tablet, UsersRound,
} from "lucide-react";

import LandingNav from "@/components/landing/LandingNav";
import Breadcrumb from "@/components/landing/Breadcrumb";
import LandingFooter from "@/components/landing/LandingFooter";
import ValuesStrip from "@/components/landing/ValuesStrip";
import SpotIllustration from "@/components/landing/SpotIllustration";

/* ═══ Tokens — the shared Material dialect (#121317 ink, #0b57d0/#4285F4
   actions, #dadce0 hairlines, pill buttons, rounded-2xl cards). ═══ */
const FONT = "'Google Sans Flex', 'Google Sans', 'DM Sans', system-ui, sans-serif";

function Reveal({ children, className = "", delay = 0 }) {
  return (
    <div
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-[opacity,transform] duration-700 ease-google motion-reduce:transition-none ${className}`}
    >
      {children}
    </div>
  );
}

function AnchorChip({ href, children }) {
  return (
    <a
      href={href}
      className="inline-flex min-h-9 items-center rounded-full border border-[#dadce0] bg-white px-4 text-[13px] font-medium text-[#5f6368] transition-colors hover:bg-[#f8f9fa] hover:text-[#121317] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
    >
      {children}
    </a>
  );
}

/* ═══ WHAT IS BUILT IN — the four interaction categories, each grounded in
   behavior the product actually has ═══ */
const CATEGORIES = [
  {
    id: "vision",
    eyebrow: "Seeing and reading",
    title: <>Make information easier <span className="text-[#0b57d0]">to read.</span></>,
    intro: "Visual presentation decides whether information is easy to understand or difficult to reach.",
    band: "bg-[#f8f9fa]",
    cards: [
      { title: "Clear structure", copy: "Information stays structured when people enlarge text, zoom the page, or change how they view it." },
      { title: "Readable contrast", copy: "Clear hierarchy, readable typography, sufficient contrast, and meaningful labels throughout." },
      { title: "Zoom & text scaling", copy: "Works with browser and operating-system features: zoom, text scaling, high contrast, and color preferences where available." },
      { title: "Reduced motion", copy: "Movement respects the reduced-motion setting you already chose on your device." },
    ],
  },
  {
    id: "voice",
    eyebrow: "Hearing and speaking",
    title: <>Use your voice <span className="text-[#0b57d0]">or your ears.</span></>,
    intro: "Voice can make interaction more natural for people who cannot, or prefer not to, rely on typing and reading alone.",
    band: "bg-white",
    cards: [
      { title: "Ask with your voice", copy: "Voice interaction provides another path into a question, explanation, or learning activity." },
      { title: "Hear information", copy: "Spoken output makes explanations easier to follow when reading is difficult or tiring." },
      { title: "Keep the conversation going", copy: "A conversational interface reduces the need to translate a thought into a rigid interface action." },
      { title: "Availability, honestly", copy: "Voice, audio, and caption availability can vary by device, browser, and language. Visionary identifies these options where they exist." },
    ],
  },
  {
    id: "motor",
    eyebrow: "Motor and navigation",
    title: <>Operated the way <span className="text-[#0b57d0]">you already do.</span></>,
    intro: "An accessible interface is also an interface that can be operated predictably.",
    band: "bg-[#f8f9fa]",
    cards: [
      { title: "Keyboard navigation", copy: "The experience supports keyboard interaction with a logical navigation order." },
      { title: "Visible focus", copy: "Clear focus states show where you are, what changed, and what you can do next." },
      { title: "Usable touch targets", copy: "Controls are sized and spaced for real hands on real screens." },
      { title: "Your device's controls", copy: "Works with the input methods and assistive features built into a person's device." },
    ],
  },
  {
    id: "language",
    eyebrow: "Language and understanding",
    title: <>The same idea, <span className="text-[#0b57d0]">more than one way in.</span></>,
    intro: "Understanding should not depend on one language, one format, or one interaction style.",
    band: "bg-white",
    cards: [
      { title: "Three languages today", copy: "Language journeys run in English, Hindi, and Bengali, with more on the roadmap." },
      { title: "Plain language", copy: "The interface favors clear, understandable wording over jargon." },
      { title: "Human-reviewed answers", copy: "One tap on any answer flags it for human review, usually within 24 hours." },
      { title: "Choice of mode", copy: "Read, hear, speak, or navigate: accessibility increases choice instead of forcing one style on everyone." },
    ],
  },
];

/* ═══ RESOURCES — "Get started at your own pace" link rows ═══ */
const RESOURCES = [
  { to: "/help", label: "Help center", desc: "Guides for setup, classrooms, and every persona." },
  { to: "/download", label: "Download Visionary", desc: "Web, desktop, and mobile: the platforms sync covers." },
  { to: "/security", label: "Security and sync", desc: "How the Sync Encrypted ID protects what moves between devices." },
  { to: "/privacy", label: "Privacy policy", desc: "What information is handled, why, and the choices you have." },
];

/* ═══ COMMITMENT — the reference's three-column promise ═══ */
const COMMITMENT = [
  {
    Icon: AccessibilityIcon,
    title: "Built in, not bolted on",
    copy: "Accessibility is part of product decisions, interface design, engineering, testing, and research, not something added after the product is finished.",
  },
  {
    Icon: UsersRound,
    title: "Tested with people",
    copy: "Accessibility becomes better when the people experiencing barriers have a meaningful role in identifying and solving them.",
  },
  {
    Icon: Lock,
    title: "Honest about limits",
    copy: "We avoid accessibility claims the product cannot support, and we say plainly what we are still building.",
  },
];

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT }}>
      <LandingNav />
      <main id="main">
        <Breadcrumb page="Accessibility" />

        {/* HERO — the reference's centered statement + anchor chips */}
        <section className="px-6 pb-12 pt-10 text-center sm:px-8 lg:px-10 lg:pb-14 lg:pt-16">
          <Reveal className="mx-auto max-w-[900px]">
            <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-[#5f6368]">Accessibility</p>
            <h1 className="mt-4 text-[48px] font-normal leading-[1.06] tracking-[-0.045em] sm:text-[64px] lg:text-[76px] text-[#121317]">
              Help every learner learn <span className="accent-gradient">how they learn best.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-[680px] text-[17px] leading-[1.6] text-[#5f6368] sm:text-[18px]">
              One product, many ways in: vision, hearing, movement, thinking, and language on the device you have.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                to="/register"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#0b57d2] px-6 text-[14px] font-medium text-white transition-all hover:bg-[#0a4cb8] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
              >
                Explore what's built in
              </Link>
            </div>
            <nav aria-label="On this page" className="mt-7 flex flex-wrap justify-center gap-2">
              <AnchorChip href="#vision">Seeing and reading</AnchorChip>
              <AnchorChip href="#voice">Hearing and speaking</AnchorChip>
              <AnchorChip href="#motor">Motor and navigation</AnchorChip>
              <AnchorChip href="#language">Language and understanding</AnchorChip>
              <AnchorChip href="#sync">Sync &amp; devices</AnchorChip>
            </nav>
          </Reveal>
        </section>

        {/* STATEMENT BAND — text + illustration (the 2-up statement pattern) */}
        <section className="border-y border-[#dadce0] px-6 py-24 sm:px-8 lg:px-10 lg:py-32">
          <Reveal className="mx-auto grid max-w-[1240px] items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="max-w-[560px]">
              <p className="text-[26px] font-normal leading-[1.25] tracking-[-0.025em] text-[#121317] sm:text-[36px]">
                The goal is not to make everyone use Visionary the same way.{" "}
                <span className="text-[#0b57d0]">It is to give more people a way in.</span>
              </p>
              <p className="mt-6 max-w-[560px] text-[16px] leading-[1.7] text-[#5f6368]">
                Accessibility shapes the product experience. It changes how information appears, how people interact with Visionary, and how easily someone can keep going when the usual path does not work.
              </p>
            </div>
            <div className="flex justify-center lg:justify-end">
              <SpotIllustration subject="accessibility" className="h-[220px] w-[220px]" title="The universal accessibility symbol inside a blue ring" />
            </div>
          </Reveal>
        </section>

        {/* FEATURE CATEGORIES — the reference's section + card-grid rhythm */}
        {CATEGORIES.map((category) => (
          <section
            key={category.id}
            id={category.id}
            aria-labelledby={`${category.id}-title`}
            className={`scroll-mt-28 px-6 py-16 sm:px-8 lg:px-10 lg:py-24 ${category.band}`}
          >
            <Reveal className="mx-auto max-w-[1240px]">
              <div className="max-w-[720px]">
                <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#5f6368]">{category.eyebrow}</p>
                <h2 id={`${category.id}-title`} className="mt-3 text-[30px] font-normal leading-[1.15] tracking-[-0.03em] text-[#121317] sm:text-[40px]">
                  {category.title}
                </h2>
                <p className="mt-4 max-w-[620px] text-[15px] leading-[1.75] text-[#5f6368] sm:text-[16px]">{category.intro}</p>
              </div>
              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {category.cards.map(({ title, copy }) => (
                  <article key={title} className={`flex min-h-[190px] flex-col rounded-2xl g-card ${category.band === "bg-white" ? "" : "bg-white"} p-6`}>
                    <h3 className="text-[16px] font-medium leading-[1.4] text-[#121317]">{title}</h3>
                    <p className="mt-2 text-[14px] leading-[1.65] text-[#5f6368]">{copy}</p>
                  </article>
                ))}
              </div>
            </Reveal>
          </section>
        ))}

        {/* SYNC SHOWPIECE — one person, every device, end to end encrypted */}
        <section id="sync" aria-labelledby="sync-title" className="scroll-mt-28 px-6 py-16 sm:px-8 lg:px-10 lg:py-24">
          <Reveal className="mx-auto max-w-[1240px]">
            <div className="grid items-center gap-10 rounded-[28px] bg-[#e8f0fe] p-8 sm:p-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
              <div>
                <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#5f6368]">Sync &amp; devices</p>
                <h2 id="sync-title" className="mt-3 text-[30px] font-normal leading-[1.15] tracking-[-0.03em] text-[#121317] sm:text-[42px]">
                  One person. Every device. <span className="text-[#0b57d0]">Anywhere.</span>
                </h2>
                <p className="mt-5 max-w-[560px] text-[15px] leading-[1.75] text-[#3c4043] sm:text-[16px]">
                  Sign in with your Sync Encrypted ID and your learning follows you, end to end encrypted. Your questions, progress, and memory arrive as they were, and only you can open them. Start on a school laptop, continue on a phone, finish on a home desktop.
                </p>
                <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#121317]/20 bg-white/80 px-4 py-2 text-[13px] font-medium text-[#121317]">
                  <Lock className="h-4 w-4 text-[#188038]" aria-hidden="true" />
                  End to end encrypted. The key stays with you
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    to="/security"
                    className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#0b57d2] px-6 text-[14px] font-medium text-white transition-all hover:bg-[#0a4cb8] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
                  >
                    How sync works
                  </Link>
                  <Link
                    to="/dashboard/settings"
                    className="inline-flex min-h-11 items-center rounded-full border border-[#121317]/30 px-6 text-[14px] font-medium text-[#121317] transition-colors hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                  >
                    Review your devices
                  </Link>
                </div>
              </div>
              <div>
                <div className="relative flex items-center justify-center gap-4 sm:gap-6">
                  <span aria-hidden="true" className="absolute left-8 right-8 top-1/2 hidden -translate-y-1/2 border-t-2 border-dashed border-[#a8c7fa] sm:block" />
                  {[
                    { Icon: Monitor, label: "Computer" },
                    { Icon: Tablet, label: "Tablet" },
                    { Icon: Smartphone, label: "Phone" },
                  ].map(({ Icon, label }) => (
                    <div key={label} className="relative z-10 flex w-28 flex-col items-center gap-3 rounded-2xl g-card p-4 text-center shadow-[0_1px_3px_rgba(60,64,67,0.1)] sm:w-32">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e8f0fe] text-[#0b57d0]">
                        <Icon className="h-6 w-6" strokeWidth={1.7} aria-hidden="true" />
                      </span>
                      <span className="text-[13px] font-medium text-[#121317]">{label}</span>
                      <span className="flex items-center gap-1 text-[12px] font-medium text-[#188038]">
                        <Lock className="h-3 w-3" aria-hidden="true" /> Encrypted
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-6 text-center text-[13px] leading-[1.6] text-[#5f6368]">
                  One Sync Encrypted ID. The encryption stays with your account, not with the device.
                </p>
              </div>
            </div>
          </Reveal>
        </section>

        {/* GET STARTED — the reference's own-pace resource split */}
        <section id="resources" aria-labelledby="resources-title" className="scroll-mt-28 border-t border-[#dadce0] px-6 py-16 sm:px-8 lg:px-10 lg:py-24">
          <Reveal className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#5f6368]">Resources</p>
              <h2 id="resources-title" className="mt-3 text-[30px] font-normal leading-[1.15] tracking-[-0.03em] text-[#121317] sm:text-[40px]">
                Start at your own pace.
              </h2>
              <p className="mt-4 max-w-[420px] text-[15px] leading-[1.75] text-[#5f6368]">
                Move at your own speed. Every resource below is free to read, and the team answers every barrier report.
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl g-card">
              {RESOURCES.map(({ to, label, desc }, i) => (
                <Link
                  key={to}
                  to={to}
                  className={`group flex items-center gap-4 bg-white px-6 py-5 transition-colors hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-inset ${i < RESOURCES.length - 1 ? "border-b border-[#dadce0]" : ""}`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-medium text-[#121317]">{label}</span>
                    <span className="mt-0.5 block text-[14px] leading-[1.6] text-[#5f6368]">{desc}</span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-[#9aa0a6] transition-colors group-hover:text-[#0b57d0]" aria-hidden="true" />
                </Link>
              ))}
              <a
                href="mailto:accessibility@visionary.org.in"
                className="group flex items-center gap-4 border-t border-[#dadce0] bg-[#f8f9fa] px-6 py-5 transition-colors hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-inset"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-medium text-[#121317]">Tell us what is missing</span>
                  <span className="mt-0.5 block text-[14px] leading-[1.6] text-[#5f6368]">Describe the task and the barrier: accessibility@visionary.org.in</span>
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-[#9aa0a6] transition-colors group-hover:text-[#0b57d0]" aria-hidden="true" />
              </a>
            </div>
          </Reveal>
        </section>

        {/* COMMITMENT — the reference's three-column promise */}
        <section aria-labelledby="commitment-title" className="border-t border-[#dadce0] px-6 py-16 sm:px-8 lg:px-10 lg:py-24">
          <Reveal className="mx-auto max-w-[1240px]">
            <div className="mx-auto max-w-[720px] text-center">
              <h2 id="commitment-title" className="text-[30px] font-normal leading-[1.15] tracking-[-0.03em] text-[#121317] sm:text-[42px]">
                Our commitment.
              </h2>
              <p className="mx-auto mt-4 max-w-[560px] text-[15px] leading-[1.75] text-[#5f6368] sm:text-[16px]">
                Accessibility is not a checkbox that gets completed once. We design, build, and test Visionary with accessibility as part of the work.
              </p>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {COMMITMENT.map(({ Icon, title, copy }) => (
                <article key={title} className="flex min-h-[220px] flex-col rounded-2xl g-card p-6 sm:p-7">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e8f0fe] text-[#0b57d0]">
                    <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-[17px] font-medium leading-[1.4] text-[#121317]">{title}</h3>
                  <p className="mt-2 text-[14px] leading-[1.7] text-[#5f6368]">{copy}</p>
                </article>
              ))}
            </div>
          </Reveal>
        </section>

        {/* CLOSING — the reference's blue DNA band */}
        <section aria-labelledby="closing-title" className="px-6 pb-24 sm:px-8 lg:px-10">
          <Reveal className="mx-auto max-w-[1240px]">
            <div className="relative overflow-hidden rounded-[28px] bg-[#e8f0fe] px-8 py-16 text-center sm:px-12 lg:py-20">
              <h2 id="closing-title" className="mx-auto max-w-[720px] text-[clamp(28px,3.6vw,46px)] font-normal leading-[1.1] tracking-[-0.03em] text-[#121317]">
                Accessibility is part of <span className="text-[#0b57d0]">our design DNA.</span>
              </h2>
              <p className="mx-auto mt-5 max-w-[560px] text-[15px] leading-[1.7] text-[#3c4043] sm:text-[16px]">
                Visionary grows from the idea that people learn differently. Accessibility makes that idea real, and your feedback builds it.
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <a
                  href="mailto:accessibility@visionary.org.in"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-6 text-[14px] font-medium text-[#0b57d2] shadow-[0_1px_3px_rgba(60,64,67,0.2)] transition-all hover:shadow-[0_2px_8px_rgba(32,33,36,0.16)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
                >
                  Email the accessibility team <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
                <Link
                  to="/how-it-works"
                  className="inline-flex min-h-11 items-center rounded-full border border-[#121317]/30 px-6 text-[14px] font-medium text-[#121317] transition-colors hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                >
                  Explore the product
                </Link>
              </div>
            </div>
          </Reveal>
        </section>

      </main>
      <ValuesStrip current="/accessibility" />
      <LandingFooter variant="quiet" />
    </div>
  );
}
