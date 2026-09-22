import { ShieldCheck, BadgeCheck, Eye, Users, Flag } from "lucide-react";
import { LegalPage } from "@/components/landing/AboutPageShared";
import { LEGAL_META } from "@/data/legalMeta";

export default function SafetyPage() {
  return (
    <LegalPage breadcrumb="Safety"
      eyebrow="Safety"
      titleParts={[{ text: "Safe by " }, { text: "design.", accent: true }]}
      intro="Guardrails for every learner, by age."
      heroIllustration="safety"
      sections={[
        {
          id: "security",
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
          id: "accessibility",
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
      lastUpdated={LEGAL_META.safety.lastUpdated}
      cta={{
        title: "Have a safety concern?",
        titleAccent: "We respond fast.",
        desc: "Report anything that feels wrong. A human reviews every report — usually within 24 hours.",
        primaryLabel: "Contact safety",
        primaryTo: "/contact",
        secondaryLabel: "Read privacy policy",
        secondaryTo: "/privacy",
        illustration: "shield",
      }}
    />
  );
}