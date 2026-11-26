import React, { lazy, Suspense } from "react";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import PersonaHero from "@/components/landing/NewPersona";
import { fontStack } from "@/components/landing/system/tokens";
import teacherHero from "@/assets/teacher-hero-main-2400w.webp";
import story from "./stories/teacher";

const CategoryStory = lazy(() => import("@/components/landing/persona/CategoryStory"));
const HERO_WORDS = ["Teaching.", "to grow.", "to reach."];

const TeacherHeroSection = React.memo(() => (
  <PersonaHero
    words={HERO_WORDS}
    srSentence="Teaching, to grow, to reach."
    sub="Plan, explain, and check understanding while the lesson is still in front of you."
    img={teacherHero}
    alt="A teacher presenting at a whiteboard"
    ctaLabel="Create a free account"
  />
));

export default function TeacherPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: fontStack }}>
      <LandingNav />
      <main id="main" tabIndex={-1}>
        <TeacherHeroSection />
        <Suspense fallback={null}>
          <CategoryStory story={story} />
        </Suspense>
      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}
