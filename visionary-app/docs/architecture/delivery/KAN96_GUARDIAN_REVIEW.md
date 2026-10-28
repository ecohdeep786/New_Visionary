# KAN-96 — ROLE-04 — verified guardian relationships, granular purpose/expiry, fixed digests; revocation/reconsent never revives old shares

## Task review and verification handoff

Jira key / source ID: KAN-96 (ROLE-04)
Acceptance scope: feature-enabler (backend-owned guardian domain; controller wiring and guardian-screen journeys happen at a later, separately reviewed cutover)
Implementer: principal (senior principal backend engineer)
Reviewer: separate reviewer required — an implementer cannot self-approve (D-095)
Worker branch / base commit / candidate head commit: `codex/principal-kan-96-guardian-grants`; based on the latest lane head `4e57dd69` (KAN-101 ROLE-09 entitlement), per D-098 (lane lineage …100 → 101 → 96).
Current dev commit / comparison range: f61292ef → candidate head (fresh worktree `principal-kan-96-guardian-grants`, D-098; `dev` owns integration, merge performed by reviewer after acceptance).
Owned files / contracts:
- `backend/upstream/backend/src/guardian/guardian-types.ts` (Owner, GuardianLink, GrantPurpose, AccessGrant, Digest, DigestShare, GuardianError)
- `backend/upstream/backend/src/guardian/guardian-lookups.ts` (GuardianStore seam + InMemoryGuardianStore contract-true state)
- `backend/upstream/backend/src/guardian/guardian-service.ts` (GuardianService — verifyGuardianLink, grantAccess, revokeGrant (cascades to shares), generateDigest, shareDigest, readDigest, revokeShare)
- `backend/upstream/backend/src/guardian/index.ts`
- `backend/upstream/backend/tsconfig.guardian.json`
- `backend/tests/contracts/guardian/guardian.test.mjs` (ROLE-04 suite, 6 tests)
- `scripts/guardian-check.mjs`, `package.json` (`guardian:check`)
Prerequisites: parent KAN-9; no hard task prerequisite (Jira: phase/shared prerequisites remain in the parent epic). Related lane stances: ROLE-05 personal/company separation; KAN-139 private-content boundary.

## Requirement

Implement verified guardian relationships, granular purpose/expiry and explicit fixed summaries/goals/classwork digests. Revocation/reconsent never revives old shares (source: BACKEND_LAUNCH_CHECKLIST.md ROLE-04; KAN-96 description).

## Acceptance criteria → evidence (backend/tests/contracts/guardian/guardian.test.mjs, 6 tests)

- VERIFIED guardian relationships — self-claimed guardianship never grants (`guardian_unverified`); verification records a named verifier (empty verifier refuses).
- GRANULAR purpose/expiry — every grant binds ONE purpose; sharing a digest of a different purpose refuses (`purpose_not_granted`); expiry refuses via an injected clock (`grant_expired`) on both the share and the guardian read path.
- EXPLICIT FIXED digests — a digest is an immutable snapshot generated from permitted fields ONLY; private chat/draft content keys refuse at generation (`private_content_forbidden`); the content hash is deterministic/byte-stable.
- REVOCATION/RECONSENT NEVER REVIVES OLD SHARES — revoking a grant ends access permanently (`grant_revoked` on the guardian read path) AND cascades to the grant's outstanding shares (append-only history keeps them revoked); re-consent creates a NEW grant and a NEW share (distinct ids) — the old records stay revoked forever.
- Owner authority — only the learner grants/revokes/shares; strangers and other guardians deny uniformly (`not_owner`, no leak).
- Cross-layer closure: Frontend — N/A in the enabler. API — controller wiring binds validated schemas at cutover. Backend — GuardianService composes the lane's private-content boundary (KAN-139 hints) and sharing stance (BUILD-06). Data — Cloud SQL adapter at integration resolves from guardian_link, guardian_grant (unique learner+guardian+purpose), guardian_digest (immutable snapshots), guardian_share (append-only) tables.

## Commands, exit codes, test counts and timestamps

- Guardian compile + suite: `node scripts/guardian-check.mjs` → tsc `tsconfig.guardian.json` exit 0; `node --test` → 6 tests, 6 pass, 0 fail (2026-10-29).
- Lane regressions: all 38 modules on this candidate, 0 failures (guardian 6, entitlement 6, organization 6, professional 6, submissions 7, assignment 7, classroom 6, sceneprotocol 12, changefeed 10, scorecard 14, airaflow 14, modalities 5, deadline 6, usagereservation 6, mlgate 7, conversationauth 6, serviceidentity 7, providerscope 4, completion 4, sharing 4, runs 6, guidedbriefs 4, draftrecovery 6, projects 5, evaluation 5, journey 8, dailyplan 7, projections 7, attempts 6, learningsession 8, conceptgraph 8, catalogadapter 7, coverage 7, mediagate 7, retrievalgate 6, qualityscope 6, mlresilience 4, contextassembly 8).
- Backend dependency install: `npm run backend:install` → exit 0 in the fresh worktree.

## Remaining defects, limitations and linked open gates

- Guardian identity-proofing workflow (who may verify a guardian) binds the account/verification infrastructure at cutover; guardian-first child admission remains ADMISSION/guardian-first gates.
- Hosted verification remains out of scope; hosted/load/privacy/commercial gates stay open.
- Enabler completion never closes linked hosted, provider, content, privacy or feature acceptance gates.

## Review

(filled by the separate reviewer per D-095 — exact reviewed commit, decision and verification evidence)
