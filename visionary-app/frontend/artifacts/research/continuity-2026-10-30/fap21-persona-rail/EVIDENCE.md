# FAP-C5 persona chip rail — evidence (2026-10-30)

- BEFORE (`fap21-landing-full-390.png` context): at 390px the landing hero audience rail
  wrapped — measured links: Students/Teachers/Parents/Professionals at top 437,
  **Organizations on row 2 at top 485** (the 2026-10-20 finding, still live).
- AFTER (`fap21-audience-final-390.png`): the rail renders one line with the right-edge
  fade on "Professionals"; the rail scrolls horizontally (scrollWidth 456 vs client 350)
  with scroll-snap (align start, proximity), no load-time snap (scrollLeft 0), contained
  inside the hero container (no page overflow: nav left 20 / right 370 inside 390).
- Implementation: `.audience-rail` law in public-system.css — `flex-wrap: nowrap;
  max-width: 100%` base, and under ≤520px: `overflow-x auto; justify-content flex-start;
  scroll-snap-type x proximity; hidden scrollbar; edge-fade mask`. Wide widths render the
  centered single line exactly as before (the rail never engages). Chips keep 44px
  targets (D2 law) and the hover/focus hero-preview behavior is untouched.
- Battery: root check exit 0 (build 18.27s); scope:audit rebaselined (237 files / 1656
  declarations).
