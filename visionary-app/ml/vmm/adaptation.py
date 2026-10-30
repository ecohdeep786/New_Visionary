"""VMM-29 (KAN-201) — evidence-driven personal adaptation with demonstrated
added value.

Three adaptation modes are COMPARED, never assumed:

  - COLD-START: the default BKT parameters; no personalization.
  - MEMORY-ONLY: adapts the strategy PREFERENCE from the durable memory ledger
    (VMM-25 tags) — memory NEVER moves a mastery estimate.
  - VERIFIED-OUTCOME: adapts the per-concept prior from backend-verified
    outcome receipts (VMM-12 ingestion semantics — `assessedBy: backend`
    only); model/self claims are refused.

  - USER UNDERSTANDING vs ARTIFACT SUCCESS are SEPARATE LEDGERS: pKnown moves
    only on backend-assessed attempts; buildOutcome never touches it.
  - MEASURABLE IMPROVEMENT: a pre-registered delta threshold + minimum samples;
    `improvementEstablished` only when the verified-outcome mode beats the
    cold-start baseline on HELD-OUT verified tasks by at least the threshold —
    otherwise the report is `inconclusive` (no invented gains).
  - OVER-INTERVENTION: correction frequency per session is tracked (composes
    the VMM-26 recurrence counter); corrections beyond the pre-declared bound
    flag over-intervention.
"""
from __future__ import annotations

import json
import math
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

from vmm.baselines import BKTParameters, bkt_update

ADAPTATION_CONTRACT = "vmm-adaptation.v1"


