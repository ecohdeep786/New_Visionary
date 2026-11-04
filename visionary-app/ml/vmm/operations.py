"""VMM-23 (KAN-191) — market-model research candidates and CONTROLLED daily
deployment decisions, composing the REAL VMM-22 launch qualification and the
VMM-20 kill switch.

  - PROVENANCE-MANDATORY RESEARCH: a retrain candidate is admitted only with a
    dataset digest + protocol reference — no unverifiable training inputs.
  - CONTROLLED DEPLOY DECISIONS: one decision per day, only for candidates
    whose launch qualification receipt (passed canary + separate reviewer)
    exists, and never while the kill switch is engaged. Decisions carry a
    reason and land in an append-only, redacted ledger.
  - NO SILENT ROLLOUTS: a decision without the qualification receipt refuses;
    the receipt (not the operator's judgement) is the authority.
"""
from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

from vmm.hardening import IndependentHardening
from vmm.launchqual import LaunchQualification

OPS_CONTRACT = "vmm-deployops.v1"


class OpsError(ValueError):
    """The deployment operation is not admissible."""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class DailyDeploymentBoard:
    def __init__(self, launch: LaunchQualification, kill_switch: IndependentHardening):
        self._launch = launch
        self._kill = kill_switch
        self._research: dict[str, dict[str, Any]] = {}
        self._decisions: list[dict[str, Any]] = []

    def propose_retrain(self, operator: dict[str, Any], candidate_id: str, dataset_digest: str, protocol_version: str) -> dict[str, Any]:
        if operator.get("role") != "ml-operator":
            raise OpsError("Only the ml-operator proposes retrain candidates")
        if type(dataset_digest) is not str or len(dataset_digest) < 16:
            raise OpsError("A dataset digest (provenance) is mandatory")
        if type(protocol_version) is not str or not protocol_version:
            raise OpsError("An evaluation protocol reference is mandatory")
        entry = {"candidateId": candidate_id, "datasetDigest": dataset_digest, "protocolVersion": protocol_version, "proposedAt": _now()}
        self._research[candidate_id] = entry
        return deepcopy(entry)

    def deploy_decision(self, operator: dict[str, Any], day: str, candidate_id: str, reason: str) -> dict[str, Any]:
        if self._kill.killed:
            raise OpsError("Kill switch engaged: no deployment decisions")
        if operator.get("role") != "ml-operator":
            raise OpsError("Only the ml-operator records deployment decisions")
        if candidate_id not in self._research:
            raise OpsError("Unregistered retrain candidate")
        promoted = self._launch._promoted.get(candidate_id)
        if promoted is None:
            raise OpsError("No launch-qualification receipt: the canary + reviewer receipt is the authority, not judgement")
        if any(d["day"] == day for d in self._decisions):
            raise OpsError("One controlled deployment decision per day")
        decision = {"contract": OPS_CONTRACT, "day": day, "candidateId": candidate_id, "canaryPassed": promoted["canary"]["passed"], "reviewerUid": promoted["reviewer"]["reviewerUid"], "reason": str(reason)[:120], "at": _now()}
        self._decisions.append(decision)
        return deepcopy(decision)

    def decisions(self) -> list[dict[str, Any]]:
        return deepcopy(self._decisions)

    @staticmethod
    def ledger_is_redacted(decisions: list[dict[str, Any]]) -> bool:
        import json as _json
        flat = _json.dumps(decisions, ensure_ascii=False)
        return not any(k in flat for k in ('"datasetDigest"', '"prompt"', '"text"'))
