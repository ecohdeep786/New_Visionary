import React, { lazy, Suspense } from "react";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import PersonaHero from "@/components/landing/NewPersona";
import { fontStack } from "@/components/landing/system/tokens";
import studentHero from "@/assets/student-hero-main-2400w.webp";
import story from "./stories/student";
import { HERO_AVIF_SOURCES, HERO_SIZES } from "@/lib/heroVariants";

/* LCP preload — the hero photograph is this page’s LCP element, but its
   URL lives inside this module, so the browser cannot discover it before
   module eval + render (under the lab throttle the request started ~200ms
   after the entry chunk landed and queued behind the auth probe).
   Preloading at module scope starts the fetch one commit earlier. The
   srcset/sizes mirror the hero <picture>'s AVIF source exactly, so the
   preload is reused, not re-fetched. Gated to this path: the eager front
   doors all evaluate with the entry chunk on every route, and the
   preload is only true on "/student". */
if (typeof window !== "undefined" && window.location.pathname === "/student") {
  const lcpPreload = document.createElement("link");
  lcpPreload.setAttribute("rel", "preload");
  lcpPreload.setAttribute("as", "image");
  /* setAttribute, not the IDL property: this Chromium build does not reflect
     imagesrcset/imagesizes assignments onto the DOM attributes, and an
     attribute-less preload is inert (the same quirk PageMeta’s upsertPreload
     works around). type="image/avif" byte-matches the hero <source>, so the
     preload is reused by the <picture> instead of fighting the fallback. */
  lcpPreload.setAttribute("imagesrcset", HERO_AVIF_SOURCES[studentHero].srcSet);
  lcpPreload.setAttribute("imagesizes", HERO_SIZES);
  lcpPreload.setAttribute("type", "image/avif");
  document.head.appendChild(lcpPreload);
}

const CategoryStory = lazy(() => import("@/components/landing/persona/CategoryStory"));
const HERO_WORDS = ["Learning,", "to master.", "to build."];

const StudentHeroSection = React.memo(() => (
  <PersonaHero
    words={HERO_WORDS}
    srSentence="Learning, to master, to build."
    sub="See the idea, practise it, and use it in the next thing you build."
    img={studentHero}
    alt="A student smiling while carrying a new laptop"
    ctaLabel="Create a free account"
  />
));

export default function StudentPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: fontStack }}>
      <LandingNav />
      <main id="main" tabIndex={-1}>
        <StudentHeroSection />
        <Suspense fallback={null}>
          <CategoryStory story={story} />
        </Suspense>
      </main>
      <LandingFooter variant="quiet" />
    </div>
  );
}