class AdaptationError(ValueError):
    """The adaptation operation is not admissible."""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class PersonalAdaptation:
    """Three-mode personal adaptation with a measured comparison."""

    def __init__(
        self,
        base_params: BKTParameters | None = None,
        min_improvement_delta: float = 0.15,
        min_heldout_samples: int = 4,
        max_corrections_per_session: int = 2,
    ):
        self.base = base_params or BKTParameters(p_init=0.2, learn_t=0.15, slip=0.05, guess=0.1)
        if type(min_improvement_delta) not in (int, float) or not 0.0 < min_improvement_delta <= 1.0:
            raise AdaptationError("Invalid min_improvement_delta")
        if type(min_heldout_samples) is not int or min_heldout_samples < 1:
            raise AdaptationError("Invalid min_heldout_samples")
        if type(max_corrections_per_session) is not int or max_corrections_per_session < 1:
            raise AdaptationError("Invalid max_corrections_per_session")
        self.min_improvement_delta = float(min_improvement_delta)
        self.min_heldout_samples = min_heldout_samples
        self.max_corrections_per_session = max_corrections_per_session
        self._receipts: dict[str, dict[str, Any]] = {}
        self._memory_tags: list[str] = []
        self._artifact_outcomes: list[dict[str, Any]] = []
        self._corrections: list[dict[str, Any]] = []

    # ---- ingestion (backend-verified only) -----------------------------------

    def ingest_verified_outcome(self, receipt: dict[str, Any]) -> dict[str, Any]:
        """Backend-verified outcome: assessedBy backend; client claims refused."""
        required = {"receiptId", "conceptId", "correct", "assessedBy"}
        if type(receipt) is not dict or not required <= set(receipt):
            raise AdaptationError("Receipt must include receiptId/conceptId/correct/assessedBy")
        if receipt["assessedBy"] != "backend":
            raise AdaptationError("Only backend-verified outcomes drive adaptation")
        if type(receipt["correct"]) is not bool:
            raise AdaptationError("correct must be a bool")
        receipt_id = receipt["receiptId"]
        if type(receipt_id) is not str or not receipt_id:
            raise AdaptationError("Invalid receiptId")
        if receipt_id in self._receipts:
            return {"ingested": False, "duplicate": True}
        self._receipts[receipt_id] = deepcopy(receipt)
        return {"ingested": True, "duplicate": False}

    def record_artifact_outcome(self, artifact_id: str, successful: bool) -> dict[str, Any]:
        """ARTIFACT SUCCESS ledger — deliberately separate from understanding."""
        self._artifact_outcomes.append({"artifactId": artifact_id, "successful": bool(successful), "at": _now()})
        return {"recorded": True, "separate": True}

    def set_memory_tags(self, tags: list[str]) -> dict[str, Any]:
        """Memory-only adaptation: strategy preference from durable memory."""
        if not isinstance(tags, list) or any(type(t) is not str for t in tags):
            raise AdaptationError("Invalid memory tags")
        self._memory_tags = sorted(set(tags))
        return {"preferenceTags": self._memory_tags, "masteryMoved": False}

    def record_correction(self, session_id: str) -> dict[str, Any]:
        self._corrections.append({"sessionId": session_id, "at": _now()})
        return {"recorded": True}

    # ---- adaptation modes -------------------------------------------------------

    def _verified_attempts(self, concept_id: str) -> list[bool]:
        return [r["correct"] for r in sorted(self._receipts.values(), key=lambda r: r["receiptId"]) if r["conceptId"] == concept_id]

    def adapt(self, concept_id: str) -> dict[str, Any]:
        """Per-mode adapted parameters for one concept."""
        attempts = self._verified_attempts(concept_id)
        # Verified-outcome mode: the prior starts from the verified evidence.
        adapted = deepcopy(self.base)
        for correct in attempts:
            adapted.p_init = bkt_update(adapted.p_init, correct, adapted)
        # Memory-only mode: strategy preference, never mastery.
        preference = None
        if "prefers-analogy" in self._memory_tags:
            preference = "analogy"
        elif "prefers-worked-example" in self._memory_tags:
            preference = "worked_example"
        return {
            "contract": ADAPTATION_CONTRACT,
            "conceptId": concept_id,
            "coldStart": {"p_init": self.base.p_init},
            "memoryOnly": {"strategyPreference": preference, "p_init": self.base.p_init, "masteryMoved": False},
            "verifiedOutcome": {"p_init": round(adapted.p_init, 6), "verifiedAttempts": len(attempts)},
        }

    # ---- measured comparison ------------------------------------------------------

    def compare_modes(self, concept_id: str, heldout_tasks: list[bool]) -> dict[str, Any]:
        """Measure each mode on HELD-OUT verified tasks; added value requires
        the verified-outcome mode to beat cold-start by the pre-registered delta."""
        if len(heldout_tasks) < self.min_heldout_samples:
            return {"contract": ADAPTATION_CONTRACT, "inconclusive": True, "reason": "insufficient_heldout_samples", "improvementEstablished": False}
        modes = {}
        for mode in ("coldStart", "memoryOnly", "verifiedOutcome"):
            adapted = self.adapt(concept_id)
            p = adapted[mode].get("p_init", self.base.p_init)
            # Clamp into the open interval the BKT parameter contract requires.
            p = min(max(float(p), 1e-6), 1.0 - 1e-6)
            sim_params = BKTParameters(p_init=p, learn_t=self.base.learn_t, slip=self.base.slip, guess=self.base.guess)
            # Step-wise predictive accuracy: predict each outcome from the
            # state BEFORE incorporating it — the honest adaptive measurement.
            p_known = p
            correct_predictions = 0
            for correct in heldout_tasks:
                if (p_known >= 0.5) == correct:
                    correct_predictions += 1
                p_known = bkt_update(p_known, correct, sim_params)
            modes[mode] = {"accuracy": round(correct_predictions / len(heldout_tasks), 6)}
        delta = modes["verifiedOutcome"]["accuracy"] - modes["coldStart"]["accuracy"]
        established = delta >= self.min_improvement_delta
        return {
            "contract": ADAPTATION_CONTRACT,
            "conceptId": concept_id,
            "heldoutSamples": len(heldout_tasks),
            "modes": modes,
            "verifiedOutcomeDelta": round(delta, 6),
            "minImprovementDelta": self.min_improvement_delta,
            "improvementEstablished": established,
            "inconclusive": not established,
        }

    def over_intervention_report(self, sessions: dict[str, int]) -> dict[str, Any]:
        """Corrections per session vs the pre-declared bound."""
        flagged = {sid: count for sid, count in sessions.items() if count > self.max_corrections_per_session}
        return {
            "contract": ADAPTATION_CONTRACT,
            "maxCorrectionsPerSession": self.max_corrections_per_session,
            "totalCorrections": len(self._corrections),
            "overInterventionSessions": flagged,
            "overInterventionDetected": bool(flagged),
        }

    def improvement_report(self, concept_id: str) -> dict[str, Any]:
        """No invented gains: no verified receipts -> no claim."""
        attempts = self._verified_attempts(concept_id)
        if not attempts:
            return {
                "contract": ADAPTATION_CONTRACT,
                "conceptId": concept_id,
                "improvementEstablished": False,
                "inconclusive": True,
                "reason": "no_verified_outcomes",
            }
        adapted = self.adapt(concept_id)
        return {
            "contract": ADAPTATION_CONTRACT,
            "conceptId": concept_id,
            "verifiedAttempts": len(attempts),
            "adaptedPrior": adapted["verifiedOutcome"]["p_init"],
            "improvementEstablished": None,
            "inconclusive": True,
            "reason": "heldout_comparison_required",
        }
