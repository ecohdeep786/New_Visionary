# KAN-44 / DATA-09 final review handoff

8 November 2026. Original implementer: deepseek. Corrective implementer/verifier:
Codex `/root`. Separate exact-source reviewer: pending. Original branch
`codex/deepseek-kan-44-admission`, original candidate `14fc87bd`, accepted dev
baseline `4bb3c22dfd403e4be73e124e79e5e584d8472bdd`, integration merge `4ddd18b1`.

## Acceptance scope

Durable admission/guardian-first backend enabler. All ages are eligible following
the founder's explicit “all age approved” clarification in this review. Current
registered product activation and hosted/operational verification retain their
separate gates. See [domain contract](../../../integration/DATA09_ADMISSION.md).
No frontend source changes, live configuration or production rollout.

## Findings corrected

Original eight tests passed, but direct probes admitted an unregistered supplied
birthYear2000 while the supposed registry returned null. Arbitrary unverified
guardian request/confirm also admitted an infant directly through requireAdmitted.
The implementation ignored its own registry, hardcoded2026, invented a13-year
cutoff, cached stale status and split link/status writes without a transaction.

Replaced unused simulator with actual PostgreSQL assurance/link state, reviewed
minimal classification/evidence references, independent configured reviewer
authority and explicit guardian confirmation. No raw DOB/documents. Current
age assurance, guardian assurance, policy, expiry, reviewer removal, tombstones
and revisions are checked. Relationship grants admission only. DML identity
checks, sorted person locks, expected revisions and atomic receipt/audit/outbox
prevent duplicate/stale/cross-account writes. Historical review metadata stays
in retained receipts. Native migration6/model/registry/container artifacts agree.

## Actual verification

- Whole Nest build; selected production/data TypeScript compilation passed.
- Replayed canonical migrations match Prisma models/native constraints.
- DATA09:19 actual PostgreSQL cases, including observed SQL lock revocation races,
  duplicate writes, wrong authority, expiry/reviewer removal, tombstones,
  retained historical reviews, native constraints, transaction rollback, outages,
  reconnect and historical migration-receipt preservation.
- DATA01..06+08+09 aggregate:186/196 initially passed; ten invitation cases
  shared a hook expecting exactly5 migrations. Updated to6; affected invitation
  ten and admission18 rerun together:28/28. Unchanged DATA07:37/37.
  Full aggregate rerun196/196 passed; with DATA07 this is233/233 before the
  added independent-review regression described below.
- Broader backend with real Firestore emulator:162/162. Script battery:133/133.
- Actual Chromium through registered backend, real Auth/Firestore emulators:
  four compatibility groups passed. Known-minor onboarding403 with no completion,
  forged fields400, account switch409, existing adult onboarding201 and no
  unaccepted public admission route. Initial harness omitted the minimum rate
  key length and required language preference; corrected fixture, guard unchanged.

All stores are disposable loopback services, demo Firebase realm and synthetic
SQL database. No identity/session stubs in the browser gate. ML/jobs/frontend
implementation is N/A for this server-owned enabler. No outbox worker, hosted
age verification or guardian/report permission is claimed.

Reviewer decision, exact SHA, candidate CI, accepted published dev integration,
integrated verification, evidence preservation, cleanup and actual Jira Done
remain pending. The submitted candidate was returned In Progress with findings
in Jira comment10689. No self-approval or completed integration is claimed.

## Independent review correction

`/root/kan44_final_review` requested changes on exact candidate
`79929989a1b7630c4dcb0c18e64b7ea383df32c8` after independently passing18/18.
A revoked initial link excluded its guardian from locks; another transaction
could re-establish the same guardian before lock acquisition, letting guardian
assurance revocation commit while an admitted callback remained open. An actual
SQL probe committed a callback write after revocation. The new regression fails
on the old candidate with "Guardian revocation escaped the admitted transaction
lock". The corrected lock set always includes a known guardian, regardless of
link state, and retains the guardian-change check. The regression now requires
the revoker to be observed waiting on the actual SQL lock until callback commit.
The container's remaining physical ledger assertion now includes migration6.
Renewed exact-source review and CI are required; earlier approval is not claimed.

The separate reviewer approved corrected source `8b32fbb2` after19/19, compilation
and replayed DDL checks. Candidate CI42454517419 then stopped on the required
import provenance check: the intentional schema change lacked its upstream
patch receipt. The byte-hashed patch and chained before/after hashes now record
exactly that schema delta. Runtime source is unchanged by this provenance repair;
the resulting final commit still requires explicit reviewer confirmation and CI.
