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
    <SimplePage>
      <AboutHero
        eyebrow="Community"
        titleParts={[{ text: "Learners, teachers, and parents " }, { text: "growing together.", accent: true }]}
        intro="Visionary isn't just a platform — it's people helping each other understand. Ask, share, and grow with others on the same journey."
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