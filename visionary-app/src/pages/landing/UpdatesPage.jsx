import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCircle2,
  Languages,
  Sparkles,
  UsersRound,
} from "lucide-react";

import LandingNav from "@/components/landing/LandingNav";
import Breadcrumb from "@/components/landing/Breadcrumb";
import LandingFooter from "@/components/landing/LandingFooter";
import SpotIllustration from "@/components/landing/SpotIllustration";

/* Google blog pattern (blog.google capture, STEP 0): tiny breadcrumb → HUGE
   light H1 → section head + right-aligned caps link → flat bordered cards
   (ONE label top-left, thin arrow top-right, corner icon-tile, hover-only
   shadow, trailing empty cells). No paragraph walls: one-liners only. */

const FONT_FAMILY =
  "'Google Sans Flex', 'Google Sans', system-ui, sans-serif";

const COLORS = {
  ink: "#121317",
  grey: "#5f6368",
  lightGrey: "#9aa0a6",
  mist: "#dadce0",
  soft: "#f8f9fa",
  blue: "#4285F4",
  white: "#ffffff",
};

const CATEGORIES = [
  {
    id: "product",
    label: "Product updates",
    Icon: Sparkles,
    subject: "updates",
    helper: "New capabilities, improvements, and important changes.",
  },
  {
    id: "language",
    label: "Languages & access",
    Icon: Languages,
    subject: "languages",
    helper: "New language experiences and accessibility improvements.",
  },
  {
    id: "research",
    label: "Research & learning",
    Icon: BookOpen,
    subject: "research",
    helper: "Findings and thinking behind the product.",
  },
  {
    id: "community",
    label: "Community & events",
    Icon: UsersRound,
    subject: "community",
    helper: "Conversations, workshops, and upcoming events.",
  },
];

