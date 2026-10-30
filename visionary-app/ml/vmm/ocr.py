"""VOCR-01 (KAN-192) — secure OCR L1 contract: admitted private upload,
quarantine, parser job and structural result contracts.

  - AUTHORIZED PRIVATE UPLOAD: owner-scoped upload intent -> PRIVATE
    quarantine with a SHA-256 digest; format + size bounds enforced; malformed
    files (bad magic bytes) refused.
  - PARSER JOB: a bounded job over quarantined bytes produces a STRUCTURAL
    result (pages -> regions -> text hypotheses with confidence + engine
    version). The engine is a SEAM — real OCR engines are hosted-gated.
  - UNTRUSTED PERCEPTION: every OCR text is a HYPOTHESIS — marked untrusted,
    bounded, scanned for injected script/URL payloads, and NEVER authoritative:
    `sourceAuthorized: False` and `masteryGranted: False` unconditionally.
    Parsing is NOT source authorization.
  - PRIVATE STORAGE DENY PATHS: cross-owner reads of uploads/results are
    denied; digests bind bytes so tampering is detectable.
  - CANCELLATION: parser-job cancellation is a defined outcome.
  - QUALIFICATION GATE: deployment eligibility requires OCR benchmark
    qualification (VOCR-02) — recorded as NOT qualified until measured.
"""
from __future__ import annotations

import hashlib
import json
import re
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

OCR_CONTRACT = "vmm-ocr.v1"

ALLOWED_MAGIC = {
    "png": b"\x89PNG\r\n\x1a\n",
    "jpeg": b"\xff\xd8\xff",
}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
MAX_PAGES = 32
MAX_REGIONS_PER_PAGE = 64
_MAX_TEXT = 2000

INJECTION_PATTERNS = (
    r"<script", r"javascript:", r"onerror\s*=", r"onload\s*=", r"https?://", r"data:",
)


class OcrError(ValueError):
    """The OCR operation is not admissible."""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _detect_format(content: bytes) -> str:
    for name, magic in ALLOWED_MAGIC.items():
        if content.startswith(magic):
            return name
    raise OcrError("Malformed or unsupported file (magic-byte check failed)")


def _scan_untrusted(text: str) -> None:
    lowered = text.lower()
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, lowered):
            raise OcrError(f"Injected payload in OCR text: {pattern}")


