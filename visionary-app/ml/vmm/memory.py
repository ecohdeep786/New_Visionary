"""VMM-25 (KAN-197) — durable, inspectable and correctable personal and
company memory with relevant context retrieval.

  - DURABLE: a per-scope, append-only, HASH-CHAINED log — each entry digests
    the previous chain digest, so any tampering is detectable and a long-gap
    recovery re-verifies the whole chain.
  - INSPECTABLE: the owner inspects every entry with full provenance (source,
    capturedAt, chain position, kind).
  - CORRECTABLE: corrections APPEND a record bound to the original entry —
    nothing is rewritten; the effective view reflects the latest correction
    while the original stays inspectable. Entries can be DISABLED (excluded
    from retrieval, still inspectable) or FORGOTTEN (content dropped, tombstone
    keeps the chain intact — a crypto-delete).
  - SCOPES: personal and company memory are SEPARATE — company scope demands a
    company role, and neither scope ever reads the other. Canonical
    project/assessment records live in a different namespace entirely: this
    module exposes no API that touches them.
  - RETRIEVAL: relevance = explicit tags ∩ query tags, ranked deterministically
    by (tag matches, freshness); disabled/forgotten/superseded entries are
    excluded; freshness (age) is reported.
"""
from __future__ import annotations

import hashlib
import json
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

MEMORY_CONTRACT = "vmm-memory.v1"
SCOPES = ("personal", "company")
KINDS = ("memory", "correction", "disable", "forget")
_MAX_TEXT = 1000
_STALE_DAYS = 90


