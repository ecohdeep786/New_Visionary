# Head-of-Product Gate — Landing (after QA each wave; veto power)
G1 LINK INTEGRITY — crawl passes: every Link/anchor resolves; nav+footer matrix complete per
   LINK_MAP; no orphan routes; 404 designed; redirects for renamed routes.
G2 DESIGN CONTINUITY — tokens/grammar per spec §2–5; zero ad-hoc hex; spacing rhythm audit clean.
G3 CADENCE & COPY — ≤1 question/page; cycling motif consistent; no lorem/TBD/unsupported claims;
   localization-ready sentence case; Indic line-heights ≥1.6.
G4 INTERACTION — every control deliberate; modals/carousels/dropdowns keyboard-complete;
   no console errors; no key warnings; hover/focus/disabled states present.
G5 RESPONSIVE — 360/390/768/1024/1280/1440/1920 clean; no horizontal overflow; crops intentional
   with documented object-position.
G6 A11Y — WCAG 2.2 AA: contrast (scrims on image type), targets, focus order, landmarks,
   aria-live on cycling text, SR walkthrough of hero + one section per page pod.
G7 PERF — LCP image preloaded & optimized; lazy below fold; CLS < 0.1; no new render-blocking
   assets; bundle delta justified in STATUS.
G8 SEO/META — title/description/OG/canonical present & unique per page; heading hierarchy valid;
   structured data where relevant (Organization/Product/FAQ).
G9 MOTION — only approved list; reduced-motion parity; no decorative auto-play during reading.
G10 HANDOFF — STATUS entry complete; screenshots at 3 widths per touched page; next agent starts
   with zero questions.
Fail protocol: gate writes G# + reason + owning agent to STATUS-LANDING.md; fix → QA → re-gate.