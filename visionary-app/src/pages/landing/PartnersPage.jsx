import { ArrowRight, ArrowUpRight, BookOpen, Building2, Code2, Globe2, Handshake } from "lucide-react";
import { Link } from "react-router-dom";

import LandingNav from "@/components/landing/LandingNav";
import PageHeading from "@/components/landing/PageHeading";
import LandingFooter from "@/components/landing/LandingFooter";

const FONT_FAMILY = "'Google Sans Flex', 'Google Sans', system-ui, sans-serif";

const COLLABORATION_AREAS = [
  {
    Icon: BookOpen,
    label: "Education",
    title: "Learning in context",
    description: "Schools, educators, and learning organizations can share the settings and needs they want us to understand.",
  },
  {
    Icon: Code2,
    label: "Technology",
    title: "Ideas for working together",
    description: "Technology teams can explore integrations that make learning, identity, or administration easier to connect.",
  },
  {
    Icon: Globe2,
    label: "Regional knowledge",
    title: "Local needs and language",
    description: "People with regional or language expertise can describe where existing learning experiences might not fit.",
  },
  {
    Icon: Building2,
    label: "Organizations",
    title: "Programs with a clear purpose",
    description: "Institutions and organizations can explore a partnership around a specific learning need, audience, or implementation goal.",
  },
];

function CollaborationCard({ Icon, label, title, description }) {
  return (
    <article className="flex h-full flex-col rounded-[20px] border border-[#dadce0] bg-white p-6 sm:p-7">
      <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#f1f3f4] text-[#1967d2]">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="mt-6 text-[12px] font-medium uppercase tracking-[0.13em] text-[#5f6368]">{label}</p>
      <h3 className="mt-2 text-[21px] font-normal leading-[1.3] tracking-[-0.02em] text-[#121317]">{title}</h3>
      <p className="mt-3 text-[14px] leading-[1.7] text-[#5f6368]">{description}</p>
    </article>
  );
}

function EmailLink({ subject, children }) {
  return (
    <a
      href={`mailto:partnerships@visionary.org.in?subject=${encodeURIComponent(subject)}`}
      className="inline-flex min-h-11 items-center gap-2 font-medium text-[#1967d2] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
    >
      {children}
      <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
    </a>
  );
}

