1. Refactor `StudentIntelligenceSection` in `src/pages/landing/StudentPage.jsx` into a true Apple-style feature chapter:
   - Use a full-width near-black cinematic surface for the chapter and remove the light-surface opt-out.
   - Replace the centered intro with a measured left-aligned statement and compact supporting copy.
   - Preserve the existing scroll-linked desktop story and mobile stacked story, but add a persistent step rail, clearer active-state treatment, and a restrained product-stage frame that reads as one evolving intelligence rather than four disconnected SVG scenes.
   - Keep all existing accessibility behavior, reduced-motion behavior, keyboard controls, and no-external-asset constraint.

2. Add narrowly scoped styling in `src/styles/public-bridge.css` for the student intelligence chapter only:
   - Ensure the dark surface, frost text, hairlines, and blue accent remain stable against the existing global bridge rules.
   - Add the Apple-style section rhythm and responsive rules needed for the rail/frame composition without changing other landing routes.

3. Audit adjacent student sections 06–13 after the section 5 change and make only the highest-signal consistency fixes needed for the Apple rhythm:
   - remove any remaining conflicting rounded top seams on the student page;
   - normalize section 6/7 transition surfaces so the dark intelligence chapter resolves cleanly into the next white chapter;
   - preserve existing copy, images, and interactions unless a layout issue makes them unreadable or nonresponsive.

4. Verify with `npm run lint`, `npm run typecheck`, and `npm run build`. Start the Vite dev server and inspect the student route at desktop and mobile widths, checking the section 5 sticky behavior, active-step transitions, overflow, reduced-motion fallback, and the handoff into section 7. Fix any issues found, then report the exact files changed and checks run.