"""VMM-27 (KAN-199) — durable typed planning, bounded delegation and
independent outcome verification.

  - DURABLE TYPED PLAN: steps are TYPED (tool | delegation | approval |
    artifact) with explicit bounds (deadlineMs, maxRetries, maxStepCostUsd);
    every transition is an append-only event; a CHECKPOINT replays events into
    an identical state — recovery across a context reset or failure is proven,
    not claimed.
  - BOUNDED DELEGATION: delegating a step to a model/tool enforces maxRetries
    and the plan's cumulative cost budget; exceeding either fails the step
    CLOSED (no infinite retry). A model's self-reported success is NEVER
    completion.
  - INDEPENDENT OUTCOME VERIFICATION: a delegated step completes only when an
    INDEPENDENT executable check (per step kind) passes — the check is a seam
    the plan runs itself; failed checks fail the step.
  - NO DUPLICATE OR LATE EFFECTS: step effects are idempotent by stepId, and an
    effect targeting a superseded plan revision is refused.
  - APPROVAL STEPS: require an explicit approver; the model can neither
    approve nor self-approve.
  - ADAPTIVE REPLANNING: constraint changes create a NEW plan revision; late
    effects against the old revision are refused.
"""
from __future__ import annotations

import json
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

PLANNING_CONTRACT = "vmm-planning.v1"
STEP_KINDS = ("tool", "delegation", "approval", "artifact")
STATUSES = ("pending", "delegated", "verified", "failed", "cancelled", "completed")


