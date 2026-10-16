"""L2 read-model / L3 proposal policy from Doc03; not a mastery or auth authority.

Only a trusted backend may supply a pinned, authorized snapshot. This reference
heuristic is deliberately uncalibrated and not connected to the product runtime.
It does not call a model, score an answer, write state, or diagnose a person.
"""
from copy import deepcopy
import math

CONTRACT = "vats-pedagogy.v1"
POLICY = "doc03-reference-v1"
STRATEGIES = ("socratic", "worked_example", "analogy", "visual", "practice")
SCOPE_FIELDS = {"uid", "workspaceId", "sessionId", "conceptId", "sourceVersion", "criteriaVersion", "graphVersion", "policyVersion", "learnerRevision", "loopRevision"}


class InvalidSnapshot(ValueError):
    """No proposal can be produced from this snapshot."""


def _object(value, fields):
    if type(value) is not dict or set(value) != set(fields):
        raise InvalidSnapshot("Invalid snapshot fields")


def _text(value):
    if type(value) is not str or not value.strip() or len(value) > 256:
        raise InvalidSnapshot("Invalid opaque reference")


def _integer(value, minimum=0):
    if type(value) is not int or not minimum <= value <= 9007199254740991:
        raise InvalidSnapshot("Invalid bounded revision or count")


def propose_teaching(request):
    """Return a scoped proposal only; backend rechecks authority and revisions."""
    _object(request, {"contractVersion", "requestId", "scope", "nodes", "teaching", "observations"})
    if request["contractVersion"] != CONTRACT:
        raise InvalidSnapshot("Unsupported contract")
    _text(request["requestId"])
    scope = request["scope"]
    _object(scope, SCOPE_FIELDS)
    for name, value in scope.items():
        _integer(value) if name.endswith("Revision") else _text(value)
    if scope["policyVersion"] != POLICY:
        raise InvalidSnapshot("Policy must be explicitly released and pinned")
    teaching, observations = request["teaching"], request["observations"]
    _object(teaching, {"phase", "failedChecks", "maxFailedChecks", "previousStrategy", "allowedStrategies"})
    _integer(teaching["failedChecks"])
    _integer(teaching["maxFailedChecks"], 1)
    if not teaching["failedChecks"] <= teaching["maxFailedChecks"] <= 3:
        raise InvalidSnapshot("Invalid bounded teaching loop")
    if teaching["phase"] not in ("explain", "check", "check_passed", "review_suggested"):
        raise InvalidSnapshot("Invalid teaching phase")
    previous, allowed = teaching["previousStrategy"], teaching["allowedStrategies"]
    if previous is not None and previous not in STRATEGIES:
        raise InvalidSnapshot("Invalid previous strategy")
    if type(allowed) is not list or not allowed or any(type(s) is not str or s not in STRATEGIES for s in allowed) or len(allowed) != len(set(allowed)):
        raise InvalidSnapshot("Invalid released strategy set")
    if teaching["failedChecks"] and previous is None:
        raise InvalidSnapshot("Missing prior strategy after an assessed failure")
    _object(observations, {"errorClass", "firstEncounter", "approvedVisualAvailable", "hintsOnly"})
    if observations["errorClass"] not in (None, "conceptual_gap", "calculation_error", "language_barrier", "careless_mistake"):
        raise InvalidSnapshot("Unsupported reviewed error hypothesis")
    if any(type(observations[key]) is not bool for key in ("firstEncounter", "approvedVisualAvailable", "hintsOnly")):
        raise InvalidSnapshot("Invalid observation flags")
    nodes = request["nodes"]
    if type(nodes) is not list or not 1 <= len(nodes) <= 512:
        raise InvalidSnapshot("Invalid bounded concept graph")
    graph = {}
    for node in nodes:
        _object(node, {"conceptId", "prerequisites", "pKnown", "assessedCount"})
        _text(node["conceptId"])
        _integer(node["assessedCount"])
        if node["conceptId"] in graph:
            raise InvalidSnapshot("Duplicate concept")
        p = node["pKnown"]
        if p is not None and (type(p) not in (int, float) or not math.isfinite(p) or not 0 <= p <= 1):
            raise InvalidSnapshot("Invalid knowledge estimate")
        if p is None and node["assessedCount"] != 0:
            raise InvalidSnapshot("Missing estimate for assessed evidence")
        prerequisites = node["prerequisites"]
        if type(prerequisites) is not list or len(prerequisites) > 32:
            raise InvalidSnapshot("Invalid prerequisites")
        for ref in prerequisites:
            _text(ref)
        if len(prerequisites) != len(set(prerequisites)):
            raise InvalidSnapshot("Duplicate prerequisite")
        graph[node["conceptId"]] = node
    if scope["conceptId"] not in graph:
        raise InvalidSnapshot("Requested concept is outside the pinned graph")
    visited, active = set(), set()

    def validate(concept):
        if concept not in graph or concept in active:
            raise InvalidSnapshot("Missing prerequisite or cyclic graph")
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

    def result(action, reason, strategy=None, concept=target):
        return {"contractVersion": CONTRACT, "requestId": request["requestId"], "scope": deepcopy(scope), "action": action, "reason": reason, "targetConceptId": concept, "strategy": strategy, "requiresAssessment": action in ("teach", "assess_prior"), "answerPolicy": "hints_only" if observations["hintsOnly"] else "teaching_example"}

    phase = teaching["phase"]
    if phase == "check":
        return result("await_response", "check_pending")
    if phase == "check_passed":
        return result("check_complete", "assessed_check_passed")
    if phase == "review_suggested" or teaching["failedChecks"] >= teaching["maxFailedChecks"]:
        return result("review", "failure_bound")
    ordered, seen = [], set()

    def ancestors(concept):
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
    # Visual admission describes the requested concept, not an ancestor target.
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
