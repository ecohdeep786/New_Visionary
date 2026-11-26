import portrait from "@/assets/professional-problem-2-1600w.webp";
import directionDesktop from "@/assets/workspace-stories/professional-direction.webp";
import directionPhone from "@/assets/workspace-stories/professional-direction-phone.webp";
import capabilityDesktop from "@/assets/workspace-stories/professional-capability.webp";
import capabilityPhone from "@/assets/workspace-stories/professional-capability-phone.webp";
import projectDesktop from "@/assets/workspace-stories/professional-project.webp";
import projectPhone from "@/assets/workspace-stories/professional-project-phone.webp";

export default {
  role: "professional",
  audience: "Professional",
  opening: {
    title: "I’ve learned the formula. Can I plan the budget?",
    body: "A team workshop needs materials, a room, and an estimate someone can check. Start with that job and work backwards to the skill you want to practise.",
    image: portrait,
    alt: "A professional works with a pen and a laptop at a desk.",
    link: "Follow a workshop budget",
  },
  workspace: "Inside the professional workspace",
  title: "Give a skill a job to do.",
  introduction: "Follow one professional from a budgeting goal to a cost estimate they can explain.",
  steps: [
    {
      id: "direction",
      label: "Goal",
      title: "Name the work ahead.",
      body: "The saved direction is to plan a project budget and compare estimated costs with actual costs. There’s a concrete task to return to.",
      alt: "A saved direction titled Plan a project budget specifies comparing estimated and actual costs with spreadsheet formulas.",
      desktop: { src: directionDesktop, width: 954, height: 309 },
      phone: { src: directionPhone, width: 483, height: 346 },
    },
    {
      id: "capability",
      label: "Skill",
      title: "Set your starting point.",
      body: "The professional chooses spreadsheet budgeting, names a team workshop as the goal, and enters their own experience level.",
      alt: "The capability form shows Spreadsheet budgeting, Plan a team workshop, and the self-selected level Intermediate.",
      desktop: { src: capabilityDesktop, width: 1034, height: 645 },
      phone: { src: capabilityPhone, width: 550, height: 875 },
    },
    {
      id: "project",
      label: "Project",
      title: "Keep the working, too.",
      body: "The draft allows ₹3,000 for materials and ₹2,000 for the room. The estimate stays with the project, ready to compare with the final bill.",
      alt: "A private workshop budget draft lists twelve sets of materials at ₹250 and a ₹2,000 room, for a planned total of ₹5,000.",
      desktop: { src: projectDesktop, width: 1034, height: 536 },
      phone: { src: projectPhone, width: 550, height: 568 },
    },
  ],
  language: {
    title: "Work through it in your own words.",
    introduction: "Read the same budgeting question in each supported language.",
    examples: {
      en: "How do I compare planned and actual costs?",
      hi: "मैं अनुमानित और वास्तविक खर्च की तुलना कैसे करूँ?",
      bn: "পরিকল্পিত খরচ আর প্রকৃত খরচের তুলনা কীভাবে করব?",
    },
  },
  support: {
    kind: "questions",
    label: "Your work and your goals",
    title: "What would you carry forward?",
    items: [
      { title: "For your next project", body: "Keep the assumptions with the estimate. When the actual costs arrive, reopen the draft and explain what changed." },
      { title: "For a career conversation", body: "Choose a piece of work whose decisions you can explain. A saved goal records what you want to learn. The project shows how you applied it." },
      { title: "When learning through work", body: "Personal goals, notes, and projects stay private. Organization membership alone gives an employer no access to your personal learning history." },
    ],
    link: { label: "How sharing works", to: "/privacy#sharing" },
  },
  closing: {
    title: "Start with a skill you want to use.",
    body: "Choose “I am a Professional” during setup to set your interests and learning goals. Registration is open to adults aged 18 and over.",
  },
};
