import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight, BookOpen, Briefcase, Building2,
  CircleHelp, GraduationCap, Lock, Mail, Newspaper, ShieldCheck,
  TrendingUp, UserRound, UsersRound,
} from "lucide-react";

import LandingNav from "@/components/landing/LandingNav";
import Breadcrumb from "@/components/landing/Breadcrumb";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingFAQ from "@/components/landing/LandingFAQ";
import { GRIEVANCE_OFFICER, RESPONSE_TIMES } from "@/data/legalMeta";

/* ═══ Tokens — the shared Material dialect (#202124 ink, #1a73e8/#0b57d0
   actions, #e8eaed hairlines, pill buttons, rounded-2xl cards). ═══ */
const FONT = "'Google Sans Flex', 'Google Sans', system-ui, sans-serif";

/* Contact routes — real mailboxes (preserved from the page). */
const CONTACT_ROUTES = [
  { Icon: Mail, category: "Product and account questions", title: "A question about Visionary?", description: "For general questions about the product, your account, or getting started.", email: "hello@visionary.org.in", subject: "General question" },
  { Icon: Building2, category: "Schools and organizations", title: "Discuss an organization", description: "For schools, colleges, coaching teams, and organizations exploring Visionary.", email: "partnerships@visionary.org.in", subject: "Organization enquiry" },
  { Icon: ShieldCheck, category: "Safety and privacy", title: "Share a safety concern", description: "Contact the safety team about a safety or privacy concern. For a formal privacy grievance, use the named officer details below.", email: "safety@visionary.org.in", subject: "Safety or privacy concern" },
  { Icon: Newspaper, category: "Press and media", title: "A media enquiry", description: "For journalists, writers, and others with press or media questions.", email: "press@visionary.org.in", subject: "Press enquiry" },
  { Icon: BookOpen, category: "Research", title: "Talk about research", description: "For questions about the learning questions Visionary is exploring.", email: "research@visionary.org.in", subject: "Research enquiry" },
  { Icon: UserRound, category: "Careers", title: "Introduce yourself", description: "There are no public vacancies listed right now. For a general introduction, write to the team; this is not a job application portal.", email: "hello@visionary.org.in", subject: "Careers introduction" },
];

/* Audience tabs — the reference's product-tab bar, mapped to our roles.
   Each tab switches the four resource cards below it. */
const TABS = [
  {
    id: "students", label: "Students",
    heading: "Get help learning with Visionary",
    cards: [
      { Icon: CircleHelp, label: "Help center", title: "Your guide to Visionary", to: "/help" },
      { Icon: BookOpen, label: "Product", title: "The learning loop: Learn, Ask, Practice, Build", to: "/student" },
      { Icon: UsersRound, label: "Community", title: "Class communities and discussions", to: "/community" },
      { Icon: ShieldCheck, label: "Safety", title: "Safety for younger learners", to: "/safety" },
    ],
  },
  {
    id: "teachers", label: "Teachers",
    heading: "Get help teaching with Visionary",
    cards: [
      { Icon: CircleHelp, label: "Help center", title: "Your guide to Visionary", to: "/help" },
      { Icon: BookOpen, label: "Product", title: "Prepare, publish, and review classwork", to: "/teacher" },
      { Icon: UsersRound, label: "Community", title: "Moderated class communities", to: "/community" },
      { Icon: ShieldCheck, label: "Safety", title: "Reporting and rate limits", to: "/safety" },
    ],
  },
  {
    id: "parents", label: "Parents",
    heading: "Get help supporting your child",
    cards: [
      { Icon: CircleHelp, label: "Help center", title: "Your guide to Visionary", to: "/help" },
      { Icon: GraduationCap, label: "Product", title: "Consent-scoped progress summaries", to: "/parent" },
      { Icon: Lock, label: "Privacy", title: "How learner data is protected", to: "/privacy" },
      { Icon: ShieldCheck, label: "Safety", title: "Safer use for children", to: "/safety" },
    ],
  },
  {
    id: "professionals", label: "Professionals",
    heading: "Get help growing your career",
    cards: [
      { Icon: CircleHelp, label: "Help center", title: "Your guide to Visionary", to: "/help" },
      { Icon: Briefcase, label: "Product", title: "Goal, evidence, and portfolio", to: "/professional" },
      { Icon: TrendingUp, label: "Updates", title: "Follow what is changing", to: "/updates" },
      { Icon: UserRound, label: "Careers", title: "Build with the team", to: "/careers" },
    ],
  },
  {
    id: "organizations", label: "Organizations",
    heading: "Get help bringing Visionary to your institution",
    cards: [
      { Icon: CircleHelp, label: "Help center", title: "Your guide to Visionary", to: "/help" },
      { Icon: UsersRound, label: "Product", title: "Insights across cohorts", to: "/organization" },
      { Icon: Building2, label: "Partners", title: "Rollout and partnerships", to: "/partners" },
      { Icon: Lock, label: "Security", title: "Protected end to end", to: "/security" },
    ],
  },
];

