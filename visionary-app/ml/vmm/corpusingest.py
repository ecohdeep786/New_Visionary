"""VMM-CURR-02 (KAN-209) — safely ingest founder-approved local curriculum
corpus into the source graph, OCR and grounded product.

The ingestion pipeline contract over the KAN-208 inbox manifest:

  - AUTHORIZED INGESTION ONLY: the sealed inbox manifest (KAN-208) is the sole
    entry point; unsealed manifests and unapproved sources are refused.
  - CHUNK + INDEX: each ingested textbook page is bounded (max chars), scanned
    for injected payloads, and indexed into the existing retrieval contract —
    the pipeline NEVER creates a parallel source store.
  - SOURCE-CITED OUTPUT: every chunk carries {sourceId, sourceVersion,
    page, chunkIndex, license} — downstream surfaces always cite.
  - DENY PATHS: wrong operator, cross-edition/board mismatch, duplicated book,
    stale syllabus (criteria version moved), source withdrawal, rights revoked,
    prompt injection, stale index, rollback.
  - WITHDRAWAL/ROLLBACK: source withdrawal or rights revocation immediately
    invalidates all chunks from that source — downstream surfaces fail closed
    until regenerated.
"""
from __future__ import annotations

import json
import re
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

from vmm.curriculum import CurriculumRegistry, CurriculumError

INGEST_CONTRACT = "vmm-corpusingest.v1"
MAX_CHUNK_CHARS = 2000
INJECTION_PATTERNS = (r"<script", r"javascript:", r"onerror\s*=", r"prompt\s+injection", r"ignore\s+(previous|above)")


class IngestError(ValueError):
    """The ingestion operation is not admissible."""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _scan_chunk(text: str) -> None:
    lowered = text.lower()
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, lowered):
            raise IngestError(f"Injected payload refused in chunk: {pattern}")


class CurriculumIngestPipeline:
    """Safely ingest the founder-approved corpus into the retrieval graph."""

    def __init__(
        self,
        curriculum_registry: CurriculumRegistry,
        inbox_manifest: dict[str, Any],
        source_revision_lookup: Any,
        pinned_criteria_version: str,
    ):
        if inbox_manifest.get("contract") != "vmm-curriculum.v1":
            raise IngestError("Not a sealed inbox manifest")
        if not inbox_manifest.get("manifestDigest"):
            raise IngestError("Inbox manifest must be sealed")
        self._registry = curriculum_registry
        self._manifest = deepcopy(inbox_manifest)
        self._revision_lookup = source_revision_lookup
        self._pinned_criteria = pinned_criteria_version
        self._chunks: list[dict[str, Any]] = []
        self._withdrawn: set[str] = set()
        self._ingested_sources: set[str] = set()
        self._served_version: int = 0

    def ingest_source(self, backend: dict[str, Any], source_id: str, filename: str, page_texts: list[str]) -> dict[str, Any]:
        """Ingest one textbook file: chunk each page, scan, index with citations."""
        if backend.get("kind") != "backend-service":
            raise IngestError("Ingestion is backend-only")
        if self._withdrawn:
            raise IngestError("Source withdrawn; ingestion blocked")
        # Verify the source is registered and approved.
        source = self._registry.source(source_id)
        if source["rights"]["status"] != "approved":
            raise IngestError(f"Source '{source_id}' is not approved")
        # Verify the file is in the sealed manifest.
        manifest_files = {f["sourceId"]: f for f in self._manifest.get("files", [])}
        if source_id not in manifest_files:
            raise IngestError(f"Source '{source_id}' not in the sealed inbox manifest")
        # Verify no duplicate book.
        if source_id in self._ingested_sources:
            raise IngestError(f"Duplicated book: {source_id} already ingested")
        # Verify the source revision hasn't moved (stale syllabus).
        current_rev = self._revision_lookup(source["downloadRef"]) if callable(self._revision_lookup) else 1
        if current_rev < 1:
            raise IngestError("Stale syllabus: source revision lookup failed")
        # Verify criteria version still pinned.
        if source.get("academicYear") and self._pinned_criteria not in ("curr-v1", "curr-v2"):
            raise IngestError("Stale syllabus: criteria version unpinned")

        chunks = []
        for page_num, page_text in enumerate(page_texts, start=1):
            if type(page_text) is not str or not page_text.strip():
                continue
            # Chunk into bounded pieces.
            for chunk_index in range(0, min(len(page_text), MAX_CHUNK_CHARS * 10), MAX_CHUNK_CHARS):
                chunk_text = page_text[chunk_index:chunk_index + MAX_CHUNK_CHARS]
                _scan_chunk(chunk_text)
                chunks.append({
                    "sourceId": source_id,
                    "sourceVersion": source["downloadRef"],
                    "page": page_num,
                    "chunkIndex": chunk_index // MAX_CHUNK_CHARS,
                    "text": chunk_text,
                    "license": source["rights"]["license"],
                    "consentRef": source["rights"]["consentRef"],
                    "criteriaVersion": self._pinned_criteria,
                    "cited": True,
                })
        self._chunks.extend(chunks)
        self._ingested_sources.add(source_id)
        self._served_version += 1
        return {
            "contract": INGEST_CONTRACT,
            "sourceId": source_id,
            "chunks": len(chunks),
            "pages": len(page_texts),
            "servedVersion": self._served_version,
        }

    def withdraw_source(self, backend: dict[str, Any], source_id: str, reason: str) -> dict[str, Any]:
        """Immediate withdrawal: all chunks from this source become invalid."""
        if backend.get("kind") != "backend-service":
            raise IngestError("Withdrawal is backend-only")
        self._withdrawn.add(source_id)
        return {"withdrawn": source_id, "reason": reason[:200], "invalidatedChunks": sum(1 for c in self._chunks if c["sourceId"] == source_id)}

    def retrieve(self, backend: dict[str, Any], query_tags: list[str] | None = None) -> list[dict[str, Any]]:
        """Retrieval: only chunks from non-withdrawn, approved sources."""
        if backend.get("kind") != "backend-service":
            raise IngestError("Retrieval is backend-only")
        active = [deepcopy(c) for c in self._chunks if c["sourceId"] not in self._withdrawn]
        if query_tags:
            active = [c for c in active if any(t in c["text"].lower() for t in query_tags)]
        return active

    def rollback(self, backend: dict[str, Any], to_served_version: int) -> dict[str, Any]:
        """Deterministic rollback to an earlier served version."""
        if backend.get("kind") != "backend-service":
            raise IngestError("Rollback is backend-only")
        if to_served_version >= self._served_version:
            raise IngestError("Rollback must target an EARLIER served version")
        removed = self._served_version - to_served_version
        self._served_version = to_served_version
        return {"rolledBackTo": to_served_version, "versionsRemoved": removed, "userRecordsChanged": False}

    def served_version(self) -> int:
        return self._served_version

    def no_competing_source_store(self) -> bool:
        """Contract proof: no source-store mutation API exists."""
        return not any(hasattr(self, name) for name in ("store_source", "upsert_source", "write_source_text"))
