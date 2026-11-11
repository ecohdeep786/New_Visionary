# KAN-92 / AI-10 — reviewer-corrector pass (2026-11-10)

Reviewer-prep for `codex/principal-kan-92-multimodal-schemas` before D-095 review; Testing, reviewer pending, NOT merged into dev. Commits: stack integration (merge of dev `2e0b1fbb`; package.json scripts unioned — all thirty-one family checks live incl. the domain's own registered gate), data-04 rolling-clock fix (byte-identical).

## Review finding (verified, no defect)

The modality gate reviewed clean and enforces the AI-10 law:

- **Release registry**: an UNRELEASED modality refuses `modality_unreleased` honestly — never a silent fallback to another modality.
- **Explicit schemas**: voice (audioRef+audioLocale), image (imageRef+conceptId), structured_activity (activityKind+steps) — a payload violating its schema refuses `schema_invalid`, never guessed.
- **Permitted context only**: the caller must own the conversation, and the pinned revision must match (no context drift).
- **Device/locale recovery**: the request locale must match the conversation's (`locale_mismatch`) — no silent locale drift.
- **Separate cost limits**: each modality draws from its OWN allowance bucket (a synchronous check-and-consume critical section); exhausting voice never spends image.

## Reviewer note (recorded, deliberately unchanged)

The pinned-revision mismatch reuses the `schema_invalid` code — semantically it is context drift, but the typed code choice is the reviewed contract; the refusal is fail-closed either way. If the reviewer wants a more precise code, that is a small follow-up on the merged base.

## Gate evidence on the merged tree (this host)

| Gate | Command | Result |
| --- | --- | --- |
| Modality-gate suite (AI-10's own acceptance) | `node --test backend/tests/contracts/modalities/modality-gate.test.mjs` (after `npx tsc -p tsconfig.modalities.json`, exit 0) | **5/5 pass** |
| Data contracts | `npm run data:check` | **exit 0** |
| Product check gate | `npm run check` | **exit 0 — 844 test lines green, frontend build ok** |
| Data-04 fix | blob diff vs canonical | **identical** |

## Notes for the reviewer

- The store is the in-memory reference; the SQL adapter keeps `tryConsumeAllowance`'s critical section atomic. Hosted multimodal operations at scale stay founder-gated as originally recorded.
