# F-13 — Privacy, safety and legal experiences (2026-11-06)

Jira key / source ID: F-13 (Visionary Frontend Agent task — privacy, safety and legal experiences)
Acceptance scope: enabler (trust-page review with one claim-accuracy correction authorized)
Implementer: ZCode agent (Trust UI + Content Engineers)
Reviewer: pending — independent review required (D-095; implementer cannot approve own work)
Worker branch / base commit: `zcode/f13-trust-pages` / beta `42cc9413` (F-12 landing)
Owned files: `frontend/src/pages/landing/CookiesPage.jsx` (one corrected claim), regenerated
inventory digest, this receipt. Everything else unchanged.

## Objective and method

Review Privacy, Terms, Cookies, Safety, Security and Accessibility for clarity, navigation and
accurate claims. The accuracy method: extract each page's substantive claims from source, then
verify them against the actual implementation (cookie/storage keys, session architecture, consent
and safety features) rather than against marketing intent. Live navigation checks on Vite dev
`127.0.0.1:4198` (preview mode). No full capture set this lane — F-12's 30-record evidence covers
these same pages' rendering one commit earlier; this lane adds the claim-level verification F-12
did not do.

## A. Verified-correct (protect)

| Page | Claim | Verification |
| --- | --- | --- |
| Cookies | "Essential cookies for sign-in and security. No ad networks, no cross-site tracking." | Sign-in session cookies exist (server-owned `visionary-session`/device/CSRF in firebase mode; localStorage session keys in preview); no ad/tracking scripts in the tree |
| Cookies | "Analytics with consent… If we use analytics cookies, we ask first" | Conditionally phrased; analytics is opt-in by default (`visionary_cookie_analytics` default false) and the product's analytics is disabled (F-01) — the claim promises less than the product does, which is the safe direction |
| Cookies | Preference keys | The page's own controls persist to real keys (`visionary_cookie_preferences`, `visionary_cookie_analytics`) |
| Security | "Encrypted HTTPS connections" / "Access is controlled" | Cloud Run managed TLS terminates HTTPS; server-owned httpOnly session cookies + CSRF origin law are real; the page's honest Note ("a secure connection does not make an unsafe device private") retained |
| Safety | "Parents follow progress through consent-based summaries"; "Organizations see patterns across cohorts, never an individual learner's answers"; "Your memory is yours" | Matches the verified product: parent dashboard requires consent flow ("Family billing does not grant access", F-03 capture), org surfaces show cohort patterns, memory controls live in personalization |
| Accessibility | Zoom/text scaling, reduced motion, voice | All verified live in F-06 (rem scaling), F-09 (reduce collapse), and the voice ladder |
| Navigation | Numbered TOC | Live: clicking "01 …" scrolls to its section on cookies (9 buttons), privacy (13), security (13) — verified this run |

## B. Verified defect found and corrected (1)

**F-13-F1 (P3 → fixed): the cookies page cited a settings location that does not exist.**
`CookiesPage.jsx:465` told users they can change cookie choices "from your Visionary settings
(Settings → Privacy & cookies)" — but the dashboard's Privacy area contains no cookie controls
(`visionary_cookie` exists only in CookiesPage.jsx). The choices ARE changeable any time — in the
"Your choices and controls" section of the same page (real localStorage persistence). Corrected the
sentence to point at the actual location. Inventory: counts identical (67 routes / 1652
declarations / 236 control files); one source digest refreshed via `scope:audit:write` after the
drift guard fired as designed (initially 652/653, then 653/653).

## C. Verification results (final run, this worktree)

| Check | Result |
| --- | --- |
| Product running | Vite dev `127.0.0.1:4198` HTTP 200 throughout |
| TOC navigation | Live: cookies/privacy/security TOC clicks scroll to their sections |
| Full battery | **PASS — all stages exit 0**: `npm test` 653/653; lint, typecheck exit 0; build exit 0 (18.42 s); qa:taps PASS (243 controls/126 files); qa:motion PASS (439 files); qa:continuity PASS; `npm run check` exit 0 (3842 imported files match baseline + 4 recorded patches) |
| Rendering evidence | F-12's 30-record capture set (one commit earlier) covers these pages; this lane's delta is the claim-level verification and the one-line fix |

## D. Backend / ML dependencies

None.

## E. Remaining issues and risks

- "Sync Encrypted ID" (SecurityPage glossary) is a loose description of the server-owned session
  identity; technically defensible but worth a founder-reviewed tighten in a future content pass.
- Cookie preferences are device-scoped by design (the page says so); cross-device preference sync
  would need the account-surface work (backend dependency, not invented here).
- F-02-F1 still bounds authenticated verification of the dashboard privacy surfaces.

## F. Worktree and change summary

`New_Visionary-worktrees/zcode-f13-trust-pages` on `zcode/f13-trust-pages` = beta `42cc9413` + the
one-line claim correction + inventory digest refresh + this receipt. Junction-based node_modules
runtime arrangement (nothing committed). Worktree removed after the beta landing per the operator's
standing instruction; branch retained pushed for review.

## G. Review handoff

```
Jira key / source ID: F-13
Acceptance scope: enabler (trust pages claim-accuracy review + one correction)
Implementer: ZCode agent
Reviewer: pending
Worker branch / base commit / candidate head commit: zcode/f13-trust-pages / 42cc9413 / <receipt commit>
Owned files: frontend/src/pages/landing/CookiesPage.jsx (one sentence); docs/architecture/tracking/product-surface.json (digest); this receipt
Verification: claims cross-checked against implementation; TOC navigation verified live; inventory counts identical; battery all-exit-0 (653/653)
Findings: F-13-F1 (P3 fixed — cookie-choices location claim); security/safety/accessibility claims verified accurate
Reviewer decision: pending
Dev integration commit: pending
```
