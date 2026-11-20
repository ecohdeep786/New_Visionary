# PROMOTION PR DRAFT — dev → main (FHE-23 Stage D)

> **DRAFT — do not open or merge until the FHE-23 gates pass.**
> This document is the prepared promotion pull request. It becomes the real
> PR only after every sign-off in
> `FHE23_STAGING_QUALIFICATION_CHECKLIST.md` §4 is recorded. Promotion is a
> reviewed PR merge — never a force-push, never a direct replace of `main`.

---

**Title:** `Promote dev → main — <approved scope> (exact SHA <sha>, artifact digest <digest>)`

**Merge method:** reviewed PR merge (merge commit or squash per repo
convention). Direct `git push origin dev:main` is forbidden by the V6 law.

## Release scope (honest)

Ships in this release:

- Public site: landing, learn-more surfaces, legal/policy pages (English by
  recorded decision).
- Connected accounts: registration with real email verification, sign-in,
  password reset, session management (logout-all), onboarding wizard.
- Account home and workspace shell with server-owned state; profile
  (display name with optimistic-concurrency protection), account security,
  approved privacy policy and consent surfaces, connections workspaces,
  learning history, plans & payments UI.
- Interface languages: English, Hindi, Bengali (interface chrome fully
  translated; audit-enforced). The Interface-language switcher is an honest
  disabled control pending the one-field backend contract.
- Accessibility: 200%/400% zoom PASS, reduced-motion PASS, keyboard and
  mobile craft pass, Devanagari typography verified.

Withheld — rendered as truthful "not available yet" rooms, by design:

- Learning catalogue, teaching/Ask turns, practice, Build, classrooms,
  guardian, professional, organization, notifications. These are
  backend/ML-lane services whose frontend contracts and adapters are
  already written and waiting (`docs/visionary/FHE07_08_…`, `FHE10_12_…`,
  `FHE13_16_ROLES_EVENTS_HANDOFF.md`).

Known limitations (must appear in launch language):

- Billing backend is not configured in this environment; the plans surface
  renders the server-owned "Test billing is not configured" state. No
  payment may be advertised.
- The preview development workspace exists only in development builds; the
  production artifact cannot name it (route-split law, enforced by tests).

## Verification at the exact SHA

- CI "Product checks and main production" green: <run URL>
- Root `npm run check`: provenance + 152/152 law tests PASS.
- `qa:realm-journeys` (4/4 core journeys, real persistence, zero page
  errors), `qa:route-sweep` (23/23 routes), `qa:i18n` (11 surfaces, zero
  untranslated hi/bn), `qa:zoom`, `qa:reduced-motion` — receipts under
  `docs/visionary/baseline/`.
- Hosted staging qualification: <link to the staging receipt — REQUIRED>.

## Sign-off block (fill before opening the PR)

- [ ] Release owner: exact artifact digest `<digest>` approved — <name/date>
- [ ] Codex independent technical review at SHA `<sha>` — <ref/date>
- [ ] Founder: launch scope + disclosed limitations approved — <date>
- [ ] Rollback plan + on-call coverage recorded — <ref>
- [ ] Post-deploy verification + synthetic monitoring armed — <ref>

## Post-merge procedure

Staged rollout per the release procedure; verify post-deploy health and
synthetic transactions; monitor error/latency dashboards; any regression
gets a new focused ticket (FHE-24 stewardship), never a silent hotfix to
`main`.
