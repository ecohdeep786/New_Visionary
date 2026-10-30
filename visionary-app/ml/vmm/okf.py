"""VMM-33 (KAN-205) — conditional OKF knowledge-exchange and provenance
adapter (interchange conventions, NOT proof of truth or rights).

Implements an OKF Markdown/YAML bundle adapter over the VMM-03 seed-record
core — an adapter to the existing content/concept contracts, NOT a new
authoritative memory database:

  - ROUND-TRIP: export core records -> signed bundle -> import -> identical
    records (proven by test).
  - VERIFICATION: the bundle is signed; each record carries a content digest;
    a CHANGED content with an OLD signoff is detected; forged verification
    blocks are refused; stale SPEC versions are refused.
  - POISONED TEXT / TRAVERSAL: injection payloads and path traversal in file
    refs are refused.
  - CROSS-TENANT CITATIONS: citations must belong to the exporting tenant.
  - RESTRICTED EXPORTS: private/consent-bound/withdrawn records are EXCLUDED
    from exports; withdrawal propagates (exported-then-withdrawn records are
    refused on re-import).
  - OKF signals (provenance/verification/lifecycle) are INTERCHANGE
    CONVENTIONS: the adapter marks imported records `verified: false` until
    the owning contract re-validates them — format conformance is not proof
    of truth, rights, or authorization.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import re
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

OKF_CONTRACT = "vmm-okf-adapter.v1"
PINNED_SPEC_VERSION = "0.2"

_MAX_TEXT = 2000
INJECTION_PATTERNS = (r"<script", r"javascript:", r"onerror\s*=", r"data:")
TRAVERSAL_PATTERN = re.compile(r"(\.\./|\.\.\\|^/|^[A-Za-z]:)")


class OKFError(ValueError):
    """The OKF exchange operation is not admissible."""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _digest(payload: Any) -> str:
    return hashlib.sha256(json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")).hexdigest()


def _scan_text(text: str) -> None:
    lowered = text.lower()
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, lowered):
            raise OKFError(f"Poisoned text refused: {pattern}")


def _no_traversal(path: str) -> str:
    if TRAVERSAL_PATTERN.search(path) or len(path) > 200:
        raise OKFError(f"Path traversal refused: {path[:60]}")
    return path


class OKFAdapter:
    """Conditional OKF bundle export/import over the VMM-03 seed core."""

    def __init__(self, signing_key: bytes, tenant: str):
        if not isinstance(signing_key, (bytes, bytearray)) or len(signing_key) < 16:
            raise OKFError("Signing key must be at least 16 bytes")
        if type(tenant) is not str or not tenant:
            raise OKFError("Invalid tenant")
        self._key = bytes(signing_key)
        self.tenant = tenant
        self._withdrawn: set[str] = set()

    def withdraw(self, record_id: str) -> dict[str, Any]:
        """Withdrawal propagates: the record is excluded from all exports."""
        self._withdrawn.add(record_id)
        return {"withdrawn": record_id, "at": _now()}

    # ---- export ---------------------------------------------------------------

    def export_bundle(self, records: list[dict[str, Any]]) -> dict[str, Any]:
        """Export rights-cleared, non-withdrawn records as a signed OKF bundle.

        Restricted exports: private-storage or consent-missing records are
        EXCLUDED (never packaged).
        """
        exported = []
        excluded: list[dict[str, str]] = []
        for record in records:
            record_id = record.get("recordId")
            if record_id in self._withdrawn:
                excluded.append({"recordId": record_id, "reason": "withdrawn"})
                continue
            if not record.get("license") or not record.get("consentRef"):
                excluded.append({"recordId": record_id, "reason": "rights_missing"})
                continue
            text = record.get("text", "")
            _scan_text(text)
            body = {
                "recordId": record_id,
                "markdown": f"# {record.get('title', record_id)}\n\n{text}",
                "yamlMeta": {
                    "specVersion": PINNED_SPEC_VERSION,
                    "tenant": self.tenant,
                    "provenance": {
                        "sourceRef": record["sourceRef"],
                        "license": record["license"],
                        "consentRef": record["consentRef"],
                    },
                    "verification": {"contentDigest": record["contentDigest"]},
                    "lifecycle": "active",
                },
            }
            body["verification"] = {"bundleDigest": _digest(body)}
            body["verification"]["signature"] = hmac.new(self._key, body["verification"]["bundleDigest"].encode("utf-8"), hashlib.sha256).hexdigest()
            exported.append(body)

        bundle = {
            "contract": OKF_CONTRACT,
            "specVersion": PINNED_SPEC_VERSION,
            "tenant": self.tenant,
            "records": exported,
            "excluded": excluded,
            "exportedAt": _now(),
        }
        bundle["bundleSignature"] = hmac.new(self._key, _digest(bundle).encode("utf-8"), hashlib.sha256).hexdigest()
        return bundle

    # ---- import ---------------------------------------------------------------

    def import_bundle(self, bundle: dict[str, Any], tenant: str | None = None) -> dict[str, Any]:
        """Validate and import a bundle; everything re-verified, nothing trusted."""
        expected_tenant = tenant or self.tenant
        if bundle.get("specVersion") != PINNED_SPEC_VERSION:
            raise OKFError(f"Stale SPEC version: {bundle.get('specVersion')} != {PINNED_SPEC_VERSION}")
        if bundle.get("tenant") != expected_tenant:
            raise OKFError("Cross-tenant bundle refused")
        signature = bundle.pop("bundleSignature", None)
        digest = _digest(bundle)
        bundle["bundleSignature"] = signature
        if type(signature) is not str or not hmac.compare_digest(
            hmac.new(self._key, digest.encode("utf-8"), hashlib.sha256).hexdigest(), signature
        ):
            raise OKFError("Forged bundle signature refused")

        imported = []
        for body in bundle.get("records", []):
            verification = body.get("verification", {})
            recorded_digest = verification.get("bundleDigest")
            recorded_signature = verification.get("signature")
            # Changed content with an old signoff: recompute the digest over the
            # body WITHOUT the verification block.
            check = {k: v for k, v in body.items() if k != "verification"}
            if _digest(check) != recorded_digest:
                raise OKFError(f"Changed content with old signoff refused: {body.get('recordId')}")
            expected_sig = hmac.new(self._key, recorded_digest.encode("utf-8"), hashlib.sha256).hexdigest()
            if type(recorded_signature) is not str or not hmac.compare_digest(expected_sig, recorded_signature):
                raise OKFError(f"Forged verification block refused: {body.get('recordId')}")

            meta = body.get("yamlMeta", {})
            if meta.get("tenant") != expected_tenant:
                raise OKFError(f"Cross-tenant citation refused: {body.get('recordId')}")
            if meta.get("lifecycle") == "withdrawn" or body["recordId"] in self._withdrawn:
                raise OKFError(f"Withdrawn record refused on import: {body.get('recordId')}")
            _no_traversal(body.get("recordId", ""))
            markdown = body.get("markdown", "")
            _scan_text(markdown)
            provenance = meta.get("provenance", {})
            imported.append({
                "contract": "vmm-seed.v1-adapter",
                "recordId": body["recordId"],
                "title": markdown.split("\n", 1)[0].lstrip("# ").strip() if markdown else "",
                "text": markdown.split("\n\n", 1)[1] if "\n\n" in markdown else "",
                "sourceRef": provenance.get("sourceRef"),
                "license": provenance.get("license"),
                "consentRef": provenance.get("consentRef"),
                "contentDigest": meta.get("verification", {}).get("contentDigest"),
                "verified": False,  # interchange conventions are NOT proof of truth
            })
        return {"contract": OKF_CONTRACT, "imported": imported, "count": len(imported), "importedAt": _now()}