/* FAQs — answers grounded in RESPONSE_TIMES and real product behavior. */
const FAQS = [
  { q: "How quickly will I get a reply?", a: RESPONSE_TIMES.general + " " + RESPONSE_TIMES.partners },
  { q: "What should I include in my message?", a: "Tell us what you were doing, what you expected, and what happened instead — with links or screenshots if they help. Please never include passwords, payment details, or sensitive learner information." },
  { q: "Who do I contact about a safety concern?", a: "Write to safety@visionary.org.in. " + RESPONSE_TIMES.safety },
  { q: "How do privacy grievances work?", a: "Under India's DPDP Act, 2023, write to the named Grievance Officer at grievance@visionary.org.in. " + RESPONSE_TIMES.grievance },
  { q: "Can we bring Visionary to our school or organization?", a: "Yes — write to partnerships@visionary.org.in about rollouts for schools, colleges, coaching institutes, and workplaces." },
  { q: "Where do I find product answers on my own?", a: "The Help Center covers setup and features, and the how-it-works page explains the learning loop end to end." },
  { q: "In which languages can I write to you?", a: "The product's language journeys are English, Hindi, and Bengali today, and the team can reply in all three. More languages are on the roadmap." },
  { q: "How do I introduce myself for a role?", a: "Write to hello@visionary.org.in with the work you are interested in. There are no public vacancies right now, and an introduction is not an application to a listed role." },
];

/* ═══ Motion — the shared reveal grammar ═══ */
function Reveal({ children, className = "" }) {
  return <div className={`transition duration-700 ease-out ${className}`}>{children}</div>;
}

function EmailLink({ email, subject, children = email, className = "" }) {
  return (
    <a href={`mailto:${email}?subject=${encodeURIComponent(subject)}`} className={`inline-flex min-h-11 items-center gap-2 break-all rounded-sm text-[14px] font-medium text-[#0b57d0] transition-colors hover:text-[#1765cc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] ${className}`}>
      {children} <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
    </a>
  );
}

function ResourceCard({ Icon, label, title, to }) {
  return (
    <Link to={to} className="group relative flex min-h-[208px] flex-col overflow-hidden rounded-2xl g-card bg-white p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[#1a73e8] text-[#1a73e8]">
        <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
      </span>
      <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#5f6368]">{label}</p>
      <h4 className="mt-1.5 max-w-[220px] text-[16px] font-medium leading-[1.4] text-[#202124]">{title}</h4>
      {/* google.com card curve — tint sweeps into the corner and the card's arrow floats in it with breath */}
      <div aria-hidden="true" className="absolute bottom-0 right-0 h-[56px] w-[92px] rounded-tl-[20px] bg-[#e8f0fe]" />
      <span className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#1a73e8] text-white transition-transform duration-300 group-hover:scale-110 motion-reduce:transform-none" aria-hidden="true">
        <ArrowUpRight className="h-4 w-4" />
      </span>
    </Link>
  );
}

