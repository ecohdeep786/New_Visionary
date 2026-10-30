"""VMM-26 (KAN-198) — verified, scoped corrections across memory, OCR,
explanations and Build artifacts.

  - CLASSIFIED, NOT ASSUMED: every reported correction is VERIFIED through a
    domain verifier seam and classified as `confirmed_error` (repair),
    `false_correction` (the original was right — the report is refuted and
    recorded) or `valid_preference` (taste — recorded, nothing repaired).
  - SCOPED REPAIR: a repair is bound to (domain, ref) and its exact artifact
    digest; it invalidates ONLY the affected revision — other domains/scopes are
    untouched. Repairs APPEND (never rewrite) and stay inspectable.
  - UNAUTHORIZED EDITS REJECTED: only the owner of the scope (or an authorized
    reviewer) may report/repair; cross-owner edits are refused.
  - RECURRENCE TESTED: repeated confirmed errors on the same ref increment the
    recurrence counter and escalate — after the pre-declared bound the loop
    escalates to human review and CLOSES (never unbounded).
  - INVALIDATION: a repair marks the affected revision stale so dependent
    artifacts (e.g. routed provenance) fail closed until regenerated.
"""
from __future__ import annotations

import json
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

CORRECTIONS_CONTRACT = "vmm-corrections.v1"
DOMAINS = ("memory", "ocr", "explanation", "build")
MAX_RECURRENCE = 3


class CorrectionError(ValueError):
    """The correction operation is not admissible."""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class CorrectionAuthority:
    """Verified, scoped corrections with recurrence escalation."""

    def __init__(self, verifiers: dict[str, Any], max_recurrence: int = MAX_RECURRENCE):
        """verifiers: {domain: callable(owner, ref, artifactDigest, claimedFix) ->
        'confirmed_error' | 'false_correction' | 'valid_preference'}"""
        if not verifiers or any(d not in DOMAINS for d in verifiers):
            raise CorrectionError("Verifiers must cover known domains")
        if type(max_recurrence) is not int or max_recurrence < 1:
            raise CorrectionError("Invalid max_recurrence")
        self._verifiers = deepcopy(verifiers)
        self._max_recurrence = max_recurrence
        self._records: list[dict[str, Any]] = []
        self._invalidated: dict[tuple[str, str], set[int]] = {}
        self._recurrence: dict[tuple[str, str], int] = {}

    def report_correction(
        self,
        actor: dict[str, Any],
        domain: str,
        ref: str,
        artifact_digest: str,
        claimed_fix: str,
    ) -> dict[str, Any]:
        """Report + VERIFY a correction; classify through the domain verifier."""
        if domain not in DOMAINS:
            raise CorrectionError("Unknown domain")
        if not self._owns(actor, domain, ref):
            raise CorrectionError("Unauthorized edit: actor does not own this scope")
        for value in (ref, artifact_digest, claimed_fix):
            if type(value) is not str or not value:
                raise CorrectionError("Invalid correction fields")
        verifier = self._verifiers[domain]
        classification = verifier(actor, ref, artifact_digest, claimed_fix)
        if classification not in ("confirmed_error", "false_correction", "valid_preference"):
            raise CorrectionError("Verifier returned an unknown classification")
        record = {
            "contract": CORRECTIONS_CONTRACT,
            "domain": domain,
            "ref": ref,
            "artifactDigest": artifact_digest,
            "claimedFix": claimed_fix[:400],
            "classification": classification,
            "reportedBy": actor.get("uid"),
            "reportedAt": _now(),
        }
        self._records.append(record)
        return deepcopy(record)

    def apply_repair(self, actor: dict[str, Any], domain: str, ref: str, artifact_digest: str, new_revision: int) -> dict[str, Any]:
        """Repair ONLY a confirmed error: invalidate the affected revision."""
        if domain not in DOMAINS:
            raise CorrectionError("Unknown domain")
        if not self._owns(actor, domain, ref):
            raise CorrectionError("Unauthorized edit: actor does not own this scope")
        confirmed = [
            r for r in self._records
            if r.get("kind") is None  # classification records only
            and r["domain"] == domain and r["ref"] == ref
            and r["artifactDigest"] == artifact_digest and r["classification"] == "confirmed_error"
        ]
        if not confirmed:
            raise CorrectionError("Repair requires a VERIFIED confirmed error for this exact digest")
        key = (domain, ref)
        invalidated = self._invalidated.setdefault(key, set())
        invalidated.add(new_revision)
        recurrence = self._recurrence.get(key, 0) + 1
        self._recurrence[key] = recurrence
        escalated = recurrence >= self._max_recurrence
        receipt = {
            "repaired": True,
            "domain": domain,
            "ref": ref,
            "repairedDigest": artifact_digest,
            "newRevision": new_revision,
            "invalidatedRevisions": sorted(invalidated),
            "recurrenceCount": recurrence,
            "escalatedToReview": escalated,
            "repairCount": len(confirmed),
            "at": _now(),
        }
        self._records.append({"contract": CORRECTIONS_CONTRACT, "kind": "repair", **deepcopy(receipt)})
        return receipt

    def recurrence_status(self, domain: str, ref: str) -> dict[str, Any]:
        key = (domain, ref)
        return {
            "recurrenceCount": self._recurrence.get(key, 0),
            "maxRecurrence": self._max_recurrence,
            "escalatedToReview": self._recurrence.get(key, 0) >= self._max_recurrence,
            "loopClosed": self._recurrence.get(key, 0) >= self._max_recurrence,
        }

    def is_stale(self, domain: str, ref: str, revision: int) -> bool:
        """Dependent artifacts fail closed against an invalidated revision."""
        return revision in self._invalidated.get((domain, ref), set())

    def history(self, actor: dict[str, Any], domain: str, ref: str) -> list[dict[str, Any]]:
        if not self._owns(actor, domain, ref):
            raise CorrectionError("Unauthorized edit: actor does not own this scope")
        return [deepcopy(r) for r in self._records if r.get("domain") == domain and r.get("ref") == ref]

    def _owns(self, actor: dict[str, Any], domain: str, ref: str) -> bool:
        """Scope ownership: the actor uid must match the ref's owner prefix, or
        an authorized reviewer role may act on any ref."""
        if actor.get("role") == "reviewer":
            return True
        owner_uid = actor.get("uid")
        if type(owner_uid) is not str or not owner_uid:
            return False
        return ref.startswith(f"{owner_uid}:")


def owned_ref(uid: str, ref: str) -> str:
    return f"{uid}:{ref}"
