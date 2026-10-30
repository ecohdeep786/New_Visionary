"""VMM-06 (KAN-174) — versioned SCM evidence-to-feature contract with
train/serve parity, explicit missingness, leakage controls and uncertainty.

The feature layer between immutable assessed evidence (VMM-03/05 shapes) and
any trainable model (VMM-07+):

  - VERSIONED + DETERMINISTIC: every feature vector carries the extractor
    version; the same extractor instance is the single implementation for BOTH
    train and serve paths (parity is proven against committed golden fixtures,
    not asserted).
  - MISSINGNESS IS EXPLICIT: missing numerics are encoded with a sentinel and a
    missingness mask — never silently zeroed (silent zeros corrupt training).
  - TIME LEAKAGE CONTROL: extraction accepts a cutoff into the attempt
    sequence; features at cutoff k are PROVEN equal to extraction from the
    truncated sequence — future attempts cannot influence features.
  - NO FUTURE OUTCOMES: evidence containing outcome fields (buildOutcome,
    misconception labels used as targets) is refused at the feature gate —
    outcomes are labels, never features.
  - IDENTITIES REMAIN OUTSIDE NEURAL FEATURES: uid/workspaceId/sessionId in
    evidence are refused; provenance travels beside the vector, not inside it.
  - NO UNSUPPORTED LABELS / REVOKED SOURCES: ontology membership (VMM-03) and
    the source-revocation ledger gate extraction.
  - UNCERTAINTY: a Wilson-score interval over the observed correct-rate plus a
    band (wide/moderate/tight) and an abstain recommendation — few attempts
    mean wide uncertainty and an honest "gather more evidence" answer.

Golden parity fixtures: ml/vmm/tests/golden/features-v1.json
"""
from __future__ import annotations

import hashlib
import json
import math
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

FEATURE_CONTRACT = "vmm-features.v1"
FEATURE_VERSION = 1

MISSING = -1.0
_IDENTITY_FIELDS = ("uid", "workspaceId", "sessionId")
_OUTCOME_FIELDS = ("buildOutcome", "outcome", "successful", "misconceptionLabels")

FEATURE_ORDER = (
    "attempt_count",
    "correct_rate",
    "recent3_correct_rate",
    "current_streak",
    "scm_p_known",
    "p_known_delta",
    "distinct_sources",
)
VECTOR_LENGTH = len(FEATURE_ORDER)


class FeatureGateError(ValueError):
    """The evidence snapshot is refused by the feature gate."""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _refuse_identity_and_outcomes(evidence: dict[str, Any]) -> None:
    for field in _IDENTITY_FIELDS:
        if field in evidence:
            raise FeatureGateError(f"Identity field '{field}' must remain outside neural features")
    for field in _OUTCOME_FIELDS:
        if field in evidence:
            raise FeatureGateError(f"Outcome field '{field}' is a label, never a feature (future-outcome leak)")


def _rate(correct: list[bool], start: int, end: int) -> float:
    window = correct[start:end]
    return sum(1.0 for c in window if c) / len(window) if window else MISSING


def _streak(correct: list[bool]) -> float:
    streak = 0
    for c in reversed(correct):
        if c:
            streak += 1
        else:
            break
    return float(streak)


def extract_features(
    evidence: dict[str, Any],
    scm_p_known: float | None,
    misconception_ontology: Any = None,
    revoked_sources: frozenset[str] | None = None,
    cutoff: int | None = None,
) -> dict[str, Any]:
    """Extract one versioned feature vector from an assessed-evidence snapshot.

    Deterministic and pure: the same evidence always yields the same vector.
    `cutoff` bounds the attempt sequence for time-leakage control.
    """
    _refuse_identity_and_outcomes(evidence)
    if evidence.get("contract") != "vmm-scm-evidence.v1":
        raise FeatureGateError("Not a VMM evidence snapshot")
    concept_id = evidence.get("conceptId")
    if type(concept_id) is not str or not concept_id.strip() or len(concept_id) > 80:
        raise FeatureGateError("Invalid conceptId")
    attempts = evidence.get("attempts")
    if not isinstance(attempts, list) or any(type(a) is not bool for a in attempts):
        raise FeatureGateError("attempts must be a list of booleans")
    source_refs = evidence.get("sourceRefs")
    if not isinstance(source_refs, list) or not source_refs or any(type(s) is not str or not s for s in source_refs):
        raise FeatureGateError("sourceRefs must be a non-empty list of strings")
    if revoked_sources is not None and any(s in revoked_sources for s in source_refs):
        raise FeatureGateError("Evidence draws on a revoked source")
    labels = evidence.get("misconceptionLabels")
    if labels is not None:
        # Misconception labels are TARGETS, never features: their presence in
        # evidence is a future-outcome leak (refused above by the gate).
        raise FeatureGateError("Misconception labels are labels, never features")
    if type(scm_p_known) not in (int, float) or not 0.0 <= float(scm_p_known) <= 1.0:
        raise FeatureGateError("scm_p_known must be provided within [0,1] (missingness handled by caller)")
    criteria_version = evidence.get("criteriaVersion")
    if type(criteria_version) is not int or criteria_version < 1:
        raise FeatureGateError("Invalid criteriaVersion")

    end = len(attempts) if cutoff is None else cutoff
    if type(end) is not int or not 0 <= end <= len(attempts):
        raise FeatureGateError("cutoff out of range")
    window = attempts[:end]

    values: dict[str, float] = {}
    values["attempt_count"] = float(len(window))
    values["correct_rate"] = _rate(window, 0, len(window))
    values["recent3_correct_rate"] = _rate(window, max(0, len(window) - 3), len(window))
    values["current_streak"] = _streak(window)
    values["scm_p_known"] = float(scm_p_known)
    values["p_known_delta"] = MISSING  # delta needs per-attempt estimates; reserved, explicitly missing
    values["distinct_sources"] = float(len(set(source_refs)))

    missing_mask = {name: values[name] == MISSING for name in FEATURE_ORDER}
    vector = [values[name] for name in FEATURE_ORDER]
    vector_digest = hashlib.sha256(
        json.dumps({"featureVersion": FEATURE_VERSION, "vector": vector}, separators=(",", ":")).encode("utf-8")
    ).hexdigest()
    return {
        "contract": FEATURE_CONTRACT,
        "featureVersion": FEATURE_VERSION,
        "conceptId": concept_id,
        "criteriaVersion": criteria_version,
        "sourceRefs": list(source_refs),
        "cutoff": end,
        "vector": vector,
        "featureOrder": list(FEATURE_ORDER),
        "missingMask": missing_mask,
        "vectorDigest": vector_digest,
        "provenanceOnlyIdentity": True,
    }


