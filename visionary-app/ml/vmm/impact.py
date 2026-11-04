"""VMM-21 (KAN-189) — evaluate ACTUAL tutoring and Build learning impact,
strictly separate from ML classification metrics.

  - VERIFIED OUTCOMES ONLY: an impact record exists only for a BACKEND-assessed
    transition (the teaching loop's own assessed check) — self-assessed or
    frontend-claimed outcomes are refused.
  - SEPARATION INVARIANT: benchmark/fluency scores live in a SEPARATE ledger
    and can never enter, weight or decorate an impact record — deriving impact
    from benchmarks is contract-refused. Tested educational benefit (gain in
    backend-assessed pKnown) is the only impact currency.
  - RETENTION / TRANSFER: delay-tagged assessment kinds record how long the
    gain held and whether it transferred to a different context.
  - STAKEHOLDER USEFULNESS: teacher/guardian/professional feedback is a
    separate ledger with bounded ratings — reported, never mixed into gains.
  - HONEST UNCERTAINTY: evaluation requires a pinned reviewed protocol and a
    minimum cohort; it reports mean gain with standard error, never a bare
    point estimate.
"""
from __future__ import annotations

import statistics
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

IMPACT_CONTRACT = "vmm-impact.v1"
ASSESSED_KINDS = ("tutoring", "build", "retention", "transfer")
STAKEHOLDER_ROLES = ("teacher", "guardian", "professional")
MIN_COHORT = 12


class ImpactError(ValueError):
    """The impact operation is not admissible."""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class LearningImpactEvaluator:
    def __init__(self, protocol_version: str):
        if type(protocol_version) is not str or not protocol_version:
            raise ImpactError("A pinned reviewed protocol version is required")
        self._protocol = protocol_version
        self._impacts: list[dict[str, Any]] = []
        self._benchmarks: list[dict[str, Any]] = []
        self._stakeholder: list[dict[str, Any]] = []

    def record_assessment(self, actor: dict[str, Any], learner_uid: str, kind: str, p_known_before: float, p_known_after: float, delay_days: int = 0) -> dict[str, Any]:
        if actor.get("assessedBy") != "backend":
            raise ImpactError("Only backend-assessed outcomes are impact evidence")
        if kind not in ASSESSED_KINDS:
            raise ImpactError(f"Unknown assessment kind: {kind}")
        for v in (p_known_before, p_known_after):
            if type(v) not in (int, float) or not 0.0 <= v <= 1.0:
                raise ImpactError("pKnown must be a 0..1 backend projection")
        if type(delay_days) is not int or delay_days < 0:
            raise ImpactError("Invalid delay")
        record = {
            "contract": IMPACT_CONTRACT,
            "learnerUid": learner_uid,
            "kind": kind,
            "gain": round(p_known_after - p_known_before, 6),
            "delayDays": delay_days,
            "assessedBy": "backend",
            "protocolVersion": self._protocol,
            "mlClassificationRef": None,
            "benchmarkScore": None,
            "at": _now(),
        }
        self._impacts.append(record)
        return deepcopy(record)

    def ingest_benchmark(self, benchmark_name: str, score: float) -> dict[str, Any]:
        """Benchmark/fluency scores live in their OWN ledger — never impact."""
        if type(score) not in (int, float) or not 0.0 <= score <= 1.0:
            raise ImpactError("Benchmark score must be 0..1")
        entry = {"benchmark": benchmark_name, "score": score, "entersImpactLedger": False, "at": _now()}
        self._benchmarks.append(entry)
        return deepcopy(entry)

    def impact_from_benchmarks(self) -> None:
        raise ImpactError("Educational benefit cannot be derived from benchmark scores")

    def record_stakeholder_feedback(self, role: str, rating: int, artifact_ref: str) -> dict[str, Any]:
        if role not in STAKEHOLDER_ROLES:
            raise ImpactError(f"Unknown stakeholder role: {role}")
        if type(rating) is not int or not 1 <= rating <= 5:
            raise ImpactError("Rating is a bounded 1..5 scale")
        entry = {"role": role, "rating": rating, "artifactRef": artifact_ref, "at": _now()}
        self._stakeholder.append(entry)
        return deepcopy(entry)

    def evaluate(self) -> dict[str, Any]:
        """Mean verified gain with honest uncertainty (standard error)."""
        if len(self._impacts) < MIN_COHORT:
            raise ImpactError(f"Cohort below the review bound ({len(self._impacts)} < {MIN_COHORT}); no point estimate")
        gains = [r["gain"] for r in self._impacts]
        mean = statistics.fmean(gains)
        stdev = statistics.stdev(gains) if len(gains) > 1 else 0.0
        se = stdev / (len(gains) ** 0.5)
        return {
            "contract": IMPACT_CONTRACT,
            "protocolVersion": self._protocol,
            "cohort": len(self._impacts),
            "meanGain": round(mean, 6),
            "standardError": round(se, 6),
            "ci95": [round(mean - 1.96 * se, 6), round(mean + 1.96 * se, 6)],
            "retentionRecords": sum(1 for r in self._impacts if r["kind"] == "retention"),
            "transferRecords": sum(1 for r in self._impacts if r["kind"] == "transfer"),
            "stakeholderMean": round(statistics.fmean([s["rating"] for s in self._stakeholder]), 6) if self._stakeholder else None,
            "separateLedgers": {"benchmarks": len(self._benchmarks), "stakeholder": len(self._stakeholder)},
        }

    def impacts(self) -> list[dict[str, Any]]:
        return deepcopy(self._impacts)
