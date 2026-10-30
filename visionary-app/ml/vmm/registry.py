"""VMM-10 (KAN-178) — private model registry: provenance, version pinning,
approval and rollback controls.

The serving-side control plane over the VMM-02 signing fabric and the VMM-09
evaluation verdicts:

  - REGISTRATION: manifests are validated (VMM-02 schema), signature-verified,
    lineage-checked across the registered set, and IMMUTABLE — the same
    id+version re-registers only with the identical digest; a different digest
    for an existing id+version is refused.
  - ARTIFACT VAULT: actual artifact bytes attach under the manifest's exact
    digest (wrong bytes refused) and are access-controlled — consumers can read
    manifests of internal/public artifacts but NEVER private artifact bytes.
  - DETERMINISTIC PINNING: consumers pin an EXACT version; there is no
    floating-latest resolve. The pinned token is deterministic
    (modelId+version+digest) and resolve returns exactly that manifest.
  - APPROVAL: a version becomes deployable only with an explicit custodian
    approval bound to an accepted VMM-09 evaluation report (modelAccepted, zero
    model safety failures). Wrong rights/approval are rejected.
  - ROLLBACK: deterministic pointer change to an EARLIER APPROVED version;
    rolling forward to an unapproved version is refused. Rollback changes only
    the served pin — user records are untouched (the registry exposes no
    user-record mutation at all).
  - INDEPENDENT VERIFICATION: anyone can verify an artifact against its
    registered manifest (digest + signature + lineage) without trusting the
    registry operator.
"""
from __future__ import annotations

import hashlib
import json
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

from vmm.supplychain import authorize_read, verify_lineage, verify_signature

REGISTRY_CONTRACT = "vmm-registry.v1"


