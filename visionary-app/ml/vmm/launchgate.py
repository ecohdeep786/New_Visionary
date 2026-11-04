"""VMM-31 (KAN-203) — day-one general capability and TWO-MODE launch
acceptance, composing the REAL chain: the teaching loop (Learn), the Build
workflow (Build), the launch qualification and the hardening kill switch.

  - FROZEN DAY-ONE CONTRACT: the launch gate is built from a frozen capability
    manifest (the two connected modes — Teach/Learn and Build); the manifest
    digest is stamped at construction and any later mutation refuses, so what
    is signed is exactly what was frozen.
  - EVIDENCE-GATED, NOT PROMISE-GATED: every capability gate accepts only REAL
    chain evidence — a closed bounded tutor-loop check (Learn), a deploy
    receipt from the frontier Build workflow (Build), a passed launch
    qualification receipt, and a kill-switch drill result. Promises, plans and
    prose are refused as evidence.
  - TWO-MODE COHERENCE: Learn and Build evidence must reference the SAME
    pinned contract versions — a pin mismatch refuses.
  - SIGN-OFF: the launch receipt requires ALL gates evidenced plus a verbatim
    SEPARATE reviewer decision (self-signoff refused). Until then the verdict
    reports exactly which gates block the launch.
"""
from __future__ import annotations

import hashlib
import json
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

LAUNCHGATE_CONTRACT = "vmm-twomode-launch.v1"
REQUIRED_GATES = ("learn_loop", "build_deploy", "launch_qualification", "kill_switch_drill")


class LaunchGateError(ValueError):
    """The launch-acceptance operation is not admissible."""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class TwoModeLaunchGate:
    def __init__(self, frozen_contract: dict[str, Any]):
        required_keys = {"mode", "pinned", "dayOneCapabilities"}
        if type(frozen_contract) is not dict or not required_keys <= set(frozen_contract) or frozen_contract.get("mode") not in ("teach-learn+build",):
            raise LaunchGateError("The frozen contract must declare the two connected modes with pinned versions")
        self._frozen = deepcopy(frozen_contract)
        self._digest = hashlib.sha256(json.dumps(self._frozen, sort_keys=True).encode()).hexdigest()[:16]
        self._evidence: dict[str, dict[str, Any]] = {}

    @property
    def frozen_digest(self) -> str:
        return self._digest

    def submit_evidence(self, gate: str, evidence: dict[str, Any]) -> dict[str, Any]:
        if gate not in REQUIRED_GATES:
            raise LaunchGateError(f"Unknown gate: {gate}")
        if evidence.get("frozenDigest") != self._digest:
            raise LaunchGateError("Evidence must reference the FROZEN contract digest (two-mode coherence)")
        checks = {
            "learn_loop": lambda e: e.get("kind") == "tutor-loop-check" and e.get("closed") is True and e.get("assessedBy") == "backend",
            "build_deploy": lambda e: e.get("kind") == "build-deploy-receipt" and bool(e.get("testDigest")) and bool(e.get("explanationDigest")),
            "launch_qualification": lambda e: e.get("kind") == "canary-receipt" and e.get("canaryPassed") is True and bool(e.get("reviewerUid")),
            "kill_switch_drill": lambda e: e.get("kind") == "hardening-drill" and e.get("failClosed") is True and e.get("recovered") is True,
        }
        if not checks[gate](evidence):
            raise LaunchGateError(f"{gate} evidence does not meet the day-one bar (promises are not evidence)")
        self._evidence[gate] = {**deepcopy(evidence), "receivedAt": _now()}
        return deepcopy(self._evidence[gate])

    def verdict(self) -> dict[str, Any]:
        missing = [g for g in REQUIRED_GATES if g not in self._evidence]
        return {"contract": LAUNCHGATE_CONTRACT, "frozenDigest": self._digest, "ready": not missing, "missingGates": missing, "evidenced": sorted(self._evidence)}

    def sign_off(self, actor: dict[str, Any], reviewer_decision: dict[str, Any]) -> dict[str, Any]:
        verdict = self.verdict()
        if not verdict["ready"]:
            raise LaunchGateError(f"Launch blocked; missing gates: {verdict['missingGates']}")
        if actor.get("role") != "release-custodian":
            raise LaunchGateError("Only the release custodian signs off")
        if type(reviewer_decision) is not dict or reviewer_decision.get("reviewerUid") == actor.get("uid"):
            raise LaunchGateError("A SEPARATE reviewer decision is required (never the custodian's own)")
        receipt = {"contract": LAUNCHGATE_CONTRACT, "frozenDigest": self._digest, "gates": sorted(self._evidence), "reviewer": deepcopy(reviewer_decision), "signedAt": _now()}
        return receipt
