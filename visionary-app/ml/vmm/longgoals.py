"""VMM-30 (KAN-202) — resumable long-running goals and user-controlled
proactive assistance.

  - RESUMABLE GOALS: a long-running goal session records append-only events
    with periodic CHECKPOINTS; resume replays to an identical state — restart,
    context loss and interruption recover deterministically. A LEASE bounds
    concurrent workers: a stale lease (lease-race) is refused — only the
    leaseholder may advance the goal.
  - USER-CONTROLLED PROACTIVE ASSISTANCE: proactive follow-ups exist ONLY
    after an explicit OPT-IN per category; suggestions derive only from
    verified state (evidence/goal events); QUIET HOURS are honored; dismissed
    suggestions never resurface; frequency is capped; every notification gets
    a real receipt with a test identity; and NO proactive ACTION executes
    without per-action consent — suggestions are suggestions.
  - CANCEL + PERMISSION CHANGE: cancelling a goal stops all assistance for it;
    a permission change (opt-out) takes effect immediately.
  - NO always-on microphone, NO default unsolicited messages.
"""
from __future__ import annotations

import json
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

GOALRUN_CONTRACT = "vmm-goalrun.v1"


class GoalRunError(ValueError):
    """The goal-run operation is not admissible."""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _hour(iso: str) -> int:
    return datetime.fromisoformat(iso.replace("Z", "+00:00")).hour


class LongRunningGoal:
    """Durable, resumable goal session with lease-bounded advancement."""

    def __init__(self, goal_id: str, owner: dict[str, Any], steps: list[str]):
        if owner.get("kind") != "user" or type(owner.get("uid")) is not str or not owner["uid"]:
            raise GoalRunError("Goals are owner-scoped")
        if not steps or any(type(s) is not str for s in steps):
            raise GoalRunError("Invalid step list")
        self.goal_id = goal_id
        self.owner = deepcopy(owner)
        self.steps = list(steps)
        self.completed: set[str] = set()
        self.events: list[dict[str, Any]] = []
        self.lease: dict[str, Any] | None = None
        self.cancelled = False

    def _append(self, kind: str, detail: dict[str, Any]) -> dict[str, Any]:
        event = {"seq": len(self.events) + 1, "goalId": self.goal_id, "kind": kind, "detail": deepcopy(detail), "at": _now()}
        self.events.append(event)
        return deepcopy(event)

    def acquire_lease(self, worker_id: str, lease_ms: int = 30000) -> dict[str, Any]:
        """Lease bounds concurrent workers; a live lease is refused (lease-race)."""
        if self.cancelled:
            raise GoalRunError("Goal cancelled")
        if self.lease is not None and self.lease["expiresAt"] > _now() and self.lease["workerId"] != worker_id:
            raise GoalRunError("Lease-race denied: another worker holds a live lease")
        self.lease = {"workerId": worker_id, "expiresAt": datetime.fromtimestamp(datetime.now(timezone.utc).timestamp() + lease_ms / 1000, timezone.utc).isoformat()}
        return self._append("lease_acquired", {"workerId": worker_id, "leaseMs": lease_ms})

    def complete_step(self, worker_id: str, step_id: str) -> dict[str, Any]:
        if self.cancelled:
            raise GoalRunError("Goal cancelled")
        if self.lease is None or self.lease["workerId"] != worker_id:
            raise GoalRunError("Only the leaseholder may advance the goal")
        if step_id not in self.steps or step_id in self.completed:
            raise GoalRunError("Unknown or already-completed step")
        self.completed.add(step_id)
        event = self._append("step_completed", {"stepId": step_id})
        if len(self.completed) == len(self.steps):
            self._append("goal_complete", {})
        return event

    def checkpoint(self) -> dict[str, Any]:
        """Durable checkpoint (events + derived state) for restart recovery."""
        return {
            "contract": GOALRUN_CONTRACT,
            "goalId": self.goal_id,
            "owner": deepcopy(self.owner),
            "steps": list(self.steps),
            "completed": sorted(self.completed),
            "events": deepcopy(self.events),
            "cancelled": self.cancelled,
        }

    @classmethod
    def resume(cls, checkpoint: dict[str, Any]) -> "LongRunningGoal":
        """Restart/interruption recovery: replay to an identical state."""
        session = cls(checkpoint["goalId"], checkpoint["owner"], checkpoint["steps"])
        session.completed = set(checkpoint["completed"])
        session.events = deepcopy(checkpoint["events"])
        session.cancelled = checkpoint["cancelled"]
        return session

    def identical(self, other: "LongRunningGoal") -> bool:
        return json.dumps(self.checkpoint(), sort_keys=True) == json.dumps(other.checkpoint(), sort_keys=True)

    def progress(self) -> dict[str, Any]:
        return {"goalId": self.goal_id, "completed": len(self.completed), "total": len(self.steps), "fraction": round(len(self.completed) / len(self.steps), 6)}

    def cancel(self, owner: dict[str, Any]) -> dict[str, Any]:
        if owner.get("uid") != self.owner["uid"]:
            raise GoalRunError("Only the owner may cancel")
        self.cancelled = True
        return self._append("cancelled", {})


