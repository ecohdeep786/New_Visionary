"""VOCR-02 (KAN-193) — the English launch OCR benchmark harness.

The per-slice evaluation harness the hosted engine run plugs into (composes
the VMM-04 registry's pre-registration + grading pattern):

  - NAMED SLICES: print / handwriting / camera / layout / formula / table —
    each gated INDEPENDENTLY (per-slice noninferiority, no aggregate pass).
  - PRE-REGISTERED THRESHOLDS per slice: character-error-rate (CER), word
    accuracy, correction rate, abstention rate — registered by the custodian
    BEFORE measurement; results bind the thresholds digest.
  - MEASUREMENT: an ENGINE SEAM (real engines hosted-gated) is invoked per
    case; the harness computes CER via Levenshtein distance (stdlib), word
    accuracy, abstention, latency and per-case cost.
  - DOWNSTREAM ERROR + CORRECTION: each case records whether an OCR error
    would propagate downstream (into assessment) and whether a correction
    exists — reported per slice.
  - VERDICT: per-slice evidence/cost/abstention with the registry verdict;
    overall qualified only when EVERY slice passes.

This harness does NOT run real engines — synthetic engines prove the contract;
the real corpus and engines remain hosted-gated.
"""
from __future__ import annotations

import json
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

OCR_BENCH_CONTRACT = "vmocr-benchmark.v1"
SLICES = ("print", "handwriting", "camera", "layout", "formula", "table")


class OcrBenchmarkError(ValueError):
    """The OCR benchmark operation is not admissible."""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def levenshtein(a: str, b: str) -> int:
    """Stdlib Levenshtein distance (deterministic)."""
    if len(a) < len(b):
        a, b = b, a
    previous = list(range(len(b) + 1))
    for i, ca in enumerate(a):
        current = [i + 1]
        for j, cb in enumerate(b):
            current.append(min(previous[j + 1] + 1, current[j] + 1, previous[j] + (ca != cb)))
        previous = current
    return previous[-1]


def character_error_rate(expected: str, actual: str) -> float:
    if not expected:
        return 0.0 if not actual else 1.0
    return round(levenshtein(expected, actual) / len(expected), 6)


def word_accuracy(expected: str, actual: str) -> float:
    expected_words, actual_words = expected.split(), actual.split()
    if not expected_words:
        return 1.0 if not actual_words else 0.0
    distance = levenshtein(expected_words, actual_words)
    return round(1.0 - distance / len(expected_words), 6)


