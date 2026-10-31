import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Compass, GraduationCap, Link2, UserRoundPlus } from "lucide-react";

import LandingNav from "@/components/landing/LandingNav";
import Breadcrumb from "@/components/landing/Breadcrumb";
import LandingFooter from "@/components/landing/LandingFooter";
import QuietLink from "@/components/landing/QuietLink";
import LandingFAQ from "@/components/landing/LandingFAQ";
import SpotIllustration from "@/components/landing/SpotIllustration";
import { ChevronIcon } from "@/components/landing/persona/PersonaSections";
import { fontStack } from "@/components/landing/system/tokens";

/* ═══ Tokens — the shared public dialect (#1d1d1f ink pills, #0066cc quiet
   links, #f5f5f7 grounds, borderless white cards). ═══ */

/* ═══ Link and pill grammar — the approved public classes, verbatim ═══ */
const quietLink = "inline-flex min-h-11 items-center gap-1.5 rounded-sm text-[17px] font-normal tracking-[0] text-[#0066cc] transition-colors duration-200 hover:text-[#0066cc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-4";
const inkPill = "inline-flex min-h-11 items-center justify-center rounded-full bg-[#1d1d1f] px-[21px] text-[17px] font-medium leading-[1.176] tracking-[-0.011em] text-white transition-all duration-200 hover:scale-[1.01] hover:bg-[#272729] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-4";
const greyPill = "inline-flex h-11 items-center justify-center rounded-full bg-[#f5f5f7] px-[21px] font-medium leading-[1.176] tracking-[-0.011em] text-[17px] text-[#1d1d1f] transition-colors hover:bg-[#e8e8ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-2";

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

/* ═══ HOW IT WORKS — the reference's blue-circle steps ═══ */
const STEPS = [
  { Icon: Link2, title: "Share the link", copy: "Copy the standard sign-up link and send it to someone who may want to explore Visionary. Only share it where it is welcome." },
  { Icon: Compass, title: "Your friend explores", copy: "The link opens the same clear sign-up experience everyone gets: the product tour, the learning loop, and the plans." },
  { Icon: GraduationCap, title: "Learning begins", copy: "If it fits, they create an account and start with Learn, Ask, Practice, Build. You had a part in it, quietly." },
];

/* ═══ WHERE TO POINT PEOPLE — the reference's second step block ═══ */
const DESTINATIONS = [
  { subject: "student", label: "Students and families", to: "/student", alt: "/parent", toLabel: "Open the student page", altLabel: "or the parent page", copy: "The learning companion that keeps your place, with parent summaries shared with consent." },
  { subject: "teacher", label: "Teachers", to: "/teacher", alt: "/how-it-works", toLabel: "Open the teacher page", altLabel: "or how it works", copy: "Prepare, publish, and review classwork in the language the classroom speaks." },
  { subject: "team", label: "Organizations", to: "/organization", alt: "/partners", toLabel: "Open the organization page", altLabel: "or the partner programme", copy: "Progress across the whole institution, never individual answers." },
];

