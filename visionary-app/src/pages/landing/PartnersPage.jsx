import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronRight,
  Globe2,
  GraduationCap,
  Handshake,
  Laptop,
  Lightbulb,
  MapPin,
  MessageCircle,
  Network,
  Settings2,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

const FONT_FAMILY =
  "'Google Sans Flex', 'Google Sans', system-ui, sans-serif";

const COLORS = {
  ink: "#121317",
  surface: "#ffffff",
  grey: "#5f6368",
  lightGrey: "#9aa0a6",
  mist: "#dadce0",
  border: "#e5e7eb",
  soft: "#f8f9fa",
  blue: "#4285F4",
  blueSoft: "#D2E3FC",
  white: "#ffffff",
};

const SECTIONS = [
  { id: "why-partner", number: "01", title: "Why work with a partner", summary: "When local knowledge, implementation, or support can make Visionary more useful." },
  { id: "what-partners-do", number: "02", title: "What partners can do", summary: "The practical ways partners can help institutions and communities." },
  { id: "education", number: "03", title: "Education partners", summary: "Bring Visionary closer to schools, colleges, coaching, and educators." },
  { id: "implementation", number: "04", title: "Implementation and support", summary: "Help organizations move from deciding to using Visionary." },
  { id: "technology", number: "05", title: "Technology and integration", summary: "Build useful connections around the Visionary experience." },
  { id: "regional", number: "06", title: "Regional partners", summary: "Help Visionary understand and serve local learning contexts." },
  { id: "who-partner", number: "07", title: "Who can become a partner", summary: "The kinds of organizations and people Visionary can work with." },
  { id: "what-we-look", number: "08", title: "What we look for", summary: "The principles that matter when choosing partners." },
  { id: "directory", number: "09", title: "Partner directory", summary: "Find partners as the network becomes available." },
  { id: "become", number: "10", title: "Become a partner", summary: "Introduce your organization and explain what you can contribute." },
  { id: "contact", number: "11", title: "Contact", summary: "How to reach Visionary about partnerships." },
];

function scrollToSection(id) {
  const element = document.getElementById(id);
  if (!element) return;
  element.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.replaceState(null, "", `#${id}`);
}

function SectionHeading({ number, title }) {
  return (
    <div className="mb-6">
      <div className="mb-3 text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.blue }}>{number}</div>
      <h2 className="text-[30px] font-normal leading-[1.2] tracking-[-0.025em] sm:text-[36px]" style={{ color: COLORS.ink }}>{title}</h2>
    </div>
  );
}

function Paragraph({ children }) {
  return (
    <p className="max-w-[760px] text-[16px] leading-[1.78] tracking-[0.005em]" style={{ color: COLORS.grey }}>{children}</p>
  );
}

function PartnerCard({ icon: Icon, eyebrow, title, description }) {
  return (
    <div className="flex h-full flex-col rounded-[22px] border bg-white p-6 sm:p-7" style={{ borderColor: COLORS.border }}>
      <div className="flex h-11 w-11 items-center justify-center rounded-[15px] border" style={{ borderColor: COLORS.mist, color: COLORS.blue }}>
        <Icon className="h-[19px] w-[19px]" strokeWidth={1.7} />
      </div>
      <div className="mt-5 text-[11px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.lightGrey }}>{eyebrow}</div>
      <h3 className="mt-1.5 text-[19px] font-normal leading-[1.3]" style={{ color: COLORS.ink }}>{title}</h3>
      <p className="mt-3 flex-1 text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>{description}</p>
    </div>
  );
}

function PrincipleRow({ icon: Icon, title, children }) {
  return (
    <div className="flex gap-4 border-b py-6 last:border-b-0" style={{ borderColor: COLORS.border }}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: COLORS.soft }}>
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} style={{ color: COLORS.blue }} />
      </div>
      <div>
        <h3 className="text-[17px] font-normal" style={{ color: COLORS.ink }}>{title}</h3>
        <p className="mt-2 max-w-[680px] text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>{children}</p>
      </div>
    </div>
  );
}

