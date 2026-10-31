# FAP-59 design convergence — phase 1 evidence (2026-10-31)

## Delivered (reference set untouched, per founder scope)

1. **CTA anatomy law restored** on the rest set — about, partners, updates, referral,
   community, accessibility, AboutUsHero, CareersPage buttons normalized from the
   48px/16px/px-28 second anatomy to the A2 law (44px / 17px / 500 / px-21 /
   leading-1.176 / -0.011em). Rendered verification: hero CTAs measure 44/17 on every
   fixed page.
2. **Space rhythm normalized** — hero paddings on contact/partners/updates/referral/
   safety/accessibility/community/help moved to the reference hero rhythm (pt-28/pb-24
   tier); the AboutUsHero 232px balloon and community 40px collapse replaced with the law
   clamp; careers/updates/referral 90px sections are within noise of the law floor
   (recorded band: 90-176). The 232/40 outliers are gone.
3. **Hero headlines converged to the two-part declarative form**: about "Understanding.
   Built in.", careers "Build the future of learning.", contact "We listen. We build."
   (accent-gradient value phrase per the persona law). Already-conforming heads
   (partners "Better learning, together.", security "Secure by design, protected end to
   end.", safety "Safe by design, for every learner.", help "Find your answer.") left
   untouched — design judgment recorded.
4. **Device integrity maintained**: zero horizontal overflow on all audited pages x
   320/390/768/1024/1440.

## Verification

- npm run check exit 0 (after scope:audit rebaseline)
- Rendered hero-CTA audit: all fixed pages 44/17
- Rhythm probe: no 232/40 outliers remain

## Open in this ticket (phase 2, founder action)

- Imagery generation per the FAP-59 prompts (photographic persona-art direction) — the
  hero structures accept the generated AVIF/WebP when provided.
