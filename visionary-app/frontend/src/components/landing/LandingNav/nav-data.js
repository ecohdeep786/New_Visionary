import {
  GraduationCap, Users, Briefcase, Building2, HeartHandshake, Sparkles,
  BookOpen, UsersRound,
  Monitor, Smartphone, Laptop, Apple, Chrome, TabletSmartphone,
  ShieldCheck, Lock, Accessibility,
  Newspaper, Mail, Handshake, Bell, Gift,
} from "lucide-react";

/* Persona metadata */
const CATEGORY_META = {
  student: { Icon: GraduationCap, desc: "Understand more and keep your place." },
  teacher: { Icon: Users, desc: "See who needs another explanation." },
  parent: { Icon: HeartHandshake, desc: "See where your child needs support." },
  professional: { Icon: Briefcase, desc: "Turn what you know into useful work." },
  organization: { Icon: Building2, desc: "Help teams carry knowledge forward." },
};

const FALLBACK_META = {
  Icon: Sparkles,
  desc: "Explore how Visionary fits your journey.",
};

const metaFor = (cat) => CATEGORY_META[cat.slug] || FALLBACK_META;

/* For organizations — 4 contexts inside /organization */
const ORG_CONTEXTS = [
  { id: "schools", Icon: GraduationCap, title: "Schools", desc: "Roll out learning across K-12." },
  { id: "colleges", Icon: BookOpen, title: "Colleges and universities", desc: "Bring Visionary to higher education." },
  { id: "coaching", Icon: UsersRound, title: "Coaching", desc: "Scale personalized coaching." },
  { id: "workplace", Icon: Briefcase, title: "Workplace learning", desc: "Grow skills across your workforce." },
];

/* Download — 6 platforms */
const DOWNLOAD_PLATFORMS = [
  { id: "web", Icon: Chrome, title: "Web", desc: "Use Visionary in any browser, no install needed." },
  { id: "ios", Icon: Smartphone, title: "iOS", desc: "iPhone and iPad." },
  { id: "android", Icon: TabletSmartphone, title: "Android", desc: "Phones and tablets." },
  { id: "windows", Icon: Monitor, title: "Windows", desc: "Desktop app for PC." },
  { id: "mac", Icon: Apple, title: "Mac", desc: "Native app for Apple Silicon and Intel." },
  { id: "linux", Icon: Laptop, title: "Linux", desc: "For developers and power users." },
];

/* About — company, support, trust/legal */
const ABOUT_GROUPS = [
  {
    title: "Company",
    items: [
      { id: "about", Icon: Sparkles, title: "About Visionary", desc: "Our mission, beliefs, company, and people.", to: "/about" },
      { id: "careers", Icon: Briefcase, title: "Careers", desc: "Help us make understanding last.", to: "/careers" },
      { id: "research", Icon: Newspaper, title: "Research and news", desc: "News from Visionary, product updates, and research.", to: "/research" },
      { id: "community", Icon: UsersRound, title: "Community", desc: "Learners, teachers, and parents growing together.", to: "/community" },
    ],
  },
  {
    title: "Support and programs",
    items: [
      { id: "contact", Icon: Mail, title: "Contact and sales", desc: "Talk to us about schools, teams, and partnerships.", to: "/contact" },
      { id: "partners", Icon: Handshake, title: "Find a partner", desc: "Bring Visionary closer to your region or institution.", to: "/partners" },
      { id: "updates", Icon: Bell, title: "Sign up for updates", desc: "Product news, new languages, and launch updates.", to: "/updates" },
      { id: "referral", Icon: Gift, title: "Referral program", desc: "Invite people and grow with Visionary.", to: "/referral" },
    ],
  },
  {
    title: "Trust and legal",
    items: [
      { id: "safety", Icon: ShieldCheck, title: "Safety", desc: "Age-appropriate answers and human review.", to: "/safety" },
      { id: "privacy", Icon: Lock, title: "Privacy policy", desc: "Your memory is yours.", to: "/privacy" },
      { id: "security", Icon: ShieldCheck, title: "Security", desc: "Protected end to end.", to: "/security" },
      { id: "accessibility", Icon: Accessibility, title: "Accessibility", desc: "Built for every learner, every device.", to: "/accessibility" },
    ],
  },
];

export { CATEGORY_META, FALLBACK_META, metaFor, ORG_CONTEXTS, DOWNLOAD_PLATFORMS, ABOUT_GROUPS };