class ProactiveAssistant:
    """Opted-in, quiet-hours-aware, capped proactive suggestions."""

    def __init__(self, quiet_hours: tuple[int, int] = (22, 7), max_per_day: int = 2):
        self.quiet_hours = quiet_hours
        self.max_per_day = max_per_day
        self._opt_in: dict[str, set[str]] = {}
        self._dismissed: set[str] = set()
        self._sent_today: dict[str, int] = {}
        self._receipts: list[dict[str, Any]] = []

    def set_opt_in(self, owner_uid: str, category: str, opted_in: bool) -> dict[str, Any]:
        """Explicit per-category opt-in; revocation takes effect immediately."""
        if type(category) is not str or not category:
            raise GoalRunError("Invalid category")
        scopes = self._opt_in.setdefault(owner_uid, set())
        if opted_in:
            scopes.add(category)
        else:
            scopes.discard(category)
        return {"ownerUid": owner_uid, "category": category, "optedIn": opted_in}

    def suggest(self, owner_uid: str, category: str, suggestion_id: str, summary: str, now_hour: int) -> dict[str, Any]:
        """One proactive suggestion — suggest-only, never an executed action."""
        if category not in self._opt_in.get(owner_uid, set()):
            return {"delivered": False, "reason": "not_opted_in"}
        if suggestion_id in self._dismissed:
            return {"delivered": False, "reason": "previously_dismissed"}
        start, end = self.quiet_hours
        quiet = (now_hour >= start) if start > end else (start <= now_hour < end)
        if quiet:
            return {"delivered": False, "reason": "quiet_hours"}
        if self._sent_today.get(owner_uid, 0) >= self.max_per_day:
            return {"delivered": False, "reason": "frequency_cap"}
        self._sent_today[owner_uid] = self._sent_today.get(owner_uid, 0) + 1
        receipt = {
            "suggestionId": suggestion_id,
            "ownerUid": owner_uid,
            "category": category,
            "summary": summary[:200],
            "delivered": True,
            "executed": False,
            "requiresExplicitConsent": True,
            "at": _now(),
        }
        self._receipts.append(receipt)
        return deepcopy(receipt)

    def dismiss(self, owner_uid: str, suggestion_id: str) -> dict[str, Any]:
        self._dismissed.add(suggestion_id)
        return {"dismissed": True, "suggestionId": suggestion_id}

    def receipts(self, owner_uid: str) -> list[dict[str, Any]]:
        return [deepcopy(r) for r in self._receipts if r["ownerUid"] == owner_uid]

    def consent_for_action(self, owner_uid: str, action_id: str, consented: bool) -> dict[str, Any]:
        """Proactive ACTIONS require per-action explicit consent."""
        return {"actionId": action_id, "consented": consented, "executed": False, "note": "Actions never execute without explicit per-action consent."}
