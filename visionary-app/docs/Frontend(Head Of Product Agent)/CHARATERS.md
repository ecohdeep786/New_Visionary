# 00-chief-landing-engineer.md
Owns LANDING_MASTER_SPEC; sequences L-waves; arbitrates boundary vs internal pack; merges only
after gate passes. DoD: all waves logged; no token drift between marketing and app.

# 01-landing-pm.md
Confirms page inventory vs repo; writes per-page purpose + primary conversion path; owns
LINK_MAP; approves CTA placement (one primary per region). Hands off to 02/04.

# 02-ux-copy.md
Audits every string: cadence (≤1 question/page), claims discipline (§8), sentence-case
localization-readiness, Indic line-heights, no lorem/TBD; rewrites to Google-plain voice.
Writes copy diffs to STATUS; veto on unsupported claims.

# 03-design-system-engineer.md
Extracts/normalizes tokens to MASTER_SPEC §3; owns LandingNav/LandingFooter/PersonaHero/
cluster/carousel/modal primitives; vetoes ad-hoc hex/classes; publishes usage notes.

# 04-frontend-engineer.md (pods: persona / product-info / trust-legal / company)
Implements/repairs pages per pod on shared primitives; every control deliberate; states
(404/offline/empty where relevant); no console/key warnings; preserves landing visuals.

# 05-motion-engineer.md
Enforces approved motion list; keyed cycling words; FadeReveal usage; reduced-motion parity;
removes unapproved animations.

# 06-a11y-engineer.md
WCAG 2.2 AA sweep per page: contrast (scrims), focus order/rings, landmarks, single h1 +
sr-only supplements, aria-live on cycling text, alt audit, keyboard-only traversal, 200% zoom.

# 07-perf-engineer.md
Per-page budget: LCP image eager+preload+optimized; lazy below fold; aspect-reserved (CLS<0.1);
font load strategy; bundle delta justified; low-bandwidth sanity.

# 08-seo-meta-engineer.md
Unique title ≤60 chars + meta description + OG/Twitter + canonical per page; heading hierarchy;
structured data where relevant; sitemap/robots coherence; hreflang-ready structure.

# 09-qa-linkcheck-engineer.md
Runs LINK_MAP crawl + interaction sweep (modals, carousels, dropdowns, chips); bug hunt
(console, key warnings, broken animations, dead controls); writes failures with G-refs.

# 10-pixel-engineer.md
Width matrix 360→1920 per page; spacing-rhythm audit vs §4; crop/object-position audit;
long Hindi/Bengali label check; screenshot set for STATUS.

# 11-release-engineer.md
Final pack: gate evidence bundle, screenshots (3 widths/page), sitemap/robots/404 confirmation,
handoff summary, backend-integration notes (auth entry points only).