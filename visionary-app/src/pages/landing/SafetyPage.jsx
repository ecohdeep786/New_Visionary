import { ShieldCheck, BadgeCheck, Eye, Users, Flag } from "lucide-react";
import { LegalPage } from "@/components/landing/AboutPageShared";

export default function SafetyPage() {
  return (
    <LegalPage
      eyebrow="Safety"
      titleParts={[{ text: "Safe to " }, { text: "grow with.", accent: true }]}
      intro="Every answer, every interaction is built to protect the person learning — especially the youngest. Safeguards are on from the first question."
      sections={[
        {
          id: "pillars",
          eyebrow: "How we protect you",
          heading: "Protection is the default,",
          headingAccent: "not a setting.",
          body: "You shouldn't have to configure safety. It should be there before you ask your first question.",
          cards: [
            { Icon: ShieldCheck, title: "Age-appropriate answers", copy: "Every explanation is checked against guidance for the learner's age — before it reaches them." },
            { Icon: BadgeCheck, title: "Protected by default", copy: "Safeguards are on from the first question. Nothing to configure, nothing to remember to turn on." },
            { Icon: Eye, title: "You can flag anything", copy: "Report any answer, anytime. A human reviews it and fixes it — usually within 24 hours." },
          ],
        },
        {
          id: "tools",
          bg: "surface",
          eyebrow: "Safety tools",
          heading: "Built into every",
          headingAccent: "interaction.",
          cards: [
            { Icon: Users, title: "Family controls", copy: "Parents and guardians can set boundaries that shape what younger learners see and do." },
            { Icon: Flag, title: "Report anything", copy: "One tap on any answer flags it for human review. We act on every report." },
            { Icon: BadgeCheck, title: "Safe by default", copy: "No unsafe content reaches a learner without passing through age-appropriate filters first." },
            { Icon: ShieldCheck, title: "Reviewed guidance", copy: "Safety policies are reviewed regularly and updated as we learn from real use." },
          ],
        },
      ]}
      cta={{
        title: "Have a safety concern?",
        titleAccent: "We respond fast.",
        desc: "Report anything that feels wrong. A human reviews every report — usually within 24 hours.",
        primaryLabel: "Contact safety",
        primaryTo: "/contact",
        secondaryLabel: "Read privacy policy",
        secondaryTo: "/privacy",
      }}
    />
  );
}