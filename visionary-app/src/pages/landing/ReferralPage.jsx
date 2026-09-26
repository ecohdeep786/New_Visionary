import { useState } from "react";
import { ArrowRight, ArrowUpRight, BookOpen, Check, Copy, Link2, Share2, UserRoundPlus } from "lucide-react";
import { Link } from "react-router-dom";

import LandingNav from "@/components/landing/LandingNav";
import PageHeading from "@/components/landing/PageHeading";
import LandingFooter from "@/components/landing/LandingFooter";

const FONT_FAMILY = "'Google Sans Flex', 'Google Sans', system-ui, sans-serif";

const COLORS = {
  ink: "#121317",
  grey: "#5f6368",
  lightGrey: "#9aa0a6",
  mist: "#dadce0",
  soft: "#f8f9fa",
  blue: "#4285F4",
  white: "#ffffff",
};

const STEPS = [
  {
    number: "01",
    Icon: Link2,
    title: "Copy the sign-up link",
    description: "Use the Visionary registration link. It opens the same clear product and account experience for everyone.",
  },
  {
    number: "02",
    Icon: Share2,
    title: "Share it with someone",
    description: "Send the link to a person who may want to explore Visionary. Only share it where it is welcome.",
  },
  {
    number: "03",
    Icon: BookOpen,
    title: "They decide for themselves",
    description: "The person you invite can explore the product and choose whether Visionary fits their goals.",
  },
];

function StepCard({ number, Icon, title, description }) {
  return (
    <article className="rounded-[20px] border bg-white p-6 sm:p-7" style={{ borderColor: COLORS.mist }}>
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-normal tracking-[0.08em]" style={{ color: COLORS.blue }}>{number}</span>
        <span className="flex h-11 w-11 items-center justify-center rounded-[14px]" style={{ backgroundColor: COLORS.soft, color: COLORS.blue }}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <h3 className="mt-7 text-[20px] font-normal leading-[1.3] tracking-[-0.02em]" style={{ color: COLORS.ink }}>{title}</h3>
      <p className="mt-3 text-[15px] leading-[1.65]" style={{ color: COLORS.grey }}>{description}</p>
    </article>
  );
}

