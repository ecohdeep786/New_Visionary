# KAN-132 / BUILD-LAUNCH-01 sandbox policy — reviewer-corrector pass (2026-11-13)

Branch `codex/principal-kan-132-sandbox-policy` (pushed); Testing, reviewer (Codex) finalizes, NOT merged into dev.

## Re-integration

Merged `origin/dev` cleanly (NO conflicts — the VMM-era base `a347ec92` predates the privacycore/backend work, so dev's files are pure additions and this branch carries NO superseded privacycore variant, unlike the PRIV family). The branch's OWN payload — `ml/vmm/sandboxpolicy.py` + `ml/vmm/tests/test_sandboxpolicy.py` (the sandbox security-policy contract, 12 tests) — is intact.

## Review finding — contract DEFECT-FREE

The sandbox security policy reviewed clean at the contract level (the hosted runtime implements real isolation; this layer proves POLICY ENFORCEMENT):

1. **Filesystem denial + no persistence** — contract fields `filesystemAccess: denied`, `persistedAfterExit: false` in every verdict; in-memory runs retain nothing outside the receipt.
2. **Egress deny-by-default** — network/import denylist (os/sys/subprocess/socket/requests/urllib/eval/exec/compile/__import__, pickle-family, dunder escapes `__class__/__globals__/__builtins__`…) refused BEFORE execution; unlisted declared dependencies refuse.
3. **Resource limits terminate** — CPU/wall-clock/memory bounded at policy construction with type-exact int checks (bools rejected); exceeding the OUTPUT bound returns `terminated / output_bound_exceeded` with an empty stdout — never a graceful degrade.
4. **Secrets isolation** — undeclared env keys refuse; secret-LOOKING key names (secret/token/key/password/credential) are denied EVEN IF declared (substring over-broad → fail-closed direction).
5. **Signed receipts** — sha256 over the canonical verdict JSON + key (msg‖key, not length-extension-prone), computed over the payload INCLUDING the timestamp; artifacts carry SHA-256 + size; policy digest pins the exact policy.
6. **Bounded requests** — request id ≤ 80 chars, code ≤ 64 KB.

Suite: the full VMM battery **303/303** (291 prior + 12 sandboxpolicy).

Notes for the reviewer (no correction required): the import denylist is DEFENSE-IN-DEPTH, not the isolation boundary — the Docker/gVisor/Firecracker hosted runtime remains the real gate; use HMAC at integration for the receipt MAC; one cosmetic duplicate `_now()` definition; the "key" substring also matches benign words like "monkey" (over-refuses, safe direction).

## Gate evidence (merged tree, this host)

| Gate | Command | Result |
| --- | --- | --- |
| VMM battery (incl. the 12 sandbox-policy tests) | `VISIONARY_PYTHON=<py312> node scripts/vmm.mjs test` | **303/303 pass** |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` | **exit 0** |

(`VISIONARY_PYTHON` must point at the host's Python 3.12 — `scripts/vmm.mjs` shells to bare `python`, which is the Store stub on this Windows host.)

## Live real-user journey (in-app browser, https://visionary.org.in/research, 2026-11-13)

The public research page makes **no code-execution or sandbox claims** (probed: `claimsCodeExecution: false`) and keeps the honest research/evaluation framing — the unreleased capability is not advertised, matching the lane's "unreleased must not be advertised" law. The sandbox itself is founder-gated ML infrastructure; its policy contract is proven by the 303-test battery.

## Notes

- `python` on PATH is the Microsoft Store stub on this host — set `VISIONARY_PYTHON` to the real interpreter for every VMM gate run.