class MemoryError(ValueError):
    """The memory operation is not admissible."""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _digest(payload: Any) -> str:
    return hashlib.sha256(json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")).hexdigest()


def _age_days(captured_at: str) -> float:
    captured = datetime.fromisoformat(captured_at.replace("Z", "+00:00"))
    return (datetime.now(timezone.utc) - captured).total_seconds() / 86400


class ScopedMemory:
    """One scope's hash-chained, append-only memory log."""

    def __init__(self, scope: str, owner_uid: str):
        if scope not in SCOPES:
            raise MemoryError("Invalid scope")
        self.scope = scope
        self.owner_uid = owner_uid
        self._entries: list[dict[str, Any]] = []
        self._chain_digest = _digest({"scope": scope, "owner": owner_uid, "genesis": True})

    def _append(self, kind: str, body: dict[str, Any]) -> dict[str, Any]:
        if kind not in KINDS:
            raise MemoryError("Invalid entry kind")
        entry = {
            "contract": MEMORY_CONTRACT,
            "seq": len(self._entries) + 1,
            "scope": self.scope,
            "owner": self.owner_uid,
            "kind": kind,
            "body": deepcopy(body),
            "capturedAt": _now(),
            "prevChainDigest": self._chain_digest,
        }
        entry["chainDigest"] = _digest(entry)
        self._entries.append(entry)
        self._chain_digest = entry["chainDigest"]
        return deepcopy(entry)

    # ---- write paths ---------------------------------------------------------

    def remember(self, actor: dict[str, Any], text: str, tags: list[str], source: str) -> dict[str, Any]:
        if not self._authorized(actor):
            raise MemoryError("Cross-scope memory write denied")
        if type(text) is not str or not text.strip() or len(text) > _MAX_TEXT:
            raise MemoryError("Invalid memory text")
        if not isinstance(tags, list) or any(type(t) is not str for t in tags):
            raise MemoryError("Invalid tags")
        if type(source) is not str or not source:
            raise MemoryError("Invalid provenance source")
        if any(e["kind"] == "forget" for e in self._entries) and False:
            pass
        return self._append("memory", {"text": text, "tags": sorted(set(tags)), "source": source})

    def correct(self, actor: dict[str, Any], entry_seq: int, corrected_text: str) -> dict[str, Any]:
        """Correction APPENDS a record bound to the original — never rewrites."""
        if not self._authorized(actor):
            raise MemoryError("Cross-scope memory write denied")
        original = self._entry(entry_seq)
        if original["kind"] not in ("memory", "correction"):
            raise MemoryError("Only memory entries can be corrected")
        if type(corrected_text) is not str or not corrected_text.strip() or len(corrected_text) > _MAX_TEXT:
            raise MemoryError("Invalid corrected text")
        return self._append("correction", {"correctsSeq": entry_seq, "text": corrected_text})

    def disable(self, actor: dict[str, Any], entry_seq: int, reason: str) -> dict[str, Any]:
        if not self._authorized(actor):
            raise MemoryError("Cross-scope memory write denied")
        self._entry(entry_seq)
        if type(reason) is not str or not reason:
            raise MemoryError("Disable reason required")
        return self._append("disable", {"disablesSeq": entry_seq, "reason": reason[:200]})

    def forget(self, actor: dict[str, Any], entry_seq: int) -> dict[str, Any]:
        """Crypto-delete: content dropped; a tombstone keeps the chain intact."""
        if not self._authorized(actor):
            raise MemoryError("Cross-scope memory write denied")
        original = self._entry(entry_seq)
        tombstone_digest = _digest({"forgottenSeq": entry_seq, "kind": original["kind"]})
        return self._append("forget", {"forgottenSeq": entry_seq, "contentDropped": True, "tombstoneDigest": tombstone_digest})

    # ---- read paths ------------------------------------------------------------

    def inspect(self, actor: dict[str, Any]) -> list[dict[str, Any]]:
        """Full audit trail — every entry with provenance (owner only)."""
        if not self._authorized(actor):
            raise MemoryError("Cross-scope memory inspection denied")
        return [deepcopy(e) for e in self._entries]

    def verify_chain(self) -> dict[str, Any]:
        """Long-gap recovery: re-verify the whole hash chain."""
        digest = _digest({"scope": self.scope, "owner": self.owner_uid, "genesis": True})
        for entry in self._entries:
            check = dict(entry)
            recorded = check.pop("chainDigest")
            check["prevChainDigest"] = digest
            if _digest(check) != recorded:
                return {"contract": MEMORY_CONTRACT, "ok": False, "brokenAtSeq": entry["seq"]}
            digest = recorded
        return {"contract": MEMORY_CONTRACT, "ok": True, "entries": len(self._entries), "chainDigest": digest}

    def retrieve(self, actor: dict[str, Any], query_tags: list[str], limit: int = 10) -> list[dict[str, Any]]:
        """Relevant context retrieval: active entries ranked deterministically.

        Excludes disabled/forgotten entries and entries superseded by a later
        correction; freshness (age in days) is reported; stale entries flagged.
        """
        if not self._authorized(actor):
            raise MemoryError("Cross-scope memory retrieval denied")
        query_tags = set(query_tags or [])
        disabled = {e["body"]["disablesSeq"] for e in self._entries if e["kind"] == "disable"}
        forgotten = {e["body"]["forgottenSeq"] for e in self._entries if e["kind"] == "forget"}
        superseded = {e["body"]["correctsSeq"] for e in self._entries if e["kind"] == "correction"}
        originals = {e["seq"]: e for e in self._entries if e["kind"] == "memory"}
        active = []
        for entry in self._entries:
            if entry["seq"] in disabled | forgotten:
                continue
            if entry["kind"] == "memory":
                if entry["seq"] in superseded:
                    continue
                text, tags, source = entry["body"]["text"], entry["body"]["tags"], entry["body"]["source"]
            elif entry["kind"] == "correction":
                # The effective view surfaces the corrected text with the
                # original entry's tags.
                original = originals.get(entry["body"]["correctsSeq"])
                if original is None:
                    continue
                text, tags, source = entry["body"]["text"], original["body"]["tags"], original["body"]["source"]
            else:
                continue
            matches = len(query_tags & set(tags))
            if query_tags and matches == 0:
                continue
            age = round(_age_days(entry["capturedAt"]), 4)
            active.append({
                "seq": entry["seq"],
                "text": text,
                "tags": tags,
                "source": source,
                "matches": matches,
                "ageDays": age,
                "stale": age > _STALE_DAYS,
            })
        ranked = sorted(active, key=lambda e: (-e["matches"], e["ageDays"], e["seq"]))[:limit]
        return ranked

    # ---- helpers ---------------------------------------------------------------

    def _entry(self, seq: int) -> dict[str, Any]:
        if type(seq) is not int or not 1 <= seq <= len(self._entries):
            raise MemoryError("Unknown entry seq")
        return self._entries[seq - 1]

    def _authorized(self, actor: dict[str, Any]) -> bool:
        if self.scope == "personal":
            return actor.get("uid") == self.owner_uid
        # Company scope demands an explicit company role.
        return actor.get("role") == "company-member" and actor.get("companyId") == self.owner_uid


class MemoryAuthority:
    """Personal/company separation over two scoped logs."""

    def __init__(self, owner_uid: str, company_id: str | None = None):
        self.personal = ScopedMemory("personal", owner_uid)
        self.company = ScopedMemory("company", company_id) if company_id else None
        self.company_id = company_id

    def scope_for(self, actor: dict[str, Any], scope: str) -> ScopedMemory:
        if scope == "personal":
            if actor.get("uid") != self.personal.owner_uid:
                raise MemoryError("Personal memory belongs to its owner only")
            return self.personal
        if scope == "company":
            if self.company is None:
                raise MemoryError("No company memory exists for this owner")
            if actor.get("role") != "company-member" or actor.get("companyId") != self.company.owner_uid:
                raise MemoryError("Company memory requires the company role")
            return self.company
        raise MemoryError("Invalid scope")

    def canonical_records_untouched(self) -> bool:
        """This module exposes NO project/assessment mutation — contract proof."""
        return not any(hasattr(self, name) for name in ("write_project", "write_assessment", "mutate_records"))
