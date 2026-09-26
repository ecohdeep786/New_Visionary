# 07 — Motion (presence floor L8; runs on SETTLED layout, last in craft)
"motion is missing" means your elements are STATIC where Google's breathe. Motion isn't
decoration you add at the end — it's the state-change every interactive element owes the user.
You time geometry that 06 already measured, so it never causes a shift the ledger didn't predict.

## SYMPTOM YOU FIX
User complaint #4: "Motion and animation is missing as Google use in our product."

## THE MOTION INVENTORY (every element type owes its row; 08 asserts none is blank)
| element | hover/focus | entrance | reduced-motion fallback |
|---------|-------------|----------|------------------------|
| card | lift translateY(-2..-4px) + shadow elevation-1→2, 200ms | fade+rise, stagger 0/60/120ms | opacity-only, NO transform, still appears |
| chevron-link | chevron translate-x-[2px] + underline-in, 150ms | (inherits parent) | color/underline only |
| primary CTA | bg deepen + scale-[1.02], 150ms | with its section | opacity-only |
| chip/tab | bg chipBg-in + ink, 150ms | stagger | opacity-only |
| stat block | — | count-up 0→N over 600ms, ease-out | show final value instantly |
| section header | — | eyebrow→h2→sub staggered 0/80/160ms | opacity-only, order preserved |
| hero | parallax/orbit subtle | heroFadeUp keyed | static composed frame |
| voice indicator | — | four-color pulse (approved voiceDot) | static four dots, colored |
| image/anchor | — | fade-in on intersect (IntersectionObserver) | opacity-only |
| looping product-UI video (S-04) | — | fade-in on intersect, muted, autoplay, loop | static first-frame image |

REFERENCE (from founder captures): classroom.google uses looping muted UI videos as section
anchors (S-04). gemini-for-education uses real product screenshots for complex capabilities.
edu.google uses real photography at w1440. None of them ship a static card with no hover state.
None of them ship a section that pops in as one lump.

## RULES
R1 NO STATIC INTERACTIVE ELEMENT. A card/link/button/chip/tab with no hover AND no focus
   transition = L8 violation → MOTION LEDGER.hasHover:false → you fix it (it's your dimension).
   08 counts blanks.
   GREP: `grep -rn "className.*card\|className.*button\|className.*link\|className.*chip\|className.*tab"
   src/pages/ src/components/ | grep -v "hover:\|transition\|duration"`
   → every hit is a candidate blank. Audit: does it have a hover/focus transition? If not, add one.

R2 STAGGER, DON'T LUMP. A section's children reveal in sequence (0/60/120/180ms), not as one block.
   entranceStaggerSteps must be ≥ children-count capped at 5. A section popping in whole = flat.
   GREP: `grep -rn "FadeReveal\|fade-in\|animate-" src/pages/ src/components/`
   → audit every section entrance: does it stagger children or reveal as one lump?

R3 APPROVED EASING ONLY. cubic-bezier(0.22,1,0.36,1) family; fast 150 / standard 250 / slow 400;
   entrances 700–900ms (heroFadeUp). NO new keyframes; NO auto-play decorative motion during
   reading (the loop pauses on hover/focus — wave law holds).

R4 REDUCED-MOTION = OPACITY-ONLY, NEVER ZERO. prefers-reduced-motion collapses transform to
   opacity but the element STILL transitions in (content must appear, just without movement).
   A fallback of "none" (instant, no fade) is a defect — the user loses the entrance cue entirely.
   GREP: `grep -rn "prefers-reduced-motion\|reduced-motion" src/ index.css`
   → confirm the global kill exists AND that it collapses to opacity-only, not to display:none
   or to instant-show.

R5 MOTION NEVER MOVES GEOMETRY 06 DIDN'T LOG. If a transform would shift layout (CLS), hand back
   to 03/06 — you time, you don't reflow. count-up reserves width (tabular-nums + min-w) so it
   doesn't jitter the row.

R6 CYCLING WORDS KEYED. Every cycling span uses React key= so the fade re-triggers; aria-hidden
   on the visual, sr-only steady sentence for SR (wave a11y law).

## TASKS (numbered, concrete, in order)
T1. Grep all interactive elements (card/button/link/chip/tab). For each: confirm hover AND focus
    transition exists. If blank, add the appropriate transition from the inventory table.
    Log every fix to MOTION LEDGER.
T2. Grep all section entrances (FadeReveal, animate-, intersection observers). For each: confirm
    children stagger (0/60/120/180ms), not one lump. Fix any lump-entrance to stagger.
    Log entranceStaggerSteps to MOTION LEDGER.
T3. Audit reduced-motion: confirm global kill exists AND collapses to opacity-only (not none,
    not instant-show, not display:none). Fix any that fails. Log reducedMotionFallback to
    MOTION LEDGER.
T4. Audit count-up stats: confirm tabular-nums + min-w reserved so the count doesn't jitter.
T5. Audit cycling words: confirm React key= on every cycling span. Confirm aria-hidden on visual,
    sr-only on steady sentence.
T6. For any section 04 flagged with a looping product-UI video (S-04): confirm muted, autoplay,
    loop, fade-in on intersect, reduced-motion = static first-frame. If no video asset exists
    yet, use a static screenshot with fade-in and log "video asset pending."

## MEASUREMENT
Emit MOTION LEDGER per route/element (hasHover/hasFocus/steps/fallback). Yield to 08 (gate
asserts L8 blanks=0). Resume: CURSOR.

## HANDOFF
motion-ledger deltas + reduced-motion proof + blank-element list (must be empty) → 08.