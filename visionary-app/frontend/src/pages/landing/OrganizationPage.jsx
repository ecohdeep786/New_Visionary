import React, { lazy, Suspense } from "react";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import PersonaHero from "@/components/landing/NewPersona";
import { fontStack } from "@/components/landing/system/tokens";
import orgHero from "@/assets/org-face-main-2400w.webp";
import story from "./stories/organization";

const CategoryStory = lazy(() => import("@/components/landing/persona/CategoryStory"));
const HERO_WORDS = ["Leading.", "to scale.", "to last."];

const OrgHeroSection = React.memo(() => (
  <PersonaHero
    words={HERO_WORDS}
    srSentence="Leading, to scale, to last."
    sub="Give teams a shared view of learning across people, projects, and time."
    img={orgHero}
    alt="A leader reviewing team progress on a tablet"
    ctaTo="/contact"
    ctaLabel="Talk to us"
  />
));

export default function OrganizationPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: fontStack }}>
      <LandingNav />
      <main id="main" tabIndex={-1}>
        <OrgHeroSection />
        <Suspense fallback={null}>
          <CategoryStory story={story} />
        </Suspense>
      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}
