"""VMM-02 (KAN-170) — private-model supply-chain security contracts.

Manifest integrity, signing, provenance lineage and registry access control
for private training data, model artifacts and evaluation corpora. Stdlib-only
(HMAC-SHA256 over canonical JSON) so verification needs no third-party
dependency at admission time.

This module is a CONTROL PLANE, not a model: it never trains, scores or
serves. Storage/admission backends implement these seams at integration.
"""
from __future__ import annotations

import hashlib
import hmac
import json
from datetime import datetime, timezone
from typing import Any

CONTRACT = "vmm-supplychain.v1"

ARTIFACT_KINDS = ("dataset", "model", "evaluation", "code", "prompt")
STORAGE_CLASSES = ("private", "internal", "public")
ROLES = ("owner", "reviewer", "consumer")

_MAX_ID = 120
_MAX_TEXT = 256
_MAX_LINEAGE = 64


class ManifestError(ValueError):
    """The artifact manifest is not admissible into the registry."""


class LineageError(ValueError):
    """The provenance chain is broken: a parent is missing or its digest moved."""


class AccessDenied(PermissionError):
    """The role may not read this artifact under the registry policy."""


def _bounded_text(value: Any, field: str, maximum: int = _MAX_TEXT) -> str:
    if type(value) is not str or not value.strip() or len(value) > maximum:
        raise ManifestError(f"Invalid {field}")
    return value


def _hex_digest(value: Any, field: str) -> str:
    if type(value) is not str or len(value) != 64:
        raise ManifestError(f"Invalid {field} digest")
    try:
        int(value, 16)
    except ValueError as exc:
        raise ManifestError(f"Invalid {field} digest") from exc
    return value.lower()


def artifact_digest(content: bytes) -> str:
    """SHA-256 of the exact artifact bytes (the manifest binds this digest)."""
    if not isinstance(content, (bytes, bytearray)):
        raise ManifestError("Artifact content must be bytes")
    return hashlib.sha256(bytes(content)).hexdigest()


def _iso(value: Any) -> str:
    if type(value) is not str or len(value) > 40:
        raise ManifestError("Invalid created timestamp")
    try:
        datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ManifestError("Invalid created timestamp") from exc
    return value


def build_manifest(
    kind: str,
    artifact_id: str,
    version: int,
    digest: str,
    producer: str,
    license: str,
    storage_class: str,
    lineage: list[dict[str, str]] | None = None,
    created: str | None = None,
    notes: str = "",
) -> dict[str, Any]:
    """Validate and normalize one registry manifest (fail closed)."""
    if kind not in ARTIFACT_KINDS:
        raise ManifestError("Invalid artifact kind")
    _bounded_text(artifact_id, "artifact id", _MAX_ID)
    if type(version) is not int or not 1 <= version <= 9007199254740991:
        raise ManifestError("Invalid artifact version")
    _hex_digest(digest, "artifact")
    _bounded_text(producer, "producer")
    _bounded_text(license, "license")
    if storage_class not in STORAGE_CLASSES:
        raise ManifestError("Invalid storage class")
    if not isinstance(notes, str) or len(notes) > 512:
        raise ManifestError("Invalid notes")
    clean_lineage: list[dict[str, str]] = []
    for parent in lineage or []:
        if type(parent) is not dict or set(parent) != {"id", "digest"}:
            raise ManifestError("Invalid lineage parent fields")
        clean_lineage.append({"id": _bounded_text(parent["id"], "parent id", _MAX_ID), "digest": _hex_digest(parent["digest"], "parent")})
    if len(clean_lineage) > _MAX_LINEAGE:
        raise ManifestError("Too many lineage parents")
    manifest = {
        "contract": CONTRACT,
        "kind": kind,
        "id": artifact_id,
        "version": version,
        "digest": digest.lower(),
        "producer": producer,
        "license": license,
        "storageClass": storage_class,
        "lineage": clean_lineage,
        "created": _iso(created or datetime.now(timezone.utc).isoformat()),
        "notes": notes,
    }
    return manifest