function scrollToSignup() {
  document.getElementById("signup")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function SectionHead({ id, title, linkLabel, onLink }) {
  return (
    <div className="mb-10 sm:mb-12">
      <h2 id={id} className="text-[30px] font-normal leading-[1.15] tracking-[-0.025em] sm:text-[36px] lg:text-[42px]" style={{ color: COLORS.ink }}>
        {title}
      </h2>
      {linkLabel && (
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={onLink}
            className="inline-flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.12em] transition-colors hover:text-[#4285F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-sm"
            style={{ color: COLORS.ink }}>
            {linkLabel}
            <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>
      )}
    </div>
  );
}

/* A-pattern card: the label IS the card. Press = pick the category, go to the form. */
function CategoryCard({ category, onPick }) {
  return (
    <button type="button" onClick={() => onPick(category.id)} aria-label={`Sign up for ${category.label}`}
      className="group relative flex min-h-[176px] w-full flex-col rounded-[16px] border bg-white p-7 text-left transition-all duration-300 hover:shadow-[0_1px_6px_rgba(32,33,36,0.1)] hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
      style={{ borderColor: COLORS.mist }}>
      <span className="text-[16px] font-medium leading-[1.4] tracking-[0]" style={{ color: COLORS.ink }}>
        {category.label}
      </span>
      <ArrowRight className="absolute right-6 top-7 h-[18px] w-[18px] transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-[#4285F4]" strokeWidth={1.7} style={{ color: COLORS.lightGrey }} />
      {/* flat corner illustration — the capture's signature */}
      <SpotIllustration subject={category.subject} className="absolute bottom-3 right-4 h-[92px] w-[92px]" />
    </button>
  );
}

/* J-pattern toggle row: icon tile + label + one-line helper + checkbox. */
function ToggleRow({ category, checked, onToggle }) {
  const { Icon } = category;
  return (
    <button type="button" role="checkbox" aria-checked={checked} onClick={() => onToggle(category.id)}
      className="flex w-full items-center gap-4 border-b py-6 text-left transition-colors last:border-b-0 hover:bg-[#f8f9fa]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] sm:gap-5"
      style={{ borderColor: COLORS.mist }}>
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border bg-white" style={{ borderColor: COLORS.mist, color: COLORS.blue }}>
        <Icon className="h-5 w-5" strokeWidth={1.7} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-medium leading-[1.4]" style={{ color: COLORS.ink }}>{category.label}</span>
        <span className="mt-1 block text-[14px] leading-[1.55]" style={{ color: COLORS.grey }}>{category.helper}</span>
      </span>
      <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors"
        style={{ borderColor: checked ? COLORS.blue : COLORS.mist, backgroundColor: checked ? COLORS.blue : COLORS.white }}>
        {checked && <Check className="h-4 w-4" strokeWidth={2.2} style={{ color: COLORS.white }} />}
      </span>
    </button>
  );
}

export default function UpdatesPage() {
  const [selected, setSelected] = useState(["product", "language"]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function toggleOption(id) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  /* Card press = make sure the category is picked, then jump to the form. */
  function pickAndGo(id) {
    setSelected((current) => (current.includes(id) ? current : [...current, id]));
    scrollToSignup();
  }

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
      <Breadcrumb page="Updates" />
      <main id="main">
        {/* HERO — breadcrumb already sits above; huge light H1, one line, one CTA.
            Same 1240px container as the sections: H1, breadcrumb and content share
            one left edge (the blog.google alignment). */}
        <section className="px-6 pb-20 pt-6 sm:px-8 sm:pb-24 lg:px-10 lg:pb-28 lg:pt-10">
          <div className="mx-auto max-w-[1240px]">
            <h1 className="max-w-[960px] text-[48px] font-normal leading-[1.06] tracking-[-0.045em] sm:text-[64px] lg:text-[76px]" style={{ color: COLORS.ink }}>
              Stay connected
            </h1>
            <p className="mt-6 max-w-[680px] text-[18px] leading-[1.6] sm:text-[20px]" style={{ color: COLORS.grey }}>
              Hear about product changes, new languages, research, and events.
            </p>
            <div className="mt-8">
              <button type="button" onClick={scrollToSignup}
                className="inline-flex h-12 items-center justify-center rounded-full px-7 text-[15px] font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 active:scale-[0.98]"
                style={{ backgroundColor: COLORS.blue }}>
                Get updates
              </button>
            </div>
          </div>
        </section>

        {/* WHAT YOU WILL RECEIVE — flat card grid, trailing empty cells */}
        <section aria-labelledby="updates-categories" className="px-6 pb-24 sm:px-8 lg:px-10 lg:pb-32">
          <div className="mx-auto max-w-[1240px]">
            <SectionHead id="updates-categories" title="What you will receive" linkLabel="Sign up" onLink={scrollToSignup} />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {CATEGORIES.map((category) => (
                <CategoryCard key={category.id} category={category} onPick={pickAndGo} />
              ))}
              <div aria-hidden="true" className="hidden lg:block" />
              <div aria-hidden="true" className="hidden lg:block" />
            </div>
          </div>
        </section>

        {/* CHOOSE YOUR UPDATES — hairline toggle rows, not cards */}
        <section aria-labelledby="updates-choose" className="px-6 pb-24 sm:px-8 lg:px-10 lg:pb-32">
          <div className="mx-auto max-w-[1240px]">
            <SectionHead id="updates-choose" title="Choose your updates" />
            <p className="-mt-4 mb-8 max-w-[560px] text-[15px] leading-[1.6]" style={{ color: COLORS.grey }}>
              Select the email you want. Change it any time.
            </p>
            <div role="group" aria-label="Update categories" className="border-t" style={{ borderColor: COLORS.mist }}>
              {CATEGORIES.map((category) => (
                <ToggleRow key={category.id} category={category} checked={selected.includes(category.id)} onToggle={toggleOption} />
              ))}
            </div>
          </div>
        </section>

        {/* SIGN UP — form, then the privacy one-liner */}
        <section id="signup" aria-labelledby="updates-signup" className="scroll-mt-24 px-6 pb-20 sm:px-8 lg:px-10 lg:pb-28">
          <div className="mx-auto max-w-[1240px]">
            <SectionHead id="updates-signup" title="Sign up" />
            <p className="-mt-4 mb-8 max-w-[560px] text-[15px] leading-[1.6]" style={{ color: COLORS.grey }}>
              Tell us where to send the updates you chose.
            </p>
            <div className="max-w-[880px] rounded-[24px] border bg-white p-6 sm:p-10" style={{ borderColor: COLORS.mist }}>
              {submitted ? (
                <div className="py-6" role="status">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[16px] border bg-white" style={{ borderColor: COLORS.mist, color: COLORS.blue }}>
                    <CheckCircle2 className="h-5 w-5" strokeWidth={1.7} />
                  </div>
                  <h3 className="mt-6 text-[28px] font-normal tracking-[-0.025em]" style={{ color: COLORS.ink }}>
                    You are on the list.
                  </h3>
                  <p className="mt-3 max-w-[560px] text-[15px] leading-[1.7]" style={{ color: COLORS.grey }}>
                    Your preferences are saved. Email delivery starts at launch.
                  </p>
                  <button type="button" onClick={() => setSubmitted(false)}
                    className="mt-6 inline-flex items-center gap-2 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-sm"
                    style={{ color: COLORS.blue }}>
                    Change your preferences
                    <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="updates-name" className="block text-[13px] font-medium" style={{ color: COLORS.ink }}>Name</label>
                      <input id="updates-name" name="name" type="text" autoComplete="name" required value={name}
                        onChange={(event) => setName(event.target.value)}
                        className="mt-2 h-12 w-full rounded-[14px] border bg-white px-4 text-[15px] outline-none transition-colors focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20"
                        style={{ borderColor: COLORS.mist, color: COLORS.ink }} />
                    </div>
                    <div>
                      <label htmlFor="updates-email" className="block text-[13px] font-medium" style={{ color: COLORS.ink }}>Email</label>
                      <input id="updates-email" name="email" type="email" autoComplete="email" required value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="mt-2 h-12 w-full rounded-[14px] border bg-white px-4 text-[15px] outline-none transition-colors focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20"
                        style={{ borderColor: COLORS.mist, color: COLORS.ink }} />
                    </div>
                  </div>

                  {/* "Posted in:" chips — the categories you chose */}
                  <div className="mt-8">
                    <div className="text-[13px] font-medium" style={{ color: COLORS.ink }}>You will receive</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {CATEGORIES.map((category) => {
                        const active = selected.includes(category.id);
                        return (
                          <button key={category.id} type="button" onClick={() => toggleOption(category.id)} aria-pressed={active}
                            className="inline-flex h-9 items-center gap-2 rounded-full border px-4 text-[13px] transition-colors hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                            style={{ borderColor: active ? COLORS.blue : COLORS.mist, color: active ? COLORS.ink : COLORS.grey, backgroundColor: active ? COLORS.white : COLORS.white }}>
                            {active && <Check className="h-3.5 w-3.5" strokeWidth={2.2} style={{ color: COLORS.blue }} />}
                            {category.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <label className="mt-8 flex items-start gap-3">
                    <input type="checkbox" required checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 h-4 w-4 accent-[#4285F4]" />
                    <span className="text-[13px] leading-[1.65]" style={{ color: COLORS.grey }}>
                      I agree to receive the updates I selected. I can unsubscribe any time.
                    </span>
                  </label>

                  <div className="mt-8">
                    <button type="submit"
                      className="inline-flex h-12 items-center justify-center rounded-full px-7 text-[15px] font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 active:scale-[0.98]"
                      style={{ backgroundColor: COLORS.blue }}>
                      Get updates
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* L one-liner: privacy */}
            <p className="mt-6 max-w-[880px] text-[13px] leading-[1.6]" style={{ color: COLORS.grey }}>
              We use your information according to the Visionary{" "}
              <Link to="/privacy" className="underline underline-offset-2 transition-colors hover:text-[#4285F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] rounded-sm" style={{ color: COLORS.grey }}>
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </section>

        {/* CONTACT one-liner */}
        <section aria-label="Contact" className="border-t px-6 py-14 sm:px-8 lg:px-10" style={{ borderColor: COLORS.mist }}>
          <div className="mx-auto flex max-w-[1240px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[15px]" style={{ color: COLORS.grey }}>Questions about updates?</p>
            <a href="mailto:hello@visionary.org.in"
              className="inline-flex w-fit items-center gap-2 text-[15px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 rounded-sm"
              style={{ color: COLORS.blue }}>
              hello@visionary.org.in
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
            </a>
          </div>
        </section>
      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}
