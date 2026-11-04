"""VOCR-04 (KAN-195) — hosted OCR acceptance: end-to-end review/repair,
correction invalidation, ownership/revocation and the per-locale rollout
matrix.

This is the layer between the VOCR-01 perception contract (raw hypotheses) and
the VOCR-03 provenance router (which refuses anything not REVIEWED):

  - REVIEW/REPAIR: only the owning operator may review an OCR interpretation;
    each correction binds to an exact (page, region) of the original
    transcript, is injection-scanned like the perception text itself, and
    yields a REVIEWED result the existing OcrProvenanceRouter accepts. Review
    is idempotent: the same correction set returns the same reviewed result.
  - CORRECTION INVALIDATION: a NEW correction supersedes every routed proposal
    captured against an earlier correction sequence — stale downstream use
    fails closed (superseded payloads are marked and re-routing the old
    transcript is refused).
  - OWNERSHIP / REVOCATION / EXPIRY: cross-owner review/routing is refused;
    an owner revocation (or a source withdrawal / permission expiry) makes the
    interpretation unusable at once and marks every routed payload invalidated.
  - ROLLOUT MATRIX: per-locale gates with required vs expansion modalities.
    English is the launch locale: a failing required English modality BLOCKS
    the model release; non-English expansion locales default to disabled and
    stay VISIBLY unavailable (their failure never blocks the launch);
    disable() is a fail-closed switch and rollback(version) restores a
    previous matrix version deterministically.
  - REDACTED LOGS: the event log carries ids, hashes and counts only — never
    OCR text or correction text (probe-proven).
  - CROSS-DEVICE RECOVERY: the harness state replays deterministically from
    the append-only event log.
"""
from __future__ import annotations

import hashlib
import json
import re
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

from vmm.ocr import INJECTION_PATTERNS, OcrError
from vmm.ocrouting import ROUTING_CONTRACT, SURFACES, OcrProvenanceRouter, OcrRoutingError

ACCEPTANCE_CONTRACT = "vmocr-acceptance.v1"

# English launch modalities (required); failing any of these blocks the release.
REQUIRED_EN_MODALITIES = ("print", "handwriting", "numbers", "formulas", "tables", "diagrams", "phone-capture")
MAX_CER = 0.15
MAX_WER = 0.25
MIN_SAMPLES = 3


class OcrAcceptanceError(ValueError):
    """The OCR acceptance operation is not admissible."""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _digest(payload: Any) -> str:
    return hashlib.sha256(json.dumps(payload, sort_keys=True, ensure_ascii=False).encode("utf-8")).hexdigest()


def _scan_untrusted(text: str) -> None:
    lowered = (text or "").lower()
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, lowered):
            raise OcrAcceptanceError(f"Injected payload in correction text: {pattern}")


def edit_distance(a: str, b: str) -> int:
    """Plain Levenshtein distance (bounded inputs; acceptance metrics only)."""
    if a == b:
        return 0
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, start=1):
        cur = [i]
        for j, cb in enumerate(b, start=1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]


def cer(reference: str, hypothesis: str) -> float:
    if not reference:
        return 0.0 if not hypothesis else 1.0
    return round(edit_distance(reference, hypothesis) / len(reference), 6)


def wer(reference: str, hypothesis: str) -> float:
    ref_words, hyp_words = reference.split(), hypothesis.split()
    if not ref_words:
        return 0.0 if not hyp_words else 1.0
    return round(edit_distance(" ".join(ref_words), " ".join(hyp_words)) / len(" ".join(ref_words)), 6)