def canonical(manifest: dict[str, Any]) -> bytes:
    """Canonical JSON bytes (sorted keys, no whitespace) — the signing basis."""
    if type(manifest) is not dict or manifest.get("contract") != CONTRACT:
        raise ManifestError("Not a VMM supply-chain manifest")
    return json.dumps(manifest, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def sign_manifest(manifest: dict[str, Any], key: bytes) -> str:
    """HMAC-SHA256 over the canonical manifest (key lives in ignored config)."""
    if not isinstance(key, (bytes, bytearray)) or len(key) < 16:
        raise ManifestError("Signing key must be at least 16 bytes")
    return hmac.new(bytes(key), canonical(manifest), hashlib.sha256).hexdigest()


def verify_signature(manifest: dict[str, Any], signature: str, key: bytes) -> bool:
    """Constant-time signature check; any manifest field change breaks it."""
    if type(signature) is not str or len(signature) != 64:
        return False
    expected = sign_manifest(manifest, key)
    return hmac.compare_digest(expected, signature)


def verify_lineage(registry: list[dict[str, Any]]) -> dict[str, Any]:
    """Every parent must exist in the registry with the exact recorded digest."""
    if not isinstance(registry, list):
        raise LineageError("Registry must be a list of manifests")
    for manifest in registry:
        if type(manifest) is not dict or manifest.get("contract") != CONTRACT:
            raise LineageError("Registry contains a non-VMM manifest")
    checked = 0
    for manifest in registry:
        for parent in manifest["lineage"]:
            parent_manifest = next((m for m in registry if m["id"] == parent["id"]), None)
            if parent_manifest is None:
                raise LineageError(f"Missing lineage parent: {parent['id']}")
            if parent_manifest["digest"] != parent["digest"]:
                raise LineageError(f"Lineage digest moved for parent: {parent['id']}")
            checked += 1
    return {"contract": CONTRACT, "artifacts": len(registry), "lineageEdgesChecked": checked, "ok": True}


def authorize_read(role: str, manifest: dict[str, Any]) -> dict[str, Any]:
    """Registry read policy: private artifacts never reach consumers."""
    if role not in ROLES:
        raise AccessDenied("Unknown registry role")
    if manifest.get("contract") != CONTRACT:
        raise AccessDenied("Not a VMM supply-chain manifest")
    storage_class = manifest["storageClass"]
    if storage_class == "private" and role == "consumer":
        raise AccessDenied("Private artifacts are not readable by consumers")
    if storage_class == "private" and role not in ("owner", "reviewer"):
        raise AccessDenied("Private artifacts require owner or reviewer role")
    return {"role": role, "artifactId": manifest["id"], "storageClass": storage_class, "allowed": True}


THREAT_CATALOG = [
    {
        "id": "T1",
        "name": "Dataset poisoning",
        "surface": "training-data ingestion",
        "control": "manifest digest binding + license/consent fields + lineage to rights-cleared sources",
        "implementedBy": "build_manifest / verify_lineage",
    },
    {
        "id": "T2",
        "name": "Artifact tampering / substitution",
        "surface": "model + evaluation artifact storage",
        "control": "SHA-256 content digest + HMAC signature over canonical manifest",
        "implementedBy": "artifact_digest / sign_manifest / verify_signature",
    },
    {
        "id": "T3",
        "name": "Credential or private-data leakage via repository",
        "surface": "working tree and public git history",
        "control": "exposure inventory with path-pattern classification (evidence, not assumption)",
        "implementedBy": "exposure.scan_tree",
    },
    {
        "id": "T4",
        "name": "Registry over-read (private training data exposure)",
        "surface": "artifact registry access",
        "control": "role-based read policy; consumers never read private artifacts",
        "implementedBy": "authorize_read",
    },
    {
        "id": "T5",
        "name": "Provenance forgery (unclear lineage)",
        "surface": "derived artifacts (checkpoints, eval sets)",
        "control": "lineage edges must resolve to registered parents with exact digests",
        "implementedBy": "verify_lineage",
    },
    {
        "id": "T6",
        "name": "Dependency supply-chain compromise",
        "surface": "pinned ml/upstream + build tooling",
        "control": "verify pinned upstream against recorded provenance; no runtime dependency for verification (stdlib-only)",
        "implementedBy": "stdlib-only contract + pinned upstream provenance",
    },
    {
        "id": "T7",
        "name": "Model theft / uncontrolled redistribution",
        "surface": "model artifact egress",
        "control": "storage class + license fields gate egress; owner decision on visibility recorded in the manifest",
        "implementedBy": "build_manifest storageClass/license + authorize_read",
    },
]
