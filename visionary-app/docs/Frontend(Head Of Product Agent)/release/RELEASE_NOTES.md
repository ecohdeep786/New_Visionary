# RELEASE NOTES — Visionary Landing Frontend (Waves L0–L6, complete 2026-09-17)

## Journey summary
| Wave | Scope | Result |
|---|---|---|
| L0 | Route inventory, crawl, token extraction, baselines, 4 launch-blocking fixes | ✅ |
| L1 | Foundation: head/meta system, /signin redirect, footer policy, 8-hex tokenization, DPDP-free scope fix, sitemap/robots/og-image, apple-touch-icon | ✅ G1–G10 PASS |
| L1a | Scope correction: auth surfaces restored byte-exact, head system scoped out of auth | ✅ |
| L1b | Speed: 46.5MB→2.2MB image conversion (original dimensions), RoutePrefetcher (idle chunk warm) | ✅ routing 19–53ms |
| L1-final | Full-matrix verification (26 routes × 7 widths) | ✅ 0 defects |
| L1-hero-fix | Hero background color-match restored (#ffffff, sampled) | ✅ |
| L2 | Persona pass: Google four-color voice indicator, modal focus trap, chip semantics (group/aria-pressed), hero srcSet (800/1600/2400w), phone hero 45KB | ✅ G1–G10 PASS |
| L3 | Product-info pass: pricing single fixture (₹299/₹499, Contact Visionary, §15.2 vocabulary), semantic table, how-it-works pedagogical loop, download notify form, 4-state forms, content-slot srcSet | ✅ G1–G10 PASS |
| L4 | Trust/legal/company pass: legalMeta fixture (dates/DPDP officer/response times), privacy anchors + grievance + cross-links, print styles, careers notify, contact 4-state | ✅ G1–G10 PASS |
| L5 | Final hardening: reduced-motion defect fix, language control, landing 1841KB→446KB, keyboard journeys, 200% zoom, budget report (R1–R5) | ✅ G1–G10 + R1–R5 PASS |
| L6 | Release pack: persona OG cards, JSON-LD, PNG cleanup, sitemap regen script, handoff bundle | ✅ FINAL SIGN-OFF |

## Key decisions (full record in STATUS-LANDING.md)
- Auth + internal product pack: never modified (L1a decree, held through L6).
- Design: frozen after acceptance; all changes were approved per-wave deliverables.
- Prices: fixture-owned (₹299 Personal / ₹499 Family provisional / Institution "Contact Visionary") — §8/§15.2 vocabulary enforced ("no daily cap · subject to fair use"; "unlimited/forever/priority" eliminated).
- Footer social links: removed until real profile URLs exist (no href="#" ships).
- Domain: placeholder https://visionary.app until founder confirms (VITE_SITE_URL + sitemap regen script ready).

## Evidence
- Gates G1–G10 pass at L1/L2/L3/L4/L5/L6 with selector-level runtime evidence per wave (STATUS-LANDING.md).
- Screenshot sets: baseline/, l1-shots/, l2-shots/, l3-shots/, l4-shots/, l5-shots/, l6-shots/ (78 PNGs).
- Reports: final-verify-report.json, l1-qa-report.json, crawl outputs, budget reports (per wave in STATUS).
- Final budget: dist 4.28MB gzipped total; prefetcher ≈284KB gzip; no route chunk >150KB gzip; hero 4G ≤250KB per persona route; CLS 0.000–0.082; LCP ≤2.4s on 4G.