export default function ReferralPage() {
  const [status, setStatus] = useState("");
  const shareUrl = typeof window === "undefined" ? "/register" : new URL("/register", window.location.origin).toString();

  async function copySignupLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setStatus("Sign-up link copied. This link does not track referrals or provide a reward.");
    } catch {
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
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
      <main id="main">
        <PageHeading
          page="Referral"
          eyebrow="Share Visionary"
          h1={<>Share a better way to <span className="text-[#4285F4]">learn.</span></>}
          dek="Invite someone to explore Visionary in a few simple steps."
        >
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#share" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#1967d2] px-6 text-[15px] font-medium text-white hover:bg-[#1558b0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2">
              Get the sign-up link <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <a href="#how-it-works" className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#dadce0] px-6 text-[15px] font-medium text-[#121317] hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]">
              How sharing works <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </PageHeading>

        <section aria-labelledby="referral-intro" className="border-y border-[#dadce0] bg-[#f8f9fa] px-6 py-14 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <div className="mx-auto grid max-w-[1240px] items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
            <div className="max-w-[700px]">
              <p className="text-[12px] font-medium uppercase tracking-[0.15em] text-[#5f6368]">A straightforward introduction</p>
              <h2 id="referral-intro" className="mt-3 text-[32px] font-normal leading-[1.15] tracking-[-0.03em] text-[#121317] sm:text-[42px]">Recommend it when it can help.</h2>
              <p className="mt-4 text-[16px] leading-[1.75] text-[#5f6368]">If Visionary has been useful to you, you can send someone the regular account sign-up page. They can review the product and decide whether to join.</p>
            </div>
            <aside className="rounded-[22px] border border-[#dadce0] bg-white p-6 sm:p-8" aria-label="Referral program availability">
              <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#5f6368]">Current availability</p>
              <p className="mt-3 text-[21px] font-normal leading-[1.35] text-[#121317]">Simple sharing, with no reward conditions.</p>
              <p className="mt-3 text-[14px] leading-[1.7] text-[#5f6368]">This invitation is open to anyone who can use the standard registration experience. It has no cash reward, account credit, referral code, or tracking dashboard.</p>
            </aside>
          </div>
        </section>

        <section id="how-it-works" aria-labelledby="steps-title" className="scroll-mt-24 px-6 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <div className="mx-auto max-w-[1240px]">
            <div className="max-w-[680px]">
              <p className="text-[12px] font-medium uppercase tracking-[0.15em] text-[#5f6368]">Three simple steps</p>
              <h2 id="steps-title" className="mt-3 text-[32px] font-normal leading-[1.15] tracking-[-0.03em] text-[#121317] sm:text-[42px]">How to share Visionary.</h2>
              <p className="mt-4 text-[15px] leading-[1.75] text-[#5f6368]">Choose the link, send it in a place where it is welcome, and let the other person decide.</p>
            </div>
            <ol className="mt-9 grid gap-4 md:grid-cols-3">
              {STEPS.map((step) => <li key={step.number}><StepCard {...step} /></li>)}
            </ol>
          </div>
        </section>

        <section id="share" aria-labelledby="share-title" className="scroll-mt-24 border-y border-[#dadce0] bg-[#f8f9fa] px-6 py-14 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <div className="mx-auto grid max-w-[1240px] gap-9 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-16">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.15em] text-[#5f6368]">Ready to share?</p>
              <h2 id="share-title" className="mt-3 text-[32px] font-normal leading-[1.15] tracking-[-0.03em] text-[#121317] sm:text-[40px]">Copy the standard sign-up link.</h2>
              <p className="mt-4 text-[15px] leading-[1.75] text-[#5f6368]">It opens Visionary registration. It contains no personal referral code and does not tell Visionary who shared it.</p>
            </div>
            <div className="rounded-[22px] border border-[#dadce0] bg-white p-6 sm:p-8">
              <label htmlFor="referral-signup-link" className="block text-[13px] font-medium text-[#121317]">Visionary sign-up page</label>
              <input
                id="referral-signup-link"
                type="text"
                readOnly
                value={shareUrl}
                onFocus={(event) => event.currentTarget.select()}
                className="mt-2 h-12 w-full min-w-0 rounded-[12px] border border-[#dadce0] bg-[#f8f9fa] px-3 text-[14px] text-[#5f6368] outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] sm:px-4"
                aria-describedby="referral-link-note"
              />
              <button type="button" onClick={copySignupLink} className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#1967d2] px-5 text-[14px] font-medium text-white hover:bg-[#1558b0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2">
                {status.startsWith("Sign-up link copied") ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                {status.startsWith("Sign-up link copied") ? "Copied" : "Copy sign-up link"}
              </button>
              <button type="button" onClick={shareSignupLink} className="ml-3 mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#dadce0] px-5 text-[14px] font-medium text-[#121317] hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]">
                <Share2 className="h-4 w-4" aria-hidden="true" /> Share
              </button>
              <p id="referral-link-note" className="mt-4 text-[12px] leading-[1.65] text-[#5f6368]">Copying this link does not register a referral or create a reward.</p>
              <p role="status" aria-live="polite" className="mt-2 min-h-5 text-[13px] leading-[1.6] text-[#1967d2]">{status}</p>
              <Link to="/register" className="mt-2 inline-flex min-h-11 items-center gap-2 text-[14px] font-medium text-[#1967d2] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]">Open registration <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>
            </div>
          </div>
        </section>

        <section aria-labelledby="referral-faq" className="px-6 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <div className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.15em] text-[#5f6368]">Good to know</p>
              <h2 id="referral-faq" className="mt-3 text-[30px] font-normal leading-[1.2] tracking-[-0.025em] text-[#121317] sm:text-[38px]">Referral questions, answered.</h2>
            </div>
            <div className="divide-y divide-[#dadce0] border-y border-[#dadce0]">
              <details className="group py-5">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-medium text-[#121317] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] [&::-webkit-details-marker]:hidden">Do I or my friend receive a reward?<span aria-hidden="true" className="text-xl text-[#5f6368] group-open:rotate-45">+</span></summary>
                <p className="max-w-[700px] pt-3 text-[14px] leading-[1.75] text-[#5f6368]">No referral reward or discount is currently offered through this page. We do not promise free months, credits, or other benefits for sharing or signing up.</p>
              </details>
              <details className="group py-5">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-medium text-[#121317] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] [&::-webkit-details-marker]:hidden">Can Visionary track who I invite?<span aria-hidden="true" className="text-xl text-[#5f6368] group-open:rotate-45">+</span></summary>
                <p className="max-w-[700px] pt-3 text-[14px] leading-[1.75] text-[#5f6368]">No. The shareable link opens ordinary registration and carries no working referral code or attribution. No referral status or history is shown here.</p>
              </details>
              <details className="group py-5">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-medium text-[#121317] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] [&::-webkit-details-marker]:hidden">Who can use the sign-up link?<span aria-hidden="true" className="text-xl text-[#5f6368] group-open:rotate-45">+</span></summary>
                <p className="max-w-[700px] pt-3 text-[14px] leading-[1.75] text-[#5f6368]">The link leads to Visionary’s standard registration page. Account access follows the sign-up experience and terms shown there; sharing this link does not grant special eligibility.</p>
              </details>
              <details className="group py-5">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-medium text-[#121317] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] [&::-webkit-details-marker]:hidden">Can I ask about future referral features?<span aria-hidden="true" className="text-xl text-[#5f6368] group-open:rotate-45">+</span></summary>
                <p className="max-w-[700px] pt-3 text-[14px] leading-[1.75] text-[#5f6368]">Yes. Contact <a href="mailto:hello@visionary.org.in?subject=Referral%20question" className="font-medium text-[#1967d2] underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]">hello@visionary.org.in</a>. Contacting Visionary does not enroll you in a referral program.</p>
              </details>
            </div>
          </div>
        </section>

        <section aria-label="Privacy reminder" className="border-t border-[#dadce0] bg-[#f8f9fa] px-6 py-8 sm:px-8 lg:px-10">
          <div className="mx-auto flex max-w-[1240px] items-start gap-3">
            <UserRoundPlus className="mt-0.5 h-5 w-5 shrink-0 text-[#5f6368]" aria-hidden="true" />
            <p className="max-w-[850px] text-[13px] leading-[1.7] text-[#5f6368]">Share thoughtfully. Don’t include someone else’s personal details in a message or imply that Visionary guarantees a reward, outcome, or service.</p>
          </div>
        </section>
      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}
