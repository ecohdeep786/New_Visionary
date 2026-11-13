# FAP-91 real-user browser verification (guard candidate)

Server: `http://127.0.0.1:5198` — vite dev serve of `zcode/fap-91-save-lastpath-guard`
(worktree `nv-worktrees\fap91-teardown-guard`, base `origin/beta` @ `d148ba4a`).
Baseline for the A/B: `http://127.0.0.1:5199` — vite dev serve of the FAP-73 branch
(= beta content, no guard). Probe: OpenCode in-app Chromium, driven as a real user,
2026-11-13. Screenshot beside this receipt.

## The defect (reproduced live on the baseline, 5199)

`DashboardLayout` autosaves the last visited route: on every route change its effect calls
`saveLastPath` (`DashboardLayout.jsx` effect → `workspaceService.saveLastPath` → `access()`).
When the persistent store (`visionary_workspace_v2`) is gone while the SPA's React state still
holds `activeWorkspace`/`user` — a second tab signing out, local-data cleanup, or the review
lane's `signOutAndClear` storage teardown — the next route change fires the effect against a
wiped store and `access()` throws `You do not have access to this workspace.`.

Live A/B reproduction, same deterministic sequence on both sides (signed in on
`/dashboard/home`, store key removed mid-session, then a client-side sidebar click to
`/dashboard/learn`):

- **Baseline 5199 (no guard):** 3 console errors —
  `Error: You do not have access to this workspace.` with the exact stack
  `at access (workspaceService.ts:77:25) / at saveLastPath (workspaceService.ts:230:3) / at DashboardLayout.jsx effect (commitHookEffectListMount)`,
  plus the React component-stack log and the Resilience Diagnostic entry. **User impact: the
  route crashes to the error boundary — "Something went wrong / This page could not open."**
- **Candidate 5198 (guard):** **0 console errors**, no crash — the workspace shell renders its
  designed honest error state instead: h1 `Workspace unavailable`, body
  "You do not have access to this workspace. / Your saved records remain on this device.
  Restore readable records, then retry." with a `Retry workspace` action (screenshot:
  `teardown-honest-workspace-unavailable@1440.png`). The store is not resurrected
  (`visionary_workspace_v2` stays absent — the guard writes nothing).

## The boot-window variant is covered too

After the teardown, a full page load of `/dashboard/settings` (session still alive, store
still absent) ran the boot race — auth resolves, bootstrap rebuilds the workspace, the
autosave effect fires into the now-rebuilt store — with **0 console errors** and a healthy
page. On the unguarded baseline this window is exactly where the review sweep recorded its
PAGEERRORs (`rev-c-identities.json`: 4 sign-out transitions → 4 × PAGEERROR triples from
`DashboardLayout` → `saveLastPath` → `access`).

## Behavior preservation on the candidate (honest autosave still works)

Fresh account `fap91.verify@visionary.test` through the full journey — register
(email-first) → password → OTP `000000` (disclosed preview copy intact) → onboarding 5 steps
→ dashboard home. Then client-side navigation, checking the persisted store after each hop:

- `/dashboard/home` → `workspaces[0].lastPath === '/dashboard/home'`
- sidebar click Learn → settled h1 `Your learning outline`, `lastPath === '/dashboard/learn'`
- sidebar click Ask → settled h1 `Visionary Guide`, `lastPath === '/dashboard/ask'`

The autosave keeps recording exactly as before; only the torn-down-store case stopped
throwing.

## Console across the whole candidate journey

Register → onboarding → dashboard → route walks → teardown repro → post-wipe reload →
settings: **0 console errors, 0 warnings.**

## Files

- `teardown-honest-workspace-unavailable@1440.png` — candidate under mid-session store
  teardown: the honest `Workspace unavailable` shell with Retry (no crash, no console error).