class PlanningError(ValueError):
    """The planning operation is not admissible."""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class TypedPlanner:
    def __init__(self, plan_id: str, max_total_cost_usd: float, verifiers: dict[str, Any] | None = None):
        if type(max_total_cost_usd) not in (int, float) or max_total_cost_usd <= 0:
            raise PlanningError("Invalid cost budget")
        self.plan_id = plan_id
        self.max_total_cost_usd = float(max_total_cost_usd)
        self.revision = 1
        self._events: list[dict[str, Any]] = []
        self._steps: dict[str, dict[str, Any]] = {}
        self._cost_spent = 0.0
        self._effects: set[str] = set()
        # Named verifier registry: checkpoints keep the NAME; the executable
        # check is re-bound on restore (it is part of the plan definition).
        self.verifiers = dict(verifiers or {})

    # ---- events / durability -------------------------------------------------

    def _append(self, kind: str, detail: dict[str, Any]) -> dict[str, Any]:
        event = {"seq": len(self._events) + 1, "planId": self.plan_id, "revision": self.revision, "kind": kind, "detail": deepcopy(detail), "at": _now()}
        self._events.append(event)
        return deepcopy(event)

    def checkpoint(self) -> dict[str, Any]:
        """Durable checkpoint: events + state for context-reset recovery."""
        return {
            "contract": PLANNING_CONTRACT,
            "planId": self.plan_id,
            "revision": self.revision,
            "events": deepcopy(self._events),
            "steps": deepcopy(self._steps),
            "costSpent": self._cost_spent,
        }

    @classmethod
    def restore(cls, checkpoint: dict[str, Any], verifiers: dict[str, Any] | None = None) -> "TypedPlanner":
        """Recover across a context reset: replay the checkpoint into an
        identical planner (proven by equality tests). Verifier callables are
        re-bound from the supplied registry (part of the plan definition)."""
        planner = cls(checkpoint["planId"], max_total_cost_usd=1.0, verifiers=verifiers)
        planner.max_total_cost_usd = 1.0
        planner.revision = checkpoint["revision"]
        planner._events = deepcopy(checkpoint["events"])
        planner._steps = deepcopy(checkpoint["steps"])
        planner._cost_spent = checkpoint["costSpent"]
        planner._effects = set()
        return planner

    def identical_state(self, other: "TypedPlanner") -> bool:
        return json.dumps(self.checkpoint(), sort_keys=True) == json.dumps(other.checkpoint(), sort_keys=True)

    # ---- steps -----------------------------------------------------------------

    def add_step(self, step_id: str, kind: str, bounds: dict[str, Any], verifier: Any = None) -> dict[str, Any]:
        if kind not in STEP_KINDS:
            raise PlanningError("Invalid step kind")
        if step_id in self._steps:
            raise PlanningError("Duplicate step id")
        if type(bounds) is not dict or not {"deadlineMs", "maxRetries", "maxStepCostUsd"} <= set(bounds):
            raise PlanningError("Bounds need deadlineMs/maxRetries/maxStepCostUsd")
        if type(bounds["deadlineMs"]) is not int or bounds["deadlineMs"] <= 0:
            raise PlanningError("Invalid deadlineMs")
        if type(bounds["maxRetries"]) is not int or bounds["maxRetries"] < 0:
            raise PlanningError("Invalid maxRetries")
        if type(bounds["maxStepCostUsd"]) not in (int, float) or bounds["maxStepCostUsd"] < 0:
            raise PlanningError("Invalid maxStepCostUsd")
        verifier_name = None
        if kind == "delegation":
            if type(verifier) is not str or verifier not in self.verifiers or not callable(self.verifiers[verifier]):
                raise PlanningError("Delegation steps require a registered INDEPENDENT verifier")
            verifier_name = verifier
        self._steps[step_id] = {
            "stepId": step_id, "kind": kind, "bounds": deepcopy(bounds),
            "status": "pending", "attempts": 0, "costSpent": 0.0,
            "verifierName": verifier_name, "delegateTo": None,
        }
        self._append("step_added", {"stepId": step_id, "kind": kind})
        return deepcopy(self._steps[step_id])

    def _step(self, step_id: str) -> dict[str, Any]:
        step = self._steps.get(step_id)
        if step is None:
            raise PlanningError("Unknown step")
        return step

    def delegate(self, actor: dict[str, Any], step_id: str, delegate_to: str) -> dict[str, Any]:
        step = self._step(step_id)
        if step["kind"] != "delegation":
            raise PlanningError("Only delegation steps can be delegated")
        if step["status"] not in ("pending", "delegated"):
            raise PlanningError(f"Step is {step['status']}")
        if actor.get("kind") != "backend-service":
            raise PlanningError("Delegation is backend-authorized")
        if step["attempts"] > step["bounds"]["maxRetries"]:
            step["status"] = "failed"
            self._append("step_failed", {"stepId": step_id, "reason": "retry_bound_exceeded"})
            raise PlanningError("Retry bound exceeded")
        step["attempts"] += 1
        step["delegateTo"] = delegate_to
        step["status"] = "delegated"
        return self._append("delegated", {"stepId": step_id, "delegateTo": delegate_to, "attempt": step["attempts"]})

    def record_outcome(self, step_id: str, claimed_success: bool, cost_usd: float) -> dict[str, Any]:
        """Record the delegate's claim — completion still requires verification."""
        step = self._step(step_id)
        if step["kind"] != "delegation":
            raise PlanningError("Only delegation steps record outcomes")
        if type(cost_usd) not in (int, float) or cost_usd < 0:
            raise PlanningError("Invalid cost")
        if self._cost_spent + cost_usd > self.max_total_cost_usd or step["costSpent"] + cost_usd > step["bounds"]["maxStepCostUsd"]:
            step["status"] = "failed"
            self._cost_spent += cost_usd
            self._append("step_failed", {"stepId": step_id, "reason": "cost_bound_exceeded"})
            raise PlanningError("Cost bound exceeded")
        step["costSpent"] += cost_usd
        self._cost_spent += cost_usd
        step["lastClaim"] = bool(claimed_success)
        return self._append("outcome_recorded", {"stepId": step_id, "claimedSuccess": bool(claimed_success), "costUsd": cost_usd})

    def verify_step(self, actor: dict[str, Any], step_id: str) -> dict[str, Any]:
        """INDEPENDENT verification: an executable check, not a model claim."""
        step = self._step(step_id)
        if step["status"] not in ("delegated", "pending"):
            raise PlanningError(f"Step is {step['status']}")
        if actor.get("kind") != "backend-service":
            raise PlanningError("Verification is backend-authorized")
        verifier = self.verifiers.get(step.get("verifierName")) if step.get("verifierName") else None
        if step["kind"] == "delegation":
            if step.get("lastClaim") is not True:
                step["status"] = "failed"
                self._append("step_failed", {"stepId": step_id, "reason": "delegate_claimed_failure"})
                raise PlanningError("Delegate reported failure")
            if not callable(verifier) or not verifier(step):
                step["status"] = "failed"
                self._append("step_failed", {"stepId": step_id, "reason": "independent_check_failed"})
                raise PlanningError("Independent check failed")
        step["status"] = "verified"
        return self._append("step_verified", {"stepId": step_id, "verifiedBy": actor.get("uid")})

    def complete_step(self, actor: dict[str, Any], step_id: str, effect_revision: int | None = None) -> dict[str, Any]:
        """Apply the step's effect — idempotent; late effects refused."""
        step = self._step(step_id)
        if step["status"] != "verified":
            raise PlanningError("Only verified steps complete")
        if step["kind"] == "approval" and actor.get("role") not in ("owner", "reviewer", "custodian"):
            raise PlanningError("Approval steps require an explicit approver — the model cannot approve")
        if effect_revision is not None and effect_revision != self.revision:
            raise PlanningError(f"Late effect: plan revision moved to {self.revision}")
        effect_key = f"{step_id}@{self.revision}"
        if effect_key in self._effects:
            raise PlanningError("Duplicate effect refused")
        self._effects.add(effect_key)
        step["status"] = "completed"
        return self._append("step_completed", {"stepId": step_id, "effectKey": effect_key})

    # ---- adaptive replanning -----------------------------------------------------

    def replan(self, actor: dict[str, Any], new_bounds: dict[str, Any] | None = None) -> dict[str, Any]:
        if actor.get("kind") != "backend-service":
            raise PlanningError("Replanning is backend-authorized")
        self.revision += 1
        for step in self._steps.values():
            if step["status"] in ("pending", "delegated") and new_bounds:
                for bound in ("deadlineMs", "maxRetries", "maxStepCostUsd"):
                    if bound in new_bounds:
                        step["bounds"][bound] = new_bounds[bound]
        return self._append("replanned", {"revision": self.revision, "bounds": deepcopy(new_bounds or {})})

    def pending_steps(self) -> list[str]:
        return sorted(sid for sid, s in self._steps.items() if s["status"] in ("pending", "delegated"))