class RegistryError(ValueError):
    """The registry operation is not admissible."""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _digest(payload: Any) -> str:
    return hashlib.sha256(json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")).hexdigest()


class ModelRegistry:
    def __init__(self, signing_key: bytes):
        if not isinstance(signing_key, (bytes, bytearray)) or len(signing_key) < 16:
            raise RegistryError("Registry signing key must be at least 16 bytes")
        self._key = bytes(signing_key)
        self._manifests: dict[tuple[str, int], dict[str, Any]] = {}
        self._signatures: dict[tuple[str, int], str] = {}
        self._artifacts: dict[tuple[str, int], bytes] = {}
        self._approvals: dict[tuple[str, int], dict[str, Any]] = {}
        self._served: dict[str, int] = {}

    # ---- registration -------------------------------------------------------

    def register(self, manifest: dict[str, Any], signature: str) -> dict[str, Any]:
        if manifest.get("contract") != "vmm-supplychain.v1":
            raise RegistryError("Not a VMM supply-chain manifest")
        # Signature FIRST — even a re-submission with mutated fields and an old
        # signature must be refused before any immutability shortcut.
        if not verify_signature(manifest, signature, self._key):
            raise RegistryError("Signature verification failed")
        key = (manifest["id"], manifest["version"])
        if key in self._manifests:
            # Signature is already verified above; idempotency binds to the
            # artifact digest (manifest metadata like timestamps may differ).
            if self._manifests[key]["digest"] == manifest["digest"]:
                return {"registered": True, "idempotent": True}
            raise RegistryError("Immutable: this id+version is already registered with a different digest")
        try:
            verify_lineage(list(self._manifests.values()) + [manifest])
        except Exception as exc:  # lineage breach
            raise RegistryError(f"Lineage verification failed: {exc}") from exc
        self._manifests[key] = deepcopy(manifest)
        self._signatures[key] = signature
        return {"registered": True, "idempotent": False, "id": manifest["id"], "version": manifest["version"]}

    def attach_artifact(self, actor: dict[str, Any], model_id: str, version: int, artifact_bytes: bytes) -> dict[str, Any]:
        """Attach the REAL artifact bytes under the exact registered digest (owner-only)."""
        if actor.get("role") != "owner":
            raise RegistryError("Only the owner may attach artifact bytes")
        key = (model_id, version)
        manifest = self._manifests.get(key)
        if manifest is None:
            raise RegistryError("Attach requires a registered manifest")
        if hashlib.sha256(artifact_bytes).hexdigest() != manifest["digest"]:
            raise RegistryError("Artifact bytes do not match the registered digest")
        self._artifacts[key] = bytes(artifact_bytes)
        return {"attached": True, "id": model_id, "version": version, "sizeBytes": len(artifact_bytes)}

    # ---- deterministic pinning ----------------------------------------------

    def pin(self, actor: dict[str, Any], model_id: str, version: int) -> dict[str, Any]:
        """Pin an EXACT version (no floating latest exists in this contract)."""
        key = (model_id, version)
        manifest = self._manifests.get(key)
        if manifest is None:
            raise RegistryError("Cannot pin an unregistered version")
        # Pinning selects an exact version (metadata only); content reads stay
        # access-controlled in load_artifact.
        return {"pinnedModel": model_id, "pinnedVersion": version, "digest": manifest["digest"], "pinToken": _digest({"id": model_id, "version": version, "digest": manifest["digest"]})}

    def resolve(self, pin_token: dict[str, Any]) -> dict[str, Any]:
        """Resolve a pinned token to exactly that manifest (deterministic)."""
        expected = _digest({"id": pin_token["pinnedModel"], "version": pin_token["pinnedVersion"], "digest": pin_token["digest"]})
        if expected != pin_token["pinToken"]:
            raise RegistryError("Pin token does not match its contents")
        manifest = self._manifests.get((pin_token["pinnedModel"], pin_token["pinnedVersion"]))
        if manifest is None or manifest["digest"] != pin_token["digest"]:
            raise RegistryError("Pinned version no longer matches the registry")
        return deepcopy(manifest)

    def load_artifact(self, actor: dict[str, Any], pin_token: dict[str, Any]) -> bytes:
        """Access-controlled artifact read: consumers never read private bytes."""
        manifest = self.resolve(pin_token)
        authorize_read(actor.get("role"), manifest)
        key = (manifest["id"], manifest["version"])
        if key not in self._artifacts:
            raise RegistryError("Artifact bytes not attached")
        return self._artifacts[key]

    # ---- approval + deployment status ----------------------------------------

    def attach_approval(self, custodian: dict[str, Any], model_id: str, version: int, evaluation_report: dict[str, Any]) -> dict[str, Any]:
        """Approval binds an ACCEPTED VMM-09 report (modelAccepted, zero model
        safety failures). Wrong rights or a failed report are rejected."""
        if custodian.get("role") != "custodian":
            raise RegistryError("Only the custodian may attach an approval")
        key = (model_id, version)
        if key not in self._manifests:
            raise RegistryError("Approval requires a registered version")
        if not evaluation_report.get("modelAccepted"):
            raise RegistryError("Evaluation report does not accept the model")
        if evaluation_report.get("modelSafetyFailuresCount", 1) != 0:
            raise RegistryError("Evaluation report carries model safety failures")
        approval = {
            "approvedBy": custodian.get("uid"),
            "reportDigest": _digest(evaluation_report),
            "approvedAt": _now(),
        }
        self._approvals[key] = approval
        return deepcopy(approval)

    def deployment_status(self, model_id: str, version: int) -> dict[str, Any]:
        key = (model_id, version)
        if key not in self._manifests:
            return {"status": "not_registered"}
        try:
            verify_lineage(list(self._manifests.values()))
            lineage_ok = True
        except Exception:
            lineage_ok = False
        if key in self._approvals and lineage_ok:
            return {"status": "approved", "approval": deepcopy(self._approvals[key])}
        return {"status": "registered", "approved": False, "lineageOk": lineage_ok}

    # ---- rollback --------------------------------------------------------------

    def set_served(self, actor: dict[str, Any], model_id: str, version: int) -> dict[str, Any]:
        """Point serving at an APPROVED version (owner-only)."""
        if actor.get("role") != "owner":
            raise RegistryError("Only the owner may change the served pin")
        status = self.deployment_status(model_id, version)
        if status["status"] != "approved":
            raise RegistryError("Serving requires an approved version")
        self._served[model_id] = version
        return {"servedVersion": version, "userRecordsChanged": False, "note": "Rollback changes only the served model pin; user records are untouched."}

    def rollback(self, actor: dict[str, Any], model_id: str, from_version: int, to_version: int) -> dict[str, Any]:
        """Deterministic rollback to an earlier APPROVED version (refuses forward)."""
        if to_version >= from_version:
            raise RegistryError("Rollback must target an EARLIER version")
        receipt = self.set_served(actor, model_id, to_version)
        return {"rolledBackFrom": from_version, **receipt, "servedVersion": to_version}

    def served_version(self, model_id: str) -> int | None:
        return self._served.get(model_id)

    # ---- independent verification -----------------------------------------------

    def provenance(self, model_id: str, version: int) -> dict[str, Any]:
        """Full lineage walk (dataset -> ... -> model) with digests."""
        key = (model_id, version)
        chain = []
        current = self._manifests.get(key)
        while current is not None:
            chain.append({"id": current["id"], "version": current["version"], "digest": current["digest"], "kind": current["kind"]})
            parent = current["lineage"][0] if current["lineage"] else None
            current = next((m for m in self._manifests.values() if m["id"] == parent["id"]), None) if parent else None
        return {"contract": REGISTRY_CONTRACT, "chain": chain}

    def verify_artifact(self, model_id: str, version: int, artifact_bytes: bytes) -> dict[str, Any]:
        """Independent verification: digest + signature + lineage, no operator trust."""
        key = (model_id, version)
        manifest = self._manifests.get(key)
        if manifest is None:
            raise RegistryError("Version not registered")
        digest_ok = hashlib.sha256(artifact_bytes).hexdigest() == manifest["digest"]
        signature_ok = verify_signature(manifest, self._signatures[key], self._key)
        try:
            verify_lineage(list(self._manifests.values()))
            lineage_ok = True
        except Exception:
            lineage_ok = False
        return {"digestOk": digest_ok, "signatureOk": signature_ok, "lineageOk": lineage_ok, "verified": digest_ok and signature_ok and lineage_ok}