export default function PartnersPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
      <main id="main">
        <PageHeading
          page="Partners"
          eyebrow="Partners"
          h1={<>Better learning, <span className="text-[#4285F4]">together.</span></>}
          dek="Bring education, technology, and local knowledge into the same work."
        >
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#partner-enquiry" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#1967d2] px-6 text-[15px] font-medium text-white hover:bg-[#1558b0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2">
              Discuss a partnership <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <a href="#find-a-partner" className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#dadce0] px-6 text-[15px] font-medium text-[#121317] hover:bg-[#f8f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]">
              Looking for a partner? <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </PageHeading>

        <section aria-labelledby="collaboration-title" className="border-y border-[#dadce0] bg-[#f8f9fa] px-6 py-14 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <div className="mx-auto max-w-[1240px]">
            <div className="max-w-[760px]">
              <p className="text-[12px] font-medium uppercase tracking-[0.15em] text-[#5f6368]">Ways to start a conversation</p>
              <h2 id="collaboration-title" className="mt-3 text-[32px] font-normal leading-[1.15] tracking-[-0.03em] text-[#121317] sm:text-[42px]">Partnership starts with context.</h2>
              <p className="mt-4 text-[16px] leading-[1.75] text-[#5f6368]">Different organizations bring different knowledge. We begin by understanding the people involved, the learning context, and the result both teams want to create.</p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {COLLABORATION_AREAS.map((area) => <CollaborationCard key={area.label} {...area} />)}
            </div>
          </div>
        </section>

        <section id="partner-enquiry" aria-labelledby="enquiry-title" className="scroll-mt-24 px-6 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <div className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.15em] text-[#5f6368]">For prospective partners</p>
              <h2 id="enquiry-title" className="mt-3 text-[32px] font-normal leading-[1.15] tracking-[-0.03em] text-[#121317] sm:text-[40px]">Tell us what you have in mind.</h2>
              <p className="mt-4 text-[15px] leading-[1.75] text-[#5f6368]">Write to us with your organization, the people or learning context you work with, and the idea you would like to discuss. An email draft opens for you to review and send.</p>
              <EmailLink subject="Partnership enquiry">partnerships@visionary.org.in</EmailLink>
              <p className="mt-4 text-[13px] leading-[1.7] text-[#5f6368]">The partnerships team reviews each enquiry and follows up when the idea and timing fit the work.</p>
            </div>
            <div className="rounded-[22px] border border-[#dadce0] p-6 sm:p-8">
              <h3 className="text-[20px] font-normal text-[#121317]">A useful first note can include</h3>
              <ol className="mt-5 divide-y divide-[#dadce0]">
                <li className="flex gap-4 py-4 first:pt-0">
                  <span className="text-[13px] font-medium text-[#1967d2]">01</span>
                  <div><p className="text-[15px] font-medium text-[#121317]">Who you are</p><p className="mt-1 text-[14px] leading-[1.6] text-[#5f6368]">Organization name, role, and how we can reach you.</p></div>
                </li>
                <li className="flex gap-4 py-4">
                  <span className="text-[13px] font-medium text-[#1967d2]">02</span>
                  <div><p className="text-[15px] font-medium text-[#121317]">The context</p><p className="mt-1 text-[14px] leading-[1.6] text-[#5f6368]">Who you work with and the learning need or setting involved.</p></div>
                </li>
                <li className="flex gap-4 py-4 last:pb-0">
                  <span className="text-[13px] font-medium text-[#1967d2]">03</span>
                  <div><p className="text-[15px] font-medium text-[#121317]">The idea</p><p className="mt-1 text-[14px] leading-[1.6] text-[#5f6368]">What you hope to explore together—without sending sensitive learner details.</p></div>
                </li>
              </ol>
              <p className="mt-6 border-t border-[#dadce0] pt-5 text-[13px] leading-[1.7] text-[#5f6368]">The link opens your email app; this website does not submit or store the message.</p>
            </div>
          </div>
        </section>

        <section id="find-a-partner" aria-labelledby="directory-title" className="scroll-mt-24 border-y border-[#dadce0] bg-[#f8f9fa] px-6 py-14 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <div className="mx-auto grid max-w-[1240px] gap-8 md:grid-cols-[auto_1fr] md:items-start md:gap-8">
            <span className="flex h-12 w-12 items-center justify-center rounded-[15px] border border-[#dadce0] bg-white text-[#1967d2]"><Handshake className="h-5 w-5" aria-hidden="true" /></span>
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.15em] text-[#5f6368]">For organizations seeking support</p>
              <h2 id="directory-title" className="mt-3 text-[30px] font-normal leading-[1.2] tracking-[-0.025em] text-[#121317] sm:text-[38px]">Start with the support you need.</h2>
              <p className="mt-4 max-w-[760px] text-[15px] leading-[1.75] text-[#5f6368]">Tell us about your organization, location, and goal. We can explain the available Visionary options and, when appropriate, whether partner support is available for that need.</p>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
                <Link to="/contact" className="inline-flex min-h-11 items-center gap-2 text-[14px] font-medium text-[#1967d2] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]">Contact Visionary <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>
                <Link to="/help" className="inline-flex min-h-11 items-center gap-2 text-[14px] font-medium text-[#1967d2] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]">Browse help topics <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="terms-title" className="px-6 py-14 sm:px-8 sm:py-18 lg:px-10 lg:py-20">
          <div className="mx-auto max-w-[1240px] border-l-2 border-[#dadce0] pl-5 sm:pl-7">
            <h2 id="terms-title" className="text-[19px] font-normal text-[#121317]">Every partnership begins with shared expectations.</h2>
            <p className="mt-2 max-w-[800px] text-[14px] leading-[1.75] text-[#5f6368]">Scope, responsibilities, privacy, support, costs, and measures of success are agreed in writing before work begins. Sending an enquiry starts a conversation and does not create an endorsement or commercial agreement.</p>
          </div>
        </section>
      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}
