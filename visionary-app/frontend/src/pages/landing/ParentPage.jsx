import React, { lazy, Suspense } from "react";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import PersonaHero from "@/components/landing/NewPersona";
import { fontStack } from "@/components/landing/system/tokens";
import parentHero from "@/assets/parent-hero-main-2400w.webp";
import story from "./stories/parent";

const CategoryStory = lazy(() => import("@/components/landing/persona/CategoryStory"));
const HERO_WORDS = ["Parenting.", "to see.", "to help."];

const ParentHeroSection = React.memo(() => (
  <PersonaHero
    words={HERO_WORDS}
    srSentence="Parenting, to see, to help."
    sub="See the progress behind the report and find a useful next step at home."
    img={parentHero}
    alt="A parent helping a child with homework"
    ctaLabel="Create a free account"
  />
));

export default function ParentPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: fontStack }}>
      <LandingNav />
      <main id="main" tabIndex={-1}>
        <ParentHeroSection />
        <Suspense fallback={null}>
          <CategoryStory story={story} />
        </Suspense>
      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}
