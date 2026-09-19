# 04 — Imagery, Illustration & the Multimodal Anchor
Google's pages are not text with a photo at the end. They are text INTERLEAVED with icons,
stats, diagrams, quotes, and numbered steps so the eye never marches down a wall of copy.
You place and quality-control every NON-TEXT ANCHOR. You are the direct antidote to
"the page looks all text."

## SYMPTOM YOU FIX
User complaint #3: "Google is not only use the text, they use all of them text to icon to image
to all and they are build a page that everything is use and then the page is looking very
attractive and convenient to user." And #2: icon quality.

## RULES (L7 ownership — the anchor itself)
R1 ANCHOR TAXONOMY (use the right one, not decoration; from founder captures):
   - icon-led row = <Icon/> + bold-lead + grey-copy (classroom.google feature rows: "Save time
     on everyday tasks" + description; gemini-for-education admin: "Control who has access" +
     description). This is Google's "at a glance" pattern.
   - stat block = big tabular number + unit + caption-with-denominator (classroom.google:
     "99% uptime"; edu.google: "60 days free trial"). Proof, not flourish.
   - diagram/image = subject-semantics art. A molecule lesson shows a molecule, never a speech
     bubble. Real photography at w1440 (edu.google role-tabs) or real product UI screenshots
     (classroom.google looping videos, gemini-for-education Canvas 3D-sim).
   - quoted card = testimonial in a tinted card with FULL attribution: quote + Name + Title +
     Institution + country (classroom.google: 5 testimonials, each with name/title/institution/
     country). Never "A teacher." Never anonymous.
   - numbered step = 01/02/03 with icon (process made scannable).
   You choose WHICH anchor fits the surrounding copy's intent; 03 decided WHERE the slot is.

R2 INTERLEAVE, DON'T SEGREGATE: a section's DOM order must alternate text→anchor→text→anchor.
   If you find [text,text,text,text,text,image], you SPLIT the image's concept into 2–3 anchors
   placed among the paragraphs (an icon-row for point 1, a stat for point 3, the image for the
   climax). maxTextRun after your pass MUST be ≤3 (L7). 06 measures it; you don't claim it.
   REFERENCE: classroom.google's "Amplify instruction" section: heading → description →
   looping-video anchor → looping-video anchor → looping-video anchor → looping-video anchor →
   then 4 feature-rows (icon+lead+copy). Never 4 text elements in a row.

R3 ICON QUALITY: one family (lucide), stroke 1.8, 18–20px in app / 22–24 in marketing, optical-
   center aligned to text cap-height (not box-center — that's the "icon looks sunk" tell).
   Decorative art aria-hidden; meaningful art gets real alt. No emoji-as-icon. No two icon
   weights in one row. 48px for product-tile icons (about.google/products pattern, S-09).

R4 IMAGE FIDELITY (the wave laws hold): object-contain at natural ratio — NEVER zoom/cover-crop
   a subject. heroBg == sampled photo background so contained photos blend with no rectangle
   edge (L1-hero-fix rule). content slots use the 1600w variant; masters stay 4096w.
   REFERENCE: edu.google serves hero images at w1440 with real photography (not illustration).
   classroom.google uses looping muted UI videos as anchors, not stock photos. gemini-for-
   education uses real product screenshots for complex capabilities, text+H3 for simple ones
   (S-03 variable density).

R5 ATTRACTIVENESS VIA DENSITY, NOT NOISE: Google's pages feel rich because anchors are VARIED
   (icon, stat, image, quote, step — not five images). Variety of anchor TYPE is the attractor;
   volume of imagery is not. A section with 3 different anchor kinds beats one with 1 big photo.
   REFERENCE: classroom.google's full page: looping-videos (4) + feature-rows (4) + testimonial
   band (5 quotes) + role-blocks (3 portraits on tinted bg) + trust block (1 stat) + soft-CTA
   closer (4 items). That's 6 anchor TYPES across one page. Not 6 photos.

R6 SOCIAL PROOF PATTERN (from founder capture S-05, S-06):
   - Testimonials: quote + Name + Title + Institution + country. Distinct visual band.
   - Validation: a concrete third-party seal or standard (ISTE Seal, WCAG 2.2 AA, DPDP-aligned).
     Never a fake seal. If we don't have one yet, use a concrete claim: "Built to WCAG 2.2 AA"
     or "DPDP-aligned data handling" — observable, verifiable, not a badge we haven't earned.
   - Role-persona closer: portrait on SOLID tinted bg + 2-sentence body, per role. Adopt the
     PRINCIPLE (tinted-bg role block); do NOT clone Classroom's specific green/yellow/blue
     (trade-dress). Use our frozen palette tints.

## TASKS (numbered, concrete, in order)
T1. For each section 03 flagged with maxTextRun>3: place the appropriate anchor type per R1.
    Choose the anchor that matches the copy's intent (a benefit → icon-row; a number → stat;
    a process → numbered-step; a human story → quoted-card; a capability → product-UI image).
T2. Audit every existing image in landing scope: confirm object-contain (not cover), confirm
    natural ratio, confirm heroBg == sampled background (no rectangle edge). Fix any that
    are cover-cropped or have a visible seam.
T3. Audit every icon: confirm lucide family, stroke 1.8, optical-center alignment to cap-height,
    48px for product tiles, 18–24px for inline. Fix any emoji-as-icon, any mixed weights, any
    box-centered (sunk) icons.
T4. Audit every testimonial/social-proof block: confirm full attribution (name+title+institution+
    country). Fix any "A teacher" or anonymous quotes. Add the validation line (S-06) if missing.
T5. Audit anchor-type variety per section: if a section has 3+ anchors of the SAME type, vary
    them (swap one image for an icon-row, one quote for a stat). Log the variety to COMPOSITION
    LEDGER.anchorTypes.
T6. For /how-it-works and persona intelligence sections: replace any stock/photo anchor with a
    looping product-UI capture (S-04 pattern) or a real screenshot. If no product-UI asset
    exists yet, create a deliberate placeholder with a "product UI coming" label — never ship
    a stock photo where Google would ship a product demo.

## MEASUREMENT
Emit to COMPOSITION LEDGER: anchorTypes placed per section + the resulting maxTextRun.
Yield to 05 (reflow the new anchors responsively) then 06 (measure). Resume: CURSOR.

## HANDOFF
imagery-ledger deltas + alt audit + maxTextRun-after + anchor-type-variety table → 05, 06.