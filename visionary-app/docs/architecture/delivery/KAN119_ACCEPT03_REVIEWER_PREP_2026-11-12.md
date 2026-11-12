# KAN-119 / ACCEPT-03 deny matrix — reviewer-corrector pass (2026-11-12)

Reviewer-prep for `codex/principal-kan-119-deny-matrix` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: corrections, stack integration (merge of dev `c260894e` into the impl commits `0936b404`+`e64c5926`, old base `f61292ef`; data-04 identical to dev) + receipt.

## Corrections

**The documented live-probe seam was not actually runnable, and its probe function carried two known defect classes.** The evidence claims "probeLive() + `--probe <base-url>` executes the anonymous 401/403 matrix against a running runtime", but the script had NO CLI entry — and `probeLive` returned a bare `Promise[]` (the missing-await class: a caller reading the results gets Promise objects whose `denied` is always undefined-falsy → a hosted run could silently "pass" nothing) with no per-probe bound (a hung endpoint stalls the hosted half) and no public-surface exclusion (anonymous probes of the public configuration surface — auth methods, CSRF bootstrap, billing catalog — return 200 by design, so the fail-closed exit would always fire). Fixed:

1. `probeLive` now returns ONE awaited promise (`Promise.all`) of per-endpoint results, each probe bounded by its own `AbortSignal.timeout(8000)`, with connection failures reported honestly (`status: 0, denied: false, error`) — never a silent pass.
2. New `publicRoutesFromRegistry` derives the reviewed public set (profiles `public`/`csrf`) from the committed authority registry, so the anonymous-denial expectation targets exactly the protected surface.
3. The `--probe <base-url>` CLI entry now exists (async IIFE, never top-level await — a TLA graph is un-requireable by the suite, which the suite caught immediately): it prints `{probe, probed, refused, notDenied}` and exits 1 fail-closed when any private endpoint is not denied; the plain invocation prints the structural summary, and `--write` materializes `integration/contracts/accept03-deny-matrix.json` for the hosted run.
4. Suite extended 2→3: the new test proves the await law (instanceof Promise, resolved value IS the result array), the public exclusion (auth methods/CSRF absent), honest failure reporting over a dead port, and that the registry-derived public set carries the reviewed routes.

## Review finding (verified otherwise sound)

The structural half is sound and fail-closed against the CURRENT merged tree: 55 registered endpoints × 8 deny cases = 440 rows, every endpoint's controller source exists AND carries the server-authority surface (`extends ProductRequestAuthority` / explicit guards), verified complete with zero problems; the negative test proves a missing file or unguarded endpoint fails the suite.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Deny-matrix suite (structural + fail-closed + seam) | `node --test backend/tests/contracts/authority/deny-matrix.test.mjs` | **3/3 pass** |
| Matrix CLI summary | `node scripts/deny-matrix.mjs` | **55 endpoints, 440 rows, complete=true, no problems** |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` | **exit 0 — 114/114 + contracts 35/35 + sub-batteries** |

## Live real-user journey (in-app browser, https://visionary.org.in, 2026-11-12)

The live product exercises the same deny surface the matrix pins: unauthenticated `/dashboard/subscription?plan=personal&billing=annual` renders the sign-in guard in-place (anonymous access to protected surfaces never leaks state), with the full `returnTo` deep link preserved. The LIVE anonymous-probe half against the HOSTED origin stays founder-hosted by design — and is now genuinely runnable with `node scripts/deny-matrix.mjs --probe https://visionary.org.in` (fail-closed exit code).

## Notes for the reviewer

- The structural guard check is per-FILE (a controller class extending the authority base covers all its handlers); the webhook/jobs routes that intentionally bypass `ProductRequestAuthority` inside a guarded controller file still pass the structural check, while their true protection (HMAC/signature/job-token) is pinned by the BILL-02/KAN-103 acceptance suite — the two layers compose rather than overlap.
- The generated `accept03-deny-matrix.json` artifact is derivable and NOT committed; the hosted run materializes it with `--write`.
