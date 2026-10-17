const fs = require('fs');
const path = require('path');

const filePath = path.join('frontend', 'src', 'pages', 'Landing.jsx');
let c = fs.readFileSync(filePath, 'utf8');

// 1. Replace the HERO_CATEGORY_WORDS block
const oldCategoryWords = `/* Apple-grammar hero: a short benefit-led line (mirroring /education's
   "Designed for every kind of learner" and /education-initiative's
   "moves … everyone forward") that names every category the page serves.
   NewPersona appends the trailing period itself, so the words carry none. */
const HERO_CATEGORY_WORDS = ["for students", "for teachers", "for parents", "for professionals", "for organizations"];

`;

const newCategoryWords = `/* Apple-grammar hero: the product statement on one line, the audience on
   the next — the /education-initiative/ pattern resolved to Visionary's
   universal grammar. */

`;

if (c.includes(oldCategoryWords)) {
  c = c.replace(oldCategoryWords, newCategoryWords);
  console.log('Replaced HERO_CATEGORY_WORDS block');
} else {
  console.log('HERO_CATEGORY_WORDS block NOT FOUND');
}

// 2. Remove MEET_WORDS and MEET_WORD_MS
const oldMeetWords = `const MEET_WORDS = ["understands.", "remembers.", "grows with you.", "starts with where you are."];
const MEET_WORD_MS = 3000;
`;
if (c.includes(oldMeetWords)) {
  c = c.replace(oldMeetWords, '');
  console.log('Removed MEET_WORDS and MEET_WORD_MS');
} else {
  console.log('MEET_WORDS NOT FOUND');
}

// 3. Update LANDING_HERO_WORDS
const oldHeroWords = `const LANDING_HERO_WORDS = ["One intelligence"];`;
const newHeroWords = `/* Apple's universal hero grammar: a single declarative statement that
   names the product's universal value and every category it serves — the
   same pattern as /education-initiative/ and /education. No cycling, no
   fragmentation — one line, one truth. */
const LANDING_HERO_WORDS = ["One intelligence,"];

/* The category line that completes the sentence — Apple carries this as
   a secondary line in the same H1. */
const LANDING_HERO_CATEGORIES = "for students, teachers, parents, professionals, and organizations";`;

if (c.includes(oldHeroWords)) {
  c = c.replace(oldHeroWords, newHeroWords);
  console.log('Updated LANDING_HERO_WORDS');
} else {
  console.log('LANDING_HERO_WORDS NOT FOUND');
}

// 4. Update LandingHeroSection
const oldHeroSection = `const LandingHeroSection = React.memo(function LandingHeroSection() {
  return (
    <PersonaHero
      words={LANDING_HERO_WORDS}
      animatedHeadlinePrefix="One intelligence"
      animatedHeadlineWords={HERO_CATEGORY_WORDS}
      srSentence="One intelligence for students, teachers, parents, professionals, and organizations."
      cast={LANDING_HERO_LINEUP}
      ctaLabel="Start learning"
      secondaryLabel="See how it works"
      minDisplay={36}
    />
  );
});`;

const newHeroSection = `/* ── HERO ──
   Apple's universal front door: a single H1 statement with the product
   name on one line and the audience on the next, the family of five alpha
   cutouts rising from the fold, and the pair of actions. No subhead, no
   cycling — Apple's education hero carries only the large statement and
   the actions; the story lives below the line-up. */
const LandingHeroSection = React.memo(function LandingHeroSection() {
  return (
    <PersonaHero
      words={LANDING_HERO_WORDS}
      staticHeadline={LANDING_HERO_CATEGORIES}
      srSentence="One intelligence, for students, teachers, parents, professionals, and organizations."
      cast={LANDING_HERO_LINEUP}
      ctaLabel="Start learning"
      secondaryLabel="See how it works"
      minDisplay={42}
    />
  );
});`;

if (c.includes(oldHeroSection)) {
  c = c.replace(oldHeroSection, newHeroSection);
  console.log('Updated LandingHeroSection');
} else {
  console.log('LandingHeroSection NOT FOUND');
}

fs.writeFileSync(filePath, c);
console.log('Landing.jsx updated successfully');
