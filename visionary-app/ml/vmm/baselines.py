"""VMM-05 (KAN-173) — VATS pedagogy reproduction, SCM/BKT baseline and a
simple statistical classifier.

Three baselines the model-building program measures against:

  1. PEDAGOGY REPRODUCTION: an independent reimplementation of the original
     VATS L2/L3 decision policy (ml/vats/pedagogy.py). The contract test proves
     it agrees with the reference on EVERY shared fixture (and raises on the
     same invalid snapshots) — "reproduce" is proven, not claimed.
  2. SCM BASELINE: a deterministic Bayesian-knowledge-tracing Student Cognitive
     Model — per-concept p(known) from attempt sequences with provenance.
     Deliberately uncalibrated and bounded: it never grants mastery.
  3. SIMPLE STATISTICAL CLASSIFIER: multinomial Naive Bayes (Laplace-smoothed,
     stdlib-only) for misconception classification with an explicit abstention
     path; evaluated THROUGH the VMM-04 benchmark registry so pre-registered
     thresholds and per-slice noninferiority gate it like any candidate.

Baselines are baselines: nothing here establishes educational gains.
"""
from __future__ import annotations

import math
from copy import deepcopy
from typing import Any

# --------------------------------------------------------------------------- #
# 1. VATS pedagogy reproduction (independent reimplementation of the L2/L3 policy)
# --------------------------------------------------------------------------- #

CONTRACT = "vats-pedagogy.v1"
POLICY = "doc03-reference-v1"
STRATEGIES = ("socratic", "worked_example", "analogy", "visual", "practice")
SCOPE_FIELDS = {"uid", "workspaceId", "sessionId", "conceptId", "sourceVersion", "criteriaVersion", "graphVersion", "policyVersion", "learnerRevision", "loopRevision"}
ERROR_CLASSES = (None, "conceptual_gap", "calculation_error", "language_barrier", "careless_mistake")
PHASES = ("explain", "check", "check_passed", "review_suggested")


class ReproductionError(ValueError):
    """The snapshot cannot produce a proposal (same refusals as the reference)."""


def _object(value: Any, fields: set[str]) -> None:
    if type(value) is not dict or set(value) != fields:
        raise ReproductionError("Invalid snapshot fields")


def _text(value: Any) -> None:
    if type(value) is not str or not value.strip() or len(value) > 256:
        raise ReproductionError("Invalid opaque reference")


def _integer(value: Any, minimum: int = 0) -> None:
    if type(value) is not int or not minimum <= value <= 9007199254740991:
        raise ReproductionError("Invalid bounded revision or count")


