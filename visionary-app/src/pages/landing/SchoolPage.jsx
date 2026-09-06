import React, { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  CircleHelp, Search, ArrowLeft, ArrowRight, Mail,
  Sparkles, UserRound, BookOpen, Users, HeartHandshake,
  CreditCard, Monitor, ShieldCheck,
} from "lucide-react";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

/* ═══ TOKENS (one system) ═══ */
const COLORS = {
  ink: "#121317", surface: "#F5F6F8", blue: "#4285F4", grey: "#5f6368",
  lightGrey: "#9AA0A6", mist: "#dadce0", chipBg: "#D2E3FC", white: "#ffffff",
};
const FONT_FAMILY = "'Google Sans Flex', 'Google Sans', system-ui, sans-serif";

/* ═══ CONTROLLERS ═══ */
function useRevealOnce(rootMargin = "0px 0px -10% 0px") {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const hasRevealed = useRef(false);
  React.useEffect(() => {
    const node = ref.current;
    if (hasRevealed.current) { setVisible(true); return undefined; }
    if (!node) { setVisible(true); return undefined; }
    if (typeof IntersectionObserver === "undefined") { setVisible(true); hasRevealed.current = true; return undefined; }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasRevealed.current) { setVisible(true); hasRevealed.current = true; observer.disconnect(); }
      },
      { threshold: 0, rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);
  return { ref, visible };
}
const FadeReveal = React.memo(function FadeReveal({ visible, children, className = "" }) {
  return (
    <div className={`transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"} ${className}`}>
      {children}
    </div>
  );
});

/* ═══ KNOWLEDGE BASE — 8 topics × 3 answers, all links real ═══ */
const HELP_TOPICS = [
  {
    id: "start", Icon: Sparkles, label: "Getting started", line: "Create an account, ask your first question, set your language.",
    keys: "start begin signup register first question onboarding",
    articles: [
      { q: "How do I create an account?", a: "Choose Get started, enter your email, and pick your role. Free forever — no card required.", to: "/register" },
      { q: "How do I ask my first question?", a: "Type or speak it on any page. Visionary answers with a visual, a conversation, and a next step.", to: "/how-it-works" },
      { q: "How do I change my language?", a: "Use the language menu in the top bar. Your journey stays connected across languages." },
    ],
  },
  {
    id: "account", Icon: UserRound, label: "Account & profile", line: "Sign in, passwords, email, and your data.",
    keys: "password login sign in email profile delete account data",
    articles: [
      { q: "I forgot my password.", a: "Use the reset link and we'll email you a secure way back in.", to: "/forgot-password" },
      { q: "How do I delete my data?", a: "One screen: see everything we remember, export it, or delete it. Instant, no email needed.", to: "/privacy" },
      { q: "How do I sign in on a new device?", a: "Sign in with the same email — your journey syncs automatically.", to: "/download" },
    ],
  },
  {
    id: "learning", Icon: BookOpen, label: "Learning & practice", line: "Lessons, visual explanations, practise mode, progress.",
    keys: "lesson learn practise practice progress memory continuity understand",
    articles: [
      { q: "What is Practise mode?", a: "Visionary gives you a problem, sees where you stick, and hints without giving it away.", to: "/how-it-works" },
      { q: "What does Visionary remember?", a: "What you understood, where you struggled, and what you built — never private conversations.", to: "/privacy" },
      { q: "How does continuity work?", a: "Every lesson builds on the last — across devices, classes, and years.", to: "/student" },
    ],
  },
  {
    id: "teaching", Icon: Users, label: "Teaching & classes", line: "Create classes, follow learners, adapt lessons.",
    keys: "teacher class classroom learner lesson adapt",
    articles: [
      { q: "How do I see who understood?", a: "Your class view shows clarity per learner and per concept, updated as they work.", to: "/teacher" },
      { q: "Can I adapt a lesson mid-class?", a: "Yes — ask Visionary for another explanation level, example, or visual anytime.", to: "/teacher" },
    ],
  },
  {
    id: "family", Icon: HeartHandshake, label: "Family & privacy", line: "Parent views, the Family plan, and what stays private.",
    keys: "parent child family plan privacy members",
    articles: [
      { q: "What can parents see?", a: "Progress and support signals — never private conversations.", to: "/parent" },
      { q: "How does the Family plan work?", a: "Up to 6 members, each with completely private memory, one weekly digest.", to: "/pricing" },
    ],
  },
  {
    id: "billing", Icon: CreditCard, label: "Billing & plans", line: "Start, Personal, Family — upgrades, downgrades, cancellation.",
    keys: "price plan billing cancel subscription payment discount invoice",
    articles: [
      { q: "Can I start free?", a: "Yes — Start is free forever: 20 questions a day and core visual explanations.", to: "/pricing" },
      { q: "How do I cancel or change my plan?", a: "Anytime. Upgrades apply immediately; downgrades at the next cycle. Nothing resets.", to: "/pricing" },
      { q: "Do you offer education discounts?", a: "Students and teachers with a valid institutional email get Personal at a discount.", to: "/pricing" },
    ],
  },
  {
    id: "devices", Icon: Monitor, label: "Apps & devices", line: "Web, desktop, and mobile installs, sync, requirements.",
    keys: "download install app windows mac linux ios android sync device requirements",
    articles: [
      { q: "Which devices are supported?", a: "Web, Windows, Mac, Linux, iOS, and Android — one account, all of them.", to: "/download" },
      { q: "Does my journey sync across devices?", a: "Automatically and privately, on every signed-in device.", to: "/download" },
      { q: "What are the system requirements?", a: "Any modern browser for web; current OS versions for the apps.", to: "/download" },
    ],
  },
  {
    id: "safety", Icon: ShieldCheck, label: "Safety & reporting", line: "Report content, family controls, and how we review.",
    keys: "safety report harmful urgent block family controls",
    articles: [
      { q: "How do I report content?", a: "Tap report on any answer. A human reviews every report.", mailto: "safety@visionary.org.in" },
      { q: "Are answers age-appropriate?", a: "Yes — guidance follows the learner's age by default, with family controls available.", to: "/safety" },
      { q: "How fast are urgent reports handled?", a: "Within 24 hours, every time.", mailto: "safety@visionary.org.in" },
    ],
  },
];

