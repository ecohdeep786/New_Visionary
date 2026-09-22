import { Users, HeartHandshake, MessageCircle, Sparkles } from "lucide-react";
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
        illustration="community"
        alt="Illustration of three people learning together"
      />
      <AboutContentSection
        eyebrow="What the community is"
        heading="One journey, many"
        headingAccent="voices."
        body="When someone explains a concept in their own words, in their own language, understanding spreads further than any textbook can reach."
        cards={PILLARS}
      />
      <AboutContentSection
        bg="surface"
        eyebrow="How to join"
        heading="Come as you are,"
        headingAccent="stay as you grow."
        body="The community is open to every learner, teacher, and parent — no matter where you are or what language you think in."
      >
        <div className="mx-auto mt-12 flex w-full max-w-[1080px] flex-col gap-4 sm:flex-row sm:justify-center lg:gap-6">
          <div className="flex-1 rounded-[20px] border bg-white p-7 transition-shadow duration-300 hover:shadow-[0_1px_3px_rgba(60,64,67,0.12),0_4px_12px_rgba(60,64,67,0.08)]" style={{ borderColor: "#dadce0" }}>
            <h3 className="font-medium tracking-[0] leading-[1.25] text-[19px]" style={{ color: "#121317" }}>Ask your first question</h3>
            <p className="mt-2.5 font-normal tracking-[0] leading-[1.6] text-[14.5px]" style={{ color: "#5f6368" }}>Start with what you're learning. The community and Visionary's intelligence answer together.</p>
          </div>
          <div className="flex-1 rounded-[20px] border bg-white p-7 transition-shadow duration-300 hover:shadow-[0_1px_3px_rgba(60,64,67,0.12),0_4px_12px_rgba(60,64,67,0.08)]" style={{ borderColor: "#dadce0" }}>
            <h3 className="font-medium tracking-[0] leading-[1.25] text-[19px]" style={{ color: "#121317" }}>Share what worked</h3>
            <p className="mt-2.5 font-normal tracking-[0] leading-[1.6] text-[14.5px]" style={{ color: "#5f6368" }}>If something helped you understand, it might help someone else. Pass it on.</p>
          </div>
        </div>
      </AboutContentSection>
      <AboutContentSection
        eyebrow="Why it matters"
        heading="Understanding spreads when"
        headingAccent="people share it."
        body="Every language, every level, every learning style — the community is where individual breakthroughs become everyone's starting point."
        stats={[
          { value: "20+", label: "languages spoken across the community" },
          { value: "1 → many", label: "one explanation helps every future learner" },
          { value: "Always open", label: "no gatekeeping, no judgement, just help" },
        ]}
      />
      <AboutCTA
        title="Ready to join the"
        titleAccent="community?"
        desc="Start with a question, stay for the people. Everyone's welcome — in every language."
        primaryLabel="Get started"
        primaryTo="/register"
        secondaryLabel="See how it works"
        secondaryTo="/how-it-works"
        illustration="community"
      />
    </SimplePage>
  );
}