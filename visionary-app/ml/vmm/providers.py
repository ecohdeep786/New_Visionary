"""VMM-15 (KAN-183) — frontier provider qualification behind stable
capability-based adapters.

The provider-selection contract feeding the VMM-14 routing table:

  - STABLE ADAPTERS: every provider exposes a pinned adapter version; the SAME
    adapter version must be used at qualification AND at serve time — a
    mismatch refuses the route.
  - THRESHOLDS PRE-REGISTERED, MEASUREMENT REPRODUCIBLE: quality, tools,
    English grounding, data terms, latency and cost are gated by thresholds the
    custodian registers BEFORE any measurement; the measured results bind the
    thresholds digest.
  - NO BRAND RANKING: qualification is thresholds-based per provider — the
    registry offers NO provider ranking operation. Consumer-chat availability
    is NOT qualification: a consumer-available provider that fails the task
    thresholds is not qualified.
  - DATA TERMS ARE MANDATORY: a provider without accepted data terms
    (retention/region/training-use) is never qualified for private tasks.
  - CAPABILITY-BASED ROUTING: qualified providers resolve per capability in a
    deterministic fallback order; unqualified providers never route.

Provider adapters are SEAMS: the contract ships with synthetic adapters for the
tests; real provider calls require hosted access and remain a separate gate.
"""
from __future__ import annotations

import hashlib
import json
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

PROVIDER_CONTRACT = "vmm-providers.v1"
CAPABILITIES = ("teach", "reason", "build")


