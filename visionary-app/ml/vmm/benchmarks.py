"""VMM-04 (KAN-172) — independent hidden-set benchmark registry.

The benchmark contract for candidate selection across roles, subjects and
modalities (extensible to cross-session goals/corrections, tool-based Build
and transfer cases — the KAN-203 dimensions):

  - PRE-REGISTRATION IS ENFORCED: numerical thresholds (quality, calibration,
    per-slice noninferiority, abstention, p95 latency, cost) plus a sample/
    power rationale must be registered by the INDEPENDENT CUSTODIAN before any
    evaluation exists. Thresholds are immutable once registered; an evaluation
    recorded against a different thresholds digest is refused.
  - HIDDEN CASES ARE CUSTODIAN-SEALED: the registry stores case digests and
    slice metadata only — expected answers never enter runner-readable records.
    The seal digest commits the exact case set before evaluation.
  - GRADING IS CUSTODIAN-ONLY: the candidate runner records raw per-case
    results; the independent custodian (a different actor) grades.
  - PER-SLICE NONINFERIORITY: every slice (role x subject x modality, plus
    transfer/cross-session/tool-build dimensions) must independently meet the
    registered thresholds — aggregate success alone never passes.
  - ENGINEERING BENCHMARK SUCCESS DOES NOT ESTABLISH EDUCATIONAL GAINS: the
    verdict records `educationalGainsEstablished: False` unconditionally.

Composes VMM-03 (ontology/exclusions) and VMM-02 (signing) where registries
are persisted; this module is the grading/sealing contract.
"""
from __future__ import annotations

import hashlib
import json
import math
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

BENCH_CONTRACT = "vmm-benchmark.v1"

ROLES = ("student", "teacher", "parent", "professional", "organization")
MODALITIES = ("text", "speech", "image", "multimodal")
SLICE_DIMENSIONS = ("role", "subject", "modality", "transfer", "crossSession", "toolBuild")

_MAX_TEXT = 400


class BenchmarkError(ValueError):
    """The benchmark registry operation is not admissible."""


