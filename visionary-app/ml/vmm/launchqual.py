"""VMM-22 (KAN-190) — controlled canary and launch qualification for the
integrated Tiny/OCR/frontier stack, composing the REAL VMM-20 kill switch.

  - RELEASE CANDIDATE: one manifest pinning the model version, OCR rollout
    version and qualified provider set — digest-stamped so the deployed thing
    is exactly the qualified thing.
  - CANARY WINDOW: bounded traffic share with recorded samples (requests,
    refusals, p95Ms); the canary AUTO-ABORTS when the refusal bound is breached
    and rolls the served pointer back to the previous release.
  - PROMOTION GATES: promotion requires a passed canary (minimum samples,
    refusal and latency bounds) with the kill switch NOT engaged, and records
    the SEPARATE reviewer's decision verbatim — the module never fabricates
    approval; without a recorded reviewer decision the candidate stays in
    canary.
  - ROLLBACK: the served release pointer rewinds deterministically to any
    previously promoted candidate.
  - DENY PATHS: promotion without a passed canary, promotion/canary while the
    kill switch is engaged, traffic share outside 1..50, unknown candidate.
"""
from __future__ import annotations

import statistics
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

from vmm.hardening import IndependentHardening

LAUNCH_CONTRACT = "vmm-launchqual.v1"
MAX_TRAFFIC_SHARE = 50
MIN_CANARY_SAMPLES = 20
MAX_REFUSAL_RATE = 0.05
MAX_P95_MS = 4000


class LaunchError(ValueError):
    """The launch-qualification operation is not admissible."""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class LaunchQualification:
    def __init__(self, kill_switch: IndependentHardening):
        self._kill = kill_switch
        self._candidates: dict[str, dict[str, Any]] = {}
        self._served: str | None = None
        self._promoted: dict[str, dict[str, Any]] = {}
        self._counter = 0

    def declare_candidate(self, owner: dict[str, Any], model_version: str, ocr_rollout_version: int, provider_ids: list[str]) -> dict[str, Any]:
        if owner.get("role") != "release-custodian":
            raise LaunchError("Only the release custodian declares candidates")
        self._counter += 1
        candidate_id = f"cand_{self._counter}"
        manifest = {"candidateId": candidate_id, "modelVersion": model_version, "ocrRolloutVersion": ocr_rollout_version, "providerIds": sorted(provider_ids), "declaredAt": _now()}
        self._candidates[candidate_id] = {"manifest": manifest, "canary": None, "verdict": None, "reviewer": None}
        return deepcopy(manifest)

    def start_canary(self, candidate_id: str, traffic_share: int) -> dict[str, Any]:
        if self._kill.killed:
            raise LaunchError("Kill switch engaged: no canary starts")
        candidate = self._candidates.get(candidate_id)
        if candidate is None:
            raise LaunchError("Unknown candidate")
        if not 1 <= traffic_share <= MAX_TRAFFIC_SHARE:
            raise LaunchError(f"Canary traffic share must be 1..{MAX_TRAFFIC_SHARE}")
        candidate["canary"] = {"trafficShare": traffic_share, "samples": [], "startedAt": _now(), "aborted": False}
        return {"candidateId": candidate_id, "trafficShare": traffic_share}

    def record_sample(self, candidate_id: str, refused: bool, latency_ms: int) -> None:
        candidate = self._candidates.get(candidate_id)
        if candidate is None or candidate["canary"] is None or candidate["canary"]["aborted"]:
            raise LaunchError("No active canary for this candidate")
        candidate["canary"]["samples"].append({"refused": bool(refused), "latencyMs": int(latency_ms)})
        samples = candidate["canary"]["samples"]
        refusals = sum(1 for s in samples if s["refused"])
        if len(samples) >= 5 and refusals / len(samples) > MAX_REFUSAL_RATE:
            candidate["canary"]["aborted"] = True
            self.rollback()

    def canary_verdict(self, candidate_id: str) -> dict[str, Any]:
        candidate = self._candidates.get(candidate_id)
        if candidate is None or candidate["canary"] is None:
            raise LaunchError("No canary for this candidate")
        samples = candidate["canary"]["samples"]
        refusals = sum(1 for s in samples if s["refused"])
        verdict = {
            "contract": LAUNCH_CONTRACT,
            "candidateId": candidate_id,
            "samples": len(samples),
            "refusalRate": round(refusals / len(samples), 6) if samples else 1.0,
            "p95Ms": sorted(s["latencyMs"] for s in samples)[min(len(samples) - 1, int(0.95 * len(samples)) - 1)] if samples else None,
            "aborted": candidate["canary"]["aborted"],
        }
        verdict["passed"] = bool(
            not verdict["aborted"]
            and verdict["samples"] >= MIN_CANARY_SAMPLES
            and verdict["refusalRate"] <= MAX_REFUSAL_RATE
            and verdict["p95Ms"] is not None and verdict["p95Ms"] <= MAX_P95_MS
        )
        candidate["verdict"] = verdict
        return deepcopy(verdict)

    def promote(self, actor: dict[str, Any], candidate_id: str, reviewer_decision: dict[str, Any]) -> dict[str, Any]:
        if self._kill.killed:
            raise LaunchError("Kill switch engaged: promotion refused")
        candidate = self._candidates.get(candidate_id)
        if candidate is None:
            raise LaunchError("Unknown candidate")
        verdict = candidate["verdict"] or self.canary_verdict(candidate_id)
        if not verdict["passed"]:
            raise LaunchError("Promotion refused: the canary has not passed")
        if actor.get("role") != "release-custodian":
            raise LaunchError("Only the release custodian promotes")
        if type(reviewer_decision) is not dict or reviewer_decision.get("reviewerUid") == actor.get("uid"):
            raise LaunchError("A SEPARATE reviewer decision is required (never the custodian's own)")
        candidate["reviewer"] = deepcopy(reviewer_decision)
        receipt = {"candidateId": candidate_id, "manifest": candidate["manifest"], "canary": verdict, "reviewer": candidate["reviewer"], "promotedAt": _now()}
        self._promoted[candidate_id] = receipt
        self._served = candidate_id
        return deepcopy(receipt)

    def rollback(self) -> dict[str, Any]:
        others = [cid for cid in self._promoted if cid != self._served]
        if not others:
            self._served = None
            return {"served": None, "rolledBack": True}
        self._served = sorted(others)[0]
        return {"served": self._served, "rolledBack": True}

    @property
    def served(self) -> str | None:
        return self._served
