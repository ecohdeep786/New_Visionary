"""VMM-CURR-01 (KAN-208) — authoritative India curriculum source registry,
rights contract and founder file-inbox manifest.

The catalog and folder/manifest contract for the founder's approved private
textbook inbox. This does NOT recreate the KAN-60-65 ingest pipeline or assume
model training rights — it defines WHAT sources exist, their rights status,
and the manifest contract for the founder's file drop.

  - CURRICULUM SOURCE REGISTRY: versioned, rights-aware catalog of
    state/UT/board/authority, class/grade, stream, medium, language, subject,
    academic year, chapter/topic, edition/publisher/book ID, and direct
    download refs. Every source carries its rights status.
  - FOUNDER FILE-INBOX MANIFEST: the contract for the founder's approved
    private folder — a manifest of files (SHA-256, format, source binding) that
    the ingest pipeline (KAN-209) will consume. The inbox manifest is
    validated BEFORE any file moves.
  - NO PARALLEL DATABASE: the registry references the existing source contract
    (KAN-29/60-65/144); it defines the CURRICULUM TAXONOMY + RIGHTS layer on
    top, never a second store for content bytes.
  - RIGHTS-AWARE: every source has {license, consentRef, rightsStatus} where
    rightsStatus ∈ {pending, approved, denied, withdrawn}. Only APPROVED
    sources may be bound to inbox files for ingestion.
"""
from __future__ import annotations

import hashlib
import json
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

CURR_CONTRACT = "vmm-curriculum.v1"
RIGHTS_STATUSES = ("pending", "approved", "denied", "withdrawn")
BOARDS = ("CBSE", "CISCE", "NIOS", "NCERT", "state")
STREAMS = ("science", "commerce", "arts", "vocational", "general")