def _text(value: Any, field: str, maximum: int = _MAX_TEXT) -> str:
    if type(value) is not str or not value.strip() or len(value) > maximum:
        raise BenchmarkError(f"Invalid {field}")
    return value


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _digest(payload: Any) -> str:
    return hashlib.sha256(json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")).hexdigest()


def _p95(values: list[float]) -> float:
    if not values:
        raise BenchmarkError("No latency samples")
    ordered = sorted(values)
    return ordered[min(len(ordered) - 1, int(math.ceil(0.95 * len(ordered))) - 1)]


def expected_calibration_error(confidences: list[float], correct: list[bool], bins: int = 10) -> float:
    """Binned ECE over (confidence, correctness) pairs — stdlib, deterministic."""
    if len(confidences) != len(correct) or not confidences:
        raise BenchmarkError("Calibration inputs must be aligned and non-empty")
    bucket = [0.0, 0.0, 0.0] * bins
    counts = [0] * bins
    for confidence, was_correct in zip(confidences, correct):
        if type(confidence) not in (int, float) or not 0.0 <= float(confidence) <= 1.0:
            raise BenchmarkError("Confidence must be within [0,1]")
        index = min(bins - 1, int(float(confidence) * bins))
        bucket[index * 3] += float(confidence)
        bucket[index * 3 + 1] += 1.0 if was_correct else 0.0
        counts[index] += 1
    total = float(len(confidences))
    ece = 0.0
    for i in range(bins):
        if counts[i] == 0:
            continue
        avg_confidence = bucket[i * 3] / counts[i]
        accuracy = bucket[i * 3 + 1] / counts[i]
        ece += (counts[i] / total) * abs(accuracy - avg_confidence)
    return round(ece, 6)


class BenchmarkRegistry:
    """Custodian-controlled registry: preregister -> seal -> evaluate -> grade."""

    def __init__(self, benchmark_id: str):
        self.benchmark_id = _text(benchmark_id, "benchmark id", 80)
        self._thresholds: dict[str, Any] | None = None
        self._thresholds_digest: str | None = None
        self._cases: dict[str, dict[str, Any]] = {}
        self._seal: dict[str, Any] | None = None
        self._evaluations: list[dict[str, Any]] = []

    # ---- custodian: preregistration ---------------------------------------

    def preregister(
        self,
        custodian: dict[str, Any],
        min_quality: float,
        noninferiority_margin: float,
        max_calibration_error: float,
        max_abstention_rate: float,
        p95_latency_ms: int,
        max_per_task_cost_usd: float,
        min_cases_per_slice: int,
        sample_rationale: str,
    ) -> dict[str, Any]:
        """Pre-register thresholds BEFORE any evaluation (custodian-only)."""
        if custodian.get("role") != "custodian":
            raise BenchmarkError("Only the independent custodian may preregister thresholds")
        if self._evaluations:
            raise BenchmarkError("Thresholds must be registered before any evaluation")
        if self._thresholds is not None:
            raise BenchmarkError("Thresholds already registered")
        for name, value, bound in [
            ("min_quality", min_quality, (0.0, 1.0)),
            ("max_calibration_error", max_calibration_error, (0.0, 1.0)),
            ("max_abstention_rate", max_abstention_rate, (0.0, 1.0)),
        ]:
            if type(value) not in (int, float) or not bound[0] <= value <= bound[1]:
                raise BenchmarkError(f"Invalid {name}")
        if type(noninferiority_margin) not in (int, float) or not 0.0 <= noninferiority_margin <= 1.0:
            raise BenchmarkError("Invalid noninferiority_margin")
        if type(p95_latency_ms) is not int or p95_latency_ms <= 0:
            raise BenchmarkError("Invalid p95_latency_ms")
        if type(max_per_task_cost_usd) not in (int, float) or max_per_task_cost_usd < 0:
            raise BenchmarkError("Invalid max_per_task_cost_usd")
        if type(min_cases_per_slice) is not int or min_cases_per_slice < 1:
            raise BenchmarkError("Invalid min_cases_per_slice")
        _text(sample_rationale, "sample rationale", 1000)
        if len(sample_rationale) < 40:
            raise BenchmarkError("Sample/power rationale required (>=40 chars)")

        self._thresholds = {
            "contract": BENCH_CONTRACT,
            "benchmarkId": self.benchmark_id,
            "minQuality": float(min_quality),
            "noninferiorityMargin": float(noninferiority_margin),
            "maxCalibrationError": float(max_calibration_error),
            "maxAbstentionRate": float(max_abstention_rate),
            "p95LatencyMs": p95_latency_ms,
            "maxPerTaskCostUsd": float(max_per_task_cost_usd),
            "minCasesPerSlice": min_cases_per_slice,
            "sampleRationale": sample_rationale,
            "registeredBy": _text(custodian.get("uid"), "custodian uid", 80),
            "registeredAt": _now(),
        }
        self._thresholds_digest = _digest(self._thresholds)
        return deepcopy(self._thresholds)

    @property
    def thresholds_digest(self) -> str | None:
        return self._thresholds_digest

    def thresholds(self) -> dict[str, Any] | None:
        return deepcopy(self._thresholds)

    # ---- custodian: hidden set sealing ------------------------------------

    def seal_hidden_set(self, custodian: dict[str, Any], cases: list[dict[str, Any]]) -> dict[str, Any]:
        """Seal the hidden set. Runner-readable records carry digests + slices
        only — expected answers NEVER enter this registry."""
        if custodian.get("role") != "custodian":
            raise BenchmarkError("Only the independent custodian may seal the hidden set")
        if self._thresholds is None:
            raise BenchmarkError("Preregister thresholds before sealing the hidden set")
        if not cases:
            raise BenchmarkError("Hidden set is empty")
        clean: list[dict[str, Any]] = []
        for case in cases:
            if type(case) is not dict or set(case) != {"caseId", "slice", "contentDigest", "graderRef"}:
                raise BenchmarkError("Hidden case fields must be caseId/slice/contentDigest/graderRef")
            case_id = _text(case["caseId"], "case id", 80)
            slice_meta = case["slice"]
            if type(slice_meta) is not dict or not {"role", "subject", "modality"} <= set(slice_meta):
                raise BenchmarkError("Hidden case slice needs role/subject/modality")
            if slice_meta["role"] not in ROLES or slice_meta["modality"] not in MODALITIES:
                raise BenchmarkError("Unknown slice role/modality")
            digest = case["contentDigest"]
            if type(digest) is not str or len(digest) != 64:
                raise BenchmarkError("Invalid case content digest")
            if "expected" in json.dumps(case):
                raise BenchmarkError("Expected answers must never enter the registry")
            clean.append({
                "caseId": case_id,
                "slice": {k: slice_meta[k] for k in sorted(slice_meta)},
                "contentDigest": digest.lower(),
                "graderRef": _text(case["graderRef"], "grader ref", 120),
            })
        if len({c["caseId"] for c in clean}) != len(clean):
            raise BenchmarkError("Duplicate hidden case ids")
        seal_digest = _digest({"benchmarkId": self.benchmark_id, "cases": sorted(clean, key=lambda c: c["caseId"])})
        self._cases = {c["caseId"]: c for c in clean}
        self._seal = {"benchmarkId": self.benchmark_id, "sealDigest": seal_digest, "caseCount": len(clean), "sealedAt": _now()}
        return deepcopy(self._seal)

    def cases(self) -> list[dict[str, Any]]:
        """Runner-visible view: slices + digests only; expected keys never exist."""
        return [deepcopy(c) for c in sorted(self._cases.values(), key=lambda c: c["caseId"])]

    def seal(self) -> dict[str, Any] | None:
        return deepcopy(self._seal)

    # ---- runner: evaluation recording -------------------------------------

    def record_evaluation(self, runner: dict[str, Any], candidate_id: str, results: list[dict[str, Any]]) -> dict[str, Any]:
        """Record raw per-case results (runner role). Custodian grading is separate."""
        if self._thresholds is None or self._thresholds_digest is None:
            raise BenchmarkError("Thresholds must be preregistered before evaluation")
        if self._seal is None:
            raise BenchmarkError("Hidden set must be sealed before evaluation")
        _text(candidate_id, "candidate id", 80)
        if not results:
            raise BenchmarkError("Empty evaluation results")
        accepted = 0
        for result in results:
            if type(result) is not dict or set(result) != {"caseId", "score", "confidence", "abstained", "latencyMs", "costUsd"}:
                raise BenchmarkError("Result fields must be caseId/score/confidence/abstained/latencyMs/costUsd")
            if result["caseId"] not in self._cases:
                raise BenchmarkError(f"Unknown hidden case: {result['caseId']}")
            for name, value in [("score", result["score"]), ("confidence", result["confidence"])]:
                if type(value) not in (int, float) or not 0.0 <= value <= 1.0:
                    raise BenchmarkError(f"Invalid {name}")
            if type(result["abstained"]) is not bool:
                raise BenchmarkError("abstained must be a bool")
            if result["abstained"] and result["score"] != 0.0:
                raise BenchmarkError("Abstained results score 0")
            if type(result["latencyMs"]) is not int or result["latencyMs"] < 0:
                raise BenchmarkError("Invalid latencyMs")
            if type(result["costUsd"]) not in (int, float) or result["costUsd"] < 0:
                raise BenchmarkError("Invalid costUsd")
            accepted += 1
        entry = {
            "candidateId": candidate_id,
            "runner": _text(runner.get("uid"), "runner uid", 80),
            "thresholdsDigest": self._thresholds_digest,
            "sealDigest": self._seal["sealDigest"],
            "results": deepcopy(results),
            "recordedAt": _now(),
        }
        self._evaluations.append(entry)
        return {"accepted": accepted, "candidateId": candidate_id}

    # ---- custodian: grading ------------------------------------------------

    def grade(self, grader: dict[str, Any], candidate_id: str) -> dict[str, Any]:
        """Independent custodian grades against the pre-registered thresholds."""
        if grader.get("role") != "custodian":
            raise BenchmarkError("Only the independent custodian may grade")
        if grader.get("uid") is None:
            raise BenchmarkError("Grader identity required")
        evaluations = [e for e in self._evaluations if e["candidateId"] == candidate_id]
        if not evaluations:
            raise BenchmarkError("No evaluation recorded for this candidate")
        thresholds = self._thresholds or {}
        # All recorded evaluations must bind the SAME pre-registered thresholds.
        if any(e["thresholdsDigest"] != self._thresholds_digest for e in evaluations):
            raise BenchmarkError("Evaluation binds different thresholds")

        merged: dict[str, dict[str, Any]] = {}
        for evaluation in evaluations:
            for result in evaluation["results"]:
                merged[result["caseId"]] = result
        by_slice: dict[str, list[dict[str, Any]]] = {}
        for case_id, result in merged.items():
            slice_meta = self._cases[case_id]["slice"]
            key = json.dumps(slice_meta, sort_keys=True)
            by_slice.setdefault(key, []).append(result)

        slice_reports = []
        all_scores: list[float] = []
        all_confidences: list[float] = []
        all_correct: list[bool] = []
        all_latencies: list[int] = []
        all_costs: list[float] = []
        all_abstentions = 0
        for key in sorted(by_slice):
            results = by_slice[key]
            slice_meta = json.loads(key)
            n = len(results)
            mean_score = sum(r["score"] for r in results) / n
            abstention_rate = sum(1 for r in results if r["abstained"]) / n
            latencies = [r["latencyMs"] for r in results]
            max_cost = max(r["costUsd"] for r in results)
            ece = expected_calibration_error([r["confidence"] for r in results], [r["score"] >= 0.5 and not r["abstained"] for r in results])
            noninferior = (
                mean_score >= thresholds["minQuality"] - thresholds["noninferiorityMargin"]
                and abstention_rate <= thresholds["maxAbstentionRate"]
                and _p95(latencies) <= thresholds["p95LatencyMs"]
                and max_cost <= thresholds["maxPerTaskCostUsd"]
                and ece <= thresholds["maxCalibrationError"]
                and n >= thresholds["minCasesPerSlice"]
            )
            slice_reports.append({
                "slice": slice_meta,
                "cases": n,
                "meanScore": round(mean_score, 6),
                "abstentionRate": round(abstention_rate, 6),
                "p95LatencyMs": _p95(latencies),
                "maxCostUsd": round(max_cost, 6),
                "calibrationError": ece,
                "noninferior": noninferior,
            })
            for r in results:
                all_scores.append(r["score"])
                all_confidences.append(r["confidence"])
                all_correct.append(r["score"] >= 0.5 and not r["abstained"])
                all_latencies.append(r["latencyMs"])
                all_costs.append(r["costUsd"])
                all_abstentions += 1 if r["abstained"] else 0

        engineering_success = all(s["noninferior"] for s in slice_reports)
        overall_abstention = all_abstentions / len(all_scores) if all_scores else 1.0
        engineering_success = engineering_success and overall_abstention <= thresholds["maxAbstentionRate"]
        engineering_success = engineering_success and _p95(all_latencies) <= thresholds["p95LatencyMs"]
        engineering_success = engineering_success and max(all_costs) <= thresholds["maxPerTaskCostUsd"]
        engineering_success = engineering_success and expected_calibration_error(all_confidences, all_correct) <= thresholds["maxCalibrationError"]

        return {
            "contract": BENCH_CONTRACT,
            "benchmarkId": self.benchmark_id,
            "candidateId": candidate_id,
            "thresholdsDigest": self._thresholds_digest,
            "engineeringBenchmarkSuccess": engineering_success,
            "educationalGainsEstablished": False,
            "note": "Engineering benchmark success does not establish educational gains.",
            "slices": slice_reports,
            "overall": {
                "cases": len(all_scores),
                "meanScore": round(sum(all_scores) / len(all_scores), 6) if all_scores else 0.0,
                "abstentionRate": round(overall_abstention, 6),
                "p95LatencyMs": _p95(all_latencies),
                "maxCostUsd": round(max(all_costs), 6),
                "calibrationError": expected_calibration_error(all_confidences, all_correct),
            },
            "gradedBy": _text(grader.get("uid"), "grader uid", 80),
            "gradedAt": _now(),
        }
