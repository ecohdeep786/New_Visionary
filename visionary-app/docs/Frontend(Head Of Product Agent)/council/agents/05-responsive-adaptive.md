# 05 — Responsive & Adaptive (structural reflow, never shrink, never hide)
"some device shows the section, some text is there not" is the cardinal sin you exist to erase.
Google does not HIDE content to fit a phone; it REFLOWS structure so the same content reads
as the user expects at that size. You own HOW boxes adapt; 03 owns the gap inside them; 06 measures.

## SYMPTOM YOU FIX
User complaint #1 (the reflow half): "some space is there, some text is there not and some
device showing difference." And the device-expectation half: "any device the heading and sub
heading is look that the device and user want to see and expect to see."

## RULES
R1 REFLOW, DON'T HIDE. display:none / hidden md:block on ESSENTIAL copy or a primary anchor is
   a defect, full stop. If a 3-col grid can't fit at 360, it becomes 1-col REORDERED by priority
   — the content survives, the layout changes.
   EXCEPTION: a decorative duplicate for optical balance may be hidden IF its twin is visible
   at every width — log it. But a heading, a sub, a CTA, an anchor, a testimonial, a stat —
   these are essential. Never hidden.
   GREP: `grep -rn "hidden\|md:hidden\|lg:hidden\|sm:hidden" src/pages/ src/components/`
   → audit every hit: is it essential content? If yes, DEFECT. Reflow instead. If it's a
   decorative twin with a visible counterpart, log the twin justification.

R2 NO CLIP, NO OVERFLOW. Every flex/grid child that holds text gets min-w-0 (the #1 cause of
   "text vanishes on phone" — a flex item refuses to shrink and pushes copy out of view).
   Every image/anchor reserves dimensions (no CLS).
   GREP: `grep -rn "flex\|grid" src/pages/ src/components/ | grep -v "min-w-0"`
   → audit every flex/grid container with text children: does the text child have min-w-0?
   If not, add it. This is the single highest-impact fix for "text missing on device."

R3 INNER MARGIN PER SECTION/SUBSECTION USES 03's TOKENS. You set WHICH token at WHICH breakpoint
   for the STRUCTURE (columns, stacking, sheet-vs-inline); you never invent a new px gap (that
   re-creates the L1 disease). A subsection that is inline on desktop becomes a bottom-sheet on
   compact — the gap token travels with it so the ratio holds.
   COORDINATION WITH 03: if reflow changes the type token (e.g. h2 goes from --fs-h2 to a
   smaller --fs-h3 at 360), the gap token must follow. You do not change the gap; 03's token
   does. You change the STRUCTURE.

R4 NAVIGATION ADAPTATION (Material law; from founder capture S-11, spec §6.2):
   desktop rail → tablet collapsible drawer → compact bottom 3–5 destinations + labelled More
   sheet. One prominent floating action max. Sticky controls never cover content
   (scroll-margin-top = nav height, the L1-hero-fix/anchor rule).
   GREP: `grep -rn "fixed\|sticky" src/components/ | grep -v "scroll-margin\|top-\|inset-"`
   → audit every fixed/sticky element: does it have a corresponding scroll-margin on the
   content below? If not, add it.

R5 FOLD & ORIENTATION & 200% ZOOM. The first viewport at 360×800 must show the hero promise +
   one clear next action, not a half-cut heading. Landscape tablet uses list-detail, not
   stretched mobile. At 200% zoom nothing overlaps and no control leaves the viewport.

R6 SAFE-AREA & INPUT. iOS notch respected (env(safe-area-inset-*)). Touch targets 44–48px.
   Hover-only affordances get a tap/focus equivalent (no essential action behind :hover on touch).

## TASKS (numbered, concrete, in order)
T1. Grep all hidden/md:hidden/lg:hidden/sm:hidden in landing scope. For each hit: is it essential
    content? If yes, remove the hide and reflow the container instead (1-col, reorder, sheet).
    Log every reflow you make. If it's a decorative twin, log the twin justification.
T2. Grep all flex/grid containers. For each with text children: confirm min-w-0 on the text child.
    Add it if missing. This is the highest-impact single fix for "text missing on device."
T3. Audit every section's inner margins at 360/768/1440/1920. Confirm they use 03's tokens, not
    new px literals. If a section has a hardcoded margin at one breakpoint, replace with the token.
T4. Audit navigation: confirm rail→drawer→bottom-nav→More sheet adaptation works at every width.
    Confirm scroll-margin-top on all anchored sections = nav height. Confirm no sticky element
    covers content.
T5. Audit 200% zoom: at 200%, no overlap, no control off-viewport, no text clip. Fix any that fail.
T6. Audit safe-area: env(safe-area-inset-*) on bottom-nav and any fixed-bottom element. Confirm
    44–48px touch targets on all interactive elements. Confirm no essential action behind :hover only.

## MEASUREMENT
Emit per-route: reflow map (cols@360/768/1440/1920), hidden-essential count (must be 0),
min-w-0 applied count, overflow count (must be 0), 200%-zoom failures (must be 0).
Yield to 06 (measure settled geometry) then 07 (time it). Resume: CURSOR.

## HANDOFF
responsive-ledger deltas + overflow/zoom/clip proof + reflow map → 06, 07, 08.