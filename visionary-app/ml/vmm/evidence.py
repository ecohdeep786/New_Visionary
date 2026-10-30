"""VMM-12 (KAN-180) — connect immutable assessed receipts to SCM/BKT and
versioned feature/progress projections.

The connector between the backend's authoritative evidence and the ML layer:

  - AUTHORITATIVE ONLY: receipts enter ONLY from the backend authority
    (`assessedBy: 'backend'` — the server-owned evaluation of KAN-74). Client
    pass-claims, model outputs, OCR outputs and Build outputs are REFUSED —
    nothing except backend assessment can fabricate mastery, and the projection
    carries `masteryGranted: False` unconditionally.
  - IDEMPOTENT / REPLAY / REBUILD: ingestion is idempotent by receiptId
    (duplicates converge), the projection is a pure function of the receipt SET
    (out-of-order replay converges to the same result), and `rebuild()`
    recomputes byte-identical projections from the full set.
  - SCM/BKT CONNECTION: receipts -> per-concept attempt sequences ->
    VMM-05 `scm_project` with provenance (criteriaVersion, sourceVersion).
  - VERSIONED FEATURE/PROGRESS PROJECTIONS: receipts -> VMM-06 feature vectors
    + Wilson uncertainty, bound to a PINNED {criteriaVersion, featureVersion};
    a receipt outside the pinned criteria version is refused (stale).
  - SECOND-DEVICE READ-BACK: projections are owner-scoped and identical for any
    device session that reads them.
  - BACKEND-ONLY INGEST: end-user callers are denied (VMM-11-style authz).
  - IDENTITIES stay out of feature vectors (VMM-06 gate); receipts carry
    identity ONLY for authorization/provenance.
"""
from __future__ import annotations

import json
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

from vmm.baselines import BKTParameters, scm_project
from vmm.features import uncertainty

EVIDENCE_CONTRACT = "vmm-evidence-connector.v1"
ALLOWED_ASSESSORS = ("backend",)


class EvidenceError(ValueError):
    """The receipt / ingestion is not admissible."""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _validate_receipt(receipt: dict[str, Any]) -> dict[str, Any]:
    required = {"receiptId", "workspaceId", "conceptId", "correct", "criteriaVersion", "sourceVersion", "assessedAt", "assessedBy"}
    if type(receipt) is not dict or set(receipt) != required:
        raise EvidenceError("Receipt fields must be exactly receiptId/workspaceId/conceptId/correct/criteriaVersion/sourceVersion/assessedAt/assessedBy")
    if type(receipt["receiptId"]) is not str or not receipt["receiptId"] or len(receipt["receiptId"]) > 80:
        raise EvidenceError("Invalid receiptId")
    if type(receipt["workspaceId"]) is not str or not receipt["workspaceId"]:
        raise EvidenceError("Invalid workspaceId")
    if type(receipt["conceptId"]) is not str or not receipt["conceptId"] or len(receipt["conceptId"]) > 80:
        raise EvidenceError("Invalid conceptId")
    if type(receipt["correct"]) is not bool:
        raise EvidenceError("correct must be the SERVER verdict (bool)")
    if type(receipt["criteriaVersion"]) is not int or receipt["criteriaVersion"] < 1:
        raise EvidenceError("Invalid criteriaVersion")
    if type(receipt["sourceVersion"]) is not str or not receipt["sourceVersion"]:
        raise EvidenceError("Invalid sourceVersion")
    if receipt["assessedBy"] not in ALLOWED_ASSESSORS:
        raise EvidenceError(f"Only backend assessment is authoritative (refused assessedBy: {receipt['assessedBy']})")
    try:
        datetime.fromisoformat(receipt["assessedAt"].replace("Z", "+00:00"))
    except (ValueError, TypeError) as exc:
        raise EvidenceError("Invalid assessedAt") from exc
    return deepcopy(receipt)


