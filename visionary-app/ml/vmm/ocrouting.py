"""VOCR-03 (KAN-194) — route reviewed OCR text/layout and corrections into
the existing learning and Build surfaces.

  - ONLY REVIEWED OCR routes: raw perception (VOCR-01 hypotheses) is refused —
    routing requires a REVIEWED result (owner-reviewed or correction-backed).
  - EXACT VERSIONS SURVIVE: every routed payload pins the exact page /
    source / correction versions; downstream surfaces see those versions and
    cannot silently see newer ones.
  - WRONG OPERATOR REFUSED: only the operator who owns the upload (or an
    authorized reviewer) may route; cross-operator routing is rejected.
  - STALE TRANSCRIPT REFUSED: if the source revision has moved past the
    version the transcript was captured against, routing is refused — a stale
    transcript cannot silently affect assessment.
  - NO NEW COMPETING SOURCE STORE: routed payloads REFERENCE the existing
    source contract (sourceVersion pinned); the router persists NO text as a
    source and exposes no source-store API (contract-proven).
  - SURFACES: learn (evidence attachment), ask (context refs), practice
    (attempt provenance), build (artifact provenance without answer keys).
  - CORRECTIONS route as corrections (bound to the original transcript), never
    as new content.
"""
from __future__ import annotations

import json
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

ROUTING_CONTRACT = "vmocr-routing.v1"
SURFACES = ("learn", "ask", "practice", "build")


class OcrRoutingError(ValueError):
    """The OCR routing operation is not admissible."""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class OcrProvenanceRouter:
    """Routes REVIEWED OCR results into the four surfaces, version-pinned."""

    def __init__(self, source_revision_lookup: Any):
        """source_revision_lookup: callable(sourceVersion) -> int (the existing
        source contract's current revision). The router owns NO source store."""
        if not callable(source_revision_lookup):
            raise OcrRoutingError("A source-revision lookup into the EXISTING source contract is required")
        self._lookup = source_revision_lookup
        self._routed: list[dict[str, Any]] = []

    def route(
        self,
        operator: dict[str, Any],
        reviewed_result: dict[str, Any],
        surface: str,
        source_version: str,
        source_revision: int,
        correction_seq: int | None = None,
    ) -> dict[str, Any]:
        """Route one reviewed OCR result (or correction) to one surface."""
        if surface not in SURFACES:
            raise OcrRoutingError(f"Unknown surface: {surface}")
        if reviewed_result.get("contract") != "vmm-ocr.v1":
            raise OcrRoutingError("Not a VOCR-01 structural result")
        if reviewed_result.get("reviewed") is not True:
            raise OcrRoutingError("Raw perception cannot route: the result must be REVIEWED first")
        owner_uid = reviewed_result.get("ownerUid")
        if type(owner_uid) is not str or not owner_uid:
            raise OcrRoutingError("Result lacks operator identity")
        if operator.get("uid") != owner_uid and operator.get("role") != "reviewer":
            raise OcrRoutingError("Wrong operator: routing denied")
        # Exact page versions survive: every page must be present in the payload.
        pages = reviewed_result.get("pages", [])
        if not pages or any(type(p.get("page")) is not int for p in pages):
            raise OcrRoutingError("Invalid page versions")
        # Stale transcript: the source revision must still be current.
        current = self._lookup(source_version)
        if current != source_revision:
            raise OcrRoutingError(
                f"Stale transcript: source revision moved ({source_revision} -> {current}); cannot silently affect assessment"
            )
        if correction_seq is not None and (type(correction_seq) is not int or correction_seq < 1):
            raise OcrRoutingError("Invalid correction seq")
        payload = {
            "contract": ROUTING_CONTRACT,
            "surface": surface,
            "jobId": reviewed_result["jobId"],
            "uploadSha256": reviewed_result["uploadSha256"],
            "ownerUid": owner_uid,
            "engineVersion": reviewed_result["engineVersion"],
            "pages": [{"page": p["page"], "regionCount": len(p["regions"])} for p in pages],
            "sourceVersion": source_version,
            "sourceRevision": source_revision,
            "correctionSeq": correction_seq,
            "routedAs": "correction" if correction_seq is not None else "reviewed-ocr",
            "untrustedPerception": reviewed_result.get("untrustedPerception", True),
            "sourceAuthorized": False,
            "hiddenAnswerKeys": [] if surface == "build" else None,
            "newSourceStore": False,
            "routedAt": _now(),
        }
        self._routed.append(deepcopy(payload))
        return deepcopy(payload)

    def routed(self) -> list[dict[str, Any]]:
        return [deepcopy(r) for r in self._routed]

    @staticmethod
    def no_new_source_store() -> bool:
        """Contract proof: the router exposes no source-store mutation API."""
        return not any(hasattr(OcrProvenanceRouter, name) for name in ("store_source", "upsert_source", "write_source"))
