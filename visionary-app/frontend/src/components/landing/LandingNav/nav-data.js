import {
  GraduationCap, Users, Briefcase, Building2, HeartHandshake, Sparkles,
  BookOpen, UsersRound,
  Monitor, Smartphone, Laptop, Apple, Chrome, TabletSmartphone,
  ShieldCheck, Lock, Accessibility,
  Newspaper, Mail, Handshake, Bell, Gift,
} from "lucide-react";

/* Persona metadata */
const CATEGORY_META = {
  student: { Icon: GraduationCap, desc: "Explore learning, practice, and building." },
  teacher: { Icon: Users, desc: "Explore learning for teaching and classwork." },
  parent: { Icon: HeartHandshake, desc: "Understand the learner journey and its boundaries." },
  professional: { Icon: Briefcase, desc: "Connect learning to work and projects." },
  organization: { Icon: Building2, desc: "Explore learning paths for teams and institutions." },
};

const FALLBACK_META = {
  Icon: Sparkles,
  desc: "Explore how Visionary fits your journey.",
};

const metaFor = (cat) => CATEGORY_META[cat.slug] || FALLBACK_META;

/* For organizations — 4 contexts inside /organization */
const ORG_CONTEXTS = [
  { id: "schools", Icon: GraduationCap, title: "Schools", desc: "Explore learning for K–12 schools." },
  { id: "colleges", Icon: BookOpen, title: "Colleges and universities", desc: "Explore higher-education learning." },
  { id: "coaching", Icon: UsersRound, title: "Coaching", desc: "Explore coaching and guided learning." },
  { id: "workplace", Icon: Briefcase, title: "Workplace learning", desc: "Explore learning for teams at work." },
];

/* Download — 6 platforms */
const DOWNLOAD_PLATFORMS = [
  { id: "web", Icon: Chrome, title: "Web", desc: "See current browser access information." },
  { id: "ios", Icon: Smartphone, title: "iOS", desc: "Check current iPhone and iPad availability." },
  { id: "android", Icon: TabletSmartphone, title: "Android", desc: "Check current phone and tablet availability." },
  { id: "windows", Icon: Monitor, title: "Windows", desc: "Check current Windows availability." },
  { id: "mac", Icon: Apple, title: "Mac", desc: "Check current Mac availability." },
  { id: "linux", Icon: Laptop, title: "Linux", desc: "Check current Linux availability." },
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
      { id: "safety", Icon: ShieldCheck, title: "Safety", desc: "Read Visionary’s current safety information.", to: "/safety" },
      { id: "privacy", Icon: Lock, title: "Privacy policy", desc: "Read the privacy policy and its stated choices.", to: "/privacy" },
      { id: "security", Icon: ShieldCheck, title: "Security", desc: "Read the security information published for Visionary.", to: "/security" },
      { id: "accessibility", Icon: Accessibility, title: "Accessibility", desc: "Read Visionary’s current accessibility information.", to: "/accessibility" },
    ],
  },
];

export { CATEGORY_META, FALLBACK_META, metaFor, ORG_CONTEXTS, DOWNLOAD_PLATFORMS, ABOUT_GROUPS };