class RolloutMatrix:
    """Per-locale OCR rollout gates with deterministic versioned rollback."""

    VERSION_ONE = 1

    def __init__(self) -> None:
        self._locales: dict[str, dict[str, Any]] = {
            "en": {"required": True, "enabled": True, "modalities": {}},
        }
        self._version = self.VERSION_ONE
        self._snapshots: dict[int, dict[str, Any]] = {self._version: deepcopy(self._locales)}

    def _state_digest(self) -> str:
        return _digest(self._locales)

    def qualify(self, locale: str, modality: str, samples: list[tuple[str, str]]) -> dict[str, Any]:
        """Record one modality measurement: samples of (reference, hypothesis)."""
        if locale not in self._locales:
            # A first-measured non-English locale registers as a DISABLED
            # expansion case: separately gated, never part of the launch gate.
            self._locales[locale] = {"required": False, "enabled": False, "modalities": {}}
        if type(samples) is not list or len(samples) < MIN_SAMPLES:
            raise OcrAcceptanceError(f"Modality {modality} needs at least {MIN_SAMPLES} measured samples")
        record = {
            "samples": len(samples),
            "cer": round(sum(cer(ref, hyp) for ref, hyp in samples) / len(samples), 6),
            "wer": round(sum(wer(ref, hyp) for ref, hyp in samples) / len(samples), 6),
        }
        record["pass"] = bool(record["cer"] <= MAX_CER and record["wer"] <= MAX_WER)
        self._locales[locale]["modalities"][modality] = record
        self._bump()
        return deepcopy(record)

    def _bump(self) -> None:
        self._version += 1
        self._snapshots[self._version] = deepcopy(self._locales)

    def disable(self, locale: str, reason: str) -> None:
        if locale not in self._locales:
            raise OcrAcceptanceError(f"Unknown locale: {locale}")
        self._locales[locale]["enabled"] = False
        self._locales[locale]["disabledReason"] = str(reason)[:120]
        self._bump()

    def enable(self, locale: str) -> None:
        if locale not in self._locales:
            raise OcrAcceptanceError(f"Unknown locale: {locale}")
        self._locales[locale]["enabled"] = True
        self._locales[locale].pop("disabledReason", None)
        self._bump()

    def status(self, locale: str) -> dict[str, Any]:
        entry = self._locales.get(locale)
        if entry is None:
            # A locale that was never qualified stays VISIBLY unavailable.
            return {"locale": locale, "enabled": False, "available": False, "reason": "not_qualified"}
        required_missing = []
        if entry["required"]:
            for modality in REQUIRED_EN_MODALITIES:
                record = entry["modalities"].get(modality)
                if record is None or not record["pass"]:
                    required_missing.append(modality)
        return {
            "locale": locale,
            "enabled": entry["enabled"],
            "available": bool(entry["enabled"] and not required_missing),
            "disabledReason": entry.get("disabledReason"),
            "missingRequired": required_missing,
            "modalities": deepcopy(entry["modalities"]),
            "version": self._version,
        }

    def release_ready(self) -> dict[str, Any]:
        """English launch gate: a failing REQUIRED English modality blocks the release."""
        en = self.status("en")
        blocked = [m for m in en.get("missingRequired", [])]
        verdict = {
            "ready": bool(en["enabled"] and not blocked),
            "blockedBy": blocked,
            "expansionLocales": {
                loc: {"enabled": self.status(loc)["enabled"], "available": self.status(loc)["available"]}
                for loc in self._locales if loc != "en"
            },
            "version": self._version,
        }
        # Expansion locales never block: their status is surfaced, not gating.
        return verdict

    def snapshot_version(self) -> int:
        return self._version

    def rollback(self, version: int) -> None:
        """Deterministic rollback to a previously served matrix version."""
        if version not in self._snapshots:
            raise OcrAcceptanceError(f"No snapshot for version {version}")
        self._locales = deepcopy(self._snapshots[version])
        for stale in [v for v in self._snapshots if v > version]:
            del self._snapshots[stale]
        self._version = version


