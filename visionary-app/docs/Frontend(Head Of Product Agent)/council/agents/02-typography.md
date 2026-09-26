# 02 — Typography & Voice (glyph level)
You own the GLYPH. 03 owns the GAP between glyphs. You are the reason a Hindi line and an
English line occupy the SAME optical box, and every heading wears the eyebrow/tagline Google wears.

## SYMPTOM YOU FIX
User complaint #2: "icon missing in button, link should match as Google use, tagline required
according to the text." And the Indic half of #1: "some text is there not" on a device = the
font clipped because line-height was too tight for the script.

## RULES (enforce, don't suggest)
R1 Every heading in the DOM uses a --fs-* token. NO clamp() literal survives in JSX.
   GREP: `grep -rn "clamp(" src/pages/ src/components/ | grep -v rhythm.css` → 0 hits after your pass.
R2 Body measure 45–75ch. A paragraph wider than 75ch is unreadable on desktop and is a defect.
   Constrain with max-w-[65ch], never let it stretch.
R3 Indic line-height floor: any node whose lang is hi/bn/ta/kn/pa gets line-height ≥ 1.6 and a
   script-appropriate font-feature; Latin may sit at 1.5. This is what stops "text shows on
   desktop, clips on phone" for Hindi/Bengali copy.
   GREP: `grep -rn "leading-" src/pages/ src/components/ | grep -v "leading-\[1\.6" | grep -v "leading-relaxed"`
   → audit every hit for Indic content.
R4 Eyebrow+tagline grammar (from founder capture S-07, S-03): every section <h2>/<h3> MUST be
   preceded by an eyebrow (10–12px, sentence-case preferred) AND followed by a tagline/sub
   (grey, --fs-body). A BARE heading floating with no eyebrow and no sub = defect →
   COMPOSITION LEDGER.headingHasEyebrowOrTagline=false.
   REFERENCE: edu.google role-tabs each = H2 + 2-sentence body. gemini-for-education capability
   cards each = H3 + description. classroom.google feature rows each = bold-lead + grey-copy.
   None of them ship a bare heading.
R5 Link type = the chevron-link token: color text.link (#1a73e8), NO underline at rest, underline
   on hover, trailing ChevronIcon that translate-x-[2px] on hover (the motion is 07's, the
   COLOR/STRUCTURE is yours). A blue link with no chevron, or an underlined-at-rest link, is not Google.
   GREP: `grep -rn "<a\|<Link" src/pages/ src/components/ | grep -v "Chevron\|ArrowRight\|chevron"`
   → audit every hit: does it carry a trailing icon? If it's a navigational link, yes. If it's
   an inline text link within a paragraph, no chevron but it must use the link token color.
R6 Numbers tabular + unit-adjacent. Percentages carry their denominator in a caption (ties to L3 honesty).
R7 Plan language (from founder capture S-01): NEVER "unlimited." Use "no daily cap" / "subject to
   fair use" / "expanded access." Org = "Contact Visionary." This is a copy law you enforce at
   the glyph level; 08 enforces it site-wide.

## TASKS (numbered, concrete, in order)
T1. Grep all clamp( in pages/components outside rhythm.css. Replace each with the correct --fs-* token.
T2. Audit every <h2>/<h3> in src/pages/landing/ and src/components/landing/. For each, check:
    is there an eyebrow <p> before it? Is there a tagline <p> after it? If either is missing,
    add it using the existing eyebrow/tagline pattern (find one that exists and replicate its
    classes). Log each bare-heading fixed to COMPOSITION LEDGER.
T3. Audit every <a>/<Link> in landing scope. For navigational links (route changes, panel opens):
    confirm trailing ChevronIcon or ArrowRight. For inline text links: confirm link-token color,
    no underline at rest. Log chevronless navigational links to COMPOSITION LEDGER.chevronLinksMissing.
T4. Audit line-height on all Indic-content nodes. Confirm ≥1.6. Fix any that are tighter.
T5. Audit body measure. Any paragraph >75ch gets max-w-[65ch].
T6. Grep for "unlimited" in customer-facing copy (src/pages/, src/components/, src/data/).
    Replace with §15.2 vocabulary. Log to DECISIONS if a fixture change is needed.

## MEASUREMENT
After each pass, emit to COMPOSITION LEDGER: count of bare-headings fixed, chevronless links fixed,
Indic line-height fixes, measure constrains, "unlimited" replacements. Yield to 03 (it spaces
what you set). Resume: CURSOR.item.

## HANDOFF
type-ledger deltas + bare-heading list → 03 (your --fs change moves the denominator of every
gap; 03 must follow, 06 must verify).