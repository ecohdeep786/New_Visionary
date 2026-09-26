# LAUNCH_CHECKLIST — Visionary Landing Frontend (Wave L6, 2026-09-17)

Founder/action-owner items are marked ⚠. Everything else is done and evidenced.

## 1. Go/no-go decisions
| Item | Decision | Owner | Status |
|---|---|---|---|
| Production domain | ⚠ FOUNDER MUST CONFIRM (visionary.app / .in / .com). Until then VITE_SITE_URL placeholder `https://visionary.app` is used for canonicals, sitemap, robots. | Founder | PENDING |
| Launch date | ⚠ FOUNDER CONFIRMS go-live date. | Founder | PENDING |
| Per-persona OG images | IMPLEMENTED — 6 cards at 1200×630 in public/ (og-image, og-student, og-teacher, og-parent, og-professional, og-organization), wired per route. | Done | ✅ |
| JSON-LD | IMPLEMENTED — Organization (/about), Product + FAQPage (/pricing), BreadcrumbList (all public routes). | Done | ✅ |
| Nav i18n | English-first shipped. Locale-declaring mechanism shipped (footer language control persists choice + sets document.documentElement.lang). Hindi/Bengali CONTENT translation deferred to post-launch. | Recorded | ✅ |
| Offline surface | DEFERRED — backend-dependent (recorded as L6-deferred). | Deferred | ✅ |
| PNG source cleanup | DONE — all imported PNGs converted to webp; 36 source PNGs deleted. Founder's unused Teacher_Problem_1–4.png work files intentionally kept. | Done | ✅ |
| Auth/internal boundary | Confirmed — auth pack untouched since L1a (git-verified); no landing work enters authenticated surfaces. | Done | ✅ |

## 2. Pre-deploy steps (11-release engineer)
1. ⚠ Set `VITE_SITE_URL=https://<confirmed-domain>` in the deploy environment.
2. Run `node scripts-tmp/generate-sitemap.mjs` with that env var (regenerates public/sitemap.xml + robots.txt).
3. Rebuild (`npm run build`) — canonical/OG URLs derive from SITE_URL at runtime.
4. Submit sitemap to Google Search Console post-launch.

## 3. Post-launch verification
- [ ] Canonicals resolve on the real domain (view-source any page).
- [ ] OG cards load via Facebook/Twitter debuggers.
- [ ] JSON-LD passes Rich Results Test (schema already validated by JSON.parse + structure in L6).
- [ ] /robots.txt + /sitemap.xml reachable.

## 4. Known deferred items (not launch-blocking)
- Per-route JSON-LD beyond the shipped matrix (Product offers detail, BreadcrumbList is shipped).
- Nav i18n content (labels currently English-only; declaring mechanism shipped).
- Offline surface, live role directory (backend-dependent).
- Founder's Teacher_Problem_*.png sources kept in src/assets (unused by build).
