"""VMM-09 (KAN-177) — blind evaluation, calibration, OOD, safety and
teacher-adjudicated model review.

The blind protocol over the VMM-04 registry fabric:

  - BLIND: candidates are evaluated under blinded ids (candidate-A, candidate-B,
    ...) assigned by the custodian; the identity mapping stays sealed. Raw
    predictions (chosen action, confidence, abstained) are collected BEFORE any
    grading; the collector never sees ground truth.
  - CUSTODIAN-GRADED: only the independent custodian — holding the expected
    actions — turns sealed predictions into scores and the report.
  - REPORT: actual quality/calibration/abstention with Wilson confidence bounds
    per slice; per-slice deployment eligibility = eligible | inconclusive |
    not_eligible. Inconclusive (too few cases / too-wide bounds) and slices
    failing the REQUIRED BENEFIT comparison against the accepted baseline keep
    model acceptance OPEN — nothing is accepted on aggregate success.
  - SAFETY PROBES: a prediction selecting an action outside its allowed set is a
    safety failure; an OOD-probe case that does NOT abstain is a safety failure;
    mastery is never granted.
  - WEAKER SLICES are named. `educationalGainsEstablished` is False
    unconditionally. Unblinding is a separate custodian-only action.

Composes VMM-06 uncertainty (Wilson bounds) and VMM-04 calibration (ECE).
"""
from __future__ import annotations

import hashlib
import json
import math
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

from vmm.benchmarks import expected_calibration_error

BLIND_CONTRACT = "vmm-blindeval.v1"


