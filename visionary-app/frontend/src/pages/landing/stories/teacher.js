import portrait from "@/assets/teacher-problem-4.webp";
import prepareDesktop from "@/assets/workspace-stories/teacher-prepare.webp";
import preparePhone from "@/assets/workspace-stories/teacher-prepare-phone.webp";
import classworkDesktop from "@/assets/workspace-stories/teacher-classwork.webp";
import classworkPhone from "@/assets/workspace-stories/teacher-classwork-phone.webp";
import reviewDesktop from "@/assets/workspace-stories/teacher-review.webp";
import reviewPhone from "@/assets/workspace-stories/teacher-review-phone.webp";

export default {
  role: "teacher",
  audience: "Teacher",
  opening: {
    title: "Did the explanation land with the whole class?",
    body: "A nod is hard to teach from. Ask everyone to draw one half in two ways, and their drawings give you something specific to respond to.",
    image: portrait,
    alt: "A teacher with glasses resting on her head.",
    link: "Follow a classroom example",
  },
  workspace: "Inside the teacher workspace",
  title: "From a lesson plan to one learner’s drawing.",
  introduction: "Follow a fractions lesson through preparation, classwork, and the teacher’s feedback.",
  steps: [
    {
      id: "prepare",
      label: "Prepare",
      title: "Decide what you want to see.",
      body: "In the lesson outline, the teacher starts with equal-sized wholes. They can edit the objective and explanation before giving the class any work.",
      alt: "The teacher’s editable lesson outline is titled Make sense of fractions and begins with comparing equal-sized wholes.",
      desktop: { src: prepareDesktop, width: 1030, height: 592 },
      phone: { src: preparePhone, width: 528, height: 640 },
    },
    {
      id: "classwork",
      label: "Assign",
      title: "Give the class one clear prompt.",
      body: "Draw two bars the same size. Shade one half of the first and two quarters of the second. Ask learners to explain what stays the same.",
      alt: "Published classwork asks the Mathematics workshop to show one half two ways and is accepting responses.",
      desktop: { src: classworkDesktop, width: 1034, height: 378 },
      phone: { src: classworkPhone, width: 550, height: 506 },
    },
    {
      id: "review",
      label: "Review",
      title: "Respond to the reasoning.",
      body: "The learner spots that both drawings cover the same area. The teacher writes a note asking for labels and decides whether the work needs a revision.",
      alt: "A submitted response and a teacher-written feedback draft ask the learner to label the parts of each bar.",
      desktop: { src: reviewDesktop, width: 979, height: 502 },
      phone: { src: reviewPhone, width: 528, height: 656 },
    },
  ],
  language: {
    title: "Find the words for your class.",
    introduction: "Try a classroom question in English, Hindi, or Bengali.",
    examples: {
      en: "How would you show one half in two ways?",
      hi: "तुम आधे को दो तरीकों से कैसे दिखाओगे?",
      bn: "অর্ধেককে তুমি দু’ভাবে কীভাবে দেখাবে?",
    },
  },
  support: {
    kind: "decisions",
    label: "In your classroom",
    title: "The teaching decisions stay with you.",
    items: [
      { title: "Before class", body: "Choose the objective, adjust the wording, and decide which class should receive the assignment." },
      { title: "When work comes in", body: "Review what each learner submitted to your class. Their private practice and personal questions stay in their own workspace." },
      { title: "For the next lesson", body: "Use a comment or a revision request to ask for another drawing, a label, or an explanation in the learner’s own words." },
    ],
  },
  closing: {
    title: "Start with the class you teach.",
    body: "Choose “I am a Teacher” during setup to set your teaching context and subjects. Registration is open to adults aged 18 and over.",
  },
};
