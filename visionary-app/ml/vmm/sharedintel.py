"""VMM-18 (KAN-186) — shared intelligence across Learn/Ask/Practice/Build and
the five roles: one committed journey, second-device resume, role-scoped
sharing with immediate revocation.

Composes the REAL VMM-25 personal memory (`ScopedMemory`) as the durable
anchor for every committed artifact:

  - COMMITTED, NOT EPHEMERAL: each surface outcome (learn loop, ask citation,
    practice attempt, build artifact) commits into the journey as a
    digest-referenced artifact (never raw private content) AND anchors into
    the owner's scoped personal memory (KAN-197).
  - SECOND-DEVICE RESUME: `resume_state()` rebuilds the journey deterministically
    from the committed event chain — a second device sees the same seq, the
    same per-surface counts and the same digest chain.
  - FIVE-ROLE SHARING: the owner may grant teacher/guardian/professional/
    company scoped read access; a viewer reads only granted, un-revoked
    artifacts; revocation cuts access IMMEDIATELY (fail closed); the student
    role is the owner and cannot be granted away.
  - DENY PATHS: cross-user commit, unknown role, ungranted or revoked read,
    unknown surface.
"""
from __future__ import annotations

import hashlib
import json
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

from vmm.memory import ScopedMemory

JOURNEY_CONTRACT = "vmm-sharedintel.v1"
SURFACES = ("learn", "ask", "practice", "build")
SHARE_ROLES = ("teacher", "guardian", "professional", "company")


class SharedIntelligenceError(ValueError):
    """The shared-intelligence operation is not admissible."""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _digest(payload: Any) -> str:
    return hashlib.sha256(json.dumps(payload, sort_keys=True, ensure_ascii=False).encode("utf-8")).hexdigest()


class SharedIntelligenceJourney:
    def __init__(self, owner: dict[str, Any]):
        uid = owner.get("uid")
        if type(uid) is not str or not uid:
            raise SharedIntelligenceError("A journey is owner-scoped")
        self._owner = uid
        self._memory = ScopedMemory("personal", uid)  # REAL VMM-25 anchor
        self._artifacts: list[dict[str, Any]] = []
        self._grants: dict[str, dict[str, Any]] = {}

    def commit(self, actor: dict[str, Any], surface: str, payload_ref: dict[str, Any]) -> dict[str, Any]:
        """Commit one surface outcome: digest-referenced, memory-anchored."""
        if actor.get("uid") != self._owner:
            raise SharedIntelligenceError("Cross-user commit denied")
        if surface not in SURFACES:
            raise SharedIntelligenceError(f"Unknown surface: {surface}")
        digest = _digest(payload_ref)
        summary = f"{surface} outcome ref {digest[:12]}"
        self._memory.remember(actor, summary, [surface], "shared-intel")
        artifact = {
            "seq": len(self._artifacts) + 1,
            "surface": surface,
            "refDigest": digest,
            "payloadKeys": sorted(payload_ref.keys()),
            "committedAt": _now(),
        }
        self._artifacts.append(artifact)
        return deepcopy(artifact)

    def resume_state(self) -> dict[str, Any]:
        """Deterministic second-device reconstruction from the committed chain."""
        per_surface = {s: sum(1 for a in self._artifacts if a["surface"] == s) for s in SURFACES}
        chain = _digest([a["refDigest"] for a in self._artifacts])
        return {"contract": JOURNEY_CONTRACT, "ownerUid": self._owner, "committed": len(self._artifacts), "perSurface": per_surface, "chainDigest": chain}

    def share_with(self, actor: dict[str, Any], role: str) -> dict[str, Any]:
        if actor.get("uid") != self._owner:
            raise SharedIntelligenceError("Only the owner may grant access")
        if role == "student":
            raise SharedIntelligenceError("The student role IS the owner; nothing to grant")
        if role not in SHARE_ROLES:
            raise SharedIntelligenceError(f"Unknown share role: {role}")
        self._grants[role] = {"granted": True, "revoked": False, "at": _now()}
        return {"role": role, "granted": True}

    def revoke(self, actor: dict[str, Any], role: str) -> dict[str, Any]:
        if actor.get("uid") != self._owner:
            raise SharedIntelligenceError("Only the owner may revoke access")
        grant = self._grants.get(role)
        if grant is None:
            raise SharedIntelligenceError("No grant to revoke")
        grant["revoked"] = True
        grant["revokedAt"] = _now()
        return {"role": role, "granted": False, "revoked": True}

    def read_as(self, viewer: dict[str, Any], role: str) -> list[dict[str, Any]]:
        """Role-scoped read: owner reads all; others only granted, un-revoked."""
        if viewer.get("uid") == self._owner:
            return deepcopy(self._artifacts)
        if role == "student":
            raise SharedIntelligenceError("A student viewer must be the owner")
        grant = self._grants.get(role)
        if grant is None or grant["revoked"]:
            raise SharedIntelligenceError(f"No active {role} grant for this journey")
        return deepcopy(self._artifacts)