class OcrAcceptanceHarness:
    """Review/repair + invalidation + revocation + rollout, event-logged."""

    def __init__(self) -> None:
        self.rollout = RolloutMatrix()
        self._owners: dict[str, str] = {}          # jobId -> ownerUid
        self._by_upload: dict[str, list[str]] = {} # uploadSha256 -> [jobId]
        self._reviewed: dict[str, dict[str, Any]] = {}  # jobId -> reviewed result
        self._correction_seq: dict[str, int] = {}  # jobId -> latest seq
        self._routed: list[dict[str, Any]] = []
        self._revoked: dict[str, str] = {}         # jobId -> reason
        self._expired: dict[str, str] = {}         # jobId -> expiry note
        self._events: list[dict[str, Any]] = []

    # -- redacted observability ------------------------------------------------
    def _log(self, event_type: str, **fields: Any) -> None:
        self._events.append({"type": event_type, "at": _now(), **fields})

    def events(self) -> list[dict[str, Any]]:
        return deepcopy(self._events)

    @staticmethod
    def log_events_are_redacted(events: list[dict[str, Any]]) -> bool:
        forbidden = ("text", "correctedText", "reference", "hypothesis", "payload_text")
        for event in events:
            flat = json.dumps(event, ensure_ascii=False)
            for key in forbidden:
                if f'"{key}"' in flat:
                    return False
        return True

    # -- review / repair -------------------------------------------------------
    def register_result(self, actor: dict[str, Any], raw_result: dict[str, Any]) -> str:
        """The owning device submits a fresh VOCR-01 result for review."""
        if raw_result.get("contract") != "vmm-ocr.v1":
            raise OcrAcceptanceError("Not a VOCR-01 structural result")
        uid = actor.get("uid")
        if type(uid) is not str or not uid:
            raise OcrAcceptanceError("Review is operator-scoped")
        job_id = raw_result.get("jobId")
        if type(job_id) is not str or not job_id:
            raise OcrAcceptanceError("Result lacks a jobId")
        sha = raw_result.get("uploadSha256")
        if type(sha) is not str or not sha:
            raise OcrAcceptanceError("Result lacks the upload digest")
        known = self._owners.get(job_id)
        if known is not None and known != uid:
            raise OcrAcceptanceError("Cross-owner registration denied")
        self._owners[job_id] = uid
        self._by_upload.setdefault(sha, []).append(job_id)
        self._correction_seq.setdefault(job_id, 0)
        self._log("result_registered", jobId=job_id, uploadSha256=sha[:12], pages=len(raw_result.get("pages", [])))
        return job_id

    def review(self, actor: dict[str, Any], raw_result: dict[str, Any], corrections: list[dict[str, Any]] | None = None) -> dict[str, Any]:
        """Owner-only review/repair -> REVIEWED result the VOCR-03 router accepts."""
        if not self.rollout.status("en")["enabled"]:
            raise OcrAcceptanceError("OCR rollout is disabled for the launch locale")
        job_id = raw_result.get("jobId")
        owner = self._owners.get(job_id)
        if owner is None or owner != actor.get("uid"):
            raise OcrAcceptanceError("Cross-owner review denied")
        if job_id in self._revoked:
            raise OcrAcceptanceError("Interpretation was revoked")
        if job_id in self._expired:
            raise OcrAcceptanceError("Permission expired for this interpretation")
        clean: list[dict[str, Any]] = []
        for correction in corrections or []:
            page_no = correction.get("page")
            region_index = correction.get("regionIndex")
            corrected = correction.get("correctedText")
            if type(page_no) is not int or type(region_index) is not int or type(corrected) is not str:
                raise OcrAcceptanceError("Correction must bind to (page, regionIndex) with correctedText")
            pages = raw_result.get("pages", [])
            page = next((p for p in pages if p.get("page") == page_no), None)
            if page is None or region_index < 0 or region_index >= len(page.get("regions", [])):
                raise OcrAcceptanceError("Correction does not bind to the transcript")
            _scan_untrusted(corrected)
            clean.append({"page": page_no, "regionIndex": region_index, "correctedText": corrected[:2000]})
        fingerprint = _digest({"jobId": job_id, "sha": raw_result.get("uploadSha256"), "corrections": clean})
        existing = self._reviewed.get(job_id)
        if existing is not None and existing["fingerprint"] == fingerprint:
            return deepcopy(existing["result"])  # idempotent retry: same reviewed result
        seq = self._correction_seq[job_id] + (1 if clean else 0)
        reviewed = deepcopy(raw_result)
        reviewed.update({
            "reviewed": True,
            "ownerUid": owner,
            "corrections": clean,
            "correctionSeq": seq,
            "reviewedAt": _now(),
        })
        if existing is not None:
            seq = max(seq, existing["result"]["correctionSeq"])
            reviewed["correctionSeq"] = seq
        self._reviewed[job_id] = {"result": reviewed, "fingerprint": fingerprint}
        self._correction_seq[job_id] = seq
        self._log("reviewed", jobId=job_id, correctionSeq=seq, correctionCount=len(clean))
        return deepcopy(reviewed)

    # -- routing through the real VOCR-03 router --------------------------------
    def route(self, actor: dict[str, Any], reviewed_result: dict[str, Any], surface: str, source_version: str, source_revision: int, router: OcrProvenanceRouter) -> dict[str, Any]:
        if surface not in SURFACES:
            raise OcrAcceptanceError(f"Unknown surface: {surface}")
        if not self.rollout.status("en")["enabled"]:
            raise OcrAcceptanceError("OCR rollout is disabled for the launch locale")
        job_id = reviewed_result.get("jobId")
        owner = self._owners.get(job_id)
        if owner is None or owner != reviewed_result.get("ownerUid"):
            raise OcrAcceptanceError("Unregistered or tampered reviewed result")
        if job_id in self._revoked:
            raise OcrAcceptanceError("Interpretation was revoked")
        current_seq = self._correction_seq.get(job_id, 0)
        if reviewed_result.get("correctionSeq", 0) < current_seq:
            raise OcrAcceptanceError("Stale transcript: a newer correction supersedes this routing")
        try:
            payload = router.route(actor, reviewed_result, surface, source_version, source_revision, correction_seq=reviewed_result.get("correctionSeq") or None)
        except OcrRoutingError as exc:
            raise OcrAcceptanceError(f"Router refused: {exc}") from exc
        self._routed.append({**payload, "jobId": job_id, "correctionSeq": reviewed_result.get("correctionSeq", 0), "superseded": False, "invalidated": False})
        self._log("routed", jobId=job_id, surface=surface, contract=ROUTING_CONTRACT, correctionSeq=reviewed_result.get("correctionSeq", 0))
        return deepcopy(payload)

    def apply_correction(self, actor: dict[str, Any], job_id: str, raw_result: dict[str, Any], corrections: list[dict[str, Any]]) -> dict[str, Any]:
        """A NEW user repair: supersedes every earlier routed proposal (fail closed)."""
        reviewed = self.review(actor, raw_result, corrections)
        new_seq = reviewed["correctionSeq"]
        for routed in self._routed:
            if routed["jobId"] == job_id and routed["correctionSeq"] < new_seq:
                routed["superseded"] = True
        self._log("correction_applied", jobId=job_id, correctionSeq=new_seq, supersededCount=sum(1 for r in self._routed if r["jobId"] == job_id and r["superseded"]))
        return reviewed

    # -- ownership / revocation / expiry ----------------------------------------
    def revoke(self, actor: dict[str, Any], job_id: str, reason: str) -> None:
        owner = self._owners.get(job_id)
        if owner is None:
            raise OcrAcceptanceError("Unknown job")
        if actor.get("uid") != owner and actor.get("kind") != "system":
            raise OcrAcceptanceError("Cross-owner revocation denied")
        self._revoked[job_id] = str(reason)[:120]
        for routed in self._routed:
            if routed["jobId"] == job_id:
                routed["invalidated"] = True
        self._log("revoked", jobId=job_id, reason=str(reason)[:120], invalidatedCount=sum(1 for r in self._routed if r["jobId"] == job_id and r["invalidated"]))

    def expire(self, job_id: str, note: str) -> None:
        """Permission/source expiry (system-driven): the interpretation dies quietly."""
        if job_id not in self._owners:
            raise OcrAcceptanceError("Unknown job")
        self._expired[job_id] = str(note)[:120]
        for routed in self._routed:
            if routed["jobId"] == job_id:
                routed["invalidated"] = True
        self._log("expired", jobId=job_id)

    def routed(self) -> list[dict[str, Any]]:
        return deepcopy(self._routed)

    def is_usable(self, job_id: str) -> bool:
        """Current validity of an interpretation (revocation/expiry aware)."""
        return job_id in self._owners and job_id not in self._revoked and job_id not in self._expired

    # -- cross-device recovery ---------------------------------------------------
    def recovery_state(self) -> dict[str, Any]:
        """The durable state a second device rebuilds from the event log."""
        return {
            "contract": ACCEPTANCE_CONTRACT,
            "matrixVersion": self.rollout.snapshot_version(),
            "routedCount": len(self._routed),
            "reviewedCount": len(self._reviewed),
            "revokedCount": len(self._revoked),
        }

    @classmethod
    def replay_state(cls, events: list[dict[str, Any]]) -> dict[str, Any]:
        """Deterministic second-device reconstruction from redacted events."""
        state = {"contract": ACCEPTANCE_CONTRACT, "matrixVersion": RolloutMatrix.VERSION_ONE, "routedCount": 0, "reviewedCount": 0, "revokedCount": 0}
        for event in events:
            if event["type"] == "routed":
                state["routedCount"] += 1
            elif event["type"] == "reviewed":
                state["reviewedCount"] += 1
            elif event["type"] == "revoked":
                state["revokedCount"] += 1
        return state