class OcrQuarantine:
    """Admitted private upload -> quarantine -> bounded parser jobs."""

    def __init__(self, engine):
        """engine: a SEAM with `recognize(page_bytes) -> [{text, confidence, bbox}]`."""
        self._engine = engine
        self._uploads: dict[str, dict[str, Any]] = {}
        self._jobs: dict[str, dict[str, Any]] = {}
        self._results: dict[str, dict[str, Any]] = {}
        self._upload_counter = 0
        self._job_counter = 0

    def admit_upload(self, owner: dict[str, Any], filename: str, content: bytes) -> dict[str, Any]:
        if owner.get("kind") != "user" or type(owner.get("uid")) is not str or not owner["uid"]:
            raise OcrError("Uploads are owner-scoped")
        if type(content) is not bytes or len(content) == 0:
            raise OcrError("Empty upload")
        if len(content) > MAX_UPLOAD_BYTES:
            raise OcrError("Upload exceeds the size bound")
        _detect_format(content)
        upload_id = f"upl_{self._upload_counter + 1}"
        self._upload_counter += 1
        record = {
            "uploadId": upload_id,
            "owner": {"uid": owner["uid"]},
            "filename": filename[:120] if type(filename) is str and filename else "upload",
            "format": _detect_format(content),
            "sizeBytes": len(content),
            "sha256": hashlib.sha256(content).hexdigest(),
            "quarantined": True,
            "admittedAt": _now(),
        }
        self._uploads[upload_id] = {"meta": record, "bytes": bytes(content)}
        return deepcopy(record)

    def read_upload_meta(self, actor: dict[str, Any], upload_id: str) -> dict[str, Any]:
        record = self._uploads.get(upload_id)
        if record is None or record["meta"]["owner"]["uid"] != actor.get("uid"):
            raise OcrError("Cross-owner upload access denied")
        return deepcopy(record["meta"])

    def start_job(self, owner: dict[str, Any], upload_id: str, deadline_ms: int = 5000) -> dict[str, Any]:
        record = self._uploads.get(upload_id)
        if record is None or record["meta"]["owner"]["uid"] != owner.get("uid"):
            raise OcrError("Cross-owner job denied")
        if type(deadline_ms) is not int or deadline_ms <= 0:
            raise OcrError("Invalid deadline")
        job_id = f"job_{self._job_counter + 1}"
        self._job_counter += 1
        job = {"jobId": job_id, "uploadId": upload_id, "owner": {"uid": owner["uid"]}, "status": "running", "deadlineMs": deadline_ms, "startedAt": _now()}
        self._jobs[job_id] = job
        return deepcopy(job)

    def cancel_job(self, owner: dict[str, Any], job_id: str) -> dict[str, Any]:
        job = self._jobs.get(job_id)
        if job is None or job["owner"]["uid"] != owner.get("uid"):
            raise OcrError("Cross-owner cancellation denied")
        job["status"] = "cancelled"
        return {"jobId": job_id, "cancelled": True}

    def complete_job(self, owner: dict[str, Any], job_id: str) -> dict[str, Any]:
        """Run the engine seam over the quarantined bytes -> structural result."""
        job = self._jobs.get(job_id)
        if job is None or job["owner"]["uid"] != owner.get("uid"):
            raise OcrError("Cross-owner completion denied")
        if job["status"] == "cancelled":
            raise OcrError("Job was cancelled")
        upload = self._uploads[job["uploadId"]]
        pages_raw = self._engine.recognize(upload["bytes"])

        if type(pages_raw) is not list or len(pages_raw) > MAX_PAGES:
            raise OcrError("Structural bound exceeded (pages)")
        pages = []
        for page_index, page in enumerate(pages_raw, start=1):
            regions_raw = page.get("regions", []) if type(page) is dict else []
            if len(regions_raw) > MAX_REGIONS_PER_PAGE:
                raise OcrError("Structural bound exceeded (regions)")
            regions = []
            for region in regions_raw:
                text = region.get("text", "")
                if type(text) is not str or len(text) > _MAX_TEXT:
                    raise OcrError("Region text bound exceeded")
                _scan_untrusted(text)
                regions.append({
                    "text": text,
                    "confidence": round(float(region.get("confidence", 0.0)), 6),
                    "bbox": region.get("bbox", {}),
                    "untrustedPerception": True,
                })
            pages.append({"page": page_index, "regions": regions})

        result = {
            "contract": OCR_CONTRACT,
            "jobId": job_id,
            "uploadId": job["uploadId"],
            "uploadSha256": upload["meta"]["sha256"],
            "engineVersion": getattr(self._engine, "version", lambda: "unknown")(),
            "pages": pages,
            "untrustedPerception": True,
            "sourceAuthorized": False,
            "masteryGranted": False,
            "benchmarkQualified": False,
            "note": "Parsing is NOT source authorization; benchmark qualification (VOCR-02) remains open.",
            "completedAt": _now(),
        }
        self._results[job_id] = result
        job["status"] = "succeeded"
        return deepcopy(result)

    def read_result(self, actor: dict[str, Any], job_id: str) -> dict[str, Any]:
        result = self._results.get(job_id)
        if result is None:
            raise OcrError("No result for job")
        job = self._jobs[job_id]
        if job["owner"]["uid"] != actor.get("uid"):
            raise OcrError("Cross-owner result access denied")
        return deepcopy(result)

    def route_provenance(self, actor: dict[str, Any], job_id: str, app: str) -> dict[str, Any]:
        """Route OCR provenance to Learn/Ask/Practice/Build (VOCR-03 seam).

        The routed payload carries PROVENANCE + the untrusted hypothesis —
        protected answers (hidden keys) are never included, and the payload
        still asserts sourceAuthorized: False.
        """
        if app not in ("learn", "ask", "practice", "build"):
            raise OcrError("Unknown target app")
        result = self.read_result(actor, job_id)
        return {
            "app": app,
            "uploadSha256": result["uploadSha256"],
            "engineVersion": result["engineVersion"],
            "pageCount": len(result["pages"]),
            "untrustedPerception": True,
            "sourceAuthorized": False,
            "hiddenAnswerKeys": [],
        }
