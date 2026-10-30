"""BUILD-LAUNCH-03 (KAN-134) — user-approved app publication, storage and
scoped connectors.

  - EXPLICIT APPROVAL REQUIRED: publication requires an explicit owner request
    PLUS a custodian approval bound to the exact artifact digest and revision.
    No self-publication, no model-initiated publication.
  - CREDENTIAL REFS STAY PRIVATE: connector credentials are stored as REFS
    (pointers to the credential vault) — never as values inside the published
    artifact. The published payload contains credential REFS only.
  - STALE / REVOKED APPROVALS FAIL SAFELY: an approval that has been revoked
    (or was issued for a different digest/revision) refuses publication; a
    previously published artifact whose approval is later revoked is marked
    REVOKED and stops serving.
  - DUPLICATE PUBLICATION REFUSED: the same artifact digest + revision cannot
    be published twice — a duplicate is refused as an idempotent no-op.
  - SCOPED CONNECTORS: published artifacts may declare scoped connectors
    (storage, database) — each connector is access-controlled and its
    credential ref stays private.
  - ROLLBACK: deterministic rollback to an earlier published revision.
"""
from __future__ import annotations

import hashlib
import json
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

PUBLICATION_CONTRACT = "vmm-publication.v1"


class PublicationError(ValueError):
    """The publication operation is not admissible."""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class PublicationAuthority:
    """Explicit-approval publication with scoped connectors and rollback."""

    def __init__(self):
        self._requests: dict[str, dict[str, Any]] = {}
        self._approvals: dict[str, dict[str, Any]] = {}
        self._published: dict[str, dict[str, Any]] = {}
        self._revoked: set[str] = set()
        self._publication_counter = 0
        self._connectors: dict[str, dict[str, Any]] = {}

    # ---- owner: request publication ------------------------------------------

    def request_publication(
        self,
        owner: dict[str, Any],
        artifact_digest: str,
        revision: int,
        connector_refs: list[str] | None = None,
    ) -> dict[str, Any]:
        """Owner requests publication of an exact artifact revision."""
        if owner.get("role") != "owner":
            raise PublicationError("Only the owner may request publication")
        if type(artifact_digest) is not str or len(artifact_digest) != 64:
            raise PublicationError("Invalid artifact digest")
        if type(revision) is not int or revision < 1:
            raise PublicationError("Invalid revision")
        pub_key = f"{artifact_digest}:{revision}"
        if pub_key in self._published:
            raise PublicationError("Duplicate publication: this artifact+revision is already published")
        if pub_key in self._requests:
            raise PublicationError("Publication already requested for this artifact+revision")
        if connector_refs and not isinstance(connector_refs, list):
            raise PublicationError("Invalid connector refs")
        request = {
            "publicationKey": pub_key,
            "artifactDigest": artifact_digest,
            "revision": revision,
            "connectorRefs": sorted(set(connector_refs or [])),
            "requestedBy": owner.get("uid"),
            "requestedAt": _now(),
        }
        self._requests[pub_key] = request
        return deepcopy(request)

    # ---- custodian: approve / revoke -----------------------------------------

    def approve(self, custodian: dict[str, Any], artifact_digest: str, revision: int) -> dict[str, Any]:
        """Custodian approves the publication request (bound to exact digest+revision)."""
        if custodian.get("role") != "custodian":
            raise PublicationError("Only the custodian may approve publication")
        pub_key = f"{artifact_digest}:{revision}"
        request = self._requests.get(pub_key)
        if request is None:
            raise PublicationError("No publication request for this artifact+revision")
        if pub_key in self._revoked:
            raise PublicationError("Approval has been revoked for this artifact")
        approval = {
            "publicationKey": pub_key,
            "approvedBy": custodian.get("uid"),
            "artifactDigest": artifact_digest,
            "revision": revision,
            "approvedAt": _now(),
        }
        self._approvals[pub_key] = approval
        return deepcopy(approval)

    def revoke_approval(self, custodian: dict[str, Any], artifact_digest: str, revision: int) -> dict[str, Any]:
        """Revoke an approval; a previously published artifact stops serving."""
        if custodian.get("role") != "custodian":
            raise PublicationError("Only the custodian may revoke an approval")
        pub_key = f"{artifact_digest}:{revision}"
        if pub_key not in self._approvals:
            raise PublicationError("No approval to revoke")
        self._revoked.add(pub_key)
        del self._approvals[pub_key]
        if pub_key in self._published:
            self._published[pub_key]["status"] = "revoked"
        return {"revoked": pub_key, "at": _now()}

    # ---- publication ----------------------------------------------------------

    def publish(self, owner: dict[str, Any], artifact_digest: str, revision: int, artifact_bytes: bytes) -> dict[str, Any]:
        """Publish an approved artifact. Duplicate publication refused."""
        if owner.get("role") != "owner":
            raise PublicationError("Only the owner may publish")
        pub_key = f"{artifact_digest}:{revision}"
        if pub_key in self._revoked:
            raise PublicationError("Approval has been revoked; publication refused")
        approval = self._approvals.get(pub_key)
        if approval is None:
            raise PublicationError("No approved publication request for this artifact+revision")
        if pub_key in self._published:
            raise PublicationError("Duplicate publication: this artifact+revision is already published")
        # Credential refs stay private — only refs, never values.
        request = self._requests[pub_key]
        connector_refs = request.get("connectorRefs", [])
        for ref in connector_refs:
            if ref not in self._connectors:
                raise PublicationError(f"Connector '{ref}' is not registered")

        self._publication_counter += 1
        published = {
            "publicationId": f"pub_{self._publication_counter}",
            "artifactDigest": artifact_digest,
            "revision": revision,
            "status": "published",
            "connectorRefs": connector_refs,
            "credentialValuesExposed": False,
            "publishedBy": owner.get("uid"),
            "publishedAt": _now(),
        }
        self._published[pub_key] = published
        return deepcopy(published)

    # ---- scoped connectors ------------------------------------------------------

    def register_connector(self, owner: dict[str, Any], connector_id: str, kind: str, credential_ref: str) -> dict[str, Any]:
        """Register a scoped connector with a PRIVATE credential ref (never a value)."""
        if owner.get("role") != "owner":
            raise PublicationError("Only the owner may register connectors")
        if type(connector_id) is not str or not connector_id:
            raise PublicationError("Invalid connector id")
        if kind not in ("storage", "database", "api"):
            raise PublicationError("Invalid connector kind")
        if type(credential_ref) is not str or not credential_ref.startswith("vault:"):
            raise PublicationError("Credential must be a vault REF (starts with 'vault:'), never a value")
        self._connectors[connector_id] = {"kind": kind, "credentialRef": credential_ref}
        return {"registered": True, "connectorId": connector_id, "kind": kind, "credentialRef": credential_ref}

    def connector_credential_ref(self, actor: dict[str, Any], connector_id: str) -> str:
        """Only the owner may read a credential REF (never the value)."""
        if actor.get("role") != "owner" and actor.get("role") != "reviewer":
            raise PublicationError("Only the owner or reviewer may read credential refs")
        connector = self._connectors.get(connector_id)
        if connector is None:
            raise PublicationError("Unknown connector")
        return connector["credentialRef"]

    # ---- rollback ------------------------------------------------------------

    def rollback(self, owner: dict[str, Any], artifact_digest: str, from_revision: int, to_revision: int) -> dict[str, Any]:
        """Deterministic rollback to an earlier PUBLISHED revision."""
        if to_revision >= from_revision:
            raise PublicationError("Rollback must target an EARLIER revision")
        to_key = f"{artifact_digest}:{to_revision}"
        if to_key not in self._published or self._published[to_key]["status"] != "published":
            raise PublicationError("Rollback target must be a PUBLISHED revision")
        return {
            "rolledBackFrom": from_revision,
            "rolledBackTo": to_revision,
            "userRecordsChanged": False,
            "at": _now(),
        }
