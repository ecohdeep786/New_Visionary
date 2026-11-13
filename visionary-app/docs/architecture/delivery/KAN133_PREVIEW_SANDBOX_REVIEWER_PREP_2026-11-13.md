# KAN-133 / BUILD-LAUNCH-02 preview sandbox — reviewer-corrector pass (2026-11-13)

Branch `codex/principal-kan-133-preview-sandbox` @ dea6bedc (pushed); Testing, reviewer (Codex) finalizes, NOT merged into dev.

## Review finding — one REAL access-boundary hazard, corrected

The preview-sandbox law reviewed sound: generated HTML is **refused outright, never stripped** (script tags, event handlers, external URLs, iframe/embed/object/form/input, CSS url()/expression/@import, `<meta http-equiv>`, dangerous attributes); the review bridge accepts postMessage events only from the AUTHORIZED origin with validated message types (ready/content-update/error/resize) and RE-SCANS content-update payloads through the sandbox; oversized payloads refuse; **the model cannot open sessions** (owner/reviewer/custodian roles only); sessions are time-bounded (5-minute TTL); cross-owner access denies; every refusal carries a machine-readable code AND a meaningful text alternative; the CSP (`default-src 'none'; style-src 'unsafe-inline'; img-src data:`) returns with each session.

**Correction — counter-based session ids on an ACCESS BOUNDARY.** `session_id = pv_{self._session_counter}` collides across runtime instances/restarts (the lane's proven counter-collision class, same as KAN-114) — and these sessions gate authorized preview access, so a collision could route one owner's review session into another's request path. All session ids are now `pv_{uuid4()}`. Tests reference returned ids only; suite stayed green.

## Re-integration

Merged `origin/dev` cleanly (no conflicts — the VMM-era base predates the privacycore work; no superseded variant). The branch's OWN payload — `ml/vmm/previewsandbox.py` + its 17 tests — is intact.

## Gate evidence (merged tree, this host)

| Gate | Command | Result |
| --- | --- | --- |
| VMM battery (incl. the 17 preview-sandbox tests) | `VISIONARY_PYTHON=<py312> node scripts/vmm.mjs test` | **291/291 pass** |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` | **exit 0** |

## Live real-user journey (in-app browser, https://visionary.org.in, 2026-11-13)

The preview sandbox serves internal artifact review (no public surface; the model cannot open sessions — owner/reviewer/custodian only, founder-gated at integration). The public product makes no preview/code-execution claims (verified in the KAN-132 pass on /research); the law is proven by the 291-test battery.

## Notes for the reviewer

- The authorized-origin constant is the contract shape; the real review bridge must serve the preview from a dedicated origin and enforce the CSP header exactly as returned.
- Session ids are now UUIDs — keep unique-key semantics at integration (no counter columns).
