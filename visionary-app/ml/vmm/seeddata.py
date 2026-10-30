"""VMM-03 (KAN-171) — versioned rights-cleared seed dataset and
misconception/action ontology.

Core data engineering contracts for the model-building program:

  - The ONTOLOGIES are versioned and append-only: misconception codes and
    pedagogical action codes are registered once and amended by appending a new
    version — earlier versions stay byte-stable. Pedagogical action labels are
    aligned with the VATS L2/L3 strategy set (ml/vats/pedagogy.py).
  - SEED RECORDS are rights-cleared and cohort-gated: license + consent refs are
    mandatory, minors require approved admission, and the registry stores ONLY
    opaque references + content digests — never raw learner text.
  - LABELS ARE SEPARATE BY SCHEMA: pedagogical action labels, general Build
    success and personal preferences live in DISTINCT fields and no function in
    this module derives one from another.
  - LICENSED BENCHMARK EXCLUSIONS are versioned: any record whose content digest
    appears in an excluded benchmark set is refused (contamination guard).
  - SOURCE REVOCATION LINEAGE: revoking a source marks its records untrainable
    (fail closed) with an append-only revocation ledger.
  - OKF INDEPENDENCE: this core schema is authored independently of OKF
    packaging; KAN-205 is an adapter that reads this core, never a source of
    rights.

Composes the VMM-02 supply-chain controls (ml/vmm/supplychain.py): the dataset
registers as a signed manifest whose lineage points at its source artifacts.
"""
from __future__ import annotations

import hashlib
import json
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

from vmm.supplychain import build_manifest, sign_manifest, verify_signature

SEED_CONTRACT = "vmm-seed.v1"
MODES = ("learn", "build")
ROLES = ("student", "teacher", "parent", "professional", "organization")
AGE_GROUPS = ("child", "minor", "adult")

_MAX_TEXT = 160
_MAX_LABELS = 8


class SeedError(ValueError):
    """The seed record / ontology / dataset is not admissible."""


class ContaminationError(ValueError):
    """A record's content matches a licensed benchmark exclusion."""


def _text(value: Any, field: str, maximum: int = _MAX_TEXT) -> str:
    if type(value) is not str or not value.strip() or len(value) > maximum:
        raise SeedError(f"Invalid {field}")
    return value


def _digest(value: Any, field: str) -> str:
    if type(value) is not str or len(value) != 64:
        raise SeedError(f"Invalid {field} digest")
    try:
        int(value, 16)
    except ValueError as exc:
        raise SeedError(f"Invalid {field} digest") from exc
    return value.lower()


def content_digest(content: bytes) -> str:
    """SHA-256 of the exact source content the record points at."""
    if not isinstance(content, (bytes, bytearray)):
        raise SeedError("Content must be bytes")
    return hashlib.sha256(bytes(content)).hexdigest()


def _iso(value: Any) -> str:
    if type(value) is not str or len(value) > 40:
        raise SeedError("Invalid timestamp")
    try:
        datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise SeedError("Invalid timestamp") from exc
    return value


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# --------------------------------------------------------------------------- #
# Versioned ontologies (append-only; earlier versions byte-stable)
# --------------------------------------------------------------------------- #

class VersionedOntology:
    """Append-only versioned code registry (misconceptions or actions)."""

    def __init__(self, ontology_id: str, prefix: str):
        self.ontology_id = _text(ontology_id, "ontology id", 80)
        self.prefix = _text(prefix, "prefix", 16)
        self._versions: list[dict[str, Any]] = []

    def _append_version(self, entries: list[dict[str, str]]) -> None:
        snapshot = {
            "ontologyId": self.ontology_id,
            "version": len(self._versions) + 1,
            "entries": [dict(e) for e in entries],
            "appendedAt": _now(),
        }
        self._versions.append(snapshot)

    def register(self, label: str, definition: str) -> dict[str, str]:
        """Append an entry; produces the NEXT version (never rewrites history)."""
        label = _text(label, "label")
        definition = _text(definition, "definition", 400)
        current = self._versions[-1] if self._versions else {"entries": []}
        code = f"{self.prefix}-{len(current['entries']) + 1:03d}"
        if any(e["code"] == code for e in current["entries"]):
            raise SeedError("Duplicate ontology code")
        entry = {"code": code, "label": label, "definition": definition}
        self._append_version(current["entries"] + [entry])
        return entry

    def version(self, number: int | None = None) -> dict[str, Any]:
        """Byte-stable snapshot of one version (default: latest)."""
        if number is None:
            number = len(self._versions)
        if type(number) is not int or not 1 <= number <= len(self._versions):
            raise SeedError("Unknown ontology version")
        return deepcopy(self._versions[number - 1])

    def codes(self, number: int | None = None) -> frozenset[str]:
        return frozenset(e["code"] for e in self.version(number)["entries"])

    def known(self, code: str, number: int | None = None) -> bool:
        return code in self.codes(number)