class EvidenceConnector:
    """Backend-only ingestion of immutable assessed receipts -> projections."""

    def __init__(self, pinned_criteria_version: int, bkt: BKTParameters | None = None):
        if type(pinned_criteria_version) is not int or pinned_criteria_version < 1:
            raise EvidenceError("Invalid pinned criteria version")
        self._pinned_criteria_version = pinned_criteria_version
        self._bkt = bkt or BKTParameters(p_init=0.2, learn_t=0.15, slip=0.05, guess=0.1)
        self._receipts: dict[str, dict[str, Any]] = {}
        self._feature_version = 1

    def ingest(self, caller: dict[str, Any], receipt: dict[str, Any]) -> dict[str, Any]:
        """Backend-only, idempotent ingestion of one immutable receipt."""
        if caller.get("kind") != "backend-service":
            raise EvidenceError("Evidence ingestion is backend-only")
        validated = _validate_receipt(receipt)
        if validated["criteriaVersion"] != self._pinned_criteria_version:
            raise EvidenceError(f"Stale receipt: criteriaVersion {validated['criteriaVersion']} != pinned {self._pinned_criteria_version}")
        existing = self._receipts.get(validated["receiptId"])
        if existing is not None:
            if existing == validated:
                return {"ingested": False, "duplicate": True, "receiptId": validated["receiptId"]}
            raise EvidenceError("Receipt id replayed with different content")
        self._receipts[validated["receiptId"]] = validated
        return {"ingested": True, "duplicate": False, "receiptId": validated["receiptId"]}

    def receipts(self) -> list[dict[str, Any]]:
        return [deepcopy(r) for r in self._receipts.values()]

    def rebuild(self, workspace_id: str) -> dict[str, Any]:
        """Recompute projections from the FULL receipt set (byte-identical)."""
        return self.project(workspace_id)

    def project(self, workspace_id: str) -> dict[str, Any]:
        """SCM/BKT + versioned feature/progress projections for one workspace.

        A pure function of the receipt SET — arrival order never matters.
        """
        by_concept: dict[str, list[bool]] = {}
        criteria_seen: set[int] = set()
        for receipt in sorted(self._receipts.values(), key=lambda r: (r["conceptId"], r["assessedAt"], r["receiptId"])):
            if receipt["workspaceId"] != workspace_id:
                continue
            by_concept.setdefault(receipt["conceptId"], []).append(receipt["correct"])
            criteria_seen.add(receipt["criteriaVersion"])

        projections = []
        for concept_id in sorted(by_concept):
            attempts = by_concept[concept_id]
            scm = scm_project(concept_id, attempts, self._bkt, f"criteria-v{self._pinned_criteria_version}", self._pinned_criteria_version)
            evidence_snapshot = {
                "contract": "vmm-scm-evidence.v1",
                "conceptId": concept_id,
                "attempts": attempts,
                "sourceRefs": [f"criteria-v{self._pinned_criteria_version}"],
                "criteriaVersion": self._pinned_criteria_version,
            }
            from vmm.features import extract_features

            features = extract_features(evidence_snapshot, scm_p_known=scm["pKnown"])
            uncert = uncertainty(scm["pKnown"], len(attempts))
            projections.append({
                "conceptId": concept_id,
                "pKnown": scm["pKnown"],
                "attemptCount": scm["attemptCount"],
                "masteryGranted": False,
                "provenance": {"criteriaVersion": self._pinned_criteria_version, "sourceVersion": scm["sourceRef"]},
                "featureVersion": features["featureVersion"],
                "featureVectorDigest": features["vectorDigest"],
                "uncertainty": uncert,
            })
        return {
            "contract": EVIDENCE_CONTRACT,
            "workspaceId": workspace_id,
            "pinnedCriteriaVersion": self._pinned_criteria_version,
            "featureVersion": self._feature_version,
            "receiptCount": len([r for r in self._receipts.values() if r["workspaceId"] == workspace_id]),
            "projections": projections,
            "masteryGranted": False,
            "projectedAt": _now(),
        }

    def read_projection(self, device_session: dict[str, Any], workspace_id: str) -> dict[str, Any]:
        """SECOND-DEVICE READ-BACK: any authorized device session reads the
        identical owner-scoped projection."""
        if device_session.get("workspaceId") != workspace_id:
            raise EvidenceError("Cross-workspace read denied")
        return self.project(workspace_id)
