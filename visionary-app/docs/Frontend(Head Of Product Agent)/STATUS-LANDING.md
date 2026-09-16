# STATUS-LANDING — append only
## [Wave L0] [00-chief] — [date]
Pack initialized; inventory pending 01-PM crawl.
---
## [Wave Ln] [Agent] — [date]
Done: … / Files/pages touched: … / Decisions: … / Open for next: … / QA+gate refs: …
---
## [Wave L0] [00-chief] — 2026-09-13
Done: Route inventory + link crawl + token extraction + baseline screenshots + 4 launch-blocking defect fixes.
Files/pages touched: ParentPage.jsx (missing `Award` lucide import — page crashed), App.jsx (`/career` → `<Navigate to="/careers" replace />`; its category data no longer exists, page threw TypeError on every device; per LINK_MAP rule 4), LandingFooter.jsx (language select overflowed 390px viewport → flex-wrap + min-w-0), ui/toast.jsx (ToastViewport missing `pointer-events-none` — empty z-100 strip intercepted taps over nav on phones / bottom-right on desktop).
Decisions: /career treated as renamed route (redirect, not rebuild) — LINK_MAP inventory unchanged; crawl tooling lives in scripts-tmp/ (l0-audit.mjs, audit.mjs, baseline.mjs) for reuse by 09-qa/10-pixel; false positives documented: /safety#security & #accessibility anchors DO exist (data-driven ids via LegalPage), commented categories in landingCategories.js ignored.
Inventory deltas (LINK_MAP §route inventory): repo additionally has /login (map says /signin), /forgot-password, /forgot-user-id, /reset-password, /help, /dev/scenarios (dev-only, orphan by design), /onboarding, /dashboard (internal pack). No /signin route exists — needs PM decision (redirect /signin→/login or rename) before G1.
Crawl: 0 dead links on public marketing pages (previous fixes held); orphans: /dev/scenarios + /reset-password + /onboarding (accepted: dev/utility entries — confirm with 01-PM).
Tokens: palette is consistent; 8 ad-hoc hex outside MASTER_SPEC §3 palette found (PrivacyPage #EAF2FF, TeacherPage #E8EAED, UpdatesPage #F8FAFF, Login/Register/ResetPassword #F0F2F5 + #EA4335) — normalizing is 03-design-system scope (L1), not L0.
Baseline: docs/Frontend(Head Of Product Agent)/baseline/ — 10 representative routes × 360/768/1440. All mounted, 0 horizontal overflow, 0 page errors (production build via vite preview :4173, Chromium --no-proxy-server).
Open for next: L1 foundation (03-design-system: 8 ad-hoc hex + /signin decision + meta/OG/canonical system — G8 currently NOT satisfied: pages have no unique titles/descriptions/OG/canonical). 06-a11y note: footer social links href="#" placeholders. 07-perf note: hero LCP images lack preload link tags.
QA+gate refs: l0-report.json (crawl), audit-report.json (device matrix 30 routes × 3 widths), baseline/ screenshots.
---

---
## [Wave L1] [01-PM] — 2026-09-16
Done: (a) /signin decided as redirect alias → /login per LINK_MAP rule 4 (login is the canonical, everywhere-linked auth entry); (b) orphans confirmed accepted: /dev/scenarios (dev-only), /reset-password (email-recovery utility — verified no in-app link needed), /onboarding (internal pack); /dashboard recorded as internal; (c) footer social policy: REMOVE (no real profile URLs exist; href="#" must not ship) — re-add when real URLs exist; (d) meta matrix for 27 public routes approved as drafted by 08-seo (src/lib/routeMeta.js).
Files: LINK_MAP.md (Wave L1 decisions section), App.jsx (redirect spec only).
Decisions: /login canonical, /signin alias; accepted-orphan list recorded in LINK_MAP (G1 exemption); social row removal approved.
Open for next: 02-copy claims veto input on pricing page; 04-frontend implements redirect + footer removal.
QA+gate refs: G1 accepted-orphan evidence in LINK_MAP §Wave L1.

---
## [Wave L1] [02-copy] — 2026-09-16
Done: Wrote/verified all 27 meta descriptions (sentence case, Google-plain, claims-disciplined, ≤160 chars, titles ≤60). Sweep for lorem/TBD/TODO across landing + auth pages: 0. Claims sweep (MASTER_SPEC §8): found and fixed 3 "unlimited" violations on pricing page (/pricing, AILearningPage): plan feature "Unlimited Ask & explore" → "Ask & explore with no daily cap"; comparison cells "Unlimited" → "No daily cap"; institution members "Unlimited" → "Contact Visionary" (org pricing TBD per §8).
Files: src/lib/routeMeta.js (matrix copy), src/pages/landing/AILearningPage.jsx.
Decisions: "No daily cap" chosen over "Unlimited" (same observable fact, no banned claim word); org member cell points to Contact Visionary rather than stating a number.
Open for next: none.
QA+gate refs: l1-qa-report.json (titles/descriptions verified unique, 0 over 60 chars); grep evidence in session log.

---
## [Wave L1] [03-design-system] — 2026-09-16
Done: Normalized all 8 L0 ad-hoc hex into MASTER_SPEC §3 semantic tokens. Token map published: #EAF2FF → surface.info-soft #E9EFFA (PrivacyPage decorative circle, bg-surface-info-soft) · #E8EAED → border.subtle #E5E7EB (TeacherPage COLORS.mist) · #F8FAFF → surface.subtle #F8F9FA (UpdatesPage active option) · #F0F2F5 → surface.canvas #F5F6F8 (Login/Register/AuthLayout page bg, bg-surface-canvas) · #EA4335 → semantic.danger (Login/Register/ResetPassword error text, text-danger). GoogleIcon #EA4335/#4285F4/#34A853/#FBBC05 exempt — brand logo asset. Zero ad-hoc hex remaining in landing/auth scope (crawl: "AD-HOC HEX outside palette (0)").
Files: tailwind.config.js (surface.canvas/subtle/info-soft, danger tokens), PrivacyPage.jsx, TeacherPage.jsx, UpdatesPage.jsx, Login.jsx, Register.jsx, ResetPassword.jsx, AuthLayout.jsx.
Decisions: token deltas are the approved normalization — pixel pass shows privacy/updates/login shots byte-identical or sub-1%; internal dashboard components using #ea4335 are internal-pack scope, untouched.
Open for next: none.
QA+gate refs: l0-audit.mjs rerun (0 ad-hoc hex); l1-shots/ diff.

---
## [Wave L1] [04-frontend] — 2026-09-16
Done: (a) Head/meta system shipped: src/lib/PageMeta.jsx (usePageMeta hook + MetaManager) + src/lib/routeMeta.js matrix wired once in App.jsx — sets unique title, meta description, OG (title/description/type/site_name/url/image), Twitter card, canonical per public route; internal surfaces (/dashboard, /onboarding, /dev) excluded. (b) /signin → <Navigate to="/login" replace>. (c) Footer social row removed (PM decision). (d) Landing visuals otherwise unchanged. Google-quality fixes from the missing-arrow/icon/tag sweep: hero hand-drawn arrows normalized to spec §5 strokeWidth 3.5 (PersonaHero 2.2→3.5; struggle-cluster arrows 2.1→3.5 in Student/Parent/Organization/College/Teacher pages — barbs already conformed to ±30°); index.html gained missing apple-touch-icon.
Files: src/lib/PageMeta.jsx (new), src/lib/routeMeta.js (new), src/App.jsx, src/components/landing/LandingFooter.jsx, src/components/landing/PersonaHero.jsx, src/pages/landing/{Student,Parent,Organization,College,Teacher}Page.jsx, index.html.
Decisions: matrix-in-one-file + MetaManager chosen over per-page helmet-style calls (one PM-owned artifact, zero page-file churn); SITE_URL via VITE_SITE_URL env, default https://visionary.app pending release config; preload uses the relative hashed asset URL to byte-match the img src (absolute URL tripped CSP img-src 'self' — caught and fixed in QA).
Open for next: 08-seo ships sitemap/robots; 11-release must set real production domain (VITE_SITE_URL + sitemap/robots canonical URLs).
QA+gate refs: l1-qa-report.json (0 console errors, redirect OK, meta complete).

---
## [Wave L1] [05-motion] — 2026-09-16
Done: Verified only approved motion runs. Keyframes in landing pack: heroFadeUp, struggleWordIn, struggleImageIn, voiceDot, ccwIn (all on approved list) + pre-existing composition keyframes oi/oiFade/oiSpin (Landing orbit visual), fadeLeft, heroFadeRight, cmFill, struggle (section entrances within approved grammar) — all present in L0 baseline, none added in L1. No new animations introduced by L1 changes. prefers-reduced-motion global kill verified in index.css. Cycling words keyed (React key=) per spec.
Files: none (no change).
Decisions: oi* orbit spin is part of the approved Landing composition (in L0 baseline), not "auto-play decorative during reading" — logged, not removed.
Open for next: none.
QA+gate refs: grep evidence in session log.

---
## [Wave L1] [06-a11y] — 2026-09-16
Done: (a) /signin redirect is instant client-side <Navigate> — lands on /login which has the standard focus flow; no focus-trap concern. (b) Footer: href="#" placeholder social links REMOVED (were unlabeled dead targets); remaining footer links all have visible text labels + aria-labelled language select. (c) Head system sets document.title + meta only — no DOM mutation inside landmarks, no SR regression; h1 census: exactly 1 h1 on every public route except auth pages (/login /register /forgot-password /forgot-user-id) which have 2 in DOM but are responsive duplicates (md:hidden) where exactly one is ever exposed (display:none excluded from a11y tree) — accepted. /about had 0 h1 → fixed by 04-frontend (mission h2 promoted to h1, identical classes, no visual change).
Files: none directly (fixes landed via 04-frontend).
Decisions: responsive-duplicate h1 pattern accepted (one exposed per viewport).
Open for next: L2 persona pass should do full SR walkthrough of hero + one section per page pod (L1 scope was regression-only).
QA+gate refs: l1-qa-report.json h1 census; scripts-tmp/footer-check.png.

---
## [Wave L1] [07-perf] — 2026-09-16
Done: link rel=preload as=image fetchpriority=high now injected for every persona-hero LCP image on /, /student, /teacher, /parent, /professional, /organization (routeMeta preloadImage → PageMeta upsertPreload, cleaned up on route change). Preload href is the relative hashed asset URL — byte-matches the img src (absolute URL tripped CSP; fixed). CLS re-verified < 0.1 at 360/768/1440 on all 29 routes (layout-shift PerformanceObserver, buffered): 0 fails. No new render-blocking assets (meta system is a tiny hook in the existing index chunk; vendor bundle hash unchanged).
Files: src/lib/PageMeta.jsx, src/lib/routeMeta.js (perf-relevant bits).
Decisions: runtime-injected preload (SPA) rather than index.html static tags — per-route correctness.
Open for next: 11-release: consider modulepreload/woff2 hints in index.html at release.
QA+gate refs: l1-qa-report.json (preloads all OK, cls fails: 0).

---
## [Wave L1] [08-seo] — 2026-09-16
Done: Meta matrix shipped for all 27 public routes (unique titles ≤60, unique descriptions, OG + Twitter card + canonical verified at runtime on every route — 0 missing, 0 duplicates, 0 over-length). /about heading hierarchy fixed (was 0 h1, now 1). Sitemap (public/sitemap.xml, 26 URLs incl. /help) and robots.txt (disallows /dashboard /onboarding /dev /reset-password) shipped and coherent with the inventory. OG share image created: public/og-image.png (1200×630, rendered via scripts-tmp/og-image.mjs). G8 CLOSED.
Files: src/lib/routeMeta.js, public/sitemap.xml (new), public/robots.txt (new), public/og-image.png (new), scripts-tmp/og-image.mjs (new).
Decisions: domain placeholder https://visionary.app for canonical/sitemap (no production domain documented in repo) — VITE_SITE_URL env override + sitemap/robots regeneration recorded as a release task for 11-release; /help added to matrix after QA caught it missing (it 404-title'd).
Open for next: real domain wiring at release.
QA+gate refs: l1-qa-report.json (missing meta: 0, duplicate titles: 0, titles >60: 0).

---
## [Wave L1] [09-qa-linkcheck] — 2026-09-16
Done: Re-ran static crawl (scripts-tmp/l0-audit.mjs) + full runtime sweep (new scripts-tmp/l1-qa.mjs: 29 routes × 360/768/1440). Crawl: 0 dead links; all findings are documented false positives (mailto data misparse in SchoolPage, commented landingCategories paths, data-driven /safety# anchors) or accepted orphans per LINK_MAP §Wave L1. AD-HOC HEX: 0. Runtime: 0 console errors, 0 page errors, 0 HTTP≥400, 0 horizontal overflow; /signin → /login verified; footer a[href="#"] count 0 on spot checks; meta complete/unique per route. Caught during this pass and fixed: /help missing from matrix (was 404-titled), preload CSP violation (absolute URL), /about missing h1.
Files: scripts-tmp/l1-qa.mjs (new), scripts-tmp/l1-qa-report.json (new).
Decisions: none blocking.
Open for next: none.
QA+gate refs: scripts-tmp/l1-qa-report.json, crawl output in session log.

---
## [Wave L1] [10-pixel] — 2026-09-16
Done: Re-shot all 10 baseline routes × 360/768/1440 (30 shots, all mounted, 0 overflow) to docs/Frontend(Head Of Product Agent)/l1-shots/ and diffed against L0 baseline/. Byte-size deltas >2%: landing-360/-768/-1440 (~13% — verified visually: ONLY the cycling persona face/word capture timing differs; layout identical), persona-student-1440 (3% — intended arrow strokeWidth 3.5 per spec §5), persona-parent/organization-1440 + pricing/careers (1–2% — intended arrow/footer-social changes). Token-normalized pages (privacy, updates, auth-login) byte-identical or sub-1% — zero unintended visual change from normalization. Footer element shot confirms clean layout after social-row removal.
Files: docs/Frontend(Head Of Product Agent)/l1-shots/ (30 PNGs), scripts-tmp/l1-shots.mjs (new), scripts-tmp/footer-check.png.
Decisions: capture-timing variance on cycling heroes documented rather than chased (both states match approved composition).
Open for next: HEAD-OF-PRODUCT GATE.
QA+gate refs: l1-shots/ vs baseline/ diff table in session log.

---
## [Wave L1] [HEAD-OF-PRODUCT GATE] — 2026-09-16
G1 LINK INTEGRITY: PASS — crawl 0 dead links; nav+footer matrix complete; accepted orphans recorded in LINK_MAP; /signin + /career redirects live; 404 designed.
G2 DESIGN CONTINUITY: PASS — ad-hoc hex in landing/auth scope: 0 (L0's 8 all tokenized; pixel diff shows no unintended change).
G3 CADENCE & COPY: PASS — 0 lorem/TBD; banned claims removed ("unlimited" ×3 on /pricing rewritten per §8); meta copy sentence-case.
G4 INTERACTION: PASS — 0 console errors / 0 page errors across 29 routes × 3 widths.
G5 RESPONSIVE: PASS — 0 horizontal overflow at 360/768/1440 on all 29 routes.
G6 A11Y: PASS — exactly one exposed h1 per route; footer accessible names clean after social removal; head system introduces no SR regression. (Full SR walkthrough deferred to L2 per 06-a11y.)
G7 PERF: PASS — LCP preload + fetchpriority=high on all 6 hero routes; CLS < 0.1 everywhere (0 fails); no new render-blocking assets; bundle delta ~0.
G8 SEO/META: PASS — unique title/description/OG/Twitter/canonical on all 27 public routes; sitemap 26 URLs coherent with robots.txt; /about h1 fixed. L0's NOT-SATISFIED flips to PASS.
G9 MOTION: PASS — approved list only; no new animations; reduced-motion parity present.
G10 HANDOFF: PASS — entry complete; l1-shots at 3 widths for all baseline routes; no open questions for next agent.
RESULT: ALL GATES PASS — Wave L1 complete. The L0 launch-blockers flipped with evidence: G1 (orphan/signin ambiguity → accepted-orphan list + /signin redirect), G2 (8 ad-hoc hex → 0), G7 (no LCP preloads → live on 6 hero routes), G8 (no meta system → complete). STOPPING per instruction — Wave L2 (persona pass) awaits user review of this gate. Release-blocking carry-forward: set the real production domain (VITE_SITE_URL + regenerate sitemap/robots URLs) before 11-release.

---
## [Wave L1a] [00-chief correction] — 2026-09-16
Done: SCOPE CORRECTION per Head-of-Product review — auth surfaces are NOT to be modified. Reverted to exact pre-L1 state via git restore: src/pages/Login.jsx, src/pages/Register.jsx, src/pages/ResetPassword.jsx, src/components/AuthLayout.jsx (the #F0F2F5/#EA4335 token normalization from 03-design-system is withdrawn for auth; those files are back to their shipped hex values). Head system scope reduced: /login, /register, /forgot-password, /forgot-user-id, /reset-password removed from ROUTE_META and SITEMAP_ROUTES; MetaManager now RESETS the head to the original index.html defaults on auth/internal routes (fixes both tag injection and stale-tag carryover when navigating from a landing page to sign-in). /signin → /login redirect KEPT (PM decision, App.jsx routing, not an auth-file change). Verified at runtime: auth routes render with default title, zero canonical/OG tags, original background/h1 structure; landing meta system unchanged; 0 console errors across the full sweep; lint + build clean.
Files: src/pages/Login.jsx, src/pages/Register.jsx, src/pages/ResetPassword.jsx, src/components/AuthLayout.jsx (restored); src/lib/routeMeta.js, src/lib/PageMeta.jsx (scope reduction); public/sitemap.xml (auth routes removed, 24 URLs); scripts-tmp/l1-qa.mjs (auth-head check added).
Decisions: L0's 8 ad-hoc hex count for G2 is now 5 (PrivacyPage/TeacherPage/UpdatesPage #EAF2FF/#E8EAED/#F8FAFF normalized; auth hex intentionally left ad-hoc as shipped) — G2 remains PASS since landing/auth visuals are unchanged and remaining auth hex is owned by the auth pack, not the landing pack. robots.txt /reset-password disallow kept (SEO hygiene, no page change).
Open for next: Wave L2 persona pass — auth pack explicitly out of landing scope going forward.
QA+gate refs: scripts-tmp/l1-qa-report.json (authTouched: [], 0 console errors); git status shows zero auth-file modifications.

---
## [Wave L1b] [07-perf + 04-frontend] — 2026-09-16
Done: PAGE & ROUTING SPEED. Root causes found by measurement (production build, Playwright): (1) hero/section PNGs weighed 46.5MB total — parent-hero 10.9MB, student-hero 9.2MB, org-face 7.1MB, teacher-hero 6.9MB, pro-face 4.6MB — the LCP image alone took 1.5s+ on localhost and 10s+ on real 4G; (2) every route is a lazy chunk, so a first click paid a fetch before mounting. Fixes: (a) 17 landing-pack images re-encoded to WebP q85 at ORIGINAL pixel dimensions (heroes still 4096×4096 — nothing downscaled/cropped; total 46.5MB → 2.2MB, 95% smaller; tool: scripts-tmp/webp-convert.mjs); imports + routeMeta preloads rewired to .webp (103 import sites; no stale PNG refs); scrim/heroBg color-match treatment untouched (computed from CSS constants, verified visually at 1440 on /teacher /organization /student — same as approved baseline). (b) src/lib/RoutePrefetcher.jsx: after requestIdleCallback, prefetches all 24 landing route chunks via the same dynamic-import specifiers App.jsx uses (browser cache warm); skipped on save-data/2g. Internal pack images and auth files untouched.
Measured results: SPA click→route-mounted (route changed + h1 in DOM, 10ms poll): /careers 29ms, /student 50ms, /pricing 53ms, /privacy 19ms, /teacher 37ms — prefetch warms chunks in 78-250ms in the background so first clicks mount instantly. Cold route loads (commit→h1 visible): /parent 3350→981ms, /pricing 2595→1072ms, /careers 2181→1056ms, /teacher 2315→1295ms, /student 3014→2067ms — the residual ~0.9-1.2s is the APPROVED heroFadeUp entrance animation (h1 is visible only as the animation completes), not routing latency. Hero transfers no longer appear in >50KB resource list on /parent.
Files: scripts-tmp/webp-convert.mjs, scripts-tmp/webp-parity.mjs, scripts-tmp/perf-verify.mjs (new tools); src/assets/*.webp (17 new files; original PNGs left in place for the internal pack/auth which do not import them); src/pages/Landing.jsx, src/pages/landing/*.jsx (import extensions only), src/lib/routeMeta.js (preload URLs), src/lib/RoutePrefetcher.jsx (new), src/App.jsx (render RoutePrefetcher).
Decisions: WebP q85 at natural size chosen over resizing (per Head-of-Product instruction: original image size, responsive display unchanged); PNGs retained on disk (git-tracked originals) — 11-release can delete converted sources later; prefetch uses connection-aware gating per G7 "no constrained-user bandwidth spend".
Open for next: Wave L2. Optional release task: add width-responsive hero variants (srcset) if mobile bandwidth becomes a concern — not required now.
QA+gate refs: scripts-tmp/l1-qa-report.json (0 console errors, CLS 0 fails, preloads OK on webp URLs); l1-shots/ re-shot post-L1b (30 shots, 0 overflow); grep evidence in session log.

---
## [Wave L1-final] [09-qa + 10-pixel + 00-chief] — 2026-09-16
Done: FINAL HARDENING PASS over every public surface (auth/dashboard/internal excluded per scope). New scripts-tmp/final-verify.mjs ran 26 routes × 7 widths (360/390/768/1024/1280/1440/1920 = 182 loads) checking: horizontal overflow (with offending-element capture), console/page errors, HTTP≥400, broken images (complete && naturalWidth=0 after full scroll-through), rendered-vs-natural aspect distortion, nav/footer landmarks, h1 census. RESULTS: 0 console/page errors, 0 HTTP failures, 0 horizontal overflow at every width, 0 broken images, 0 distorted images. Image fidelity verified: parent-hero-main.webp natural 4096×4096 rendered 1440×836 eager (original resolution, responsive positioning, below-fold lazy). 4 interim "empty mount" flags (/community /contact @1280, /student /community @1440) re-tested with mount-aware waits: all mount correctly with h1+nav+footer — sweep-timing artifacts, not defects. /signin and 404 standalone (no landing nav/footer) confirmed as designed; 404 has correct meta + working Go Home action (left untouched per no-design-change instruction). Mobile spot-checks (pricing/updates/landing @360) visually clean. Wave L1 is COMPLETE: foundation + meta + tokens + speed + full-matrix verification all green.
Files: scripts-tmp/final-verify.mjs (new), scripts-tmp/final-verify-report.json (new), docs/Frontend(Head Of Product Agent)/l1-shots/ (refreshed post-L1b, 30 shots).
Decisions: 404 standalone design accepted as-is (functional, correct meta); /signin NO-NAV expected (lands on auth layout).
Open for next: Wave L2 persona pages pass — awaiting Head-of-Product go.
QA+gate refs: scripts-tmp/final-verify-report.json (182 loads, 0 defects); G5 responsive evidence at 7 widths; G7 perf evidence in Wave L1b entry.

---
## [Wave L1-hero-fix] [03-design-system + 00-chief] — 2026-09-16
Done: HERO BACKGROUND COLOR-MATCH RESTORED (Head-of-Product observation). The photo in every persona hero rendered as a white rectangle with visible edges against the section's #fafafc background. Diagnosis: canvas-sampled the photo edges of all 5 hero images (scripts-tmp/sample-bg approach) — every photo's own background is pure #ffffff, while NewPersona painted heroBg #fafafc. Fix: NewPersona heroBg default #fafafc → #ffffff (single value; no page overrides it) so the contained photo blends seamlessly into the hero section — the Apple-style color-match treatment from previous repo versions. Scrim gradient inherits the same value (bottom fade now blends into white; next sections are white). Verified visually at 1440 on /teacher /organization /professional — seams eliminated, design otherwise unchanged (same layout, type, CTAs, motion). All 5 persona pages + any future NewPersona consumer get the correct treatment automatically.
Files: src/components/landing/NewPersona.jsx (one value + comment).
Decisions: heroBg must always equal the sampled photo background for full-bleed contain heroes — recorded here so L2 persona work keeps photos and heroBg in sync when new imagery lands.
Open for next: Wave L2 persona pass (awaiting Head-of-Product go).
QA+gate refs: scripts-tmp/hero-fix-*.png (seam-free); l1-shots/ refreshed (30 shots, 0 overflow); G2/G5 unaffected.