const SUGGESTIONS = ["password", "install", "cancel", "privacy", "report"];

/* ═══ Answer accordion row ═══ */
function AnswerItem({ a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b py-6" style={{ borderColor: `${COLORS.ink}14` }}>
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-6 rounded-[8px] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]">
        <span className="font-normal tracking-[0] leading-[1.3] text-[17.5px]" style={{ color: COLORS.ink }}>{a.q}</span>
        <ArrowRight className={`h-4 w-4 shrink-0 transition-transform duration-300 ${open ? "rotate-90" : ""}`} strokeWidth={1.8} style={{ color: COLORS.lightGrey }} />
      </button>
      <div className={`grid transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <p className="pt-4 font-normal tracking-[0] leading-[1.6] text-[15px]" style={{ color: COLORS.grey }}>{a.a}</p>
          {a.to && (
            <Link to={a.to} className="mt-3 inline-flex items-center gap-1 font-normal tracking-[0] text-[14px]" style={{ color: COLORS.blue }}>
              Open the page <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
            </Link>
          )}
          {a.mailto && (
            <a href={`mailto:${a.mailto}`} className="mt-3 inline-flex items-center gap-1 font-normal tracking-[0] text-[14px]" style={{ color: COLORS.blue }}>
              Email us <Mail className="h-4 w-4" strokeWidth={1.8} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══ PAGE ══ */
export default function SchoolPage() {
  const { ref, visible } = useRevealOnce();
  const [q, setQ] = useState("");
  const [topicId, setTopicId] = useState(null);
  const query = q.trim().toLowerCase();

  const topics = useMemo(
    () => HELP_TOPICS.filter((t) => !query || `${t.label} ${t.line} ${t.keys}`.toLowerCase().includes(query)),
    [query]
  );
  const activeTopic = HELP_TOPICS.find((t) => t.id === topicId) || null;
  const answers = useMemo(() => {
    const pool = activeTopic
      ? activeTopic.articles
      : HELP_TOPICS.flatMap((t) => t.articles.map((a) => ({ ...a, topicLabel: t.label })));
    return pool.filter((a) => !query || `${a.q} ${a.a}`.toLowerCase().includes(query));
  }, [activeTopic, query]);

  const noResults = query.length > 0 && topics.length === 0 && answers.length === 0;

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
      <main id="main">
        {/* ═══ HERO — mark + heading + search (Google Help pattern) ═══ */}
        <section ref={ref} className="relative px-6 pb-16 pt-40 lg:pt-48" style={{ backgroundColor: COLORS.white }}>
          <FadeReveal visible={visible}>
            <div className="mx-auto flex flex-col items-center text-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-[24px] border bg-white" style={{ borderColor: COLORS.mist, color: COLORS.blue }}>
                <CircleHelp className="h-9 w-9" strokeWidth={1.8} />
              </span>
              <h1 className="mt-8 font-medium tracking-[0] leading-[1.05] text-[clamp(36px,5vw,72px)]" style={{ color: COLORS.ink }}>
                How can we <span style={{ color: COLORS.blue }}>help</span> you?
              </h1>

              {/* Search bar */}
              <div className="mx-auto mt-10 flex h-14 w-full max-w-[760px] items-center gap-3 rounded-full border bg-white px-6 transition-colors focus-within:border-[#4285F4]" style={{ borderColor: COLORS.mist }}>
                <Search className="h-5 w-5 shrink-0" strokeWidth={1.8} style={{ color: COLORS.lightGrey }} />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  type="search"
                  placeholder="Describe your issue"
                  aria-label="Search help articles"
                  className="h-full w-full bg-transparent font-normal tracking-[0] text-[15px] outline-none"
                  style={{ color: COLORS.ink }}
                />
              </div>

              {/* Suggestion chips */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => { setQ(s); setTopicId(null); }}
                    className="rounded-full border bg-white px-5 py-2 font-normal tracking-[0.24px] text-[13px] transition-colors hover:border-[#4285F4]"
                    style={{ borderColor: COLORS.mist, color: COLORS.grey }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </FadeReveal>
        </section>

        {/* ═══ BODY — topics or answers ═══ */}
        <section className="relative bg-white px-6 py-24 lg:py-32">
          {activeTopic ? (
            <div className="mx-auto w-full max-w-[900px]">
              <button type="button" onClick={() => setTopicId(null)}
                className="inline-flex items-center gap-2 font-normal tracking-[0] text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-[8px]"
                style={{ color: COLORS.blue }}>
                <ArrowLeft className="h-4 w-4" strokeWidth={1.8} /> All topics
              </button>
              <div className="mt-8 flex items-center gap-5">
                <span className="flex h-14 w-14 items-center justify-center rounded-[16px] border bg-white" style={{ borderColor: COLORS.mist, color: COLORS.blue }}>
                  <activeTopic.Icon className="h-6 w-6" strokeWidth={1.8} />
                </span>
                <div>
                  <h2 className="font-medium tracking-[0] leading-[1.15] text-[clamp(22px,2.4vw,32px)]" style={{ color: COLORS.ink }}>{activeTopic.label}</h2>
                  <p className="mt-1 font-normal tracking-[0] text-[14px]" style={{ color: COLORS.grey }}>{activeTopic.line}</p>
                </div>
              </div>
              <div className="mt-10">
                {answers.length > 0 ? (
                  answers.map((a) => <AnswerItem key={a.q} a={a} />)
                ) : (
                  <p className="font-normal tracking-[0] leading-[1.6] text-[15px]" style={{ color: COLORS.grey }}>
                    No answers match here yet — email us below and we'll answer within one business day.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-[1240px]">
              {/* Topic grid */}
              {topics.length > 0 && (
                <>
                  <p className="text-center font-normal uppercase tracking-[0.43px] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>Browse by topic</p>
                  <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {topics.map((t) => (
                      <button key={t.id} type="button" onClick={() => { setTopicId(t.id); setQ(""); }}
                        className="group flex flex-col items-start rounded-[24px] border bg-white p-7 text-left transition-all hover:border-[#4285F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                        style={{ borderColor: COLORS.mist }}>
                        <span className="flex h-14 w-14 items-center justify-center rounded-[16px] border bg-white" style={{ borderColor: COLORS.mist, color: COLORS.blue }}>
                          <t.Icon className="h-6 w-6" strokeWidth={1.8} />
                        </span>
                        <p className="mt-6 font-medium tracking-[0] text-[20px]" style={{ color: COLORS.ink }}>{t.label}</p>
                        <p className="mt-2 font-normal tracking-[0] leading-[1.6] text-[14px]" style={{ color: COLORS.grey }}>{t.line}</p>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Flat matching answers while searching */}
              {query && answers.length > 0 && (
                <div className="mx-auto mt-16 w-full max-w-[900px]">
                  <p className="text-center font-normal uppercase tracking-[0.43px] leading-[14px] text-[12px]" style={{ color: COLORS.grey }}>Matching answers</p>
                  <div className="mt-6">
                    {answers.map((a) => <AnswerItem key={`${a.topicLabel}-${a.q}`} a={a} />)}
                  </div>
                </div>
              )}

              {/* No results */}
              {noResults && (
                <div className="mx-auto max-w-[760px] rounded-[24px] border bg-white p-10 text-center" style={{ borderColor: COLORS.mist }}>
                  <p className="font-medium tracking-[0] text-[clamp(20px,2vw,26px)]" style={{ color: COLORS.ink }}>Nothing matches "{q}".</p>
                  <p className="mt-3 font-normal tracking-[0] leading-[1.6] text-[15px]" style={{ color: COLORS.grey }}>
                    Tell us what you need — a human answers within one business day.
                  </p>
                  <a href="mailto:hello@visionary.org.in" className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-full px-8 font-medium tracking-[0.24px] text-[15px] text-white transition-all hover:opacity-90" style={{ backgroundColor: COLORS.blue }}>
                    <Mail className="h-4 w-4" strokeWidth={1.8} /> Email us
                  </a>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ═══ CONTACT BAND (Apple support pattern) ═══ */}
        <section className="relative px-6 py-24" style={{ backgroundColor: COLORS.surface }}>
          <div className="mx-auto max-w-[760px] rounded-[24px] border bg-white p-10 text-center" style={{ borderColor: COLORS.mist }}>
            <p className="font-medium tracking-[0] leading-[1.15] text-[clamp(22px,2.4vw,32px)]" style={{ color: COLORS.ink }}>Still stuck?</p>
            <p className="mx-auto mt-3 max-w-[560px] font-normal tracking-[0] leading-[1.6] text-[15px]" style={{ color: COLORS.grey }}>
              We answer within one business day. Urgent safety reports are handled within 24 hours.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a href="mailto:hello@visionary.org.in" className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-8 font-medium tracking-[0.24px] text-[15px] text-white transition-all hover:opacity-90" style={{ backgroundColor: COLORS.blue }}>
                <Mail className="h-4 w-4" strokeWidth={1.8} /> hello@visionary.org.in
              </a>
              <a href="mailto:safety@visionary.org.in" className="inline-flex h-12 items-center justify-center gap-2 rounded-full border px-8 font-medium tracking-[0.24px] text-[15px] transition-colors hover:bg-[#121317]/5" style={{ borderColor: `${COLORS.ink}4D`, color: COLORS.ink }}>
                <ShieldCheck className="h-4 w-4" strokeWidth={1.8} /> Report a safety issue
              </a>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}