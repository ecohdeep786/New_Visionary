import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen, Check, CheckCircle2,
  Languages, Sparkles, UsersRound,
} from "lucide-react";

import LandingNav from "@/components/landing/LandingNav";
import Breadcrumb from "@/components/landing/Breadcrumb";
import LandingFooter from "@/components/landing/LandingFooter";
import SpotIllustration from "@/components/landing/SpotIllustration";
import { ChevronIcon } from "@/components/landing/persona/PersonaSections";
import { fontStack } from "@/components/landing/system/tokens";

/* ═══ Tokens — the shared public dialect (#1d1d1f ink pills, #0066cc quiet
   links, #f5f5f7 trays, white rounded-[20px] cards, whisper hairlines). ═══ */

/* ═══ Motion — reveal on first scroll into view (shared reveal grammar,
   motion-reduce safe). ═══ */
function Reveal({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") { setShown(true); return undefined; }
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setShown(true); observer.disconnect(); } },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-[opacity,transform] duration-700 ease-apple motion-reduce:transition-none ${
        shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* ═══ Update categories — also the signup topics (preserved functionality) ═══ */
const CATEGORIES = [
  { id: "product", label: "Product updates", Icon: Sparkles, subject: "updates", helper: "New features, improvements, and important changes." },
  { id: "language", label: "Languages and access", Icon: Languages, subject: "languages", helper: "New language experiences and accessibility improvements." },
  { id: "research", label: "Research and learning", Icon: BookOpen, subject: "research", helper: "Findings and thinking behind the product." },
  { id: "community", label: "Community and events", Icon: UsersRound, subject: "community", helper: "Community stories, practical guidance, and ways to participate." },
];

/* ═══ LATEST — every entry grounded in shipped product behavior ═══ */
const UPDATES = [
  { date: "September 2026", cat: "product", subject: "build", title: "The learning loop, end to end", copy: "Learn, Ask, Practice, Build: one workspace now carries every step of the loop." },
  { date: "September 2026", cat: "language", subject: "languages", title: "Three languages, one loop", copy: "Language journeys run in English, Hindi, and Bengali, with more on the roadmap." },
  { date: "September 2026", cat: "product", subject: "lock", title: "Consent-scoped progress summaries", copy: "Parents follow the journey with confidence, without opening the learner's private space." },
  { date: "September 2026", cat: "product", subject: "growth", title: "Insights across cohorts", copy: "Organizations see patterns across learners. Individual answers stay individual." },
  { date: "August 2026", cat: "community", subject: "community", title: "Class communities, moderated", copy: "Discussions stay safe with one-tap reporting and human review, usually within 24 hours." },
  { date: "August 2026", cat: "research", subject: "research", title: "What we learn, we publish", copy: "Findings from real use shape the loop. The work so far lives in Research & News." },
  { date: "July 2026", cat: "language", subject: "teacher", title: "Teach in your language", copy: "Teachers can prepare and publish classwork in the language their classroom speaks." },
  { date: "July 2026", cat: "product", subject: "shield", title: "Safety guidance, reviewed openly", copy: "We update safety policies as we learn from real use, just like the product itself." },
];

/* ═══ FAQ-style micro-facts are not needed here; the signup keeps the
   honest mailto flow. ═══ */

export default function UpdatesPage() {
  const [selected, setSelected] = useState(["product", "language"]);
  const [filter, setFilter] = useState("all");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    const topics = CATEGORIES.filter((category) => selected.includes(category.id)).map((category) => category.label).join(", ");
    const body = `Name: ${name}\nEmail: ${email}\nTopics: ${topics}`;
    window.location.href = `mailto:hello@visionary.org.in?subject=${encodeURIComponent("Visionary updates request")}&body=${encodeURIComponent(body)}`;
    setSubmitted(true);
  }

  const visibleUpdates = filter === "all" ? UPDATES : UPDATES.filter((u) => u.cat === filter);
  const catLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label ?? id;

  return (
    <div className="page-updates min-h-screen bg-white" style={{ fontFamily: fontStack }}>
      <LandingNav />
      <main id="main">
        <Breadcrumb page="Updates" />

        {/* HERO — editorial statement: eyebrow, display heading, dek, two paths */}
        <section data-section="01-hero" className="px-6 pb-16 pt-10 sm:px-8 lg:px-10 lg:pb-24 lg:pt-28">
          <Reveal className="mx-auto max-w-[880px]">
            <p data-type="label" className="text-[#6e6e73]">News &amp; updates</p>
            <h1 className="mt-4 text-[48px] font-normal leading-[1.06] tracking-[-0.045em] sm:text-[64px] lg:text-[76px] text-[#1d1d1f]">
              What&rsquo;s <span className="accent-gradient">new</span> at Visionary.
            </h1>
            <p className="mt-8 max-w-[760px] text-[17px] leading-[25px] text-[#6e6e73]">
              Product news, new languages, and launch updates as they land, with the date on each one.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href="#signup"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#1d1d1f] px-[21px] text-[17px] font-medium leading-[1.176] tracking-[-0.011em] text-white transition-all duration-200 hover:scale-[1.01] hover:bg-[#272729] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-4"
              >
                Get updates by email
              </a>
              <a
                href="#latest"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-sm text-[17px] font-normal tracking-[0] text-[#0066cc] transition-colors duration-200 hover:text-[#0066cc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-4"
              >
                Browse the latest
                <ChevronIcon className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </Reveal>
        </section>

        {/* FEATURED — the editorial lead story */}
        <section aria-labelledby="featured-title" data-section="02-featured" className="px-6 py-24 sm:px-8 lg:px-10">
          <Reveal className="mx-auto max-w-[1240px]">
            <article className="relative grid items-center gap-8 overflow-hidden rounded-[30px] bg-[#f5f5f7] p-8 sm:p-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14 lg:p-12">
              <div>
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-[14px] font-semibold text-[#0066cc]">Featured</span>
                  <span className="text-[14px] font-semibold text-[#6e6e73]">Languages &amp; access</span>
                </div>
                <h2 id="featured-title" className="mt-5 text-[30px] font-normal leading-[1.15] tracking-[-0.025em] text-[#1d1d1f] sm:text-[40px]">
                  One intelligence, every learner, in their language.
                </h2>
                <div className="mt-4 max-w-[560px]">
                  <p className="text-[17px] leading-[1.6] text-[#6e6e73]">
                    Visionary&rsquo;s language journeys run in English, Hindi, and Bengali today, and the team can reply in all three. More languages are on the roadmap — the loop stays the same: Learn, Ask, Practice, Build.
                  </p>
                </div>
                <p className="mt-6 text-[13px] tracking-[0.01em] text-[#6e6e73]">September 2026</p>
                <Link to="/how-it-works" className="mt-6 inline-flex min-h-11 items-center gap-1.5 rounded-sm text-[17px] font-normal tracking-[0] text-[#0066cc] transition-colors duration-200 hover:text-[#0066cc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-4">
                  See how the loop works
                  <ChevronIcon className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
              <div className="flex justify-center lg:justify-end">
                <div className="flex h-[220px] w-full max-w-[340px] items-center justify-center rounded-[20px] bg-white sm:h-[240px]">
                  <SpotIllustration subject="loop" className="h-[150px] w-[200px]" title="The learning loop: Learn, Ask, Practice, Build" />
                </div>
              </div>
            </article>
          </Reveal>
        </section>

        {/* LATEST — filter chips + dated cards */}
        <section id="latest" aria-labelledby="latest-title" data-section="03-latest" className="scroll-mt-28 px-6 sm:px-8 lg:px-10">
          <Reveal className="mx-auto max-w-[1240px]">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-[680px]">
                <p className="apple-eyebrow text-[#6e6e73]">The changes, by category</p>
                <h2 id="latest-title" className="mt-3 text-[32px] font-normal leading-[1.15] tracking-[-0.03em] text-[#1d1d1f] sm:text-[42px]">
                  Latest updates.
                </h2>
                <p className="mt-4 text-[16px] leading-[1.75] text-[#6e6e73]">
                  Each entry names the month it landed. Pick a category to narrow the view.
                </p>
              </div>
              <div role="group" aria-label="Filter updates by category" className="flex flex-wrap gap-2">
                <button
                  type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}
                  className={`inline-flex min-h-11 items-center rounded-full px-4 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] ${
                    filter === "all" ? "bg-[#1d1d1f] text-white" : "bg-[#f5f5f7] text-[#6e6e73] hover:text-[#1d1d1f]"
                  }`}
                >
                  All
                </button>
                {CATEGORIES.map(({ id, label }) => (
                  <button
                    key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}
                    className={`inline-flex min-h-11 items-center rounded-full px-4 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] ${
                      filter === id ? "bg-[#1d1d1f] text-white" : "bg-[#f5f5f7] text-[#6e6e73] hover:text-[#1d1d1f]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-12 rounded-[30px] bg-[#f5f5f7] p-4 sm:p-6 lg:p-8">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {visibleUpdates.map((item) => (
                  <article key={item.title} className="group relative flex min-h-[240px] flex-col overflow-hidden rounded-[20px] bg-white p-6">
                    <div className="flex items-center gap-3">
                      <span className="text-[14px] font-semibold text-[#6e6e73]">{catLabel(item.cat)}</span>
                      <span className="text-[12px] tracking-[0.01em] text-[#86868b]">{item.date}</span>
                    </div>
                    <h3 className="relative z-10 mt-4 max-w-[220px] text-[17px] font-medium leading-[1.4] text-[#1d1d1f]">{item.title}</h3>
                    <p className="relative z-10 mt-2 flex-1 text-[14px] leading-[1.65] text-[#6e6e73]">{item.copy}</p>
                    <SpotIllustration subject={item.subject} className="pointer-events-none absolute -bottom-2 -right-2 h-[84px] w-[84px] opacity-95" />
                  </article>
                ))}
              </div>
            </div>
            {visibleUpdates.length === 0 && (
              <p className="mt-10 text-center text-[16px] text-[#6e6e73]">No updates in this category yet.</p>
            )}
          </Reveal>
        </section>

        {/* FROM THE RESEARCH — the evidence band */}
        <section aria-labelledby="research-band-title" data-section="04-evidence" className="px-6 sm:px-8 lg:px-10">
          <Reveal className="mx-auto max-w-[1240px]">
            <div className="relative grid items-center gap-8 overflow-hidden rounded-[30px] bg-[#f5f5f7] p-8 sm:p-12 lg:grid-cols-[1.35fr_0.65fr] lg:gap-16">
              <div>
                <p className="apple-eyebrow text-[#6e6e73]">Research &amp; learning</p>
                <h2 id="research-band-title" className="mt-3 text-[30px] font-normal leading-[1.15] tracking-[-0.025em] text-[#1d1d1f] sm:text-[38px]">
                  Evidence over claims.
                </h2>
                <div className="mt-4 max-w-[620px]">
                  <p className="text-[17px] leading-[1.6] text-[#6e6e73]">
                    We study how people learn with Visionary and publish what we find: what worked, what did not, and what changed as a result.
                  </p>
                </div>
                <Link to="/research" className="mt-6 inline-flex min-h-11 items-center gap-1.5 rounded-sm text-[17px] font-normal tracking-[0] text-[#0066cc] transition-colors duration-200 hover:text-[#0066cc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-4">
                  Read Research &amp; News
                  <ChevronIcon className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
              <div className="flex justify-center lg:justify-end">
                <div className="flex h-[180px] w-[180px] items-center justify-center rounded-full bg-white">
                  <SpotIllustration subject="research" className="h-[116px] w-[116px]" title="A magnifier over data" />
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* CHOOSE YOUR UPDATES + SIGN UP — preserved mailto flow, restyled */}
        <section id="signup" aria-labelledby="signup-title" data-section="05-signup" className="scroll-mt-28 bg-[#f5f5f7] px-6 sm:px-8 lg:px-10">
          <Reveal className="mx-auto max-w-[1240px]">
            <div className="max-w-[680px]">
              <p className="apple-eyebrow text-[#6e6e73]">Stay in the loop</p>
              <h2 id="signup-title" className="mt-3 text-[32px] font-normal leading-[1.15] tracking-[-0.03em] text-[#1d1d1f] sm:text-[42px]">
                Get updates by email.
              </h2>
              <p className="mt-4 text-[16px] leading-[1.75] text-[#6e6e73]">
                Choose your topics and prepare an email request to the Visionary team. Change your mix any time.
              </p>
            </div>

            <div className="mt-12 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
              {/* Topic toggles */}
              <div role="group" aria-label="Update categories" className="self-start rounded-[20px] bg-white p-2 sm:p-3">
                {CATEGORIES.map((category) => {
                  const checked = selected.includes(category.id);
                  const { Icon } = category;
                  return (
                    <button
                      key={category.id} type="button" role="checkbox" aria-checked={checked}
                      onClick={() => { setSelected((current) => (current.includes(category.id) ? current.filter((item) => item !== category.id) : [...current, category.id])); }}
                      className="flex w-full items-center gap-4 rounded-xl border-b border-[rgba(18,19,23,0.12)] p-4 text-left transition-colors last:border-b-0 hover:bg-[#f5f5f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc]"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[#f5f5f7] text-[#0066cc]">
                        <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[17px] font-semibold leading-[1.4] text-[#1d1d1f]">{category.label}</span>
                        <span className="mt-1 block text-[13px] leading-[1.55] text-[#6e6e73]">{category.helper}</span>
                      </span>
                      <span aria-hidden="true" className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${checked ? "border-[#1d1d1f] bg-[#1d1d1f]" : "border-[rgba(18,19,23,0.12)] bg-white"}`}>
                        {checked && <Check className="h-4 w-4" strokeWidth={2.4} style={{ color: "#ffffff" }} />}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* The form */}
              <div className="rounded-[20px] bg-white p-6 sm:p-8">
                {submitted ? (
                  <div className="py-4" role="status">
                    <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#f5f5f7] text-[#0066cc]">
                      <CheckCircle2 className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 text-[28px] font-normal leading-[1.2] tracking-[-0.025em] text-[#1d1d1f]">Your request is ready.</h3>
                    <p className="mt-3 max-w-[520px] text-[14px] leading-[1.7] text-[#6e6e73]">
                      Your email app opened a draft with these preferences. Review it and choose whether to send. This page has not subscribed you automatically.
                    </p>
                    <button
                      type="button" onClick={() => setSubmitted(false)}
                      className="mt-5 inline-flex min-h-11 items-center gap-1.5 rounded-sm text-[17px] font-normal tracking-[0] text-[#0066cc] transition-colors duration-200 hover:text-[#0066cc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-4"
                    >
                      Change your preferences
                      <ChevronIcon className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label htmlFor="updates-name" className="mb-2 block text-[14px] text-[#6e6e73]">Name</label>
                        <input
                          id="updates-name" name="name" type="text" autoComplete="name" required value={name}
                          onChange={(event) => setName(event.target.value)}
                          className="h-12 w-full rounded-full bg-[#f5f5f7] px-5 text-[16px] text-[#1d1d1f] outline-none transition-colors placeholder:text-[#86868b] focus:bg-white focus:ring-2 focus:ring-[#0066cc]/30"
                        />
                      </div>
                      <div>
                        <label htmlFor="updates-email" className="mb-2 block text-[14px] text-[#6e6e73]">Email</label>
                        <input
                          id="updates-email" name="email" type="email" autoComplete="email" required value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          className="h-12 w-full rounded-full bg-[#f5f5f7] px-5 text-[16px] text-[#1d1d1f] outline-none transition-colors placeholder:text-[#86868b] focus:bg-white focus:ring-2 focus:ring-[#0066cc]/30"
                        />
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="text-[14px] text-[#6e6e73]">You will receive</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {CATEGORIES.map((category) => {
                          const active = selected.includes(category.id);
                          return (
                            <button
                              key={category.id} type="button" aria-pressed={active}
                              onClick={() => setSelected((current) => (current.includes(category.id) ? current.filter((item) => item !== category.id) : [...current, category.id]))}
                              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#f5f5f7] px-4 text-[13px] text-[#1d1d1f] transition-colors hover:bg-[#e8e8ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc]"
                            >
                              {active && <Check className="h-3.5 w-3.5" strokeWidth={2.4} style={{ color: "#0066cc" }} aria-hidden="true" />}
                              {category.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <label className="mt-6 flex items-start gap-3">
                      <input
                        type="checkbox" required checked={consent} onChange={(event) => setConsent(event.target.checked)}
                        className="mt-1 h-4 w-4 accent-[#1d1d1f]"
                      />
                      <span className="text-[13px] leading-[1.65] text-[#6e6e73]">
                        I agree to receive the updates I selected. I can unsubscribe any time.
                      </span>
                    </label>

                    <button
                      type="submit"
                      className="mt-7 inline-flex h-12 items-center justify-center rounded-full bg-[#1d1d1f] px-8 font-medium tracking-[0.24px] text-[16px] text-white transition-all duration-200 hover:scale-[1.01] hover:bg-[#272729] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2"
                    >
                      Prepare email request
                    </button>
                    <p className="mt-4 text-[13px] leading-[1.6] text-[#6e6e73]">
                      Nothing is submitted from this page. Your email app opens a draft for you to review and send.
                    </p>
                  </form>
                )}
              </div>
            </div>

            <p className="mt-8 max-w-[880px] text-[13px] leading-[1.6] text-[#6e6e73]">
              We use your information according to the Visionary{" "}
              <Link to="/privacy" className="relative after:absolute after:-inset-y-3 after:-inset-x-2 rounded-sm text-[#0066cc] underline-offset-2 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc]">
                Privacy Policy
              </Link>
              .
            </p>
          </Reveal>
        </section>

        {/* CONTACT one-liner */}
        <section aria-label="Contact" data-section="06-contact" className="px-6 sm:px-8 lg:px-10">
          <div className="mx-auto flex max-w-[1240px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[16px] text-[#6e6e73]">Questions about updates?</p>
            <a
              href="mailto:hello@visionary.org.in"
              className="inline-flex min-h-11 w-fit items-center gap-1.5 rounded-sm text-[17px] font-normal tracking-[0] text-[#0066cc] transition-colors duration-200 hover:text-[#0066cc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-4"
            >
              hello@visionary.org.in
              <ChevronIcon className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}