# --------------------------------------------------------------------------- #
# Seed records (rights-cleared; labels separate by schema)
# --------------------------------------------------------------------------- #

RECORD_FIELDS = frozenset({
    "contract", "recordId", "datasetId", "datasetVersion",
    "mode", "cohort", "locale", "sourceRef", "license", "consentRef",
    "contentDigest", "misconceptionLabels", "pedagogicalAction",
    "buildOutcome", "preferenceSignals", "recordedAt",
})


def build_record(
    record_id: str,
    dataset_id: str,
    dataset_version: int,
    mode: str,
    role: str,
    age_group: str,
    admission_approved: bool,
    language: str,
    script: str,
    source_ref: str,
    license: str,
    consent_ref: str,
    content_digest: str,
    misconception_ontology: VersionedOntology,
    action_ontology: VersionedOntology,
    misconception_labels: list[str] | None = None,
    pedagogical_action: str | None = None,
    build_outcome: dict[str, Any] | None = None,
    preference_signals: dict[str, Any] | None = None,
    recorded_at: str | None = None,
) -> dict[str, Any]:
    """Validate one seed record (fail closed). Labels are NEVER derived here."""
    _text(record_id, "record id", 80)
    _text(dataset_id, "dataset id", 80)
    if type(dataset_version) is not int or dataset_version < 1:
        raise SeedError("Invalid dataset version")
    if mode not in MODES:
        raise SeedError("Invalid mode")
    if role not in ROLES:
        raise SeedError("Invalid cohort role")
    if age_group not in AGE_GROUPS:
        raise SeedError("Invalid age group")
    if age_group in ("child", "minor") and admission_approved is not True:
        raise SeedError("Minor cohorts require approved admission")
    _text(language, "language", 32)
    _text(script, "script", 32)
    _text(source_ref, "source ref", 120)
    _text(license, "license")
    _text(consent_ref, "consent ref", 120)
    _digest(content_digest, "content")

    labels = list(misconception_labels or [])
    if len(labels) > _MAX_LABELS:
        raise SeedError("Too many misconception labels")
    known_mc = misconception_ontology.known
    for code in labels:
        if not known_mc(code):
            raise SeedError(f"Unknown misconception code: {code}")

    if pedagogical_action is not None and not action_ontology.known(pedagogical_action):
        raise SeedError(f"Unknown pedagogical action: {pedagogical_action}")

    if build_outcome is not None:
        if type(build_outcome) is not dict or set(build_outcome) != {"successful", "criteriaRef"}:
            raise SeedError("Invalid buildOutcome fields")
        if type(build_outcome["successful"]) is not bool:
            raise SeedError("buildOutcome.successful must be a bool")
    if preference_signals is not None and type(preference_signals) is not dict:
        raise SeedError("Invalid preferenceSignals")

    return {
        "contract": SEED_CONTRACT,
        "recordId": record_id,
        "datasetId": dataset_id,
        "datasetVersion": dataset_version,
        "mode": mode,
        "cohort": {"role": role, "ageGroup": age_group, "admissionApproved": admission_approved},
        "locale": {"language": language, "script": script},
        "sourceRef": source_ref,
        "license": license,
        "consentRef": consent_ref,
        "contentDigest": content_digest,
        "misconceptionLabels": labels,
        "pedagogicalAction": pedagogical_action,
        "buildOutcome": deepcopy(build_outcome) if build_outcome is not None else None,
        "preferenceSignals": deepcopy(preference_signals) if preference_signals is not None else None,
        "recordedAt": _iso(recorded_at or _now()),
    }


# --------------------------------------------------------------------------- #
# Licensed benchmark exclusions (contamination guard)
# --------------------------------------------------------------------------- #