export default function ContactPage() {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const tab = TABS.find((t) => t.id === activeTab);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT }}>
      <LandingNav />
      <main id="main">
        <Breadcrumb page="Contact" />

        {/* HERO — the support-page statement: centered heading, sub, and an
            outlined Help Center pill */}
        <section className="px-6 pb-14 pt-10 text-center sm:px-8 lg:px-10 lg:pb-16 lg:pt-16">
          <Reveal className="mx-auto max-w-[880px]">
            <h1 className="text-[clamp(34px,5.5vw,58px)] font-normal leading-[1.05] tracking-[-0.045em] text-[#202124]">
              Guidance to get you going on Visionary
            </h1>
            <p className="mx-auto mt-6 max-w-[680px] text-[17px] leading-[1.6] text-[#5f6368] sm:text-[18px]">
              Find the answers and support you need to make the most of Visionary.
            </p>
            <div className="mt-8 flex justify-center">
              <Link to="/help" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#dadce0] bg-white px-5 text-[14px] font-medium text-[#0b57d0] transition-colors hover:bg-[#f1f3f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]">
                Help Center <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
        </section>

        {/* AUDIENCE TABS + RESOURCE CARDS — the reference's product-tab bar */}
        <section id="resources" className="scroll-mt-32 px-6 pb-16 sm:px-8 lg:px-10 lg:pb-24">
          <Reveal className="mx-auto max-w-[1240px]">
            <div className="flex justify-center">
              <div role="tablist" aria-label="Choose your role" className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full bg-[#f1f3f4] p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {TABS.map((t) => (
                  <button key={t.id} type="button" role="tab" aria-selected={activeTab === t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`shrink-0 rounded-full px-5 py-2.5 text-[14px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] ${
                      activeTab === t.id ? "bg-white text-[#202124] shadow-[0_1px_3px_rgba(60,64,67,0.2)]" : "text-[#5f6368] hover:text-[#202124]"
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mx-auto mt-14 max-w-[780px] text-center">
              <h2 className="text-[36px] font-normal leading-[1.12] tracking-[-0.03em] text-[#202124] sm:text-[46px]">
                {tab.heading}
              </h2>
              <p className="mx-auto mt-4 max-w-[620px] text-[15px] leading-[1.65] text-[#5f6368] sm:text-[16px]">
                From how-to guides to safety and community, these resources help you make the most of Visionary.
              </p>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {tab.cards.map((card) => (
                <ResourceCard key={card.title} {...card} />
              ))}
            </div>
            <div className="mt-12 flex justify-center">
              <Link to="/how-it-works" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#dadce0] bg-white px-5 text-[14px] font-medium text-[#0b57d0] transition-colors hover:bg-[#f1f3f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]">
                More Visionary resources <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
        </section>

        {/* YOUR QUESTIONS ANSWERED — FAQ with expand-all and show-more */}
        <section id="faq" className="scroll-mt-32 border-t border-[#e8eaed] px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <Reveal className="mx-auto max-w-[840px]">
            <div className="text-center">
              <h2 className="text-[36px] font-normal leading-[1.12] tracking-[-0.03em] text-[#202124] sm:text-[46px]">
                Your questions answered
              </h2>
              <p className="mx-auto mt-4 max-w-[560px] text-[15px] leading-[1.65] text-[#5f6368] sm:text-[16px]">
                From the basics to beyond — information and support on the topics we hear most.
              </p>
              <div className="mt-6 flex justify-center">
                <Link to="/help" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#dadce0] bg-white px-5 text-[14px] font-medium text-[#0b57d0] transition-colors hover:bg-[#f1f3f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]">
                  Help Center <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
            <div className="mt-12">
              <LandingFAQ
                faqs={FAQS}
                multiple={true}
                showExpandAll={true}
                visibleCount={5}
                expandAllLabel="Expand all"
                collapseAllLabel="Collapse all"
                showMoreLabel="Show more"
              />
            </div>
          </Reveal>
        </section>

        {/* STILL NEED HELP? — the grey band */}
        <section className="bg-[#f8f9fa] px-6 py-16 sm:px-8 lg:px-10 lg:py-20">
          <Reveal className="mx-auto flex max-w-[1240px] flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-[40px] font-normal leading-[1.08] tracking-[-0.035em] text-[#202124] sm:text-[52px]">
                Still need help?
              </h2>
              <p className="mt-4 max-w-[560px] text-[16px] leading-[1.65] text-[#5f6368]">
                For additional guidance, visit the Help Center — or write to us directly and a human will read it.
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
              <Link to="/help" className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#dadce0] bg-white px-6 text-[14px] font-medium text-[#202124] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8] shadow-[0_1px_3px_rgba(60,64,67,0.15)]">
                Visit Help Center
              </Link>
              <EmailLink email="hello@visionary.org.in" subject="Support question" />
            </div>
          </Reveal>
        </section>

        {/* CONTACT ROUTES — the real mailboxes */}
        <section id="routes" className="scroll-mt-32 px-6 py-20 sm:px-8 lg:px-10 lg:py-28">
          <Reveal className="mx-auto max-w-[1240px]">
            <div className="max-w-[680px]">
              <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#5f6368]">Contact routes</p>
              <h2 className="mt-3 text-[32px] font-normal leading-[1.15] tracking-[-0.03em] text-[#202124] sm:text-[42px]">Start with what you need.</h2>
              <p className="mt-4 text-[16px] leading-[1.75] text-[#5f6368]">Each option opens a message in your email app, addressed to the relevant team. {RESPONSE_TIMES.general}</p>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CONTACT_ROUTES.map(({ Icon, category, title, description, email, subject }) => (
                <article key={category} className="flex min-h-[262px] flex-col rounded-2xl g-card bg-white p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[#1a73e8] text-[#1a73e8]">
                    <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#5f6368]">{category}</p>
                  <h3 className="mt-1.5 text-[17px] font-medium leading-[1.35] text-[#202124]">{title}</h3>
                  <p className="mt-2 flex-1 text-[14px] leading-[1.6] text-[#5f6368]">{description}</p>
                  <EmailLink email={email} subject={subject} className="mt-4">{email}</EmailLink>
                </article>
              ))}
            </div>
          </Reveal>
        </section>

        {/* PRIVACY GRIEVANCE — the formal DPDP route */}
        <section id="grievance" className="scroll-mt-32 border-t border-[#e8eaed] bg-[#f8f9fa] px-6 py-20 sm:px-8 lg:px-10 lg:py-24">
          <Reveal className="mx-auto grid max-w-[1240px] gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#5f6368]">Privacy grievance</p>
              <h2 className="mt-3 text-[30px] font-normal leading-[1.2] tracking-[-0.025em] text-[#202124] sm:text-[38px]">A formal route for privacy concerns.</h2>
              <p className="mt-4 max-w-[420px] text-[15px] leading-[1.75] text-[#5f6368]">For a privacy grievance under India's DPDP Act, contact the named Grievance Officer directly.</p>
            </div>
            <div className="rounded-2xl g-card bg-white p-6 sm:p-8">
              <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#5f6368]">{GRIEVANCE_OFFICER.role}</p>
              <h3 className="mt-3 text-[22px] font-normal text-[#202124]">{GRIEVANCE_OFFICER.name}</h3>
              <p className="mt-3 max-w-[650px] text-[14px] leading-[1.7] text-[#5f6368]">{GRIEVANCE_OFFICER.response}</p>
              <EmailLink email={GRIEVANCE_OFFICER.email} subject="Privacy grievance" className="mt-4" />
            </div>
          </Reveal>
        </section>

        {/* BEFORE YOU SEND — honest email hygiene */}
        <section className="px-6 py-16 sm:px-8 lg:px-10 lg:py-20">
          <Reveal className="mx-auto grid max-w-[1240px] gap-8 md:grid-cols-2 md:gap-12">
            <div>
              <h2 className="text-[20px] font-medium text-[#202124]">Before you send</h2>
              <p className="mt-3 text-[14px] leading-[1.75] text-[#5f6368]">Your email app will open a draft. Review the recipient and message, then choose whether to send it. Nothing is submitted to Visionary from this page.</p>
            </div>
            <div>
              <h2 className="text-[20px] font-medium text-[#202124]">Keep sensitive details out</h2>
              <p className="mt-3 text-[14px] leading-[1.75] text-[#5f6368]">Do not include passwords, payment card details, or sensitive learner information in an email. For information about personal data, read the <Link to="/privacy" className="font-medium text-[#0b57d0] underline underline-offset-2">Privacy policy</Link>.</p>
            </div>
          </Reveal>
        </section>

      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}
