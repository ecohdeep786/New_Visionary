"""PLAT-08 (KAN-52) — backup / PITR / object-protection / restore-identity
DRILL: the executable verification the platform must pass BEFORE persistent
real-user data is admitted. Synthetic data only — real user records are
contract-refused from the drill.

  - BACKUP + DIGEST: every snapshot is digest-stamped; the digest covers the
    whole synthetic store so any divergence is detectable.
  - RESTORE IS BYTE-IDENTICAL: restore reproduces the store EXACTLY (same
    digest), including owner identities — a restore that loses or reassigns
    identities fails.
  - PITR: the drill keeps an append-only snapshot log; restore-to-point-in-time
    rebuilds ANY recorded instant, later mutations discarded.
  - OBJECT PROTECTION: snapshots carry a retention lock — deletion before the
    retention horizon refuses (immutable backup).
  - NO REAL USER DATA: records flagged real-user refuse admission into the
    drill (synthetic-first discipline).
"""
from __future__ import annotations

import hashlib
import json
from copy import deepcopy
from datetime import datetime, timedelta, timezone
from typing import Any

DRILL_CONTRACT = "plat-backup-drill.v1"
RETENTION_DAYS = 30


class DrillError(ValueError):
    """The backup-drill operation is not admissible."""


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _digest(payload: Any) -> str:
    return hashlib.sha256(json.dumps(payload, sort_keys=True, ensure_ascii=False).encode("utf-8")).hexdigest()


class BackupDrill:
    def __init__(self) -> None:
        self._store: dict[str, Any] = {}
        self._snapshots: list[dict[str, Any]] = []

    def seed(self, records: list[dict[str, Any]]) -> None:
        for record in records:
            if record.get("realUser") is True:
                raise DrillError("Real-user records are refused: the drill is synthetic-first")
            self._store[record["id"]] = deepcopy(record)

    def snapshot(self, label: str) -> dict[str, Any]:
        if any(s["label"] == label for s in self._snapshots):
            raise DrillError("Duplicate snapshot label: point-in-time labels must be unambiguous")
        entry = {"label": label, "digest": _digest(self._store), "state": deepcopy(self._store), "takenAt": _now().isoformat(), "retentionUntil": (_now() + timedelta(days=RETENTION_DAYS)).isoformat()}
        self._snapshots.append(entry)
        return {"label": label, "digest": entry["digest"], "retentionUntil": entry["retentionUntil"]}

    def restore_latest(self) -> dict[str, Any]:
        if not self._snapshots:
            raise DrillError("No snapshot to restore")
        target = self._snapshots[-1]
        restored = deepcopy(target["state"])
        if _digest(restored) != target["digest"]:
            raise DrillError("Restore diverged from the snapshot digest")
        for record in restored.values():
            if not record.get("ownerUid"):
                raise DrillError("Restore lost an owner identity")
        self._store = restored
        return {"restoredFrom": target["label"], "digest": target["digest"], "identities": len(restored)}

    def restore_point_in_time(self, label: str) -> dict[str, Any]:
        target = next((s for s in self._snapshots if s["label"] == label), None)
        if target is None:
            raise DrillError("Unknown point-in-time label")
        restored = deepcopy(target["state"])
        # the same byte-identity and identity guarantees as restore_latest:
        # a PITR rebuild that diverges from its recorded digest or loses an
        # owner identity is a failed restore, not a recovery
        if _digest(restored) != target["digest"]:
            raise DrillError("Point-in-time restore diverged from the snapshot digest")
        for record in restored.values():
            if not record.get("ownerUid"):
                raise DrillError("Point-in-time restore lost an owner identity")
        self._store = restored
        return {"restoredTo": label, "digest": _digest(self._store)}

    def delete_snapshot(self, label: str, actor_now: datetime | None = None) -> None:
        entry = next((s for s in self._snapshots if s["label"] == label), None)
        if entry is None:
            raise DrillError("Unknown snapshot")
        until = datetime.fromisoformat(entry["retentionUntil"])
        if (actor_now or _now()) < until:
            raise DrillError("Retention lock: immutable backup cannot be deleted before the horizon")
        self._snapshots = [s for s in self._snapshots if s["label"] != label]

    def state(self) -> dict[str, Any]:
        return deepcopy(self._store)

    def state_digest(self) -> str:
        return _digest(self._store)
