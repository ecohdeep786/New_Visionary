import portrait from "@/assets/organization-problem-1-1600w.webp";
import cohortDesktop from "@/assets/workspace-stories/organization-cohort.webp";
import cohortPhone from "@/assets/workspace-stories/organization-cohort-phone.webp";
import contentDesktop from "@/assets/workspace-stories/organization-content.webp";
import contentPhone from "@/assets/workspace-stories/organization-content-phone.webp";
import insightsDesktop from "@/assets/workspace-stories/organization-insights.webp";
import insightsPhone from "@/assets/workspace-stories/organization-insights-phone.webp";

export default {
  role: "organization",
  audience: "Organization",
  opening: {
    title: "How do we help two teams make a better handoff?",
    body: "One team receives a customer request. Another takes it forward. A small pilot gives both teams the same situation to rehearse and a clear purpose for the material they review.",
    image: portrait,
    alt: "An organization lead considers a planning decision.",
    link: "Explore the handoff pilot",
  },
  workspace: "Inside the organization workspace",
  title: "One cohort. One shared handoff.",
  introduction: "See how a pilot brings together its people, a versioned resource, and a view of the evidence available to the group.",
  steps: [
    {
      id: "cohort",
      label: "Cohort",
      title: "Give the group a purpose.",
      body: "The pilot has a name and a goal to rehearse passing a request between two teams. Its membership comes from accepted members and explicitly linked classes.",
      alt: "The Customer handoff pilot cohort is being edited with the purpose of rehearsing a customer request between two teams.",
      desktop: { src: cohortDesktop, width: 1030, height: 357 },
      phone: { src: cohortPhone, width: 528, height: 371 },
    },
    {
      id: "content",
      label: "Content",
      title: "Give the resource a review history.",
      body: "A clear customer handoff starts as revision one in the content library. The draft can go to another reviewer before it is approved for use.",
      alt: "The content library lists A clear customer handoff, revision one, as a draft.",
      desktop: { src: contentDesktop, width: 1034, height: 275 },
      phone: { src: contentPhone, width: 550, height: 389 },
    },
    {
      id: "insights",
      label: "Evidence",
      title: "See when there’s enough to report.",
      body: "This example has too few contributors to show concept totals. The workspace explains the minimum of five and the records included in the reporting period.",
      alt: "Scoped learning evidence explains that at least five contributing learners are required for concept totals and that smaller groups are hidden.",
      desktop: { src: insightsDesktop, width: 1034, height: 768 },
      phone: { src: insightsPhone, width: 550, height: 987 },
    },
  ],
  language: {
    title: "Give the group a shared question.",
    introduction: "The same handoff prompt can be read in English, Hindi, or Bengali.",
    examples: {
      en: "What does the next team need to know?",
      hi: "अगली टीम को क्या जानना चाहिए?",
      bn: "পরের দলের কী জানা দরকার?",
    },
  },
  support: {
    kind: "decisions",
    label: "Planning a rollout",
    title: "Three decisions for a first pilot.",
    items: [
      { title: "Who takes part?", body: "Identify the cohort lead, the people to invite, and the classes to link. A profile and an invitation each serve a different purpose. Membership requires acceptance." },
      { title: "Who reviews the material?", body: "Name an author and a separate reviewer. Decide which version is ready for the pilot before distributing it." },
      { title: "What will the group learn from it?", body: "Choose a reporting period and agree which group evidence will inform the next rehearsal. Personal projects and private conversations stay outside the report." },
    ],
    link: { label: "Review the sharing policy", to: "/privacy#sharing" },
  },
  closing: {
    title: "What would your first cohort practise?",
    body: "Tell the Visionary team who would take part, what they need to learn, and what a useful first pilot would look like.",
  },
};