class BenchmarkExclusions:
    """Versioned registry of licensed benchmark content that must NEVER enter training data."""

    def __init__(self):
        self._versions: list[dict[str, Any]] = [{"exclusions": [], "version": 1, "appendedAt": _now()}]

    def exclude(self, name: str, license: str, digests: list[str]) -> int:
        name = _text(name, "benchmark name", 80)
        _text(license, "benchmark license")
        clean = [_digest(d, "benchmark") for d in digests]
        current = self._versions[-1]
        if any(e["name"] == name for e in current["exclusions"]):
            raise SeedError("Benchmark already excluded")
        self._versions.append({
            "version": len(self._versions) + 1,
            "exclusions": current["exclusions"] + [{"name": name, "license": license, "digests": clean}],
            "appendedAt": _now(),
        })
        return len(self._versions)

    def version(self, number: int | None = None) -> dict[str, Any]:
        if number is None:
            number = len(self._versions)
        if type(number) is not int or not 1 <= number <= len(self._versions):
            raise SeedError("Unknown exclusion version")
        return deepcopy(self._versions[number - 1])

    def all_digests(self) -> frozenset[str]:
        blocked: set[str] = set()
        for entry in self.version()["exclusions"]:
            blocked.update(entry["digests"])
        return frozenset(blocked)


def assert_no_benchmark_contamination(records: list[dict[str, Any]], exclusions: BenchmarkExclusions) -> dict[str, Any]:
    """Refuse the dataset if any record's content digest is benchmark-excluded."""
    blocked = exclusions.all_digests()
    contaminated = sorted(r["recordId"] for r in records if r["contentDigest"] in blocked)
    if contaminated:
        raise ContaminationError(f"Benchmark-contaminated records: {', '.join(contaminated)}")
    return {"checked": len(records), "contaminated": 0, "ok": True}


# --------------------------------------------------------------------------- #
# Dataset registry (revocation lineage + supply-chain manifest integration)
# --------------------------------------------------------------------------- #

class SeedDatasetRegistry:
    """Holds validated records; revoking a source makes its records untrainable."""

    def __init__(self, dataset_id: str, dataset_version: int):
        self.dataset_id = _text(dataset_id, "dataset id", 80)
        self.dataset_version = dataset_version
        self._records: list[dict[str, Any]] = []
        self._revocations: list[dict[str, Any]] = []

    def add(self, record: dict[str, Any]) -> dict[str, Any]:
        if record.get("contract") != SEED_CONTRACT:
            raise SeedError("Not a VMM seed record")
        if record["datasetId"] != self.dataset_id or record["datasetVersion"] != self.dataset_version:
            raise SeedError("Record belongs to a different dataset version")
        if any(r["recordId"] == record["recordId"] for r in self._records):
            raise SeedError("Duplicate record id")
        self._records.append(deepcopy(record))
        return deepcopy(record)

    def records(self) -> list[dict[str, Any]]:
        return [deepcopy(r) for r in self._records]

    def revoke_source(self, source_ref: str, reason: str) -> dict[str, Any]:
        """Append-only revocation ledger; affected records become untrainable."""
        _text(source_ref, "source ref", 120)
        _text(reason, "revocation reason", 400)
        if any(r["sourceRef"] == source_ref for r in self._revocations):
            raise SeedError("Source already revoked")
        affected = sorted(r["recordId"] for r in self._records if r["sourceRef"] == source_ref)
        entry = {"sourceRef": source_ref, "reason": reason, "affectedRecords": affected, "revokedAt": _now()}
        self._revocations.append(entry)
        return deepcopy(entry)

    def revocations(self) -> list[dict[str, Any]]:
        return [deepcopy(r) for r in self._revocations]

    def trainable_records(self) -> list[dict[str, Any]]:
        """Fail closed: records from revoked sources are never trainable."""
        revoked = {r["sourceRef"] for r in self._revocations}
        return [deepcopy(r) for r in self._records if r["sourceRef"] not in revoked]

    def dataset_manifest(self, producer: str, signing_key: bytes, source_manifests: list[dict[str, Any]] | None = None):
        """Register this dataset version as a signed VMM-02 manifest.

        The manifest digest binds the EXACT canonical record set; lineage points
        at the source artifacts that produced it.
        """
        payload = json.dumps(
            sorted(json.dumps(r, sort_keys=True, separators=(",", ":"), ensure_ascii=False) for r in self._records),
            separators=(",", ":"),
        ).encode("utf-8")
        digest = hashlib.sha256(payload).hexdigest()
        manifest = build_manifest(
            kind="dataset",
            artifact_id=self.dataset_id,
            version=self.dataset_version,
            digest=digest,
            producer=producer,
            license="record-level-licenses",
            storage_class="private",
            lineage=[{"id": m["id"], "digest": m["digest"]} for m in (source_manifests or [])],
        )
        signature = sign_manifest(manifest, signing_key)
        return {"manifest": manifest, "signature": signature, "recordCount": len(self._records)}

    @staticmethod
    def verify_dataset_manifest(signed: dict[str, Any], signing_key: bytes) -> bool:
        return verify_signature(signed["manifest"], signed["signature"], signing_key)
