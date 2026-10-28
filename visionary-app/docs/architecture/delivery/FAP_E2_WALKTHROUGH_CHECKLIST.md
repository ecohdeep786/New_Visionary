# FAP E2 — Founder walkthrough checklist

**Jira / source ID:** FAP-57 (FAP-E2) — part of release evidence closeout.
**Purpose:** the founder (human) walks the canonical public journey to confirm the
rebuilt A0→E1 system holds up in person. This is a human acceptance checkpoint, not
an automated gate. Each item records what to look at and the expected result from
the current `beta`.

Baseline: production build / preview on `origin/beta` head (E1 merge fe984775 +
delivery record 3e4e8234; current task lane tip 19c8ada3). Recommended viewport
start: 1440, then 390 on the same routes.

## 1. Landing (`/`)
- Hero art loads (AVIF/WebP, measured density — no oversized PNG fallback).
- Hero headline is one voice (no dual-ink; headline spans are ink/gradient only).
- Primary CTA (pill) geometry matches canonical 17px/1.176/-0.022em, min 44px tall.
- Motion: scroll reveals use `--ease-out-apple` only; reduced-motion = static and visible.
- Nav pills ≥44px hit targets; logo link has a valid hit union.
- Fonts: only subset WOFF2 loaded; no bridge fallback (same role/family across the page).

## 2. Pricing (`/pricing`)
- Store-grade table: 3-column, hairline-only, sticky headers, 28px price, 12px fine,
  commerce-blue "Start free" per column; entitlement copy matches pricingConfig.
- FAQ accordion to Apple resolve curve.
- CTA pills identical to landing geometry; plan CTAs + institution CTA canonical leading.

## 3. Download (`/download`)
- "Open Visionary / See platforms / Open in browser / coming-soon / Prepare email / Continue on web" pills all canonical leading; coming-soon affordances are honest
  (disabled-with-reason or "Plan released later"), never lying submits.
- 44px hit targets; no overflow at 390.

## 4. Trust set (safety `/safety`, privacy `/privacy`, terms `/terms`, security `/security`,
accessibility `/accessibility`, cookies `/cookies`)
- Left sidebar + content on one typographic system; no bridge fallback; links single
  source ink.
- Legal chips/links ≥44px hit targets (fixed in D2); no sub-44 signatures.
- Roles resolve (no raw-size styling); headings use data-type roles.
- Cookies: 64×44 switch hit wrapper with unchanged 28×48 visual pill.

## 5. Auth (`/login`, `/register`, `/forgot`)
- Canvas `#f5f5f7`, white 28px card, ink pill primary, link `#0066cc`, error `#e30000`.
- Real mobile phone sign-in present; dead "coming soon" submits rendered as honest
  NULL choices (hidden mobile sign-in options until real).
- Per-route titles, autoComplete attributes; softer unavailability state.

## 6. Dashboard (post-auth shell, `Ask`, `Build`, `StudentClasses`,
`Subscription`, `Settings`, `RoleWorkspace`, `Guide`)
- No leaked Material (`#4285F4` / `#dadce0`) — all v-tokens.
- Every route has an h1; error/empty states inside the shell; 44px controls.
- Navigation qa:design + qa:navigation green dark+light ×320/390/768/1440.

## Pass / notes
- Each item: ✅ / ❌ / note. Walkthrough verdict + exact reviewed commit go in the
  FAP-57 review comment (D-095 — separate reviewer records decision before Done).
- Known honest boundary: D3 records LCP >2.5s on raw Fast3G (physics: 4 flex TTF
  ~505KB + 331KB JS + LCP art). Fast-LCP lever is a named next-wave; not claimed as met.
- C3 (FAP-51) dashboard v-token completion is in beta but board still In Progress;
  C4 (FAP-52) forms honesty is open. Both precede Done for the full chain.
