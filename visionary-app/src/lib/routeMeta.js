/**
 * Per-route meta matrix — drafted by 08-seo, approved by 01-PM (Wave L1).
 * One entry per public landing-pack route. Titles ≤60 chars; descriptions
 * sentence-case, claims-disciplined (MASTER_SPEC §8). Internal surfaces
 * (dashboard/onboarding/dev) are excluded — they keep document defaults.
 */
import landingHeroImg from "@/assets/student-face-main.webp";
import { HERO_SRCSETS, HEROES } from "@/lib/heroVariants";
import { PRICING_FAQ } from "@/data/pricingConfig";

export const ROUTE_META = {
  "/": {
    title: "Visionary — Learn, ask, practice, and build",
    description: "One intelligence that helps anyone learn, teach, support, and build. Start free with Visionary.",
    image: "/og-image.jpg",
    preloadImage: landingHeroImg,
  },
  "/student": {
    title: "Visionary for students | Learn at your pace",
    description: "Understand every concept deeply, practice with feedback, and build real projects — in the language you think in.",
    image: "/og-image.jpg",
    preloadImage: { src: HEROES.studentHero, srcSet: HERO_SRCSETS[HEROES.studentHero] },
  },
  "/teacher": {
    title: "Visionary for teachers | Prepare and teach",
    description: "Prepare lessons, assign practice, and see evidence-backed insights — Visionary assists, you stay in control.",
    image: "/og-image.jpg",
    preloadImage: { src: HEROES.teacherHero, srcSet: HERO_SRCSETS[HEROES.teacherHero] },
  },
  "/parent": {
    title: "Visionary for parents | Follow their progress",
    description: "Get plain-language summaries of your child's learning, connect with teachers, and know how to help each week.",
    image: "/og-image.jpg",
    preloadImage: { src: HEROES.parentHero, srcSet: HERO_SRCSETS[HEROES.parentHero] },
  },
  "/professional": {
    title: "Visionary for professionals | Grow your skills",
    description: "Learn from real work problems, practice interviews, and build a portfolio of evidence-backed skills at your pace.",
    image: "/og-image.jpg",
    preloadImage: { src: HEROES.proHero, srcSet: HERO_SRCSETS[HEROES.proHero] },
  },
  "/organization": {
    title: "Visionary for organizations | Teach at scale",
    description: "Give your institution one workspace for classes, cohorts, insights, and safety controls your people can trust.",
    image: "/og-image.jpg",
    preloadImage: { src: HEROES.orgHero, srcSet: HERO_SRCSETS[HEROES.orgHero] },
  },
  "/how-it-works": {
    title: "How Visionary works",
    description: "See how one intelligence teaches, explains, and adapts — from your first question to demonstrated mastery.",
    image: "/og-image.jpg",
  },
  "/help": {
    title: "Help Center | Visionary",
    description: "Find answers about accounts, classes, safety, and using Visionary — or contact our team.",
    image: "/og-image.jpg",
  },
  "/pricing": {
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Product",
        name: "Visionary",
        description: "One intelligence that helps anyone learn, teach, support, and build. Free to start.",
        brand: { "@type": "Brand", name: "Visionary" },
        offers: [
          { "@type": "Offer", name: "Start", price: "0", priceCurrency: "INR" },
          { "@type": "Offer", name: "Personal", price: "299", priceCurrency: "INR" },
          { "@type": "Offer", name: "Family", price: "499", priceCurrency: "INR" },
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: PRICING_FAQ.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
    title: "Pricing | Visionary",
    description: "Simple plans for learners and organizations. Start free and upgrade when you need more.",
    image: "/og-image.jpg",
  },
  "/download": {
    title: "Download Visionary",
    description: "Get Visionary on your devices and start learning, asking, and building wherever you are.",
    image: "/og-image.jpg",
  },
  "/about": {
    jsonLd: [{
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Visionary",
      url: "https://visionary.app",
      description: "Visionary builds an education product with role-based workspaces for learning, teaching, and building.",
      founder: { "@type": "Person", name: "Md Shahid Ali" },
    }],
    title: "About Visionary",
    description: "Who we are and what we build: one learning flow with role-based workspaces for students, teachers, parents, professionals, and organizations.",
    image: "/og-image.jpg",
  },
  "/research": {
    title: "Research | Visionary",
    description: "Read how we study learning, measure understanding, and publish what works.",
    image: "/og-image.jpg",
  },
  "/community": {
    title: "Community | Visionary",
    description: "Explore Visionary’s learning workspace, optional connections, product updates, and current community features.",
    image: "/og-image.jpg",
  },
  "/updates": {
    title: "Updates | Visionary",
    description: "Product news, releases, and improvements from the Visionary team.",
    image: "/og-image.jpg",
  },
  "/partners": {
    title: "Partners | Visionary",
    description: "Explore a partnership enquiry route and find out whether a public Visionary partner directory is available.",
    image: "/og-image.jpg",
  },
  "/referral": {
    title: "Refer a friend | Visionary",
    description: "Share Visionary’s standard sign-up page. This link is not tracked and does not provide referral rewards.",
    image: "/og-image.jpg",
  },
  "/privacy": {
    title: "Privacy policy | Visionary",
    description: "How Visionary collects, uses, and protects your data — explained in plain language.",
    image: "/og-image.jpg",
  },
  "/terms": {
    title: "Terms of service | Visionary",
    description: "The terms that govern your use of Visionary.",
    image: "/og-image.jpg",
  },
  "/cookies": {
    title: "Cookie policy | Visionary",
    description: "How Visionary uses cookies and the controls you have.",
    image: "/og-image.jpg",
  },
  "/safety": {
    title: "Safety | Visionary",
    description: "How we keep learners safe: protections, moderation, and controls for schools and families.",
    image: "/og-image.jpg",
  },
  "/security": {
    title: "Security | Visionary",
    description: "How Visionary protects your account and data with layered security practices.",
    image: "/og-image.jpg",
  },
  "/accessibility": {
    title: "Accessibility | Visionary",
    description: "Our commitment to an accessible product for every learner, teacher, and parent.",
    image: "/og-image.jpg",
  },
  "/careers": {
    title: "Careers | Visionary",
    description: "Help build one intelligence for learning. See open roles across teams.",
    image: "/og-image.jpg",
  },
  "/contact": {
    title: "Contact | Visionary",
    description: "Questions about Visionary or bringing it to your organization? Talk to us.",
    image: "/og-image.jpg",
  },
  /* Auth surfaces (login/register/recovery) are owned by the auth pack — the
     head system leaves them untouched, per Head-of-Product scope decision. */
};

/* Per-persona OG share cards (L6). Other routes share og-image.jpg (JPEG q90 — crawler-friendly, 6x lighter than PNG). */
export const PERSONA_OG = {
  "/": "/og-image.jpg",
  "/student": "/og-student.jpg",
  "/teacher": "/og-teacher.jpg",
  "/parent": "/og-parent.jpg",
  "/professional": "/og-professional.jpg",
  "/organization": "/og-organization.jpg",
};

/* 404 fallback applies to any path that is not an internal or auth surface. */
const AUTH_PATHS = ["/login", "/signin", "/register", "/forgot-password", "/forgot-user-id", "/reset-password"];
export const ROUTE_EXACT = (pathname) =>
  !pathname.startsWith("/dashboard") && !pathname.startsWith("/onboarding") && !pathname.startsWith("/dev") &&
  !AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

/* Public routes shipped in sitemap.xml (no redirects, no auth/internal/utility routes). */
export const SITEMAP_ROUTES = [
  "/", "/student", "/teacher", "/parent", "/professional", "/organization",
  "/how-it-works", "/help", "/pricing", "/download", "/about", "/research", "/community",
  "/updates", "/partners", "/referral", "/privacy", "/terms", "/cookies",
  "/safety", "/security", "/accessibility", "/careers", "/contact",
];