class ProviderError(ValueError):
    """The provider qualification operation is not admissible."""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _digest(payload: Any) -> str:
    return hashlib.sha256(json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")).hexdigest()


class ProviderQualification:
    """Thresholds -> measurement -> verdict per provider, thresholds-based."""

    def __init__(self):
        self._thresholds: dict[str, Any] | None = None
        self._thresholds_digest: str | None = None
        self._profiles: dict[str, dict[str, Any]] = {}
        self._measurements: dict[str, list[dict[str, Any]]] = {}
        self._verdicts: dict[str, dict[str, Any]] = {}

    def preregister_thresholds(self, custodian: dict[str, Any], thresholds: dict[str, Any]) -> dict[str, Any]:
        if custodian.get("role") != "custodian":
            raise ProviderError("Only the custodian may preregister thresholds")
        if self._thresholds is not None:
            raise ProviderError("Thresholds already preregistered")
        required = {"minTaskQuality", "maxLatencyMs", "maxPerTaskCostUsd", "minEnglishGrounding", "minSamples"}
        if type(thresholds) is not dict or not required <= set(thresholds):
            raise ProviderError(f"Thresholds must include {sorted(required)}")
        if type(thresholds["minSamples"]) is not int or thresholds["minSamples"] < 1:
            raise ProviderError("Invalid minSamples")
        for name in ("minTaskQuality", "minEnglishGrounding"):
            if type(thresholds[name]) not in (int, float) or not 0.0 <= thresholds[name] <= 1.0:
                raise ProviderError(f"Invalid {name}")
        if type(thresholds["maxLatencyMs"]) is not int or thresholds["maxLatencyMs"] <= 0:
            raise ProviderError("Invalid maxLatencyMs")
        if type(thresholds["maxPerTaskCostUsd"]) not in (int, float) or thresholds["maxPerTaskCostUsd"] < 0:
            raise ProviderError("Invalid maxPerTaskCostUsd")
        thresholds = {**thresholds, "preregisteredAt": _now()}
        self._thresholds = thresholds
        self._thresholds_digest = _digest(thresholds)
        return deepcopy(thresholds)

    def register_profile(
        self,
        provider_id: str,
        capabilities: list[str],
        adapter_version: str,
        data_terms: dict[str, Any],
        consumer_chat_available: bool,
        tools: list[str],
    ) -> dict[str, Any]:
        """Register a provider profile: data terms MANDATORY, adapter pinned."""
        if self._thresholds is None:
            raise ProviderError("Preregister thresholds before profiles")
        if type(provider_id) is not str or not provider_id or len(provider_id) > 80:
            raise ProviderError("Invalid provider id")
        if not capabilities or any(c not in CAPABILITIES for c in capabilities):
            raise ProviderError("Invalid capabilities")
        if type(adapter_version) is not str or not adapter_version:
            raise ProviderError("Adapter version must be pinned")
        required_terms = {"retention", "region", "trainingUse"}
        if type(data_terms) is not dict or not required_terms <= set(data_terms):
            raise ProviderError("Data terms (retention/region/trainingUse) are mandatory")
        if not isinstance(tools, list):
            raise ProviderError("Invalid tools")
        profile = {
            "providerId": provider_id,
            "capabilities": sorted(set(capabilities)),
            "adapterVersion": adapter_version,
            "dataTerms": deepcopy(data_terms),
            "consumerChatAvailable": consumer_chat_available,
            "tools": sorted(set(tools)),
        }
        self._profiles[provider_id] = profile
        self._measurements[provider_id] = []
        return deepcopy(profile)

    def measure(self, provider_id: str, adapter, tasks: list[dict[str, Any]]) -> dict[str, Any]:
        """Measure through the STABLE adapter; results bind the thresholds digest.

        tasks: [{grounded: bool, toolsUsed: [str]}] — the adapter returns
        {score, latencyMs, costUsd} per task.
        """
        thresholds = self._thresholds
        if thresholds is None:
            raise ProviderError("Thresholds not preregistered")
        profile = self._profiles.get(provider_id)
        if profile is None:
            raise ProviderError("Unknown provider profile")
        if adapter.version() != profile["adapterVersion"]:
            raise ProviderError("Adapter version mismatch: the serve-time adapter must equal the qualified one")
        if len(tasks) < thresholds["minSamples"]:
            raise ProviderError("Insufficient samples for the pre-registered power")

        results = []
        for task in tasks:
            out = adapter.invoke(task)
            if type(out) is not dict or not {"score", "latencyMs", "costUsd"} <= set(out):
                raise ProviderError("Adapter output must include score/latencyMs/costUsd")
            results.append({
                "score": float(out["score"]),
                "latencyMs": int(out["latencyMs"]),
                "costUsd": float(out["costUsd"]),
                "grounded": bool(task.get("grounded", False)),
                "toolsUsed": list(task.get("toolsUsed", [])),
            })
        self._measurements[provider_id] = results
        return {"measured": len(results), "thresholdsDigest": self._thresholds_digest}

    def qualify(self, provider_id: str, custodian: dict[str, Any]) -> dict[str, Any]:
        """Thresholds-based verdict. Consumer-chat availability is irrelevant."""
        if custodian.get("role") != "custodian":
            raise ProviderError("Only the custodian may issue a qualification verdict")
        thresholds = self._thresholds
        profile = self._profiles.get(provider_id)
        results = self._measurements.get(provider_id, [])
        if profile is None or not results:
            raise ProviderError("Profile + measurement required before a verdict")

        mean_quality = sum(r["score"] for r in results) / len(results)
        p95_latency = sorted(r["latencyMs"] for r in results)[min(len(results) - 1, int(0.95 * len(results)) - 1)]
        max_cost = max(r["costUsd"] for r in results)
        grounding_rate = sum(1 for r in results if r["grounded"]) / len(results)
        tools_supported = all(t in profile["tools"] for r in results for t in r["toolsUsed"])

        failures = []
        if mean_quality < thresholds["minTaskQuality"]:
            failures.append("task_quality")
        if p95_latency > thresholds["maxLatencyMs"]:
            failures.append("latency")
        if max_cost > thresholds["maxPerTaskCostUsd"]:
            failures.append("cost")
        if grounding_rate < thresholds["minEnglishGrounding"]:
            failures.append("english_grounding")
        if not tools_supported:
            failures.append("tools")
        # Data terms must be ACCEPTED (trainingUse 'none' or explicit owner
        # approval; region recorded) — a provider without accepted terms is
        # never qualified for private tasks.
        terms = profile["dataTerms"]
        terms_accepted = terms.get("trainingUse") == "none" and terms.get("retention") not in (None, "", "unlimited")

        verdict = {
            "contract": PROVIDER_CONTRACT,
            "providerId": provider_id,
            "capabilities": profile["capabilities"],
            "adapterVersion": profile["adapterVersion"],
            "thresholdsDigest": self._thresholds_digest,
            "meanTaskQuality": round(mean_quality, 6),
            "p95LatencyMs": p95_latency,
            "maxPerTaskCostUsd": round(max_cost, 6),
            "englishGroundingRate": round(grounding_rate, 6),
            "failures": failures,
            "dataTermsAccepted": terms_accepted,
            "qualified": not failures and terms_accepted,
            "consumerChatAvailableIrrelevant": True,
            "decidedBy": custodian.get("uid"),
            "decidedAt": _now(),
        }
        self._verdicts[provider_id] = verdict
        return deepcopy(verdict)

    def capability_route(self, capability: str) -> dict[str, Any]:
        """Deterministic qualified-provider fallback order per capability."""
        if capability not in CAPABILITIES:
            raise ProviderError("Unknown capability")
        qualified = [
            self._verdicts[pid] for pid in sorted(self._verdicts)
            if self._verdicts[pid]["qualified"] and capability in self._verdicts[pid]["capabilities"]
        ]
        return {
            "contract": PROVIDER_CONTRACT,
            "capability": capability,
            "qualifiedProviders": [{"providerId": v["providerId"], "adapterVersion": v["adapterVersion"]} for v in qualified],
            "note": "Thresholds-based qualification; never a brand ranking.",
        }

    def refuse_ranking(self) -> None:
        """The registry has NO provider-ranking operation (contract proof)."""
        raise ProviderError("Provider ranking does not exist: qualification is thresholds-based per provider")