class OcrBenchmarkHarness:
    def __init__(self, benchmark_id: str):
        self.benchmark_id = benchmark_id
        self._thresholds: dict[str, dict[str, float]] | None = None
        self._thresholds_digest: str | None = None
        self._measurements: dict[str, list[dict[str, Any]]] = {}

    def preregister(self, custodian: dict[str, Any], thresholds: dict[str, dict[str, float]]) -> dict[str, Any]:
        """Per-slice thresholds BEFORE measurement (custodian-only)."""
        if custodian.get("role") != "custodian":
            raise OcrBenchmarkError("Only the custodian may preregister")
        if self._thresholds is not None:
            raise OcrBenchmarkError("Thresholds already registered")
        if set(thresholds) != set(SLICES):
            raise OcrBenchmarkError(f"Thresholds must cover exactly the named slices: {SLICES}")
        clean: dict[str, dict[str, float]] = {}
        for slice_name, bounds in thresholds.items():
            if type(bounds) is not dict or not {"maxCer", "minWordAccuracy", "maxCorrectionRate", "maxAbstentionRate"} <= set(bounds):
                raise OcrBenchmarkError(f"Slice '{slice_name}' thresholds need maxCer/minWordAccuracy/maxCorrectionRate/maxAbstentionRate")
            clean[slice_name] = {k: float(v) for k, v in bounds.items()}
        self._thresholds = clean
        self._thresholds_digest = _digest(clean)
        return deepcopy(clean)

    def measure(self, runner: dict[str, Any], engine, cases: list[dict[str, Any]]) -> dict[str, Any]:
        """Run the engine seam per case; per-slice metrics computed (runner records)."""
        if self._thresholds is None:
            raise OcrBenchmarkError("Thresholds must be preregistered before measurement")
        if runner.get("role") != "runner":
            raise OcrBenchmarkError("Measurement is runner-recorded")
        by_slice: dict[str, list[dict[str, Any]]] = {}
        for case in cases:
            if type(case) is not dict or not {"caseId", "slice", "expectedText", "correctionProbe"} <= set(case):
                raise OcrBenchmarkError("Case fields must be caseId/slice/expectedText/correctionProbe")
            slice_name = case["slice"]
            if slice_name not in SLICES:
                raise OcrBenchmarkError(f"Unknown slice: {slice_name}")
            out = engine.invoke(case)
            if type(out) is not dict or not {"text", "abstained", "latencyMs", "costUsd", "corrected"} <= set(out):
                raise OcrBenchmarkError("Engine output must include text/abstained/latencyMs/costUsd/corrected")
            cer = 0.0 if out["abstained"] else character_error_rate(case["expectedText"], out["text"])
            word_acc = 1.0 if out["abstained"] else word_accuracy(case["expectedText"], out["text"])
            by_slice.setdefault(slice_name, []).append({
                "caseId": case["caseId"],
                "cer": cer,
                "wordAccuracy": word_acc,
                "abstained": out["abstained"],
                "latencyMs": out["latencyMs"],
                "costUsd": out["costUsd"],
                "downstreamError": (not out["abstained"]) and cer > 0.3,  # would propagate into assessment
                "corrected": bool(out["corrected"]),
            })
        for slice_name, results in by_slice.items():
            self._measurements.setdefault(slice_name, []).append({"run": deepcopy(results), "thresholdsDigest": self._thresholds_digest, "measuredAt": _now()})
        return {"measuredCases": sum(len(v) for v in by_slice.values()), "slices": sorted(by_slice)}

    def report(self, custodian: dict[str, Any]) -> dict[str, Any]:
        """Custodian-only per-slice verdict + overall qualification."""
        if custodian.get("role") != "custodian":
            raise OcrBenchmarkError("Only the custodian may issue the report")
        if not self._measurements:
            raise OcrBenchmarkError("No measurements recorded")
        slice_reports = []
        overall = True
        for slice_name in SLICES:
            runs = self._measurements.get(slice_name, [])
            if not runs:
                slice_reports.append({"slice": slice_name, "cases": 0, "qualified": False, "inconclusive": True, "reason": "no_measurement"})
                overall = False
                continue
            results = runs[-1]["run"]
            n = len(results)
            mean_cer = sum(r["cer"] for r in results) / n
            mean_word_acc = sum(r["wordAccuracy"] for r in results) / n
            abstention = sum(1 for r in results if r["abstained"]) / n
            correction_rate = sum(1 for r in results if r["corrected"]) / n
            downstream_errors = sum(1 for r in results if r["downstreamError"])
            bounds = self._thresholds[slice_name]
            qualified = (
                mean_cer <= bounds["maxCer"]
                and mean_word_acc >= bounds["minWordAccuracy"]
                and correction_rate <= bounds["maxCorrectionRate"]
                and abstention <= bounds["maxAbstentionRate"]
            )
            if not qualified:
                overall = False
            slice_reports.append({
                "slice": slice_name,
                "cases": n,
                "meanCer": round(mean_cer, 6),
                "meanWordAccuracy": round(mean_word_acc, 6),
                "abstentionRate": round(abstention, 6),
                "correctionRate": round(correction_rate, 6),
                "downstreamErrorCount": downstream_errors,
                "maxLatencyMs": max(r["latencyMs"] for r in results),
                "totalCostUsd": round(sum(r["costUsd"] for r in results), 6),
                "qualified": qualified,
            })
        return {
            "contract": OCR_BENCH_CONTRACT,
            "benchmarkId": self.benchmark_id,
            "thresholdsDigest": self._thresholds_digest,
            "slices": slice_reports,
            "overallQualified": overall,
            "note": "Synthetic-engine measurements prove the harness; the real engine run remains hosted-gated.",
            "reportedAt": _now(),
        }


def _digest(payload: Any) -> str:
    import hashlib

    return hashlib.sha256(json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")).hexdigest()