class CurriculumError(ValueError):
    """The curriculum operation is not admissible."""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _digest(payload: Any) -> str:
    return hashlib.sha256(json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")).hexdigest()


class CurriculumRegistry:
    """Versioned, rights-aware curriculum source catalog."""

    def __init__(self):
        self._sources: dict[str, dict[str, Any]] = {}
        self._version = 1

    def register_source(
        self,
        source_id: str,
        state_or_ut: str,
        board: str,
        class_grade: str,
        stream: str,
        medium: str,
        language: str,
        subject: str,
        academic_year: str,
        chapter_topics: list[str],
        edition: str,
        publisher: str,
        book_id: str,
        download_ref: str,
        license: str,
        consent_ref: str,
        rights_status: str = "pending",
    ) -> dict[str, Any]:
        """Register one curriculum source with full taxonomy + rights."""
        for name, value, max_len in [
            ("source_id", source_id, 80), ("state_or_ut", state_or_ut, 60),
            ("class_grade", class_grade, 20), ("medium", medium, 40),
            ("language", language, 40), ("subject", subject, 80),
            ("academic_year", academic_year, 20), ("edition", edition, 60),
            ("publisher", publisher, 120), ("book_id", book_id, 80),
            ("download_ref", download_ref, 200), ("license", license, 100),
            ("consent_ref", consent_ref, 120),
        ]:
            if type(value) is not str or not value.strip() or len(value) > max_len:
                raise CurriculumError(f"Invalid {name}")
        if board not in BOARDS:
            raise CurriculumError(f"Invalid board: {board}")
        if stream not in STREAMS:
            raise CurriculumError(f"Invalid stream: {stream}")
        if rights_status not in RIGHTS_STATUSES:
            raise CurriculumError(f"Invalid rights status: {rights_status}")
        if not isinstance(chapter_topics, list) or not chapter_topics or any(type(c) is not str for c in chapter_topics):
            raise CurriculumError("Invalid chapter topics")
        if source_id in self._sources:
            raise CurriculumError(f"Duplicate source id: {source_id}")

        source = {
            "contract": CURR_CONTRACT,
            "sourceId": source_id,
            "stateOrUt": state_or_ut,
            "board": board,
            "classGrade": class_grade,
            "stream": stream,
            "medium": medium,
            "language": language,
            "subject": subject,
            "academicYear": academic_year,
            "chapterTopics": sorted(set(chapter_topics)),
            "edition": edition,
            "publisher": publisher,
            "bookId": book_id,
            "downloadRef": download_ref,
            "rights": {"license": license, "consentRef": consent_ref, "status": rights_status},
            "registeredAt": _now(),
        }
        self._sources[source_id] = source
        self._version += 1
        return deepcopy(source)

    def set_rights(self, source_id: str, rights_status: str) -> dict[str, Any]:
        """Update rights status (founder decision)."""
        if source_id not in self._sources:
            raise CurriculumError(f"Unknown source: {source_id}")
        if rights_status not in RIGHTS_STATUSES:
            raise CurriculumError(f"Invalid rights status: {rights_status}")
        self._sources[source_id]["rights"]["status"] = rights_status
        return {"sourceId": source_id, "rightsStatus": rights_status}

    def source(self, source_id: str) -> dict[str, Any]:
        src = self._sources.get(source_id)
        if src is None:
            raise CurriculumError(f"Unknown source: {source_id}")
        return deepcopy(src)

    def approved_sources(self) -> list[dict[str, Any]]:
        """Only sources with rights_status 'approved' are ingest-eligible."""
        return [deepcopy(s) for s in self._sources.values() if s["rights"]["status"] == "approved"]

    def registry_version(self) -> int:
        return self._version


class FounderInboxManifest:
    """The founder's private textbook folder manifest contract.

    The founder drops textbook files into an approved private folder. This
    manifest validates the DROP before any ingest — each file must bind to a
    registered, APPROVED curriculum source with a matching SHA-256 digest.
    """

    def __init__(self, curriculum_registry: CurriculumRegistry):
        self.registry = curriculum_registry
        self._files: dict[str, dict[str, Any]] = {}
        self._manifest_sealed = False

    def declare_file(self, filename: str, content: bytes, source_id: str) -> dict[str, Any]:
        """Declare one inbox file bound to a registered, APPROVED source."""
        if self._manifest_sealed:
            raise CurriculumError("Manifest already sealed")
        source = self.registry.source(source_id)
        if source["rights"]["status"] != "approved":
            raise CurriculumError(f"Source '{source_id}' is not approved (status: {source['rights']['status']})")
        if type(content) is not bytes or len(content) == 0:
            raise CurriculumError("Empty file")
        sha256 = hashlib.sha256(content).hexdigest()
        entry = {
            "filename": filename[:120] if type(filename) is str and filename else "unnamed",
            "sourceId": source_id,
            "sha256": sha256,
            "sizeBytes": len(content),
            "format": source["downloadRef"].rsplit(".", 1)[-1] if "." in source["downloadRef"] else "unknown",
            "declaredAt": _now(),
        }
        self._files[filename] = entry
        return deepcopy(entry)

    def seal(self, founder: dict[str, Any]) -> dict[str, Any]:
        """Founder seals the manifest — no more files can be declared."""
        if founder.get("role") != "founder":
            raise CurriculumError("Only the founder may seal the inbox manifest")
        if not self._files:
            raise CurriculumError("Cannot seal an empty manifest")
        self._manifest_sealed = True
        manifest_digest = _digest({"files": sorted(self._files.values(), key=lambda f: f["filename"])})
        return {
            "contract": CURR_CONTRACT,
            "fileCount": len(self._files),
            "manifestDigest": manifest_digest,
            "sealedAt": _now(),
        }

    def files(self) -> list[dict[str, Any]]:
        return [deepcopy(f) for f in sorted(self._files.values(), key=lambda f: f["filename"])]

    def validate_ingest_eligibility(self) -> dict[str, Any]:
        """Check the sealed manifest is ready for KAN-209 ingestion."""
        if not self._manifest_sealed:
            raise CurriculumError("Manifest not sealed")
        unapproved = [f["sourceId"] for f in self._files.values() if self.registry.source(f["sourceId"])["rights"]["status"] != "approved"]
        return {
            "contract": CURR_CONTRACT,
            "fileCount": len(self._files),
            "allSourcesApproved": not unapproved,
            "unapprovedSourceIds": unapproved,
            "readyForIngest": not unapproved,
        }