/* ═══ COLLAGE — the reference's image trio, in our illustration voice ═══ */
const COLLAGE = [
  { subject: "study", title: "A student learning with Visionary" },
  { subject: "teach", title: "A teacher preparing classwork" },
  { subject: "teamwork", title: "A team growing together" },
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
    <div className="page-referral min-h-screen bg-white" style={{ fontFamily: fontStack }}>
      <LandingNav />
      <main id="main">
        <Breadcrumb page="Referral" />

        {/* HERO — the reference's centered statement with the illustration trio */}
        <section data-section="01-hero" className="px-6 pb-16 pt-10 text-center sm:px-8 lg:px-10 lg:pb-24 lg:pt-28">
          <Reveal className="mx-auto max-w-[880px]">
            <p data-type="label" className="text-[#6e6e73]">Referral programme</p>
            <h1 className="mt-4 text-[48px] font-normal leading-[1.06] tracking-[-0.045em] sm:text-[64px] lg:text-[76px] text-[#1d1d1f]">
              Share a better way to <span className="accent-gradient">learn.</span>
            </h1>
            <p className="mx-auto mt-8 max-w-[760px] text-[17px] leading-[25px] text-[#6e6e73]">
              Invite someone to explore Visionary. One link, the same sign-up everyone gets. No codes, no tracking, nothing to manage.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <button type="button" onClick={copySignupLink} className={inkPill}>
                {copied ? "Link copied" : "Copy your invite link"}
              </button>
              <a href="#how" className={quietLink}>
                How sharing works
                <ChevronIcon className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
            <p role="status" aria-live="polite" className="mt-4 min-h-5 text-[13px] text-[#6e6e73]">{copied ? status : ""}</p>
          </Reveal>

          {/* the illustration trio rides the hero composition (About/Community anatomy) */}
          <Reveal className="mt-14" delay={100}>
            <div aria-hidden="true" className="mx-auto grid max-w-[1080px] gap-4 sm:grid-cols-3 sm:gap-6">
              {COLLAGE.map((panel, i) => (
                <div
                  key={panel.subject}
                  className={`overflow-hidden rounded-[24px] ${i === 1 ? "sm:mt-10" : ""}`}
                >
                  <SpotIllustration subject={panel.subject} className="h-auto w-full" title={panel.title} />
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* HOW IT WORKS — the reference's steps, told in grey tiles */}
        <section id="how" data-section="02-how" aria-labelledby="how-title" className="scroll-mt-28 px-6 sm:px-8 lg:px-10">
          <Reveal className="mx-auto max-w-[1240px]">
            <div className="mx-auto max-w-[720px] text-center">
              <p className="apple-eyebrow text-[#6e6e73]">Sending an invite</p>
              <h2 id="how-title" className="mt-3 text-[36px] font-normal leading-[1.12] tracking-[-0.03em] text-[#1d1d1f] sm:text-[46px]">
                How it works.
              </h2>
              <p className="mx-auto mt-4 max-w-[560px] text-[16px] leading-[1.65] text-[#6e6e73] sm:text-[16px]">
                The more personal the share, the more it can mean. Three steps, about a minute.
              </p>
            </div>

            <ol className="mx-auto mt-14 grid max-w-[1080px] gap-10 md:grid-cols-3 md:gap-8">
              {STEPS.map(({ Icon, title, copy }) => (
                <li key={title} className="text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#f5f5f7] text-[#0066cc]">
                    <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-[17px] font-medium leading-[1.4] text-[#1d1d1f]">{title}</h3>
                  <p className="mx-auto mt-2 max-w-[300px] text-[14px] leading-[1.65] text-[#6e6e73]">{copy}</p>
                </li>
              ))}
            </ol>

            <div className="mt-12 flex justify-center">
              <a href="#share" className={quietLink}>
                Copy the link now
                <ChevronIcon className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </Reveal>
        </section>

        {/* POINT THEM WELL — the reference's "redeeming" block, mapped to
            honest destinations */}
        <section aria-labelledby="point-title" data-section="03-point" className="bg-[#f5f5f7] px-6 py-24 sm:px-8 lg:px-10">
          <Reveal className="mx-auto max-w-[1240px]">
            <div className="mx-auto max-w-[720px] text-center">
              <p className="apple-eyebrow text-[#6e6e73]">Pointing them well</p>
              <h2 id="point-title" className="mt-3 text-[32px] font-normal leading-[1.15] tracking-[-0.03em] text-[#1d1d1f] sm:text-[42px]">
                Start from what they need.
              </h2>
              <p className="mx-auto mt-4 max-w-[560px] text-[16px] leading-[1.65] text-[#6e6e73] sm:text-[16px]">
                A share lands better when the page matches the person. Send the one that fits, or the how-it-works tour for everyone.
              </p>
            </div>

            <div className="mx-auto mt-14 grid max-w-[1080px] gap-3 md:grid-cols-3">
              {DESTINATIONS.map(({ subject, label, to, alt, toLabel, altLabel, copy }) => (
                <article key={label} className="flex min-h-[300px] flex-col rounded-[20px] bg-white p-6">
                  <span className="flex h-[104px] w-[104px] items-center justify-center">
                    <SpotIllustration subject={subject} className="h-[76px] w-[76px]" title={label} />
                  </span>
                  <h3 className="mt-5 text-[17px] font-medium leading-[1.4] text-[#1d1d1f]">{label}</h3>
                  <p className="mt-2 flex-1 text-[14px] leading-[1.65] text-[#6e6e73]">{copy}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1">
                    <Link to={to} className={quietLink}>
                      {toLabel}
                      <ChevronIcon className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    <Link to={alt} className={quietLink}>
                      {altLabel}
                      <ChevronIcon className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </Reveal>
        </section>

        {/* THE LINK — the functional share card (preserved behavior) */}
        <section id="share" data-section="04-share" aria-labelledby="share-title" className="scroll-mt-28 px-6 sm:px-8 lg:px-10">
          <Reveal className="mx-auto grid max-w-[1240px] items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
            <div>
              <p className="apple-eyebrow text-[#6e6e73]">Ready to share?</p>
              <h2 id="share-title" className="mt-3 text-[32px] font-normal leading-[1.15] tracking-[-0.03em] text-[#1d1d1f] sm:text-[42px]">
                Copy the standard sign-up link.
              </h2>
              <p className="mt-4 max-w-[480px] text-[16px] leading-[1.75] text-[#6e6e73]">
                It opens Visionary registration. It contains no personal referral code and does not tell Visionary who shared it.
              </p>
              <p className="mt-6 flex items-center gap-2 text-[13px] tracking-[0.01em] text-[#6e6e73]">
                <UserRoundPlus className="h-4 w-4 text-[#0066cc]" aria-hidden="true" />
                Works for every persona, no account needed to copy it.
              </p>
            </div>
            <div className="rounded-[20px] bg-white p-6 sm:p-8">
              <label htmlFor="referral-signup-link" className="mb-2 block text-[14px] text-[#6e6e73]">Visionary sign-up page</label>
              <input
                id="referral-signup-link"
                type="text"
                readOnly
                value={shareUrl}
                onFocus={(event) => event.currentTarget.select()}
                className="h-12 w-full min-w-0 rounded-full bg-[#f5f5f7] px-5 text-[16px] text-[#6e6e73] outline-none transition-colors focus:bg-white focus:ring-2 focus:ring-[#0066cc]/30"
                aria-describedby="referral-link-note"
              />
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <button type="button" onClick={copySignupLink} className={inkPill}>
                  {copied ? "Copied" : "Copy sign-up link"}
                </button>
                <button type="button" onClick={shareSignupLink} className={greyPill}>
                  Share
                </button>
                <Link to="/register" className={quietLink}>
                  Open registration
                  <ChevronIcon className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
              <p id="referral-link-note" className="mt-4 text-[12px] leading-[1.65] text-[#6e6e73]">
                Copying this link does not register a referral or create a reward.
              </p>
              <p role="status" aria-live="polite" className="mt-2 min-h-5 text-[13px] leading-[1.6] text-[#6e6e73]">{status}</p>
            </div>
          </Reveal>
        </section>

        {/* HONESTY BAND — the reference's rates block, told straight */}
        <section aria-labelledby="honest-title" data-section="05-honesty" className="bg-[#f5f5f7] px-6 sm:px-8 lg:px-10">
          <Reveal className="mx-auto flex max-w-[900px] flex-col items-center text-center">
            <h2 id="honest-title" className="text-[clamp(26px,3.4vw,38px)] font-normal leading-[1.25] tracking-[-0.025em] text-[#1d1d1f]">
              No points. No tracking. Just a good tool worth passing on.
            </h2>
            <div className="mt-5 max-w-[640px]">
              <p className="text-[16px] leading-[1.75] text-[#6e6e73] sm:text-[16px]">
                There is no cash reward, account credit, referral code, or tracking dashboard attached to sharing Visionary today. If a formal referral programme with rewards is ever introduced, it will be announced on this page first.
              </p>
            </div>
            <div className="mt-7 flex flex-wrap justify-center gap-2">
              {["No tracking", "No codes", "No rewards", "No expiry"].map((chip) => (
                <span key={chip} className="inline-flex items-center rounded-[12px] border border-[rgba(18,19,23,0.12)] bg-white px-2.5 py-1 apple-eyebrow text-[#1d1d1f]">
                  {chip}
                </span>
              ))}
            </div>
            <div className="mt-9 flex justify-center">
              <QuietLink href="mailto:hello@visionary.org.in?subject=Referral%20question">
                Ask a referral question <ChevronIcon className="h-4 w-4" aria-hidden="true" />
              </QuietLink>
            </div>
          </Reveal>
        </section>

        {/* FAQ — the reference's split layout with expand-all */}
        <section id="faq" data-section="06-faq" aria-labelledby="faq-title" className="scroll-mt-28 px-6 sm:px-8 lg:px-10">
          <Reveal className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
            <div>
              <p className="apple-eyebrow text-[#6e6e73]">Good to know</p>
              <h2 id="faq-title" className="mt-3 text-[32px] font-normal leading-[1.15] tracking-[-0.03em] text-[#1d1d1f] sm:text-[42px]">
                Frequently asked questions.
              </h2>
              <p className="mt-4 max-w-[360px] text-[16px] leading-[1.75] text-[#6e6e73]">
                Straight answers about sharing Visionary, including what this page does not promise.
              </p>
            </div>
            <div>
              <LandingFAQ
                faqs={[
                  { q: "Do I or my friend receive a reward?", a: "No referral reward or discount is currently offered through this page. We do not promise free months, credits, or other benefits for sharing or signing up." },
                  { q: "Can Visionary track who I invite?", a: "No. The shareable link opens ordinary registration and carries no working referral code or attribution. No referral status or history is shown here." },
                  { q: "Who can use the sign-up link?", a: "Anyone. The link leads to Visionary's standard registration page; account access follows the sign-up experience and terms shown there. Sharing it grants no special eligibility." },
                  { q: "What should I tell my friend?", a: "Start with what they need. The how-it-works page explains the loop (Learn, Ask, Practice, Build), and each persona page shows how Visionary fits students, teachers, parents, professionals, and organizations." },
                  { q: "Can I ask about future referral features?", a: "Yes. Write to hello@visionary.org.in with the subject \u201cReferral question\u201d. Contacting Visionary does not enroll you in a referral program." },
                ]}
                multiple={true}
                showExpandAll={true}
                expandAllLabel="Expand all"
                collapseAllLabel="Collapse all"
              />
              <p className="mt-8 text-[14px] leading-[1.7] text-[#6e6e73]">
                More questions?{" "}
                <a
                  href="mailto:hello@visionary.org.in?subject=Referral%20question"
                  className="group inline-flex min-h-11 items-center gap-1.5 break-all rounded-sm text-[17px] font-normal tracking-[0] text-[#0066cc] transition-colors duration-200 hover:text-[#0066cc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066cc] focus-visible:ring-offset-4"
                >
                  hello@visionary.org.in <ChevronIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                </a>
              </p>
            </div>
          </Reveal>
        </section>

        {/* PRIVACY REMINDER — preserved strip */}
        <section aria-label="Privacy reminder" data-section="07-privacy" className="bg-[#f5f5f7] px-6 sm:px-8 lg:px-10">
          <div className="mx-auto flex max-w-[1240px] items-start gap-3">
            <UserRoundPlus className="mt-0.5 h-5 w-5 shrink-0 text-[#6e6e73]" aria-hidden="true" />
            <p className="max-w-[850px] text-[13px] leading-[1.7] text-[#6e6e73]">
              Share thoughtfully. Don&rsquo;t include someone else&rsquo;s personal details in a message or imply that Visionary guarantees a reward, outcome, or service.
            </p>
          </div>
        </section>

        {/* CLOSING — the reference's rounded card, pointed at honest next steps */}
        <section aria-labelledby="closing-title" data-section="08-closing" className="px-6 sm:px-8 lg:px-10">
          <Reveal className="mx-auto max-w-[1240px]">
            <div className="rounded-[30px] bg-[#f5f5f7] px-8 py-14 text-center sm:px-12 lg:py-16">
              <h2 id="closing-title" className="mx-auto max-w-[680px] text-[clamp(28px,3.6vw,42px)] font-normal leading-[1.12] tracking-[-0.03em] text-[#1d1d1f]">
                Not sharing yet? Keep growing with us.
              </h2>
              <p className="mx-auto mt-4 max-w-[520px] text-[16px] leading-[1.7] text-[#1d1d1f]">
                Follow what changes, or meet the people who learn with Visionary, then share when it feels right.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link to="/updates" className={inkPill}>
                  Sign up for updates
                </Link>
                <Link to="/community" className={quietLink}>
                  Meet the community
                  <ChevronIcon className="h-4 w-4" aria-hidden="true" />
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
