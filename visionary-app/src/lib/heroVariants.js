/**
 * Responsive hero variants (Wave L2, 07-perf). Each hero ships 800w/1600w/2400w
 * with 2400w as the largest candidate; NewPersona renders them via srcSet so devices fetch
 * only what their viewport/DPR needs (an entry-level 390px phone gets the 800w
 * file, ~20-45KB, and avoids the ~260MB decode of the 4096w source).
 * Keys are the imported 4096w URLs (same module instances the pages import).
 */
import studentHero from "@/assets/student-hero-main-2400w.webp";
import teacherHero from "@/assets/teacher-hero-main-2400w.webp";
import parentHero from "@/assets/parent-hero-main-2400w.webp";
import proHero from "@/assets/pro-face-main-2400w.webp";
import orgHero from "@/assets/org-face-main-2400w.webp";

import studentHero800 from "@/assets/student-hero-main-800w.webp";
import studentHero1600 from "@/assets/student-hero-main-1600w.webp";
import studentHero2400 from "@/assets/student-hero-main-2400w.webp";
import teacherHero800 from "@/assets/teacher-hero-main-800w.webp";
import teacherHero1600 from "@/assets/teacher-hero-main-1600w.webp";
import teacherHero2400 from "@/assets/teacher-hero-main-2400w.webp";
import parentHero800 from "@/assets/parent-hero-main-800w.webp";
import parentHero1600 from "@/assets/parent-hero-main-1600w.webp";
import parentHero2400 from "@/assets/parent-hero-main-2400w.webp";
import proHero800 from "@/assets/pro-face-main-800w.webp";
import proHero1600 from "@/assets/pro-face-main-1600w.webp";
import proHero2400 from "@/assets/pro-face-main-2400w.webp";
import orgHero800 from "@/assets/org-face-main-800w.webp";
import orgHero1600 from "@/assets/org-face-main-1600w.webp";
import orgHero2400 from "@/assets/org-face-main-2400w.webp";

const srcSet = (w800, w1600, w2400) => `${w800} 800w, ${w1600} 1600w, ${w2400} 2400w`;

export const HERO_SIZES = "100vw";

export const HERO_SRCSETS = {
  [studentHero]: srcSet(studentHero800, studentHero1600, studentHero2400),
  [teacherHero]: srcSet(teacherHero800, teacherHero1600, teacherHero2400),
  [parentHero]: srcSet(parentHero800, parentHero1600, parentHero2400),
  [proHero]: srcSet(proHero800, proHero1600, proHero2400),
  [orgHero]: srcSet(orgHero800, orgHero1600, orgHero2400),
};

export const HEROES = { studentHero, teacherHero, parentHero, proHero, orgHero };
