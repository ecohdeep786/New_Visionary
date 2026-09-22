import { Users, HeartHandshake, MessageCircle, Sparkles } from "lucide-react";
import SpotIllustration from "@/components/landing/SpotIllustration";
import { SimplePage, AboutHero, AboutContentSection, AboutCTA } from "@/components/landing/AboutPageShared";

const PILLARS = [
  { Icon: Users, title: "Learners helping learners", copy: "Students, teachers, and parents who've been through the same struggles share what worked — in their own language." },
  { Icon: HeartHandshake, title: "Teachers supporting teachers", copy: "Educators share lesson ideas, what clicked, and what didn't. No judgement — just help from people who get it." },
  { Icon: MessageCircle, title: "Ask, answer, grow", copy: "Questions get answers from people who've been there. Answers get better when more minds contribute." },
  { Icon: Sparkles, title: "Built by everyone", copy: "The community shapes what Visionary becomes. Feedback, stories, and ideas from real use guide what we build." },
];

export default function CommunityPage() {
  return (
    <SimplePage breadcrumb="Community">
      <AboutHero
        eyebrow="Community"
        titleParts={[{ text: "Build with " }, { text: "others.", accent: true }]}
        intro="Learners, teachers and builders, together."
      />

      {/* STORY BAND — text + visual (Google 2-up statement pattern) */}
      <section className="border-b" style={{ borderColor: "#dadce0" }}>
        <div className="mx-auto max-w-[1240px] px-6 py-16 sm:px-8 sm:py-20 lg:px-10">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="max-w-[560px]">
              <p className="text-[28px] font-normal leading-[1.2] tracking-[-0.025em] sm:text-[40px]" style={{ color: "#121317" }}>
                When someone explains a concept in their own words, in their own language, understanding spreads further than any textbook can reach.
              </p>
              <p className="mt-6 max-w-[560px] text-[17px] leading-[1.7]" style={{ color: "#5f6368" }}>
                The community is how Visionary grows past its own codebase. Learners, teachers, and builders share what worked — and what didn't.
              </p>
            </div>
            <div className="flex justify-center lg:justify-end">
              <SpotIllustration subject="community" className="h-[200px] w-[200px]" />
            </div>
          </div>
        </div>
      </section>

      <AboutContentSection
        eyebrow="What the community is"
        heading="One journey, many"
        headingAccent="voices."
        body="The community turns one person’s breakthrough into everyone’s starting point."
        cards={PILLARS}
      />
      <AboutContentSection
        bg="surface"
        eyebrow="How to join"
        heading="Come as you are,"
        headingAccent="stay as you grow."
        body="The community is open to every learner, teacher, and parent — no matter where you are or what language you think in."
      >
        <div className="mx-auto mt-16 flex w-full max-w-[1080px] flex-col gap-6 sm:flex-row sm:justify-center">
          <div className="flex-1 rounded-[24px] border bg-white p-7" style={{ borderColor: "#dadce0" }}>
            <h3 className="font-medium tracking-[0] leading-[1.25] text-[20px]" style={{ color: "#121317" }}>Ask your first question</h3>
            <p className="mt-3 font-normal tracking-[0] leading-[1.6] text-[15px]" style={{ color: "#5f6368" }}>Start with what you're learning. The community and Visionary's intelligence answer together.</p>
          </div>
          <div className="flex-1 rounded-[24px] border bg-white p-7" style={{ borderColor: "#dadce0" }}>
            <h3 className="font-medium tracking-[0] leading-[1.25] text-[20px]" style={{ color: "#121317" }}>Share what worked</h3>
            <p className="mt-3 font-normal tracking-[0] leading-[1.6] text-[15px]" style={{ color: "#5f6368" }}>If something helped you understand, it might help someone else. Pass it on.</p>
          </div>
        </div>
      </AboutContentSection>
      <AboutCTA
        title="Ready to join the"
        titleAccent="community?"
        desc="Start with a question, stay for the people. Everyone's welcome — in every language."
        primaryLabel="Get started"
        primaryTo="/register"
        secondaryLabel="See how it works"
        secondaryTo="/how-it-works"
      />
    </SimplePage>
  );
}