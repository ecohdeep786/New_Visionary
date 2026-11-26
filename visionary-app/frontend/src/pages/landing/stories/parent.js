import portrait from "@/assets/problem-cutouts/parent-question.webp";
import connectionDesktop from "@/assets/workspace-stories/parent-connection.webp";
import connectionPhone from "@/assets/workspace-stories/parent-connection-phone.webp";
import reportDesktop from "@/assets/workspace-stories/parent-report.webp";
import reportPhone from "@/assets/workspace-stories/parent-report-phone.webp";
import guidanceDesktop from "@/assets/workspace-stories/parent-guidance.webp";
import guidancePhone from "@/assets/workspace-stories/parent-guidance-phone.webp";

export default {
  role: "parent",
  audience: "Parent",
  opening: {
    title: "What could we talk about after school?",
    body: "“How was school?” can be hard to answer. A shared assignment gives you a smaller place to start, like asking your child to show you two ways to draw one half.",
    image: portrait,
    alt: "A parent sits with a child looking at a tablet.",
    link: "See a shared progress summary",
  },
  workspace: "Inside the parent workspace",
  title: "A shared summary. A conversation at home.",
  introduction: "See what happens when a learner accepts a connection and chooses to share progress summaries.",
  steps: [
    {
      id: "connection",
      label: "Connect",
      title: "Begin with permission.",
      body: "Aarav has accepted a connection for progress summaries. The connection shows its scope and offers a way to stop sharing.",
      alt: "Aarav’s connection says progress summaries only and includes a Stop sharing control.",
      desktop: { src: connectionDesktop, width: 954, height: 331 },
      phone: { src: connectionPhone, width: 483, height: 459 },
    },
    {
      id: "report",
      label: "Summary",
      title: "Find one thing to ask about.",
      body: "Aarav’s summary lists a fractions assignment due soon. That’s enough to ask what the class has been drawing, while his written answer stays private.",
      alt: "The shared report lists Two ways to show one half under upcoming work. Answers, grades, and private feedback are excluded.",
      desktop: { src: reportDesktop, width: 1034, height: 674 },
      phone: { src: reportPhone, width: 550, height: 746 },
    },
    {
      id: "guidance",
      label: "Guidance",
      title: "Let your child lead.",
      body: "The guidance suggests inviting Aarav to show something he enjoyed. He can explain how it works or choose what he’d like to explore next.",
      alt: "Guidance from Aarav’s shared report suggests a conversation about an activity he enjoyed.",
      desktop: { src: guidanceDesktop, width: 1034, height: 437 },
      phone: { src: guidancePhone, width: 550, height: 550 },
    },
  ],
  language: {
    title: "Start in the language you share.",
    introduction: "An invitation to talk can sound more familiar in the words you use at home.",
    examples: {
      en: "What would you like to show me today?",
      hi: "आज तुम मुझे क्या दिखाना चाहोगे?",
      bn: "আজ তুমি আমাকে কী দেখাতে চাও?",
    },
  },
  support: {
    kind: "boundaries",
    label: "Family sharing",
    title: "What can a parent see?",
    items: [
      { title: "In a shared summary", points: [
        "The learner’s accepted connection and its scope",
        "Upcoming assignments and due dates",
        "Available updates about returned classwork",
      ] },
      { title: "Kept in the learner’s workspace", points: [
        "Their written answers and grades",
        "Private teacher feedback and conversations",
        "Personal notes and unfinished drafts",
      ] },
    ],
    link: { label: "Read about sharing", to: "/privacy#sharing" },
  },
  closing: {
    title: "Set up your parent profile.",
    body: "Choose “I am a Parent” during setup. Registration is for adults aged 18 and over. Seeing a learner’s summary requires an accepted connection.",
  },
};
