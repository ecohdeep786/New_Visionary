import React, { lazy, Suspense } from "react";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import PersonaHero from "@/components/landing/NewPersona";
import { fontStack } from "@/components/landing/system/tokens";
import proHero from "@/assets/pro-face-main-2400w.webp";
import story from "./stories/professional";

const CategoryStory = lazy(() => import("@/components/landing/persona/CategoryStory"));
const HERO_WORDS = ["Building.", "to apply.", "to grow."];

const ProHeroSection = React.memo(() => (
  <PersonaHero
    words={HERO_WORDS}
    srSentence="Building, to apply, to grow."
    sub="Turn a question, project, or new skill into work you can use."
    img={proHero}
    alt="A professional writing notes beside a laptop"
    ctaLabel="Create a free account"
  />
));

export default function CollegePage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: fontStack }}>
      <LandingNav />
      <main id="main" tabIndex={-1}>
        <ProHeroSection />
        <Suspense fallback={null}>
          <CategoryStory story={story} />
        </Suspense>
      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}
