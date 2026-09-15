# Landing Frontend Master Contract (v1)
Scope: all public marketing pages. Backend/auth later; pages are static-react complete.

## 1. Page inventory (01-PM confirms against repo routes; add redirects if renamed)
Persona: / · /student · /teacher · /parent · /professional · /organization
Product info: /how-it-works · /pricing · /download · /about · /research · /community ·
/updates · /partners · /referral
Trust/legal: /privacy · /terms · /cookies · /safety · /security · /accessibility
Company: /careers · /contact
Auth entry: /register · /signin
Error: designed 404 (+ offline notice where feasible).

## 2. Design tokens (single source = MASTER_SPEC §3; marketing values)
Everything already done the and matched with the google and apple designed. In landing page no 
need to check design token 

## 3. Type & cadence
Already done the typoegraphy and you have to check that resonsiblity is to make sure everwhere 
the fonts are applied correctly and work adjust according to theany device as gogole and apple font does.

## 4. Breathing scale (marketing)
Already done the breathing scale and you have to check that resonsiblity is to make sure everwhere 
the breathing scale is applied correctly and work adjust according to theany device as gogole and apple breathing scale does.


## 5. Component grammar (reuse, never re-invent)
PersonaHero: full-bleed image (object-contain lg, top-anchored), cycling word, black pill CTA +
bordered secondary. Circle cluster: 1 big + satellites, hand-drawn arrow in the gutter
(strokeWidth 3.5, head barbs ±30° off reverse tangent). Chip rail (two-way synced where specced).
Carousel: center-first ALIGN, pill-active dots, round prev/next on cardSurface. Modal grammar:
eyebrow → two-line headline ink+blue → rounded-24 image band with white icon chip → 2×2 blocks
(border-top, icon tile, bold lead-in, grey copy, blue chevron link) → dark round close.
Cards: white, radius 24–50 per context, border #e5e7eb or ink1A, elevation-1/2 only.
Scrim on image type: from-#121317/55 via/20 to transparent. Icon pills white/95 + blue icon.

## 6. Motion (approved list only)
heroFadeUp 0.9s cubic-bezier(0.22,1,0.36,1) · FadeReveal y6→0 700ms · struggleWordIn 0.65s ·
struggleImageIn 0.7s · voiceDot 1.2s · travelSlot* 0.9s · ccwIn · icFloatY · keyed cycling words.
Global prefers-reduced-motion kill. No auto-play decorative motion during reading.

## 7. Per-page requirements (every page, no exceptions)
Semantic single h1 (+ sr-only supplement where display text is partial) · meta title ≤60 chars ·
meta description · OG+Twitter card · canonical · alt on all meaningful images · decorative svg
aria-hidden · focus-visible rings #4285F4 · every Link resolves (LINK_MAP) · nav+footer present ·
CTA to /register (or role-correct entry) · no console errors · no React key warnings ·
no lorem/TBD/placeholder copy · images: eager+preload for LCP, lazy below fold, aspect reserved.

## 8. Claims discipline
Customer copy states observable behavior; "pedagogical AGI/knows everything/guaranteed mastery"
stay internal vision (MASTER_SPEC §1.4). Prices only from config (₹299 / family ₹499 provisional /
org TBD as "Contact Visionary"). No "uncopyable", no "unlimited".

## 9. Waves
L0 audit (route inventory, token extraction, link crawl, baseline shots) →
L1 foundation (shared nav/footer/404/meta system, token normalization) →
L2 persona pages pass → L3 product-info pass → L4 trust/legal/company pass →
L5 hardening (crawl, a11y, perf, seo, motion, pixel) → L6 release pack. 