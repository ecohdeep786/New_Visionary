import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight, Check, Compass, Copy, GraduationCap, Link2,
  Share2, UserRoundPlus,
} from "lucide-react";

import LandingNav from "@/components/landing/LandingNav";
import Breadcrumb from "@/components/landing/Breadcrumb";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingFAQ from "@/components/landing/LandingFAQ";
import SpotIllustration from "@/components/landing/SpotIllustration";

/* ═══ Tokens — the shared Material dialect (#202124 ink, #0b57d0/#1a73e8
   actions, #e8eaed hairlines, pill buttons, rounded-2xl cards). ═══ */
const FONT = "'Google Sans Flex', 'Google Sans', system-ui, sans-serif";

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
      className={`transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none ${
        shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* ═══ HOW IT WORKS — the reference's blue-circle steps ═══ */
const STEPS = [
  { Icon: Link2, title: "Share the link", copy: "Copy the standard sign-up link and send it to someone who may want to explore Visionary. Only share it where it is welcome." },
  { Icon: Compass, title: "Your friend explores", copy: "The link opens the same clear sign-up experience everyone gets — the product tour, the learning loop, and the plans." },
  { Icon: GraduationCap, title: "Learning begins", copy: "If it fits, they create an account and start with Learn, Ask, Practice, Build. You had a part in it — quietly." },
];

/* ═══ WHERE TO POINT PEOPLE — the reference's second step block ═══ */
const DESTINATIONS = [
  { subject: "student", label: "Students & families", to: "/student", alt: "/parent", copy: "The learning companion that keeps your place — with consent-scoped parent summaries." },
  { subject: "teacher", label: "Teachers", to: "/teacher", alt: "/how-it-works", copy: "Prepare, publish, and review classwork in the language the classroom speaks." },
  { subject: "team", label: "Organizations", to: "/organization", alt: "/partners", copy: "Cohorts and aggregate insights across a whole institution — never individual answers." },
];

/* ═══ COLLAGE — the reference's image trio, in our illustration voice ═══ */
const COLLAGE = [
  { subject: "student", tint: "#F1F1F4", title: "A student learning with Visionary" },
  { subject: "teacher", tint: "#F1F1F4", title: "A teacher preparing classwork" },
  { subject: "team", tint: "#F1F1F4", title: "A team growing together" },
];

export default function ReferralPage() {
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState("");
  const shareUrl = typeof window === "undefined" ? "/register" : new URL("/register", window.location.origin).toString();

  async function copySignupLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setStatus("Sign-up link copied. This link does not track referrals or provide a reward.");
    } catch {
      setCopied(false);
      setStatus("Copy was unavailable. Select the sign-up link above and copy it manually.");
    }
  }

  async function shareSignupLink() {
    if (!navigator.share) { await copySignupLink(); return; }
    try {
      await navigator.share({ title: "Explore Visionary", text: "A learning workspace for understanding, practice, and projects.", url: shareUrl });
      setStatus("Share options opened.");
    } catch (error) {
      if (error?.name !== "AbortError") setStatus("Sharing was unavailable. You can copy the link instead.");
    }
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT }}>
      <LandingNav />
      <main id="main">
        <Breadcrumb page="Referral" />

        {/* HERO — the reference's centered statement + two paths */}
        <section className="px-6 pb-14 pt-10 text-center sm:px-8 lg:px-10 lg:pb-16 lg:pt-16">
          <Reveal className="mx-auto max-w-[880px]">
            <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-[#5f6368]">Referral programme</p>
            <h1 className="mt-4 text-[clamp(34px,5.5vw,58px)] font-normal leading-[1.05] tracking-[-0.045em] text-[#202124]">
              Share a better way to <span className="text-[#0b57d0]">learn.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-[640px] text-[17px] leading-[1.6] text-[#5f6368] sm:text-[18px]">
              Invite someone to explore Visionary. One link, the same sign-up everyone gets — no codes, no tracking, nothing to manage.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                type="button" onClick={copySignupLink}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#0b57d2] px-6 text-[14px] font-medium text-white transition-all hover:bg-[#0a4cb8] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] focus-visible:ring-offset-2"
              >
                {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                {copied ? "Link copied" : "Copy your invite link"}
              </button>
              <a
                href="#how" 
                className="inline-flex min-h-11 items-center rounded-full border border-[#dadce0] bg-white px-6 text-[14px] font-medium text-[#202124] transition-colors hover:bg-[#f1f3f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]"
              >
                How sharing works
              </a>
            </div>
            <p role="status" aria-live="polite" className="mt-4 min-h-5 text-[13px] text-[#0b57d0]">{copied ? status : ""}</p>
          </Reveal>
        </section>

        {/* COLLAGE — the reference's image trio in our illustration voice */}
        <section aria-hidden="true" className="px-6 pb-20 sm:px-8 lg:px-10">
          <Reveal className="mx-auto grid max-w-[1080px] gap-4 sm:grid-cols-3 sm:gap-6" delay={100}>
            {COLLAGE.map((panel, i) => (
              <div
                key={panel.subject}
                className={`flex h-[220px] items-center justify-center rounded-[28px] sm:h-[260px] ${i === 1 ? "sm:mt-10" : ""}`}
                style={{ backgroundColor: panel.tint }}
              >
                <SpotIllustration subject={panel.subject} className="h-[160px] w-[120px]" title={panel.title} />
              </div>
            ))}
          </Reveal>
        </section>

        {/* HOW IT WORKS — the reference's blue-circle steps */}
        <section id="how" aria-labelledby="how-title" className="scroll-mt-28 border-t border-[#e8eaed] px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <Reveal className="mx-auto max-w-[1240px]">
            <div className="mx-auto max-w-[720px] text-center">
              <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#5f6368]">Sending an invite</p>
              <h2 id="how-title" className="mt-3 text-[36px] font-normal leading-[1.12] tracking-[-0.03em] text-[#202124] sm:text-[46px]">
                How it works.
              </h2>
              <p className="mx-auto mt-4 max-w-[560px] text-[15px] leading-[1.65] text-[#5f6368] sm:text-[16px]">
                The more personal the share, the more it can mean. Three steps, about a minute.
              </p>
            </div>

            <ol className="mx-auto mt-14 grid max-w-[1080px] gap-10 md:grid-cols-3 md:gap-8">
              {STEPS.map(({ Icon, title, copy }) => (
                <li key={title} className="text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#0b57d2] text-white">
                    <Icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-[17px] font-medium leading-[1.4] text-[#202124]">{title}</h3>
                  <p className="mx-auto mt-2 max-w-[300px] text-[14px] leading-[1.65] text-[#5f6368]">{copy}</p>
                </li>
              ))}
            </ol>

            <div className="mt-12 flex justify-center">
              <a
                href="#share"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#dadce0] bg-white px-6 text-[14px] font-medium text-[#0b57d0] transition-colors hover:bg-[#f1f3f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]"
              >
                Copy the link now <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </Reveal>
        </section>

        {/* POINT THEM WELL — the reference's "redeeming" block, mapped to
            honest destinations */}
        <section aria-labelledby="point-title" className="border-y border-[#e8eaed] bg-[#f8f9fa] px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <Reveal className="mx-auto max-w-[1240px]">
            <div className="mx-auto max-w-[720px] text-center">
              <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#5f6368]">Pointing them well</p>
              <h2 id="point-title" className="mt-3 text-[32px] font-normal leading-[1.15] tracking-[-0.03em] text-[#202124] sm:text-[42px]">
                Start from what they need.
              </h2>
              <p className="mx-auto mt-4 max-w-[560px] text-[15px] leading-[1.65] text-[#5f6368] sm:text-[16px]">
                A share lands better when the page matches the person. Send the one that fits — or the how-it-works tour for everyone.
              </p>
            </div>

            <div className="mx-auto mt-14 grid max-w-[1080px] gap-4 md:grid-cols-3">
              {DESTINATIONS.map(({ subject, label, to, alt, copy }) => (
                <article key={label} className="flex min-h-[300px] flex-col rounded-2xl border border-[#e8eaed] bg-white p-6 transition-shadow duration-300 hover:shadow-[0_2px_8px_rgba(32,33,36,0.16)]">
                  <span className="flex h-[104px] w-[104px] items-center justify-center rounded-[22px] border border-[#e8eaed] bg-white">
                    <SpotIllustration subject={subject} className="h-[76px] w-[76px]" title={label} />
                  </span>
                  <h3 className="mt-5 text-[17px] font-medium leading-[1.4] text-[#202124]">{label}</h3>
                  <p className="mt-2 flex-1 text-[14px] leading-[1.65] text-[#5f6368]">{copy}</p>
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                    <Link to={to} className="inline-flex min-h-9 items-center gap-1.5 rounded-sm text-[14px] font-medium text-[#0b57d0] transition-colors hover:text-[#1765cc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]">
                      Open {to} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                    <Link to={alt} className="inline-flex min-h-9 items-center gap-1.5 rounded-sm text-[14px] font-medium text-[#5f6368] transition-colors hover:text-[#202124] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]">
                      or {alt} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </Reveal>
        </section>

        {/* THE LINK — the functional share card (preserved behavior) */}
        <section id="share" aria-labelledby="share-title" className="scroll-mt-28 px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <Reveal className="mx-auto grid max-w-[1240px] items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#5f6368]">Ready to share?</p>
              <h2 id="share-title" className="mt-3 text-[32px] font-normal leading-[1.15] tracking-[-0.03em] text-[#202124] sm:text-[42px]">
                Copy the standard sign-up link.
              </h2>
              <p className="mt-4 max-w-[480px] text-[15px] leading-[1.75] text-[#5f6368]">
                It opens Visionary registration. It contains no personal referral code and does not tell Visionary who shared it.
              </p>
              <p className="mt-6 flex items-center gap-2 text-[13px] tracking-[0.01em] text-[#5f6368]">
                <UserRoundPlus className="h-4 w-4 text-[#1a73e8]" aria-hidden="true" />
                Works for every persona — no account needed to copy it.
              </p>
            </div>
            <div className="rounded-2xl border border-[#e8eaed] bg-white p-6 sm:p-8">
              <label htmlFor="referral-signup-link" className="block text-[13px] font-medium text-[#202124]">Visionary sign-up page</label>
              <input
                id="referral-signup-link"
                type="text"
                readOnly
                value={shareUrl}
                onFocus={(event) => event.currentTarget.select()}
                className="mt-2 h-12 w-full min-w-0 rounded-xl border border-[#dadce0] bg-[#f8f9fa] px-4 text-[14px] text-[#5f6368] outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]"
                aria-describedby="referral-link-note"
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button" onClick={copySignupLink}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#0b57d2] px-5 text-[14px] font-medium text-white transition-all hover:bg-[#0a4cb8] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] focus-visible:ring-offset-2"
                >
                  {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                  {copied ? "Copied" : "Copy sign-up link"}
                </button>
                <button
                  type="button" onClick={shareSignupLink}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#dadce0] px-5 text-[14px] font-medium text-[#202124] transition-colors hover:bg-[#f1f3f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]"
                >
                  <Share2 className="h-4 w-4" aria-hidden="true" /> Share
                </button>
                <Link
                  to="/register"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#dadce0] px-5 text-[14px] font-medium text-[#0b57d0] transition-colors hover:bg-[#f1f3f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]"
                >
                  Open registration <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
              <p id="referral-link-note" className="mt-4 text-[12px] leading-[1.65] text-[#5f6368]">
                Copying this link does not register a referral or create a reward.
              </p>
              <p role="status" aria-live="polite" className="mt-2 min-h-5 text-[13px] leading-[1.6] text-[#0b57d0]">{status}</p>
            </div>
          </Reveal>
        </section>

        {/* HONESTY BAND — the reference's rates block, told straight */}
        <section aria-labelledby="honest-title" className="bg-[#f8f9fa] px-6 py-20 sm:px-8 lg:px-10 lg:py-24">
          <Reveal className="mx-auto flex max-w-[900px] flex-col items-center text-center">
            <h2 id="honest-title" className="text-[clamp(26px,3.4vw,38px)] font-normal leading-[1.25] tracking-[-0.025em] text-[#202124]">
              No points. No tracking. Just a good tool worth passing on.
            </h2>
            <p className="mt-5 max-w-[640px] text-[15px] leading-[1.75] text-[#5f6368] sm:text-[16px]">
              There is no cash reward, account credit, referral code, or tracking dashboard attached to sharing Visionary today. If a formal referral programme with rewards is ever introduced, it will be announced on this page first.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-2">
              {["No tracking", "No codes", "No rewards", "No expiry"].map((chip) => (
                <span key={chip} className="inline-flex items-center rounded-[6px] border border-[#dadce0] bg-white px-3 py-1.5 text-[12px] font-medium uppercase tracking-[0.12em] text-[#202124]">
                  {chip}
                </span>
              ))}
            </div>
          </Reveal>
        </section>

        {/* FAQ — the reference's split layout with expand-all */}
        <section id="faq" aria-labelledby="faq-title" className="scroll-mt-28 px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <Reveal className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#5f6368]">Good to know</p>
              <h2 id="faq-title" className="mt-3 text-[32px] font-normal leading-[1.15] tracking-[-0.03em] text-[#202124] sm:text-[42px]">
                Frequently asked questions.
              </h2>
              <p className="mt-4 max-w-[360px] text-[15px] leading-[1.75] text-[#5f6368]">
                Straight answers about sharing Visionary — including what this page does not promise.
              </p>
            </div>
            <div>
              <LandingFAQ
                faqs={[
                  { q: "Do I or my friend receive a reward?", a: "No referral reward or discount is currently offered through this page. We do not promise free months, credits, or other benefits for sharing or signing up." },
                  { q: "Can Visionary track who I invite?", a: "No. The shareable link opens ordinary registration and carries no working referral code or attribution. No referral status or history is shown here." },
                  { q: "Who can use the sign-up link?", a: "Anyone. The link leads to Visionary's standard registration page; account access follows the sign-up experience and terms shown there. Sharing it grants no special eligibility." },
                  { q: "What should I tell my friend?", a: "Start with what they need. The how-it-works page explains the loop — Learn, Ask, Practice, Build — and each persona page shows how Visionary fits students, teachers, parents, professionals, and organizations." },
                  { q: "Can I ask about future referral features?", a: "Yes — write to hello@visionary.org.in with the subject \u201cReferral question\u201d. Contacting Visionary does not enroll you in a referral program." },
                ]}
                multiple={true}
                showExpandAll={true}
                expandAllLabel="Expand all"
                collapseAllLabel="Collapse all"
              />
              <p className="mt-8 text-[14px] leading-[1.7] text-[#5f6368]">
                More questions?{" "}
                <a
                  href="mailto:hello@visionary.org.in?subject=Referral%20question"
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-sm font-medium text-[#0b57d0] transition-colors hover:text-[#1765cc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]"
                >
                  hello@visionary.org.in <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </p>
            </div>
          </Reveal>
        </section>

        {/* PRIVACY REMINDER — preserved strip */}
        <section aria-label="Privacy reminder" className="border-t border-[#e8eaed] bg-[#f8f9fa] px-6 py-8 sm:px-8 lg:px-10">
          <div className="mx-auto flex max-w-[1240px] items-start gap-3">
            <UserRoundPlus className="mt-0.5 h-5 w-5 shrink-0 text-[#5f6368]" aria-hidden="true" />
            <p className="max-w-[850px] text-[13px] leading-[1.7] text-[#5f6368]">
              Share thoughtfully. Don&rsquo;t include someone else&rsquo;s personal details in a message or imply that Visionary guarantees a reward, outcome, or service.
            </p>
          </div>
        </section>

        {/* CLOSING — the reference's rounded card, pointed at honest next steps */}
        <section aria-labelledby="closing-title" className="px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <Reveal className="mx-auto max-w-[1240px]">
            <div className="relative overflow-hidden rounded-[28px] bg-[#e8f0fe] px-8 py-14 text-center sm:px-12 lg:py-16">
              <h2 id="closing-title" className="mx-auto max-w-[680px] text-[clamp(28px,3.6vw,42px)] font-normal leading-[1.12] tracking-[-0.03em] text-[#202124]">
                Not sharing yet? Keep growing with us.
              </h2>
              <p className="mx-auto mt-4 max-w-[520px] text-[15px] leading-[1.7] text-[#3c4043]">
                Follow what changes, or meet the people who learn with Visionary — then share when it feels right.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/updates"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-6 text-[14px] font-medium text-[#0b57d2] shadow-[0_1px_3px_rgba(60,64,67,0.2)] transition-all hover:shadow-[0_2px_8px_rgba(32,33,36,0.16)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] focus-visible:ring-offset-2"
                >
                  Sign up for updates <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  to="/community"
                  className="inline-flex min-h-11 items-center rounded-full border border-[#202124]/30 px-6 text-[14px] font-medium text-[#202124] transition-colors hover:bg-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]"
                >
                  Meet the community
                </Link>
              </div>
            </div>
          </Reveal>
        </section>

      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}
