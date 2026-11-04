"""VMM-32 (KAN-204) — prelaunch learning, market-update and operations
readiness: the go/no-go checklist that must be green BEFORE launch, composed
with the real chain evidence shapes (two-mode launch receipt, hardening
drill, deployment-ops ledger, launch qualification).

  - THREE READINESS CATEGORIES: learning (all released surfaces verified),
    market-update (staged update pipeline with frozen source pointers),
    operations (runbooks, kill-switch drill, rollback drill, decision ledger).
  - EVIDENCE-REFERENCED ITEMS: every checklist item closes only with a real
    receipt reference (digest-bearing); prose and intentions refuse.
  - GO/NO-GO: the verdict reports exactly which items block; the recorded
    go decision requires ALL items green plus a verbatim SEPARATE reviewer
    (self-approval refused). A recorded NO-GO is a first-class outcome.
"""
from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

PRELAUNCH_CONTRACT = "vmm-prelaunch.v1"
CATEGORIES = ("learning", "market_update", "operations")
REQUIRED_ITEMS = {
    "learning": ("two_mode_launch_receipt", "impact_evaluation_reference"),
    "market_update": ("staged_update_pointer", "rollback_pointer"),
    "operations": ("runbook_reference", "kill_switch_drill", "deploy_decision_ledger"),
}


class PrelaunchError(ValueError):
    """The prelaunch operation is not admissible."""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class PrelaunchReadiness:
    def __init__(self) -> None:
        self._items: dict[str, dict[str, Any]] = {}
        self._decisions: list[dict[str, Any]] = []

    def close_item(self, actor: dict[str, Any], category: str, item: str, receipt_ref: dict[str, Any]) -> dict[str, Any]:
        if actor.get("role") != "ml-operator":
            raise PrelaunchError("Only the ml-operator closes checklist items")
        if category not in CATEGORIES or item not in REQUIRED_ITEMS[category]:
            raise PrelaunchError(f"Unknown checklist item: {category}/{item}")
        if type(receipt_ref) is not dict or not receipt_ref.get("digest") or not receipt_ref.get("kind"):
            raise PrelaunchError("A checklist item closes only with a digest-bearing receipt reference (no prose)")
        self._items[f"{category}/{item}"] = {"receiptRef": deepcopy(receipt_ref), "closedAt": _now()}
        return {"category": category, "item": item, "closed": True}

    def verdict(self) -> dict[str, Any]:
        missing = [f"{c}/{i}" for c in REQUIRED_ITEMS for i in REQUIRED_ITEMS[c] if f"{c}/{i}" not in self._items]
        return {"contract": PRELAUNCH_CONTRACT, "ready": not missing, "missingItems": missing, "closedItems": sorted(self._items)}

    def decide(self, actor: dict[str, Any], decision: str, reviewer_decision: dict[str, Any]) -> dict[str, Any]:
        if decision not in ("go", "no-go"):
            raise PrelaunchError("Decision is go or no-go")
        if actor.get("role") != "release-custodian":
            raise PrelaunchError("Only the release custodian records the launch decision")
        if type(reviewer_decision) is not dict or reviewer_decision.get("reviewerUid") == actor.get("uid"):
            raise PrelaunchError("A SEPARATE reviewer decision is required (never the custodian's own)")
        verdict = self.verdict()
        if decision == "go" and not verdict["ready"]:
            raise PrelaunchError(f"GO refused; blocking items: {verdict['missingItems']}")
        record = {"contract": PRELAUNCH_CONTRACT, "decision": decision, "verdict": verdict, "reviewer": deepcopy(reviewer_decision), "at": _now()}
        self._decisions.append(record)
        return deepcopy(record)

    def decisions(self) -> list[dict[str, Any]]:
        return deepcopy(self._decisions)