def validate_misconception_labels(labels: list[str], ontology: Any) -> list[str]:
    """Label-side gate: training labels must exist in the pinned ontology version."""
    if not isinstance(labels, list) or any(type(l) is not str for l in labels):
        raise FeatureGateError("Labels must be a list of ontology codes")
    if ontology is None:
        raise FeatureGateError("A pinned ontology version is required")
    for code in labels:
        if not ontology.known(code):
            raise FeatureGateError(f"Unsupported misconception label: {code}")
    return list(labels)


def assert_train_serve_parity(train_vector: dict[str, Any], serve_vector: dict[str, Any]) -> bool:
    """Train and serve paths must produce identical vectors (digest equality)."""
    if train_vector["featureVersion"] != serve_vector["featureVersion"]:
        raise FeatureGateError("Feature version mismatch between train and serve")
    if train_vector["vector"] != serve_vector["vector"]:
        raise FeatureGateError("Train/serve parity violation")
    return train_vector["vectorDigest"] == serve_vector["vectorDigest"]


def leakage_report(train_records: list[dict[str, Any]], eval_records: list[dict[str, Any]]) -> dict[str, Any]:
    """Time/source leakage check across a train/eval split (fail closed).

    Any shared sourceRef or contentDigest between the split sides is leakage.
    """
    train_sources = {ref for r in train_records for ref in r.get("sourceRefs", [])}
    eval_sources = {ref for r in eval_records for ref in r.get("sourceRefs", [])}
    shared_sources = sorted(train_sources & eval_sources)
    train_digests = {r.get("contentDigest") for r in train_records} - {None}
    eval_digests = {r.get("contentDigest") for r in eval_records} - {None}
    shared_digests = sorted(train_digests & eval_digests)
    return {
        "contract": FEATURE_CONTRACT,
        "trainRecords": len(train_records),
        "evalRecords": len(eval_records),
        "sharedSourceRefs": shared_sources,
        "sharedContentDigests": shared_digests,
        "leakageDetected": bool(shared_sources or shared_digests),
    }


def uncertainty(p_known: float, attempt_count: int, z: float = 1.96) -> dict[str, Any]:
    """Wilson-score interval over the observed correct-rate + honest band.

    Few attempts -> a wide interval and an explicit abstain recommendation.
    """
    if type(p_known) not in (int, float) or not 0.0 <= p_known <= 1.0:
        raise FeatureGateError("p_known out of range")
    if type(attempt_count) is not int or attempt_count < 0:
        raise FeatureGateError("Invalid attempt count")
    n = attempt_count
    if n == 0:
        return {
            "contract": FEATURE_CONTRACT,
            "estimate": round(p_known, 6),
            "intervalLow": 0.0,
            "intervalHigh": 1.0,
            "band": "wide",
            "abstainRecommended": True,
            "attemptCount": 0,
        }
    denominator = 1.0 + z * z / n
    center = (p_known + z * z / (2 * n)) / denominator
    half = (z * math.sqrt(p_known * (1.0 - p_known) / n + z * z / (4 * n * n))) / denominator
    low = max(0.0, center - half)
    high = min(1.0, center + half)
    width = high - low
    band = "tight" if width <= 0.2 else ("moderate" if width <= 0.45 else "wide")
    return {
        "contract": FEATURE_CONTRACT,
        "estimate": round(p_known, 6),
        "intervalLow": round(low, 6),
        "intervalHigh": round(high, 6),
        "band": band,
        "abstainRecommended": band == "wide",
        "attemptCount": n,
    }


def golden_digest(payload: dict[str, Any]) -> str:
    return hashlib.sha256(json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")).hexdigest()