function Note({ children }) {
  return (
    <div className="mt-6 rounded-[18px] border px-5 py-5 sm:px-6" style={{ borderColor: COLORS.border, backgroundColor: COLORS.soft }}>
      <p className="text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>{children}</p>
    </div>
  );
}

const APPLICATION_TYPES = [
  "Education implementation",
  "Professional development",
  "Technology or integration",
  "Regional partnership",
  "Content or learning resources",
  "Other",
];

export default function PartnersPage() {
  const [activeId, setActiveId] = useState("why-partner");
  const [showMobileContents, setShowMobileContents] = useState(false);
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState(APPLICATION_TYPES[0]);
  const [website, setWebsite] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const activeSection = useMemo(
    () => SECTIONS.find((section) => section.id === activeId),
    [activeId]
  );

  useEffect(() => {
    const observers = [];
    SECTIONS.forEach((section) => {
      const element = document.getElementById(section.id);
      if (!element) return;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setActiveId(section.id);
          });
        },
        { rootMargin: "-18% 0px -65% 0px", threshold: 0.01 }
      );
      observer.observe(element);
      observers.push(observer);
    });
    return () => observers.forEach((observer) => observer.disconnect());
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (!hash || !SECTIONS.some((section) => section.id === hash)) return;
    requestAnimationFrame(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: "auto", block: "start" });
      setActiveId(hash);
    });
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: FONT_FAMILY }}>
      <LandingNav />
      <main id="main">
        {/* HERO */}
        <section className="border-b pt-28 sm:pt-32" style={{ borderColor: COLORS.border }}>
          <div className="mx-auto max-w-[1240px] px-6 pb-16 sm:px-8 sm:pb-20 lg:px-10 lg:pb-24">
            <div className="max-w-[1000px]">
              <div className="mb-5 flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.grey }}>
                <Handshake className="h-4 w-4" strokeWidth={1.7} />
                Find a Partner
              </div>
              <h1 className="max-w-[960px] text-[48px] font-normal leading-[1.06] tracking-[-0.045em] sm:text-[64px] lg:text-[76px]" style={{ color: COLORS.ink }}>
                Bring Visionary
                <br />
                <span style={{ color: COLORS.blue }}>closer to where learning happens.</span>
              </h1>
              <p className="mt-8 max-w-[800px] text-[18px] leading-[1.6] tracking-[0.005em] sm:text-[20px]" style={{ color: COLORS.grey }}>
                The right partner can make a product more useful in a particular school, institution, region, or learning environment. Visionary is building partnerships around that idea.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a href="#directory" onClick={(event) => { event.preventDefault(); scrollToSection("directory"); }}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-[15px] font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 active:scale-[0.98]"
                  style={{ backgroundColor: COLORS.blue }}>
                  Find a partner
                  <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                </a>
                <a href="#become" onClick={(event) => { event.preventDefault(); scrollToSection("become"); }}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border px-7 text-[15px] transition-colors hover:bg-[#121317]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
                  style={{ borderColor: COLORS.mist, color: COLORS.ink }}>
                  Become a partner
                  <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* STORY BAND */}
        <section className="border-b" style={{ borderColor: COLORS.border, backgroundColor: COLORS.soft }}>
          <div className="mx-auto max-w-[1240px] px-6 py-16 sm:px-8 sm:py-20 lg:px-10">
            <div className="max-w-[940px]">
              <p className="text-[28px] font-normal leading-[1.2] tracking-[-0.025em] sm:text-[40px]" style={{ color: COLORS.ink }}>
                The product is one thing.
                <br />
                <span style={{ color: COLORS.blue }}>Knowing where it belongs is another.</span>
              </p>
              <p className="mt-6 max-w-[760px] text-[17px] leading-[1.75]" style={{ color: COLORS.grey }}>
                A school has its own rhythm. A college has different needs. A coaching center works differently from a workplace. Local context matters. Good partners help Visionary understand that context and make the product work within it.
              </p>
            </div>
          </div>
        </section>

        {/* MOBILE CONTENTS */}
        <section className="border-b lg:hidden" style={{ borderColor: COLORS.border }}>
          <div className="mx-auto max-w-[1240px] px-6 sm:px-8">
            <button type="button" onClick={() => setShowMobileContents((value) => !value)} aria-expanded={showMobileContents}
              className="flex w-full items-center justify-between py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]">
              <span>
                <span className="block text-[12px] uppercase tracking-[0.12em]" style={{ color: COLORS.grey }}>Contents</span>
                <span className="mt-1 block text-[15px]" style={{ color: COLORS.ink }}>{activeSection?.title}</span>
              </span>
              <ChevronRight className={`h-5 w-5 transition-transform duration-200 ${showMobileContents ? "rotate-90" : ""}`} strokeWidth={1.7} style={{ color: COLORS.grey }} />
            </button>
            {showMobileContents && (
              <div className="pb-5">
                <div className="overflow-hidden rounded-[18px] border" style={{ borderColor: COLORS.border }}>
                  {SECTIONS.map((section) => {
                    const active = activeId === section.id;
                    return (
                      <button key={section.id} type="button"
                        onClick={() => { scrollToSection(section.id); setActiveId(section.id); setShowMobileContents(false); }}
                        className="flex w-full items-start gap-4 border-b px-4 py-4 text-left last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-inset"
                        style={{ borderColor: COLORS.border, backgroundColor: active ? COLORS.soft : COLORS.white }}>
                        <span className="mt-0.5 text-[12px] font-medium" style={{ color: active ? COLORS.blue : COLORS.grey }}>{section.number}</span>
                        <span className="text-[14px] leading-[1.45]" style={{ color: active ? COLORS.ink : COLORS.grey }}>{section.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* CONTENT */}
        <section>
          <div className="mx-auto max-w-[1240px] px-6 py-12 sm:px-8 lg:px-10 lg:py-20">
            <div className="grid gap-12 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-20">
              {/* DESKTOP CONTENTS */}
              <aside className="hidden lg:block">
                <div className="sticky top-24">
                  <div className="mb-4 text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.grey }}>Contents</div>
                  <nav aria-label="Partner sections">
                    <div className="space-y-1">
                      {SECTIONS.map((section) => {
                        const active = activeId === section.id;
                        return (
                          <button key={section.id} type="button" onClick={() => scrollToSection(section.id)}
                            className="group flex w-full items-start gap-3 rounded-[12px] px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                            style={{ backgroundColor: active ? COLORS.soft : "transparent" }}>
                            <span className="mt-0.5 w-6 shrink-0 text-[11px] font-medium" style={{ color: active ? COLORS.blue : COLORS.grey }}>{section.number}</span>
                            <span className="text-[13px] leading-[1.45]" style={{ color: active ? COLORS.ink : COLORS.grey }}>{section.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </nav>
                </div>
              </aside>

              <div className="min-w-0">
                <article className="divide-y divide-[#e5e7eb]">
                  {/* 01 */}
                  <section id="why-partner" className="scroll-mt-24 pb-14 sm:pb-16">
                    <SectionHeading number="01" title="Why work with a partner" />
                    <Paragraph>The closer Visionary gets to the people using it, the better it can understand what actually matters.</Paragraph>
                    <div className="mt-5"><Paragraph>Partners can bring knowledge that a product team cannot get from a distance: how an institution works, what educators need, how a region learns, what infrastructure is available, and what makes adoption practical.</Paragraph></div>
                    <div className="mt-5"><Paragraph>The relationship should work both ways. Visionary provides the product and technology; partners bring context, implementation, expertise, or reach.</Paragraph></div>
                  </section>

                  {/* 02 */}
                  <section id="what-partners-do" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="02" title="What partners can do" />
                    <Paragraph>A Visionary partnership can take different forms depending on what people are trying to accomplish.</Paragraph>
                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                      <PartnerCard icon={GraduationCap} eyebrow="Education" title="Bring Visionary to learners" description="Help schools, colleges, coaching organizations, and educators understand where Visionary fits into their existing learning environment." />
                      <PartnerCard icon={UsersRound} eyebrow="Professional learning" title="Help people use it well" description="Provide training, onboarding, guidance, or ongoing support where organizations need more than a product alone." />
                      <PartnerCard icon={Settings2} eyebrow="Implementation" title="Make adoption practical" description="Help institutions move from an idea to a working deployment with the processes and support they need." />
                      <PartnerCard icon={Network} eyebrow="Technology" title="Connect useful systems" description="Explore integrations and technical relationships that make Visionary more useful in a real environment." />
                    </div>
                  </section>

                  {/* 03 */}
                  <section id="education" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="03" title="Education partners" />
                    <Paragraph>Education is not one environment. Visionary needs partners who understand the differences.</Paragraph>
                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                      <PartnerCard icon={Building2} eyebrow="Schools" title="K–12 education" description="Support implementation around classrooms, teachers, students, families, curriculum, and school operations." />
                      <PartnerCard icon={BookOpen} eyebrow="Higher education" title="Colleges and universities" description="Explore how Visionary can support complex subjects, assignments, projects, research, and practical skills." />
                      <PartnerCard icon={UsersRound} eyebrow="Coaching" title="Coaching and preparation" description="Bring personalized understanding and practice into structured preparation environments." />
                      <PartnerCard icon={GraduationCap} eyebrow="Educators" title="Teacher communities" description="Help teachers discover, evaluate, and use Visionary in ways that fit their teaching." />
                    </div>
                  </section>

                  {/* 04 */}
                  <section id="implementation" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="04" title="Implementation and support" />
                    <Paragraph>Choosing a product is only the beginning. The real question is what happens after the decision.</Paragraph>
                    <div className="mt-6">
                      <div className="overflow-hidden rounded-[22px] border bg-white" style={{ borderColor: COLORS.border }}>
                        <PrincipleRow icon={MessageCircle} title="Understand the need">Start with what the institution or team is trying to improve rather than starting with a fixed deployment.</PrincipleRow>
                        <PrincipleRow icon={Settings2} title="Plan the rollout">Identify the people, workflows, training, and product configuration needed to make adoption practical.</PrincipleRow>
                        <PrincipleRow icon={UsersRound} title="Help people use it">Support teachers, learners, administrators, or teams as they begin using Visionary.</PrincipleRow>
                        <PrincipleRow icon={CheckCircle2} title="Learn what changed">Use real feedback and evidence to understand what worked and what needs to improve.</PrincipleRow>
                      </div>
                    </div>
                  </section>

                  {/* 05 */}
                  <section id="technology" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="05" title="Technology and integration" />
                    <Paragraph>Visionary should fit into the systems people already use when doing so creates real value.</Paragraph>
                    <div className="mt-5"><Paragraph>Technology partners may help with identity, institutional systems, content, workflows, integrations, or other capabilities that make the experience more useful.</Paragraph></div>
                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                      <PartnerCard icon={Laptop} eyebrow="Build" title="Create integrations" description="Connect Visionary with useful products and systems where a technical integration makes sense." />
                      <PartnerCard icon={Network} eyebrow="Connect" title="Bring systems together" description="Reduce unnecessary separation between the tools people already use." />
                      <PartnerCard icon={Globe2} eyebrow="Extend" title="Reach new environments" description="Help Visionary work in contexts the core product team cannot reach alone." />
                    </div>
                    <Note>Specific APIs, SDKs, integration programs, and technical requirements should be documented here only when those capabilities are officially available.</Note>
                  </section>

                  {/* 06 */}
                  <section id="regional" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="06" title="Regional partners" />
                    <Paragraph>A product built for India has to understand that India is not one learning environment.</Paragraph>
                    <div className="mt-5"><Paragraph>Language, curriculum, connectivity, institutions, communities, and expectations can differ from one place to another. Regional partners can help Visionary understand those realities and build relationships around them.</Paragraph></div>
                    <div className="mt-6 rounded-[22px] border p-6 sm:p-7">
                      <div className="flex items-start gap-4">
                        <MapPin className="mt-0.5 h-6 w-6 shrink-0" strokeWidth={1.6} style={{ color: COLORS.blue }} />
                        <div>
                          <h3 className="text-[20px] font-normal" style={{ color: COLORS.ink }}>
                            Start local.
                            <br />
                            <span style={{ color: COLORS.blue }}>Build for more places.</span>
                          </h3>
                          <p className="mt-3 max-w-[700px] text-[14px] leading-[1.7]" style={{ color: COLORS.grey }}>
                            The goal is not to make every region work the same way. It is to understand local context well enough to make the product genuinely useful there.
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* 07 */}
                  <section id="who-partner" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="07" title="Who can become a partner" />
                    <Paragraph>Partnership is about capability and alignment, not a particular company size.</Paragraph>
                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                      <PartnerCard icon={Building2} eyebrow="Institutions" title="Education organizations" description="Schools, colleges, coaching networks, education groups, and other organizations working directly with learners." />
                      <PartnerCard icon={UsersRound} eyebrow="Services" title="Training and consulting" description="People and organizations with expertise in implementation, professional learning, or educational transformation." />
                      <PartnerCard icon={Laptop} eyebrow="Technology" title="Technology companies" description="Teams that can build integrations, services, tools, or infrastructure around useful Visionary workflows." />
                      <PartnerCard icon={Globe2} eyebrow="Regional" title="Local organizations" description="Organizations with strong local understanding and relationships in a region or learning community." />
                    </div>
                  </section>

                  {/* 08 */}
                  <section id="what-we-look" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="08" title="What we look for" />
                    <Paragraph>The best partnership is not the largest one. It is the one that makes the product more useful for people.</Paragraph>
                    <div className="mt-6">
                      <div className="overflow-hidden rounded-[22px] border bg-white" style={{ borderColor: COLORS.border }}>
                        <PrincipleRow icon={UsersRound} title="Start with people">The partnership should solve a real need for learners, teachers, institutions, professionals, or other people using the product.</PrincipleRow>
                        <PrincipleRow icon={Lightbulb} title="Bring something real">Strong local knowledge, implementation capability, technical expertise, or another meaningful contribution.</PrincipleRow>
                        <PrincipleRow icon={CheckCircle2} title="Work with evidence">Be willing to learn from what actually happens instead of assuming the rollout worked because it launched.</PrincipleRow>
                        <PrincipleRow icon={ShieldCheck} title="Protect trust">Respect privacy, safety, intellectual property, and the responsibilities that come with working around learning.</PrincipleRow>
                      </div>
                    </div>
                  </section>

                  {/* 09 */}
                  <section id="directory" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="09" title="Partner directory" />
                    <Paragraph>A directory is useful only when there are real partners to search for and clear criteria for being listed.</Paragraph>
                    <div className="mt-8 rounded-[24px] border p-7 sm:p-8" style={{ borderColor: COLORS.border, backgroundColor: COLORS.soft }}>
                      <div className="flex h-12 w-12 items-center justify-center rounded-[16px] border bg-white" style={{ borderColor: COLORS.mist, color: COLORS.blue }}>
                        <Globe2 className="h-5 w-5" strokeWidth={1.7} />
                      </div>
                      <h3 className="mt-6 text-[25px] font-normal tracking-[-0.02em]" style={{ color: COLORS.ink }}>The partner network is growing.</h3>
                      <p className="mt-3 max-w-[700px] text-[15px] leading-[1.7]" style={{ color: COLORS.grey }}>
                        Public partner listings will appear here as Visionary establishes and verifies its partner network.
                      </p>
                      <p className="mt-4 max-w-[700px] text-[15px] leading-[1.7]" style={{ color: COLORS.grey }}>
                        Until then, institutions and organizations can contact Visionary directly to discuss the kind of support or partnership they need.
                      </p>
                      <div className="mt-6">
                        <a href="mailto:partnerships@visionary.org.in"
                          className="inline-flex items-center gap-2 text-[17px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                          style={{ color: COLORS.blue }}>
                          partnerships@visionary.org.in
                          <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
                        </a>
                      </div>
                    </div>
                  </section>

                  {/* 10 */}
                  <section id="become" className="scroll-mt-24 py-14 sm:py-16">
                    <SectionHeading number="10" title="Become a partner" />
                    <Paragraph>Tell us what you do, who you work with, and where you think Visionary could become more useful.</Paragraph>
                    <div className="mt-8 rounded-[24px] border bg-white p-6 sm:p-8" style={{ borderColor: COLORS.border }}>
                      {submitted ? (
                        <div className="py-8">
                          <div className="flex h-12 w-12 items-center justify-center rounded-[16px]" style={{ backgroundColor: COLORS.blueSoft }}>
                            <CheckCircle2 className="h-5 w-5" strokeWidth={1.7} style={{ color: COLORS.blue }} />
                          </div>
                          <h3 className="mt-6 text-[28px] font-normal tracking-[-0.025em]" style={{ color: COLORS.ink }}>Your introduction is ready.</h3>
                          <p className="mt-3 max-w-[650px] text-[15px] leading-[1.7]" style={{ color: COLORS.grey }}>
                            The application flow is connected to this page, but the production partnership endpoint still needs to be connected before launch.
                          </p>
                          <button type="button" onClick={() => setSubmitted(false)}
                            className="mt-6 inline-flex items-center gap-2 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                            style={{ color: COLORS.blue }}>
                            Send another introduction
                            <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleSubmit}>
                          <div className="grid gap-6 sm:grid-cols-2">
                            <div>
                              <label htmlFor="partner-name" className="block text-[13px] font-medium" style={{ color: COLORS.ink }}>Your name</label>
                              <input id="partner-name" name="name" type="text" autoComplete="name" required value={name}
                                onChange={(event) => setName(event.target.value)}
                                className="mt-2 h-12 w-full rounded-[14px] border bg-white px-4 text-[15px] outline-none transition-colors focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20"
                                style={{ borderColor: COLORS.mist, color: COLORS.ink }} />
                            </div>
                            <div>
                              <label htmlFor="partner-organization" className="block text-[13px] font-medium" style={{ color: COLORS.ink }}>Organization</label>
                              <input id="partner-organization" name="organization" type="text" autoComplete="organization" required value={organization}
                                onChange={(event) => setOrganization(event.target.value)}
                                className="mt-2 h-12 w-full rounded-[14px] border bg-white px-4 text-[15px] outline-none transition-colors focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20"
                                style={{ borderColor: COLORS.mist, color: COLORS.ink }} />
                            </div>
                          </div>
                          <div className="mt-6 grid gap-6 sm:grid-cols-2">
                            <div>
                              <label htmlFor="partner-email" className="block text-[13px] font-medium" style={{ color: COLORS.ink }}>Work email</label>
                              <input id="partner-email" name="email" type="email" autoComplete="email" required value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                className="mt-2 h-12 w-full rounded-[14px] border bg-white px-4 text-[15px] outline-none transition-colors focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20"
                                style={{ borderColor: COLORS.mist, color: COLORS.ink }} />
                            </div>
                            <div>
                              <label htmlFor="partner-type" className="block text-[13px] font-medium" style={{ color: COLORS.ink }}>Partnership type</label>
                              <select id="partner-type" name="type" value={type}
                                onChange={(event) => setType(event.target.value)}
                                className="mt-2 h-12 w-full rounded-[14px] border bg-white px-4 text-[15px] outline-none transition-colors focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20"
                                style={{ borderColor: COLORS.mist, color: COLORS.ink }}>
                                {APPLICATION_TYPES.map((item) => (
                                  <option key={item} value={item}>{item}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="mt-6">
                            <label htmlFor="partner-website" className="block text-[13px] font-medium" style={{ color: COLORS.ink }}>Organization website</label>
                            <input id="partner-website" name="website" type="url" autoComplete="url" placeholder="https://" value={website}
                              onChange={(event) => setWebsite(event.target.value)}
                              className="mt-2 h-12 w-full rounded-[14px] border bg-white px-4 text-[15px] outline-none transition-colors focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20"
                              style={{ borderColor: COLORS.mist, color: COLORS.ink }} />
                          </div>
                          <div className="mt-6">
                            <label htmlFor="partner-message" className="block text-[13px] font-medium" style={{ color: COLORS.ink }}>Tell us about the partnership</label>
                            <textarea id="partner-message" name="message" required rows={7} value={message}
                              onChange={(event) => setMessage(event.target.value)}
                              placeholder="Who do you work with, what do you do, and what could we build together?"
                              className="mt-2 w-full resize-y rounded-[14px] border bg-white px-4 py-3 text-[15px] leading-[1.6] outline-none transition-colors placeholder:text-[#9AA0A6] focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20"
                              style={{ borderColor: COLORS.mist, color: COLORS.ink }} />
                          </div>
                          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="max-w-[550px] text-[12px] leading-[1.6]" style={{ color: COLORS.grey }}>
                              Please share only information needed to help us understand the partnership.
                            </p>
                            <button type="submit"
                              className="inline-flex h-12 shrink-0 items-center justify-center rounded-full px-7 text-[15px] font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2 active:scale-[0.98]"
                              style={{ backgroundColor: COLORS.blue }}>
                              Send introduction
                              <ArrowUpRight className="ml-2 h-4 w-4" strokeWidth={1.8} />
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                    <Note>Partner approval criteria, commercial terms, technical requirements, and any formal partner program should be published separately once Visionary has defined them.</Note>
                  </section>

                  {/* 11 */}
                  <section id="contact" className="scroll-mt-24 pt-14 sm:pt-16">
                    <SectionHeading number="11" title="Contact" />
                    <Paragraph>For institutional partnerships, implementation, technology relationships, regional opportunities, or partner questions:</Paragraph>
                    <div className="mt-6">
                      <a href="mailto:partnerships@visionary.org.in"
                        className="inline-flex items-center gap-2 text-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
                        style={{ color: COLORS.blue }}>
                        partnerships@visionary.org.in
                        <ArrowUpRight className="h-5 w-5" strokeWidth={1.7} />
                      </a>
                    </div>
                    <div className="mt-6">
                      <Link to="/contact" className="inline-flex items-center gap-2 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ color: COLORS.blue }}>
                        Other ways to contact us
                        <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                      </Link>
                    </div>
                  </section>
                </article>

                {/* CLOSING */}
                <section className="mt-20 border-t border-[#e5e7eb] pt-14 sm:mt-24 sm:pt-16">
                  <div className="max-w-[920px]">
                    <div className="mb-5 text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: COLORS.blue }}>Find a Partner</div>
                    <h2 className="text-[36px] font-normal leading-[1.12] tracking-[-0.03em] sm:text-[48px]" style={{ color: COLORS.ink }}>
                      The right partnership
                      <br />
                      <span style={{ color: COLORS.blue }}>makes the next step possible.</span>
                    </h2>
                    <p className="mt-6 max-w-[740px] text-[17px] leading-[1.7]" style={{ color: COLORS.grey }}>
                      Visionary is built to adapt to the people who use it. Partnerships help it adapt to the places where those people learn and work.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center gap-4">
                      <a href="#become" onClick={(event) => { event.preventDefault(); scrollToSection("become"); }}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-full border px-5 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                        style={{ borderColor: COLORS.mist, color: COLORS.ink }}>
                        Become a partner
                        <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
                      </a>
                      <Link to="/organization" className="inline-flex h-11 items-center justify-center rounded-full border px-5 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                        style={{ borderColor: COLORS.mist, color: COLORS.ink }}>
                        For organizations
                      </Link>
                      <Link to="/contact" className="inline-flex h-11 items-center justify-center rounded-full border px-5 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                        style={{ borderColor: COLORS.mist, color: COLORS.ink }}>
                        Contact
                      </Link>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}