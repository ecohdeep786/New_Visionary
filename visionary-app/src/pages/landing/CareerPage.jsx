import { Briefcase, TrendingUp, Target, Brain, Users } from "lucide-react";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import { getCategory } from "@/data/landingCategories";
import CategoryHero from "@/components/landing/sections/CategoryHero";
import StatsBar from "@/components/landing/sections/StatsBar";
import FeatureShowcase from "@/components/landing/sections/FeatureShowcase";
import JourneySteps from "@/components/landing/sections/JourneySteps";
import TestimonialBlock from "@/components/landing/sections/TestimonialBlock";
import FAQAccordion from "@/components/landing/sections/FAQAccordion";
import CTASection from "@/components/landing/sections/CTASection";
import RelatedCategories from "@/components/landing/sections/RelatedCategories";

export default function CareerPage() {
  const category = getCategory("career");
  return (
    <div className="min-h-screen bg-white">
      <LandingNav />
      <CategoryHero
        category={category}
        eyebrow="Career development"
        accentWord="Go"
        headline="Go from learning to earning — with intelligence."
        description="Visionary bridges the gap between education and employment. Build job-ready skills, create a real portfolio, and get career guidance powered by AI that understands both your learning history and the job market."
      />
      <StatsBar color={category.color} stats={[
        { value: "85%", label: "Placement rate" },
        { value: "500+", label: "Partner companies" },
        { value: "Real", label: "Portfolio projects" },
        { value: "AI", label: "Career pathfinder" },
      ]} />
      <FeatureShowcase
        eyebrow="Features"
        title="Everything you need to launch your career"
        subtitle="From skill gaps to job offer — Visionary guides every step."
        color={category.color}
        features={[
          { icon: Target, title: "Skill gap analysis", desc: "AI maps your current skills against your target role and creates a personalized upskilling plan." },
          { icon: Brain, title: "Job-ready learning", desc: "Industry-aligned courses and projects that match what employers actually hire for." },
          { icon: Briefcase, title: "Portfolio builder", desc: "Build real projects with AI mentorship that demonstrate skills to employers." },
          { icon: Users, title: "Recruiter connect", desc: "Your Visionary profile goes directly to 500+ partner companies looking for skilled graduates." },
        ]}
      />
      <JourneySteps
        eyebrow="Career pathway"
        title="From first lesson to first job"
        color={category.color}
        steps={[
          { icon: Target, title: "Map your goal", desc: "Tell Visionary your target role and it maps the skills you need to get there" },
          { icon: Brain, title: "Build skills intelligently", desc: "AI-curated learning path with real-world projects and mentor support" },
          { icon: Briefcase, title: "Create your portfolio", desc: "Guided projects that become evidence of your skills for employers" },
          { icon: TrendingUp, title: "Land your role", desc: "AI-optimized resume, interview prep, and direct recruiter connections" },
        ]}
      />
      <TestimonialBlock
        color={category.color}
        quote="I graduated with a computer science degree and couldn't get interviews. Visionary helped me build three real projects in six weeks and connected me with recruiters. I had an offer within a month."
        author="Rohan Malhotra"
        role="Software Engineer · Bengaluru"
        initials="RM"
      />
      <FAQAccordion
        eyebrow="Questions"
        title="Frequently asked"
        color={category.color}
        faqs={[
          { q: "Which industries does Visionary cover?", a: "Technology, finance, healthcare, education, and law are currently supported, with more domains being added every quarter." },
          { q: "Are the portfolio projects real or fake?", a: "Real. Visionary's Build App guides you through building functioning products — not toy exercises. Employers see working code and live projects." },
          { q: "Do I need prior experience?", a: "No. Visionary adapts to where you are — whether you're a fresh graduate or changing careers. The AI builds your plan from your current baseline." },
          { q: "How does the recruiter connection work?", a: "Partner companies have access to Visionary's talent pool. When your profile matches their requirements, you get a direct introduction — no middlemen." },
        ]}
      />
      <CTASection title="Ready to launch your career?" description="Start building the skills and portfolio that get you hired." />
      <RelatedCategories currentSlug="career" />
      <LandingFooter />
    </div>
  );
}