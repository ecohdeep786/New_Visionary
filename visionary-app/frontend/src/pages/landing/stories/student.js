import portrait from "@/assets/problem-understanding.webp";
import learnDesktop from "@/assets/workspace-stories/student-learn.webp";
import learnPhone from "@/assets/workspace-stories/student-learn-phone.webp";
import askDesktop from "@/assets/workspace-stories/student-ask.webp";
import askPhone from "@/assets/workspace-stories/student-ask-phone.webp";
import practiceDesktop from "@/assets/workspace-stories/student-practice.webp";
import practicePhone from "@/assets/workspace-stories/student-practice-phone.webp";
import buildDesktop from "@/assets/workspace-stories/student-build.webp";
import buildPhone from "@/assets/workspace-stories/student-build-phone.webp";

export default {
  role: "student",
  audience: "Student",
  opening: {
    title: "It made sense in class. Can I use it on my own?",
    body: "Half a bar can look like two quarters or four eighths. It’s easy to remember the numbers and still wonder why they mean the same thing.",
    image: portrait,
    alt: "A learner pauses over an open book.",
    link: "Follow the fractions lesson",
  },
  workspace: "Inside the learner workspace",
  title: "One half, from a picture to a recipe.",
  introduction: "See the idea, ask about it, try it without the picture, then use it to plan a meal.",
  steps: [
    {
      id: "learn",
      label: "Learn",
      title: "See the same amount.",
      body: "Move across eight equal parts of a bar. At four shaded parts, you can see exactly where one half falls.",
      alt: "The fractions explorer shows four of eight equal sections shaded and marks the halfway point.",
      desktop: { src: learnDesktop, width: 755, height: 356 },
      phone: { src: learnPhone, width: 688, height: 742 },
    },
    {
      id: "ask",
      label: "Ask",
      title: "Bring your own question.",
      body: "“Can I use fractions in my project?” In this example, the guide finds the meal plan already saved in Build and offers a way back to it.",
      alt: "The learner asks about using fractions in a project. The guide points to their unfinished shared-meal plan.",
      desktop: { src: askDesktop, width: 756, height: 319 },
      phone: { src: askPhone, width: 688, height: 800 },
    },
    {
      id: "practice",
      label: "Practice",
      title: "Check it another way.",
      body: "Which fraction equals one half? Choose an answer and read why two of four equal parts cover the same amount.",
      alt: "A checked practice question explains why two quarters equal one half.",
      desktop: { src: practiceDesktop, width: 755, height: 558 },
      phone: { src: practicePhone, width: 688, height: 1142 },
    },
    {
      id: "build",
      label: "Build",
      title: "Make enough for four.",
      body: "One bowl needs half a cup of oats. The learner saves a meal plan that uses the idea to work out two cups for four bowls.",
      alt: "The saved meal-plan draft shows four half-cup portions adding up to two cups of oats.",
      desktop: { src: buildDesktop, width: 746, height: 307 },
      phone: { src: buildPhone, width: 688, height: 654 },
    },
  ],
  language: {
    title: "Ask it the way you think.",
    introduction: "Here’s the same fractions question in the three supported languages.",
    examples: {
      en: "Why do two quarters make one half?",
      hi: "दो चौथाई मिलकर आधा कैसे बनते हैं?",
      bn: "দুই চতুর্থাংশ মিলে অর্ধেক হয় কীভাবে?",
    },
  },
  support: {
    kind: "questions",
    label: "Your learning path",
    title: "Where would you start?",
    items: [
      { title: "A topic you missed", body: "Start with the part you can’t explain. In the fractions example, moving the shaded bar gives you something concrete to ask about." },
      { title: "An exam you’re preparing for", body: "Try a question before looking at the explanation. Read the reason for your answer, then revisit the part that tripped you up." },
      { title: "A project you want to finish", body: "Keep your work in a saved draft. The recipe in this example gives you a place to return to the next time you open Build." },
    ],
  },
  closing: {
    title: "Bring the question you’re stuck on.",
    body: "Choose “I am a Learner” during setup. Public registration is open to adults aged 18 and over.",
  },
};
