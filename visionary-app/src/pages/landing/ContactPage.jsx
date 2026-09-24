import { ArrowRight, ArrowUpRight, BookOpen, Building2, Mail, Newspaper, ShieldCheck, UserRound } from "lucide-react";
import { Link } from "react-router-dom";

import LandingNav from "@/components/landing/LandingNav";
import PageHeading from "@/components/landing/PageHeading";
import LandingFooter from "@/components/landing/LandingFooter";
import { GRIEVANCE_OFFICER } from "@/data/legalMeta";

const FONT_FAMILY = "'Google Sans Flex', 'Google Sans', system-ui, sans-serif";

const CONTACT_ROUTES = [
  {
    Icon: Mail,
    category: "Product and account questions",
    title: "A question about Visionary?",
    description: "For general questions about the product, your account, or getting started.",
    email: "hello@visionary.org.in",
    subject: "General question",
  },
  {
    Icon: Building2,
    category: "Schools and organizations",
    title: "Discuss an organization",
    description: "For schools, colleges, coaching teams, and organizations exploring Visionary.",
    email: "partnerships@visionary.org.in",
    subject: "Organization enquiry",
  },
  {
    Icon: ShieldCheck,
    category: "Safety and privacy",
    title: "Share a safety concern",
    description: "Contact the safety team about a safety or privacy concern. For a formal privacy grievance, use the named officer details below.",
    email: "safety@visionary.org.in",
    subject: "Safety or privacy concern",
  },
  {
    Icon: Newspaper,
    category: "Press and media",
    title: "A media enquiry",
    description: "For journalists, writers, and others with press or media questions.",
    email: "press@visionary.org.in",
    subject: "Press enquiry",
  },
  {
    Icon: BookOpen,
    category: "Research",
    title: "Talk about research",
    description: "For questions about the learning questions Visionary is exploring.",
    email: "research@visionary.org.in",
    subject: "Research enquiry",
  },
  {
    Icon: UserRound,
    category: "Careers",
    title: "Introduce yourself",
    description: "There are no public vacancies listed right now. For a general introduction, write to the team; this is not a job application portal.",
    email: "hello@visionary.org.in",
    subject: "Careers introduction",
  },
];

function EmailLink({ email, subject, children = email, className = "" }) {
  const href = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
  return (
    <a href={href} className={`inline-flex min-h-11 items-center gap-2 text-[14px] font-medium text-[#1967d2] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] ${className}`}>
      {children} <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
    </a>
  );
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
      <main id="main">
        <PageHeading
          page="Contact"
          eyebrow="Contact Visionary"
          h1={<>How can we <span className="text-[#4285F4]">help?</span></>}
          dek="Choose the contact route that best fits your question."
        >
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a href="#contact-routes" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#4285F4] px-6 text-[15px] font-medium text-white transition-colors hover:bg-[#3367d6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2">
              Find the right team <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <Link to="/help" className="inline-flex h-12 items-center gap-2 rounded-full px-5 text-[15px] font-medium text-[#121317] hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]">
              Browse help topics <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </PageHeading>

        <section id="contact-routes" className="scroll-mt-24 border-y border-[#dadce0] bg-[#f8f9fa] px-6 py-14 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <div className="mx-auto max-w-[1240px]">
            <div className="max-w-[680px]">
              <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#5f6368]">Contact routes</p>
              <h2 className="mt-3 text-[32px] font-normal leading-[1.15] tracking-[-0.03em] text-[#121317] sm:text-[42px]">Start with what you need.</h2>
              <p className="mt-4 text-[16px] leading-[1.75] text-[#5f6368]">Each option opens a message in your email app, addressed to the relevant team.</p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CONTACT_ROUTES.map(({ Icon, category, title, description, email, subject }) => (
                <article key={category} className="flex min-h-[278px] flex-col rounded-[22px] border border-[#dadce0] bg-white p-6 sm:p-7">
                  <span className="flex h-12 w-12 items-center justify-center rounded-[16px] border border-[#dadce0] text-[#4285F4]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <p className="mt-6 text-[12px] font-medium uppercase tracking-[0.14em] text-[#5f6368]">{category}</p>
                  <h3 className="mt-2 text-[20px] font-normal leading-[1.35] text-[#121317]">{title}</h3>
                  <p className="mt-3 flex-1 text-[14px] leading-[1.7] text-[#5f6368]">{description}</p>
                  <EmailLink email={email} subject={subject} className="mt-5 break-all">{email}</EmailLink>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="grievance" className="scroll-mt-24 px-6 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <div className="mx-auto grid max-w-[1240px] gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#5f6368]">Privacy grievance</p>
              <h2 className="mt-3 text-[30px] font-normal leading-[1.2] tracking-[-0.025em] text-[#121317] sm:text-[38px]">A formal route for privacy concerns.</h2>
              <p className="mt-4 text-[15px] leading-[1.75] text-[#5f6368]">For a privacy grievance under India’s DPDP Act, contact the named Grievance Officer directly.</p>
            </div>
            <div className="rounded-[22px] border border-[#dadce0] p-6 sm:p-8">
              <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#5f6368]">{GRIEVANCE_OFFICER.role}</p>
              <h3 className="mt-3 text-[22px] font-normal text-[#121317]">{GRIEVANCE_OFFICER.name}</h3>
              <p className="mt-3 max-w-[650px] text-[14px] leading-[1.7] text-[#5f6368]">{GRIEVANCE_OFFICER.response}</p>
              <EmailLink email={GRIEVANCE_OFFICER.email} subject="Privacy grievance" className="mt-4 break-all" />
            </div>
          </div>
        </section>

        <section id="before-writing" className="scroll-mt-24 border-y border-[#dadce0] bg-[#f8f9fa] px-6 py-14 sm:px-8 sm:py-16 lg:px-10">
          <div className="mx-auto grid max-w-[1240px] gap-8 md:grid-cols-2 md:gap-12">
            <div>
              <h2 className="text-[22px] font-normal text-[#121317]">Before you send</h2>
              <p className="mt-3 text-[14px] leading-[1.75] text-[#5f6368]">Your email app will open a draft. Review the recipient and message, then choose whether to send it. Nothing is submitted to Visionary from this page.</p>
            </div>
            <div>
              <h2 className="text-[22px] font-normal text-[#121317]">Keep sensitive details out</h2>
              <p className="mt-3 text-[14px] leading-[1.75] text-[#5f6368]">Do not include passwords, payment card details, or sensitive learner information in an email. For information about personal data, read the <Link to="/privacy" className="font-medium text-[#1967d2] underline underline-offset-2">Privacy policy</Link>.</p>
            </div>
          </div>
        </section>

        <section className="px-6 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <div className="mx-auto flex max-w-[1240px] flex-col gap-6 rounded-[24px] border border-[#dadce0] p-7 sm:p-9 md:flex-row md:items-center md:justify-between">
            <div className="max-w-[680px]">
              <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#5f6368]">Self-service</p>
              <h2 className="mt-3 text-[27px] font-normal leading-[1.2] tracking-[-0.02em] text-[#121317] sm:text-[32px]">Looking for product information?</h2>
              <p className="mt-3 text-[14px] leading-[1.7] text-[#5f6368]">Explore Visionary’s help topics, product overview, and current updates.</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Link to="/help" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#4285F4] px-5 text-[14px] font-medium text-white hover:bg-[#3367d6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2">Help topics <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
              <Link to="/updates" className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#dadce0] px-5 text-[14px] font-medium text-[#121317] hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]">Updates <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}