def propose_teaching_reproduction(request: dict[str, Any]) -> dict[str, Any]:
    """Independent reimplementation of the reference VATS L2/L3 policy.

    Must agree with ml/vats/pedagogy.propose_teaching on every shared fixture
    and refuse the same invalid snapshots (proven by test, not claimed).
    """
    _object(request, {"contractVersion", "requestId", "scope", "nodes", "teaching", "observations"})
    if request["contractVersion"] != CONTRACT:
        raise ReproductionError("Unsupported contract")
    _text(request["requestId"])
    scope = request["scope"]
    _object(scope, SCOPE_FIELDS)
    for name, value in scope.items():
        _integer(value) if name.endswith("Revision") else _text(value)
    if scope["policyVersion"] != POLICY:
        raise ReproductionError("Policy must be explicitly released and pinned")
    teaching, observations = request["teaching"], request["observations"]
    _object(teaching, {"phase", "failedChecks", "maxFailedChecks", "previousStrategy", "allowedStrategies"})
    _integer(teaching["failedChecks"])
    _integer(teaching["maxFailedChecks"], 1)
    if not teaching["failedChecks"] <= teaching["maxFailedChecks"] <= 3:
        raise ReproductionError("Invalid bounded teaching loop")
    if teaching["phase"] not in PHASES:
        raise ReproductionError("Invalid teaching phase")
    previous, allowed = teaching["previousStrategy"], teaching["allowedStrategies"]
    if previous is not None and previous not in STRATEGIES:
        raise ReproductionError("Invalid previous strategy")
    if type(allowed) is not list or not allowed or any(type(s) is not str or s not in STRATEGIES for s in allowed) or len(allowed) != len(set(allowed)):
        raise ReproductionError("Invalid released strategy set")
    if teaching["failedChecks"] and previous is None:
        raise ReproductionError("Missing prior strategy after an assessed failure")
    _object(observations, {"errorClass", "firstEncounter", "approvedVisualAvailable", "hintsOnly"})
    if observations["errorClass"] not in ERROR_CLASSES:
        raise ReproductionError("Unsupported reviewed error hypothesis")
    if any(type(observations[key]) is not bool for key in ("firstEncounter", "approvedVisualAvailable", "hintsOnly")):
        raise ReproductionError("Invalid observation flags")
    nodes = request["nodes"]
    if type(nodes) is not list or not 1 <= len(nodes) <= 512:
        raise ReproductionError("Invalid bounded concept graph")
    graph: dict[str, dict[str, Any]] = {}
    for node in nodes:
        _object(node, {"conceptId", "prerequisites", "pKnown", "assessedCount"})
        _text(node["conceptId"])
        _integer(node["assessedCount"])
        if node["conceptId"] in graph:
            raise ReproductionError("Duplicate concept")
        p = node["pKnown"]
        if p is not None and (type(p) not in (int, float) or not math.isfinite(p) or not 0 <= p <= 1):
            raise ReproductionError("Invalid knowledge estimate")
        if p is None and node["assessedCount"] != 0:
            raise ReproductionError("Missing estimate for assessed evidence")
        prerequisites = node["prerequisites"]
        if type(prerequisites) is not list or len(prerequisites) > 32:
            raise ReproductionError("Invalid prerequisites")
        for ref in prerequisites:
            _text(ref)
        if len(prerequisites) != len(set(prerequisites)):
            raise ReproductionError("Duplicate prerequisite")
        graph[node["conceptId"]] = node
    if scope["conceptId"] not in graph:
        raise ReproductionError("Requested concept is outside the pinned graph")
    visited, active = set(), set()

    def validate(concept: str) -> None:
        if concept not in graph or concept in active:
            raise ReproductionError("Missing prerequisite or cyclic graph")
        if concept in visited:
            return
        active.add(concept)
        for ref in graph[concept]["prerequisites"]:
            validate(ref)
        active.remove(concept)
        visited.add(concept)

    for concept in sorted(graph):
        validate(concept)
    target = scope["conceptId"]

    def result(action: str, reason: str, strategy: str | None = None, concept: str = target) -> dict[str, Any]:
        return {
            "contractVersion": CONTRACT,
            "requestId": request["requestId"],
            "scope": deepcopy(scope),
            "action": action,
            "reason": reason,
            "targetConceptId": concept,
            "strategy": strategy,
            "requiresAssessment": action in ("teach", "assess_prior"),
            "answerPolicy": "hints_only" if observations["hintsOnly"] else "teaching_example",
        }

    phase = teaching["phase"]
    if phase == "check":
        return result("await_response", "check_pending")
    if phase == "check_passed":
        return result("check_complete", "assessed_check_passed")
    if phase == "review_suggested" or teaching["failedChecks"] >= teaching["maxFailedChecks"]:
        return result("review", "failure_bound")
    ordered: list[str] = []
    seen: set[str] = set()

    def ancestors(concept: str) -> None:
        if concept in seen:
            return
        seen.add(concept)
        for ref in sorted(graph[concept]["prerequisites"]):
            ancestors(ref)
        ordered.append(concept)

    ancestors(target)
    for ref in ordered:
        node = graph[ref]
        if node["assessedCount"] == 0:
            return result("assess_prior", "insufficient_evidence", concept=ref)
        if ref != target and node["pKnown"] < 0.5:
            target = ref
            break
    node = graph[target]
    p, error = node["pKnown"], observations["errorClass"]
    visual_available = observations["approvedVisualAvailable"] and target == scope["conceptId"]
    visual = observations["firstEncounter"] and visual_available
    if visual:
        preferred = "visual"
    elif p < 0.35:
        preferred = "analogy" if error == "language_barrier" else "worked_example"
    elif p > 0.75:
        preferred = "practice"
    else:
        preferred = "socratic"
    candidates = [preferred] + [s for s in STRATEGIES if s != preferred]
    candidates = [s for s in candidates if s in allowed and (s != "visual" or visual_available) and (not teaching["failedChecks"] or s != previous)]
    if not candidates:
        return result("review", "no_alternative", concept=target)
    # An observed estimate, even .99, never skips an assessed check or creates mastery.
    return result("teach", "prerequisite_gap" if target != scope["conceptId"] else "state_based_strategy", candidates[0], target)


# --------------------------------------------------------------------------- #
# 2. SCM baseline: deterministic BKT student-cognitive-model projection
# --------------------------------------------------------------------------- #

BKT_CONTRACT = "vmm-scm-bkt.v1"


class BKTParameters:
    """Bayesian Knowledge Tracing parameters, each bounded to (0,1) strictly."""

    def __init__(self, p_init: float, learn_t: float, slip: float, guess: float):
        for name, value in [("p_init", p_init), ("learn_t", learn_t), ("slip", slip), ("guess", guess)]:
            if type(value) not in (int, float) or not math.isfinite(value) or not 0.0 < value < 1.0:
                raise ValueError(f"Invalid BKT {name}")
        self.p_init = float(p_init)
        self.learn_t = float(learn_t)
        self.slip = float(slip)
        self.guess = float(guess)

    def as_dict(self) -> dict[str, float]:
        return {"p_init": self.p_init, "learn_t": self.learn_t, "slip": self.slip, "guess": self.guess}


