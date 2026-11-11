# KAN-84 / AI-02 — reviewer-corrector pass (2026-11-10)

Reviewer-prep for `codex/principal-kan-84-provider-scope` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: stack integration (merge of dev `2e0b1fbb`; package.json scripts unioned — all twenty-three family checks live incl. the gate's own registered check), data-04 rolling-clock fix (byte-identical).

## Review finding (verified, no defect)

The provider-request scope gate reviewed clean and enforces the AI-02 law:

- **Active reviewed contracts only**: requests run against the ACTIVE reviewed contract for the provider+purpose; revoked/expired/unknown refuse.
- **Fail-closed field minimization**: only contract-permitted fields forward; a request that NEEDS a non-permitted field REFUSES (never silently widened, never dropped-and-sent-anyway).
- **Contract-permitted tools only**.
- **Pre-approved fallbacks only**: switching provider/region requires an EXPLICIT fallback entry in the reviewed contract AND its own active contract.
- The minimized request carries the contract version + region + retention — the provenance travels with the request.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Provider-scope suite (AI-02's own acceptance) | `node --test backend/tests/contracts/providerscope/provider-scope.test.mjs` (after `npx tsc -p tsconfig.providerscope.json`, exit 0) | **4/4 pass** |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` | **exit 0 — 844 test lines green, frontend build ok** |
| Data-04 fix | blob diff vs canonical | **identical** |

## Notes for the reviewer

- The contract lookup is injected (maps onto the reviewed provider-contract rows). No provider is contacted by the gate itself. Hosted provider calls at scale stay founder-gated as originally recorded.
