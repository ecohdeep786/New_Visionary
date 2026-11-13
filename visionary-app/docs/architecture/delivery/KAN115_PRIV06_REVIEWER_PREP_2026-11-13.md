# KAN-115 / PRIV-06 — reviewer-corrector pass (2026-11-13)

Branch `codex/principal-kan-115-retention-verification` @ be65f70a (pushed); Testing, reviewer (Codex) finalizes, NOT merged into dev.

## Review finding — law DEFECT-FREE

The negative-authorization gate reviewed clean; every ticket requirement enforced:

1. **Exports / object links owner-bound and expiring** — a signed link serves only its owner within its window: strangers refuse `link_not_owned`, expired refuses `link_expired`, owner-in-window resolves; one rule covers exports and private object URLs.
2. **Search cannot leak** — server-side visibility filtering: a private hit owned by someone else never appears in results.
3. **Uniform denials, no existence leak** — wrong-user and unknown-id denials are byte-equal ("The requested record is unavailable.").
4. **Telemetry is redaction-only** — any raw private string present in a telemetry record refuses (`telemetry_leak`); the probe guards the empty-string always-match trap.
5. **Operating procedures validate** — log-retention, backup-hold, access-review and secret-rotation records must exist with positive cadence and concrete steps (`procedure_invalid` otherwise).

No correction needed. Suite 5/5.

**Ordering note for the reviewer**: `resolveLink` checks expiry BEFORE ownership, so a stranger probing an expired foreign link sees `link_expired` rather than `link_not_owned` — fail-closed either way (access refused), and the ticket itself demands the two distinct codes; the uniform-denial law applies to record access, not signed links.

## Superseded-variant cleanup (same as KAN-110–114)

The dev merge resolved the privacycore add/add conflicts to **dev's approved baseline** and removed the stacked superseded KAN-110 variant. The branch's OWN KAN-115 payload — the `negativeauth` package (types/lookups/gate + `tsconfig.negativeauth.json` + check script + family test + its own review doc) — is genuinely new in dev and is kept.

## Gate evidence (merged tree, this host)

| Gate | Command | Result |
| --- | --- | --- |
| Negative-auth suite | `node --test backend/tests/contracts/negativeauth/negative-auth.test.mjs` | **5/5 pass** |
| Backend compile (nest) + negativeauth tsconfig | `npm run build` + `tsc -p tsconfig.negativeauth.json` | **exit 0** |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` | **exit 0** |

## Live real-user journey (in-app browser, https://visionary.org.in/privacy, 2026-11-13)

The public privacy page is HONEST about exactly the surfaces PRIV-06 guards: "Your data is never sold", "Delete on request", "Review your data" with a review path, **"No self-service account export is currently connected. Ask the Grievance officer about a data request."** (matching PRIV-02's server-law state — no fake export affordance), the grievance-officer contact, per-class "What we collect / Why we use it / Who can see it" disclosure, and "Contact and grievances". The exports/links/telemetry surfaces themselves are signed-in server-side (founder-gated); their negative laws are proven by the 5/5 suite.

## Notes for the reviewer

- The real integration implements `NegativeAuthStore`; `resolveLink`'s expiry-before-ownership ordering is documented above — if the founder prefers zero existence information for foreign probes, swap the two checks (behavior remains fail-closed).