def bkt_update(p_known: float, correct: bool, params: BKTParameters) -> float:
    """One BKT observation update (posterior, then learning transition)."""
    if not 0.0 <= p_known <= 1.0:
        raise ValueError("p_known out of range")
    if correct:
        likelihood_known = p_known * (1.0 - params.slip)
        denom = likelihood_known + (1.0 - p_known) * params.guess
        posterior = likelihood_known / denom if denom > 0 else 0.0
    else:
        likelihood_known = p_known * params.slip
        denom = likelihood_known + (1.0 - p_known) * (1.0 - params.guess)
        posterior = likelihood_known / denom if denom > 0 else 0.0
    return posterior + (1.0 - posterior) * params.learn_t


def scm_project(concept_id: str, attempts: list[bool], params: BKTParameters, source_ref: str, criteria_version: int) -> dict[str, Any]:
    """SCM projection: p(known) after the attempt sequence, with provenance.

    Bounded and honest: evidence provenance travels with the estimate; the
    estimate NEVER grants mastery and never skips an assessed check.
    """
    if type(criteria_version) is not int or criteria_version < 1:
        raise ValueError("Invalid criteria version")
    p = params.p_init
    for correct in attempts:
        if type(correct) is not bool:
            raise ValueError("Attempts must be booleans")
        p = bkt_update(p, correct, params)
    return {
        "contract": BKT_CONTRACT,
        "conceptId": concept_id,
        "pKnown": round(p, 6),
        "attemptCount": len(attempts),
        "parameters": params.as_dict(),
        "sourceRef": source_ref,
        "criteriaVersion": criteria_version,
        "masteryGranted": False,
    }


# --------------------------------------------------------------------------- #
# 3. Simple statistical classifier: multinomial Naive Bayes with abstention
# --------------------------------------------------------------------------- #

NB_CONTRACT = "vmm-naivebayes.v1"


class NaiveBayesClassifier:
    """Multinomial Naive Bayes over token counts (Laplace-smoothed, stdlib-only).

    Deterministic; abstains when the top-class confidence is below the
    abstention floor — an explicit uncertainty path, not a forced guess.
    """

    def __init__(self, abstain_below: float = 0.5):
        if type(abstain_below) not in (int, float) or not 0.0 <= abstain_below <= 1.0:
            raise ValueError("Invalid abstain_below")
        self.abstain_below = float(abstain_below)
        self._counts: dict[str, dict[str, int]] = {}
        self._totals: dict[str, int] = {}
        self._docs: dict[str, int] = {}
        self._vocabulary: set[str] = set()
        self._docs_total = 0
        self._trained = False

    def train(self, samples: list[dict[str, Any]]) -> "NaiveBayesClassifier":
        """samples: [{tokens: [str], label: str}] — labels must be strings."""
        for sample in samples:
            if type(sample) is not dict or set(sample) != {"tokens", "label"}:
                raise ValueError("Samples must be {tokens, label}")
            tokens, label = sample["tokens"], sample["label"]
            if type(label) is not str or not label.strip():
                raise ValueError("Invalid label")
            if not isinstance(tokens, list) or any(type(t) is not str for t in tokens):
                raise ValueError("Tokens must be a list of strings")
            self._counts.setdefault(label, {})
            self._docs[label] = self._docs.get(label, 0) + 1
            self._docs_total += 1
            for token in tokens:
                self._counts[label][token] = self._counts[label].get(token, 0) + 1
                self._totals[label] = self._totals.get(label, 0) + 1
                self._vocabulary.add(token)
        self._trained = True
        return self

    def predict(self, tokens: list[str]) -> dict[str, Any]:
        """Return {label, confidence, abstained} or {abstained: True} below the floor."""
        if not self._trained:
            raise ValueError("Classifier is not trained")
        if not isinstance(tokens, list) or any(type(t) is not str for t in tokens):
            raise ValueError("Tokens must be a list of strings")
        vocab_size = len(self._vocabulary) or 1
        scores: dict[str, float] = {}
        for label in self._counts:
            log_p = math.log(self._docs[label] / self._docs_total)
            total = self._totals[label] + vocab_size  # Laplace smoothing denominator
            for token in tokens:
                count = self._counts[label].get(token, 0)
                log_p += math.log((count + 1) / total)
            scores[label] = log_p
        best = max(scores, key=lambda l: scores[l])
        # Posterior over classes via log-sum-exp normalisation.
        max_log = max(scores.values())
        exp = {l: math.exp(s - max_log) for l, s in scores.items()}
        z = sum(exp.values())
        confidence = exp[best] / z
        if confidence < self.abstain_below:
            return {"abstained": True, "confidence": round(confidence, 6)}
        return {"label": best, "confidence": round(confidence, 6), "abstained": False}
