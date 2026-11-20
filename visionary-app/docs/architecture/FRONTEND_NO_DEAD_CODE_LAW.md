# FRONTEND NO-DEAD-CODE LAW

**Status:** binding engineering law for `visionary-app/frontend` (V6 §3 enforcement).
**Established:** 2026-11-18, no-dead-code sweep on branch `zcode/fhe05-connected-shell`
(the FHE-05 lane). **Enforcement:** `npm run verify:graph` (frontend) +
`tests/production-graph.test.mjs` + `tests/fap80-dark-token-coverage.test.mjs`.

## 1. What is banned

No code may exist in the frontend product that is not reachable, justified and owned.
Concretely:

1. **Orphan source files** — any file under `frontend/src/` that no root reaches
   (app entry `src/main.jsx`, or any file under `tests/`/`scripts/`). Dead files are
   removed, not commented, not "kept for later".
2. **Preview-store execution** — the development preview store
   (`workspaceService`) and everything only it imports must never sit in the
   production build's **executed closure** (entry chunk + transitive static
   imports). Production users must never download browser-local-authority code.
3. **Preview-route mounting** — a preview-backed dashboard route may mount its
   declared element only through `ConnectedWorkspaceContent`'s `<Outlet/>`, and
   that `<Outlet/>` is legal **only** for `/dashboard/subscription` (the connected
   billing surface). Every other `/dashboard/*` path must land on a server-backed
   connected surface or the honest unavailable room.
4. **Stray engineering markers** — no `TODO`/`FIXME`/`XXX`/`HACK` comments and no
   `console.log`/`debugger` statements in `src/` (verified clean 2026-11-18; ESLint
   + reviews keep it that way).
5. **Misfiled fixtures** — test/demo fixtures live under `tests/`, never under
   `src/` (the no-demo law, V6 §3). `src/api/demoFixtures.js` was the last
   violation; it now lives at `tests/fixtures/demoFixtures.js`.
6. **Dead style law drift** — the dark-scheme palette remap must cover 100% of the
   palette utility classes present in live dashboard source; exceptions require a
   registered reason in `tests/fap80-dark-token-coverage.test.mjs` AND the
   justification written in `workspace-design.css` itself.

## 2. What is registered as intentional (and may never be deleted as "dead")

| File | Reason | Owner |
| --- | --- | --- |
| `src/services/backendTransport.ts` | Registered backend/ML adapter seam (V6 §5): the typed contract backend owners implement against; exercised by `tests/backend-transport.test.mjs`. Wiring into routes happens only with the owning service lane. | Frontend head + backend/ML owner |

Registered entries live in `scripts/production-graph.mjs` (`REGISTERED`) with their
reasons. Adding an entry requires the same review as adding a product surface.

## 3. Preview route chunks (debt retired 2026-11-18 — the FHE-20 route-table split)

This section originally registered a known debt: preview route chunks shipped
in the production artifact as never-fetched inventory. **The FHE-20 split
retired it.** Every intercepted `/dashboard/*` child now declares its element
as `import.meta.env.DEV ? <Preview /> : null`, the preview lazy declarations
use the same DEV-conditional pattern, and the `AuthContext` preview-store seam
rejects in production before its dynamic import is reachable. With Vite's
static `import.meta.env.DEV` replacement the preview chunks are no longer
merely unexecuted — **they are absent from the production artifact**: 147 → 87
chunks, and the `workspaceService` (browser-local store) chunk does not ship
at all. Production URL behavior is unchanged (verified live: declared paths
render connected surfaces or honest rooms; undeclared paths still 404), and
DEV mode keeps the full approved preview workspace (verified live on
`vite dev`). The route law test, the surface audit (31 development-only
routes), `ROUTE_GRAPH.json` and `npm run verify:graph` pin all of it.

## 4. How to comply (every change)

```bash
# from visionary-app/frontend — after building:
npm run build
npm run verify:graph     # exits non-zero on any law in §1.1–1.2 or orphan files
npm test                 # includes tests/production-graph.test.mjs (route law) and fap80 (style law)
```

- **Adding a file** under `src/`: it must be imported from the app entry (or from
  tests/scripts, which classifies it as engineering-only and still surfaces in the
  audit's `productDead` report for review).
- **Retiring a file:** delete it with `git rm` in the same commit that justifies
  the retirement; if the surface audit's review registry cites it, update the
  registry (the audit fails closed on "Obsolete control review" — that gate is the
  reminder, not the owner).
- **Adding a dashboard route:** it must either be backed by a connected
  server-authoritative surface mounted in `ConnectedWorkspaceContent`, or be
  dev-only. The route-law test fails any third option.
- **Reusing an old file instead of writing a new one** is encouraged — that is
  what this sweep protects: no parallel implementations of the same intent.

## 5. The 2026-11-18 sweep (provenance of the current clean state)

Removed 93 orphaned files: the pre-Apple-unification dashboard card library
(`AGIHero`, `AITeacherHero`, gamification/streak/briefing cards, …), superseded
Learn/Practice sub-components, superseded role homes (`OrgHome`, `ParentHome`,
`StudentHome`), superseded pages (`Ask.jsx` — superseded by the intent-flow
`DashboardHome`; `Build.jsx` — superseded by `ArtifactStudio`; `OAuthConsent.jsx`),
Base44 scaffold primitives unused by any reachable surface (41 unused `ui/*`
primitives + `use-mobile`), the misfiled demo fixture (moved to
`tests/fixtures/`), `App.css`, `productAccess.js`, `utils/index.ts`,
`useSheetStack.js`, `AGIIntro.jsx`, and stale review-registry entries for all of
them (surface inventory: 1684 → 1532 control declarations, 246 → 192 control
files). Git history retains every removed file; nothing was deleted without
reachability evidence from `scripts/production-graph.mjs` plus a whole-tree
basename cross-check.
