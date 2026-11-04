"""VMM-16 (KAN-184) — add OCR to the fixed VATS L1 teaching loop.

Binds the VOCR chain (private capture -> owner review/repair -> provenance
routing) into the existing bounded L1 tutor loop WITHOUT changing the loop's
contract:

  - ADMISSION BY ROUTING: a capture is usable in the L1 session only after it
    routes successfully into the `learn` surface through the REAL acceptance
    harness + provenance router — that single gate enforces ownership, review,
    non-staleness, revocation/expiry and the rollout switch (fail closed).
  - UNTRUSTED VISUAL ONLY: the reviewed capture may set the loop's
    `approved_visual_available` input; it NEVER authorizes a source and NEVER
    grants mastery by itself — every attempt record keeps untrustedPerception
    and sourceAuthorized: False, and the mastery decision stays with the
    loop's own backend-assessed check.
  - FEATURE VISIBILITY: the OCR feature is served only when the rollout matrix
    is release-ready; otherwise `feature_status` reports available: False and
    the loop still works with the visual input forced off (visible fallback,
    never a hidden failure).
  - CORRECTIONS REBIND: after a user repair the NEW correction sequence is
    what routes; the old transcript cannot re-enter the session.
"""
from __future__ import annotations

from typing import Any

from vmm.ocracceptance import OcrAcceptanceError, OcrAcceptanceHarness
from vmm.ocrouting import OcrProvenanceRouter


class L1OcrIntegrationError(ValueError):
    """The OCR-to-L1 operation is not admissible."""


class L1OcrIntegration:
    def __init__(self, harness: OcrAcceptanceHarness, router: OcrProvenanceRouter):
        self._harness = harness
        self._router = router
        self._captures: dict[str, dict[str, Any]] = {}  # jobId -> routed learn payload
        self._attempts: list[dict[str, Any]] = []

    def feature_status(self) -> dict[str, Any]:
        verdict = self._harness.rollout.release_ready()
        return {
            "available": bool(verdict["ready"]),
            "blockedBy": verdict["blockedBy"],
            "version": verdict["version"],
        }

    def attach_capture(self, actor: dict[str, Any], reviewed_result: dict[str, Any], source_version: str, source_revision: int) -> dict[str, Any]:
        """Route the reviewed capture into learn; success = the session may use it."""
        if not self.feature_status()["available"]:
            raise L1OcrIntegrationError("OCR feature is not available for the launch locale")
        payload = self._harness.route(actor, reviewed_result, "learn", source_version, source_revision, self._router)
        self._captures[payload["jobId"]] = payload
        return payload

    def explain_with_capture(self, loop: Any, actor: dict[str, Any], job_id: str, first_encounter: bool) -> dict[str, Any]:
        """Run the L1 explain step; the capture may only enable the visual input."""
        capture = self._captures.get(job_id)
        if capture is None:
            raise L1OcrIntegrationError("Capture was never admitted to this session")
        if not self._harness.is_usable(job_id):
            raise L1OcrIntegrationError("Capture was revoked or expired")
        if capture["ownerUid"] != actor.get("uid"):
            raise L1OcrIntegrationError("Cross-user capture use denied")
        status = self.feature_status()
        available = bool(status["available"])
        loop_result = loop.explain(first_encounter, available)
        return {
            "loop": loop_result,
            "ocr": {
                "jobId": job_id,
                "uploadSha256": capture["uploadSha256"],
                "correctionSeq": capture["correctionSeq"],
                "visualAvailable": available,
                "untrustedPerception": True,
                "sourceAuthorized": False,
                "featureStatus": status,
            },
        }

    def record_attempt(self, actor: dict[str, Any], job_id: str | None, correct: bool, assessed_by: str = "backend") -> dict[str, Any]:
        """One practice/check attempt; OCR provenance rides along, never decides."""
        capture = self._captures.get(job_id) if job_id else None
        if job_id and capture is None:
            raise L1OcrIntegrationError("Attempt references an unadmitted capture")
        if capture is not None and (not self._harness.is_usable(job_id) or capture["ownerUid"] != actor.get("uid")):
            raise L1OcrIntegrationError("Capture revoked, expired, or cross-user")
        attempt = {
            "actorUid": actor.get("uid"),
            "correct": bool(correct),
            "assessedBy": assessed_by,
            "ocr": None if capture is None else {
                "jobId": capture["jobId"],
                "uploadSha256": capture["uploadSha256"],
                "correctionSeq": capture["correctionSeq"],
                "untrustedPerception": True,
                "sourceAuthorized": False,
                "masteryFromOcrAlone": False,
            },
        }
        self._attempts.append(attempt)
        return dict(attempt)

    def attempts(self) -> list[dict[str, Any]]:
        return [dict(a) for a in self._attempts]