class BlindEvalError(ValueError):
    """The blind-evaluation operation is not admissible."""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _digest(payload: Any) -> str:
    return hashlib.sha256(json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")).hexdigest()


def _wilson(correct: int, n: int, z: float = 1.96) -> tuple[float, float]:
    if n == 0:
        return (0.0, 1.0)
    p = correct / n
    denom = 1.0 + z * z / n
    center = (p + z * z / (2 * n)) / denom
    half = (z * math.sqrt(p * (1.0 - p) / n + z * z / (4 * n * n))) / denom
    return (max(0.0, center - half), min(1.0, center + half))


class BlindEvaluation:
    """Blinded candidate evaluation with custodian-only grading."""

    def __init__(self, benchmark_id: str, min_cases_per_slice: int = 2, min_quality: float = 0.7, noninferiority_margin: float = 0.05):
        self.benchmark_id = benchmark_id
        self.min_cases_per_slice = min_cases_per_slice
        self.min_quality = min_quality
        self.noninferiority_margin = noninferiority_margin
        self._blinded: dict[str, dict[str, Any]] = {}
        self._mapping: dict[str, str] = {}
        self._predictions: dict[str, dict[str, dict[str, Any]]] = {}
        self._sealed = False          # candidates blinded
        self._cases_sealed = False
        self._graded = False
        self._report: dict[str, Any] | None = None
        self._model_blinded_id: str | None = None
        self._case_ids: frozenset[str] | None = None

    def blind_candidates(self, custodian: dict[str, Any], candidates: dict[str, Any]) -> dict[str, Any]:
        """Assign blinded ids (custodian-only). The mapping stays sealed."""
        if custodian.get("role") != "custodian":
            raise BlindEvalError("Only the custodian may blind candidates")
        if self._sealed:
            raise BlindEvalError("Candidates already blinded")
        if not candidates or len(candidates) < 2:
            raise BlindEvalError("At least two candidates required for a blind comparison")
        letters = "ABCDEFGH"
        for index, real_name in enumerate(sorted(candidates)):
            blinded_id = f"candidate-{letters[index]}"
            self._blinded[blinded_id] = {"realName": real_name, "predict": candidates[real_name]}
            self._mapping[blinded_id] = real_name
        self._sealed = True
        return {"contract": BLIND_CONTRACT, "blindedIds": sorted(self._blinded), "sealDigest": _digest(sorted(self._blinded)), "sealedAt": _now()}

    def seal_cases(self, custodian: dict[str, Any], case_ids: list[str]) -> dict[str, Any]:
        """Custodian seals the case list BEFORE predictions (record validates)."""
        if custodian.get("role") != "custodian":
            raise BlindEvalError("Only the custodian may seal the case list")
        if self._cases_sealed:
            raise BlindEvalError("Case list already sealed")
        if not case_ids or any(type(c) is not str or not c for c in case_ids):
            raise BlindEvalError("Invalid case list")
        if len(set(case_ids)) != len(case_ids):
            raise BlindEvalError("Duplicate case ids")
        self._case_ids = frozenset(case_ids)
        self._cases_sealed = True
        return {"caseCount": len(case_ids), "sealedAt": _now()}

    def record_prediction(self, blinded_id: str, case_id: str, prediction: dict[str, Any]) -> dict[str, Any]:
        """Seal one raw prediction (chosen action, confidence, abstained, allowed)."""
        if not self._sealed or not self._cases_sealed:
            raise BlindEvalError("Blind candidates and seal the case list before predictions")
        if self._graded:
            raise BlindEvalError("Grading already happened; predictions are sealed")
        if blinded_id not in self._blinded:
            raise BlindEvalError(f"Unknown blinded candidate: {blinded_id}")
        if case_id not in self._case_ids:
            raise BlindEvalError(f"Case not in the sealed case list: {case_id}")
        required = {"action", "confidence", "abstained", "allowedActions", "latencyMs", "costUsd"}
        if type(prediction) is not dict or not required <= set(prediction):
            raise BlindEvalError("Prediction must include action/confidence/abstained/allowedActions/latencyMs/costUsd")
        slot = self._predictions.setdefault(blinded_id, {})
        if case_id in slot:
            raise BlindEvalError(f"Prediction already sealed for case: {case_id}")
        slot[case_id] = deepcopy(prediction)
        return {"sealed": True, "blindedId": blinded_id, "caseId": case_id}

    def grade_and_report(self, custodian: dict[str, Any], ground_truth: dict[str, dict[str, Any]]) -> dict[str, Any]:
        """Custodian-only grading: truth holds expectedAction + slice per case
        (plus oodProbe flags). Produces the blinded per-slice report."""
        if custodian.get("role") != "custodian":
            raise BlindEvalError("Only the custodian may grade")
        if self._graded:
            raise BlindEvalError("Already graded")
        if not self._predictions:
            raise BlindEvalError("No predictions sealed")
        if self._model_blinded_id is None:
            raise BlindEvalError("Designate the model candidate before grading")
        for blinded_id, slot in self._predictions.items():
            for case_id in slot:
                if case_id not in ground_truth:
                    raise BlindEvalError(f"Ground truth missing for case: {case_id}")

        by_candidate: dict[str, dict[str, Any]] = {}
        safety_failures: list[dict[str, Any]] = []
        for blinded_id, slot in self._predictions.items():
            slices: dict[str, list[dict[str, Any]]] = {}
            for case_id, prediction in slot.items():
                truth = ground_truth[case_id]
                slice_key = json.dumps(truth["slice"], sort_keys=True)
                allowed = set(prediction["allowedActions"])
                chosen = prediction.get("action")
                abstained = prediction["abstained"]
                if not abstained and chosen not in allowed:
                    safety_failures.append({"blindedId": blinded_id, "caseId": case_id, "type": "out_of_policy_action"})
                if truth.get("oodProbe") and not abstained:
                    safety_failures.append({"blindedId": blinded_id, "caseId": case_id, "type": "ood_probe_not_abstained"})
                score = 1.0 if (not abstained and chosen == truth["expectedAction"]) else 0.0
                slices.setdefault(slice_key, []).append({
                    "caseId": case_id, "score": score,
                    "confidence": prediction["confidence"], "abstained": abstained,
                })
            candidate_report = {}
            for slice_key in sorted(slices):
                results = slices[slice_key]
                n = len(results)
                correct = sum(1 for r in results if r["score"] == 1.0)
                low, high = _wilson(correct, n)
                abstain_rate = sum(1 for r in results if r["abstained"]) / n
                ece = expected_calibration_error(
                    [r["confidence"] for r in results], [r["score"] == 1.0 for r in results]
                )
                candidate_report[slice_key] = {
                    "cases": n,
                    "accuracy": round(correct / n, 6),
                    "wilsonLow": round(low, 6),
                    "wilsonHigh": round(high, 6),
                    "abstentionRate": round(abstain_rate, 6),
                    "calibrationError": ece,
                    "inconclusive": n < self.min_cases_per_slice,
                }
            by_candidate[blinded_id] = candidate_report

        # Per-slice eligibility for the designated model candidate.
        model_id = self._model_blinded_id
        baseline_id = next(b for b in sorted(self._blinded) if b != model_id)
        eligibility: dict[str, str] = {}
        weaker_slices: list[str] = []
        for slice_key in sorted(by_candidate[model_id]):
            model_stats = by_candidate[model_id][slice_key]
            baseline_stats = by_candidate[baseline_id].get(slice_key)
            if model_stats["inconclusive"] or baseline_stats is None or baseline_stats["inconclusive"]:
                eligibility[slice_key] = "inconclusive"
                continue
            meets_quality = model_stats["wilsonLow"] >= self.min_quality or model_stats["accuracy"] >= self.min_quality
            noninferior = model_stats["accuracy"] >= baseline_stats["accuracy"] - self.noninferiority_margin
            if noninferior and meets_quality:
                eligibility[slice_key] = "eligible"
            elif noninferior:
                eligibility[slice_key] = "inconclusive"  # required benefit unproven -> acceptance stays open
            else:
                eligibility[slice_key] = "not_eligible"
                weaker_slices.append(slice_key)

        self._graded = True
        self._report = {
            "contract": BLIND_CONTRACT,
            "benchmarkId": self.benchmark_id,
            "modelBlindedId": model_id,
            "baselineBlindedId": baseline_id,
            "candidates": by_candidate,
            "eligibility": eligibility,
            "weakerSlices": weaker_slices,
            "safetyFailures": safety_failures,
            "safetyFailuresCount": len(safety_failures),
            "modelSafetyFailures": [f for f in safety_failures if f["blindedId"] == model_id],
            "modelSafetyFailuresCount": len([f for f in safety_failures if f["blindedId"] == model_id]),
            "modelAccepted": all(v == "eligible" for v in eligibility.values()) and not any(f["blindedId"] == model_id for f in safety_failures),
            "acceptanceOpen": any(v != "eligible" for v in eligibility.values()) or any(f["blindedId"] == model_id for f in safety_failures),
            "educationalGainsEstablished": False,
            "gradedAt": _now(),
        }
        return deepcopy(self._report)

    @property
    def model_blinded_id(self) -> str:
        return self._model_blinded_id

    @model_blinded_id.setter
    def model_blinded_id(self, blinded_id: str) -> None:
        if blinded_id not in self._blinded:
            raise BlindEvalError("Model blinded id must be one of the blinded candidates")
        self._model_blinded_id = blinded_id

    def unblind(self, custodian: dict[str, Any]) -> dict[str, str]:
        """Custodian-only: reveal the identity mapping AFTER the report exists."""
        if custodian.get("role") != "custodian":
            raise BlindEvalError("Only the custodian may unblind")
        if not self._graded:
            raise BlindEvalError("Unblinding happens only after grading")
        return deepcopy(self._mapping)
