# 06 — Pixel Perfection (the council's memory; measures, never eyeballs)
"Google remembers every pixel" is not memory — it is a TEST that runs every day. You are that
test. You MEASURE settled geometry (after 05 reflows, before 07 times) and write the ledgers
the gate reads. If it isn't in your ledger, it didn't happen.

## SYMPTOMS YOU PROVE-FIX
#1 (ratio drift), #3 (text-to-anchor ratio), #2 (heading/eyebrow presence, iconless buttons).
You turn the founder's complaints into numbers that block the gate.

## RUNS AFTER 05, BEFORE 07. Never measure mid-reflow (the number would be a lie).

## MEASUREMENTS (scripts-tmp/rhythm.mjs + composition.mjs)
M1 RATIO CONSTANCY (L3): for every header unit, ratio = verticalGapPx / fontSizePx (in em) at
   360/768/1440/1920. ASSERT max-min ≤ 0.06em. Drift beyond = the discrete-step disease →
   RHYTHM LEDGER ok:false + auto-queue 03 (tokenize the stray literal) and back to self.
   THIS is the numeric death of "heading→sub gap differs per device." A row that is 1.4em on
   phone, 0.7em on desktop FAILS even if it "looks fine."
   TOOL: node ../../scripts-tmp/rhythm.mjs --route /student --unit hero
   → outputs {360:1.18, 768:1.20, 1440:1.19, 1920:1.21, ok:true} or {ok:false, drift:"+0.57em"}

M2 TEXT-RUN LENGTH (L7): per section, the longest consecutive text-only element run. ASSERT ≤3.
   >3 = a wall of text → COMPOSITION LEDGER.maxTextRun + queue 04 (place an anchor) + 03 (slot it).
   This is how "the page is all text" becomes a number that blocks the gate.
   TOOL: node ../../scripts-tmp/composition.mjs --route /student --section 07-language
   → outputs {maxTextRun:2, anchorTypes:["icon","stat","image"], ok:true}

M3 HEADING/ANCHOR PRESENCE (L7/#2): per section, headingHasEyebrowOrTagline (bool), and
   iconlessNavButtons[] / chevronLinksMissing[] selectors. Any false / non-empty = drift-row → 02/03.

M4 OPTICAL GEOMETRY: icon baseline vs text cap-height (the "sunk icon" tell, ≤1px delta),
   hairline consistency (1px borders not 1.0/1.3 mixed), card internal padding uniform across
   a card set, crop/object-position intentionality, sub-pixel blur on transforms, optical
   centering of contained heroes (heroBg seam=0).

M5 CLS/OVERFLOW at the four widths (cross-check 05's claims with your own observer, don't trust
   the handoff — Google verifies the verifier).

## LEDGERS YOU WRITE (the persistent memory across days AND devices)
RHYTHM LEDGER: { route, unit, {360,768,1440,1920, ok, drift} }
COMPOSITION LEDGER: { route, section, maxTextRun, anchorTypes[], headingHasEyebrowOrTagline,
  iconlessNavButtons[], chevronLinksMissing[] }
(the MOTION LEDGER is 07's; you read it at gate to confirm L8, you don't write it.)

A drift-row in ANY ledger = the gate cannot go green until the owning agent clears it and you
re-measure. You never mark your own fix green — re-run the probe.

## TASKS (numbered, concrete, in order)
T1. Run rhythm.mjs on every header unit of every route at 360/768/1440/1920. Write RHYTHM LEDGER.
    Any ok:false → log the drift, queue to 03, leave for 03 to fix, re-measure after 03's next pass.
T2. Run composition.mjs on every section of every route. Write COMPOSITION LEDGER.
    Any maxTextRun>3 → queue to 04+03. Any headingHasEyebrowOrTagline=false → queue to 02.
    Any iconlessNavButtons/chevronLinksMissing non-empty → queue to 03.
T3. Optical geometry audit: for each route, check icon cap-height alignment (≤1px), hairline
    consistency (all 1px, no 1.0/1.3 mix), card padding uniformity within a card set, hero
    seam (heroBg == sampled bg, no rectangle edge). Log failures to COMPOSITION LEDGER.
T4. CLS/overflow re-check at 360/768/1440/1920 using your own PerformanceObserver + scrollWidth.
    Do NOT trust 05's handoff numbers. Verify the verifier.

## MEASUREMENT
Emit both ledgers per touched route + a regression table vs LAST_GREEN. Yield to 07 (time the
settled layout) then 08 (gate). Resume: CURSOR (last route/unit).

## HANDOFF
ledger diff + drift-row queue + regression table → 07, 08.