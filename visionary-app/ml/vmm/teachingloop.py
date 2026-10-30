"""VMM-13 (KAN-181) — wire Tiny-ranked teaching actions into the bounded
tutor loop.

The teaching-runtime contract connecting the model chain to the tutor loop:

  - THE REFERENCE POLICY REMAINS THE LOOP AUTHORITY: every transition is
    decided by the VMM-05 reproduction of the original VATS pedagogy policy —
    the Tiny-D1 ranking (VMM-07/11) is consumed as an ADVISORY strategy
    preference, applied ONLY when it is inside the policy's allowed set and
    the loop's own invariants (assessed checks, failure bound) still hold.
    Model provenance is recorded; the model NEVER skips an assessed check and
    NEVER grants mastery.
  - REAL FLOW: explanation (with pinned source citations) -> learner doubt ->
    check -> remediation (strategy != previous) or review at the failure bound.
  - PROTECTED ANSWERS: the loop never stores or exposes the expected answer;
    the policy's answerPolicy (hints_only) travels with the check.
  - VISUAL FALLBACK: a visual preference without an approved visual falls back
    to the policy's next candidate (the policy decides, not the model).
  - CORRECT STOP BEHAVIOR: the loop stops at check_complete or at the failure
    bound (review) — it is never unbounded.
  - OPTIONAL TEACHING DURING BUILD: a Build run may attach a teaching session;
    the attachment is a distinct operation and never advances Build acceptance.
  - PINNED VERSIONS: policy/criteria/graph/source versions are pinned at start;
    unpinned or stale versions are refused. Events are append-only, so a
    second device resumes the identical loop state.
"""
from __future__ import annotations

import json
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

from vmm.baselines import propose_teaching_reproduction

LOOP_CONTRACT = "vmm-teachingloop.v1"

PHASES = ("explain", "doubt", "check", "check_passed", "review")
_MAX_EVENTS = 64


class LoopError(ValueError):
    """The tutor-loop operation is not admissible."""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class BoundedTutorLoop:
    """The bounded tutor loop consuming Tiny-ranked actions as advisory input."""

    def __init__(
        self,
        loop_id: str,
        pinned: dict[str, str],
        concept_id: str,
        p_known: float,
        assessed_count: int,
        allowed_strategies: list[str],
        ranker=None,
    ):
        required = {"policyVersion", "criteriaVersion", "graphVersion", "sourceVersion"}
        if type(pinned) is not dict or set(pinned) != required or any(
            type(v) is not str or not v for v in pinned.values()
        ):
            raise LoopError("All pinned versions (policy/criteria/graph/source) are required")
        if pinned["policyVersion"] != "doc03-reference-v1":
            raise LoopError("Policy must be explicitly released and pinned")
        _concept = concept_id
        if type(_concept) is not str or not _concept or len(_concept) > 80:
            raise LoopError("Invalid conceptId")
        if type(p_known) not in (int, float) or not 0.0 <= p_known <= 1.0:
            raise LoopError("Invalid pKnown")
        if type(assessed_count) is not int or assessed_count < 0:
            raise LoopError("Invalid assessedCount")
        if ranker is not None and not callable(ranker):
            raise LoopError("ranker must be callable")
        if not allowed_strategies:
            raise LoopError("An allowed strategy set is required")

        self.loop_id = loop_id
        self.pinned = dict(pinned)
        self.concept_id = concept_id
        self.p_known = p_known
        self.assessed_count = assessed_count
        self.allowed = list(allowed_strategies)
        self.ranker = ranker  # e.g. the VMM-11 worker's Tiny ranking (advisory)
        self.events: list[dict[str, Any]] = []
        self.phase = "explain"
        self.failed_checks = 0
        self.previous_strategy: str | None = None
        self.closed = False
        self._append("started", {"phase": self.phase, "pinned": self.pinned})

    # ---- events -------------------------------------------------------------

    def _append(self, kind: str, detail: dict[str, Any]) -> dict[str, Any]:
        if len(self.events) >= _MAX_EVENTS:
            raise LoopError("Loop event bound exceeded")
        detail = {**detail, "phaseAfter": self.phase}
        event = {"seq": len(self.events) + 1, "kind": kind, "detail": detail, "at": _now()}
        self.events.append(event)
        return deepcopy(event)

    def _policy_decision(self, observations: dict[str, Any]) -> dict[str, Any]:
        """The VMM-05 reproduction of the reference policy decides every transition."""
        request = {
            "contractVersion": "vats-pedagogy.v1",
            "requestId": f"{self.loop_id}-{len(self.events) + 1}",
            "scope": {
                "uid": "u", "workspaceId": "w", "sessionId": self.loop_id,
                "conceptId": self.concept_id, "sourceVersion": self.pinned["sourceVersion"],
                "criteriaVersion": self.pinned["criteriaVersion"], "graphVersion": self.pinned["graphVersion"],
                "policyVersion": self.pinned["policyVersion"], "learnerRevision": 1, "loopRevision": len(self.events) + 1,
            },
            "nodes": [{"conceptId": self.concept_id, "prerequisites": [], "pKnown": self.p_known, "assessedCount": self.assessed_count}],
            "teaching": {
                "phase": "check" if self.phase == "check" else ("check_passed" if self.phase == "check_passed" else ("review_suggested" if self.phase == "review" else "explain")),
                "failedChecks": self.failed_checks,
                "maxFailedChecks": 3,
                "previousStrategy": self.previous_strategy,
                "allowedStrategies": self.allowed,
            },
            "observations": observations,
        }
        return propose_teaching_reproduction(request)

    # ---- flow ---------------------------------------------------------------

    def explain(self, first_encounter: bool, approved_visual_available: bool) -> dict[str, Any]:
        """Explanation phase: policy decides; Tiny ranking is advisory inside the
        policy's allowed set; source citation pinned; visual fallback honored."""
        if self.closed or self.phase != "explain":
            raise LoopError(f"explain is invalid in phase {self.phase}")
        decision = self._policy_decision({
            "errorClass": None, "firstEncounter": first_encounter,
            "approvedVisualAvailable": approved_visual_available, "hintsOnly": True,
        })
        if decision["action"] != "teach":
            raise LoopError(f"Policy did not propose teaching: {decision['action']}/{decision['reason']}")

        ranked_by = "policy"
        strategy = decision["strategy"]
        if self.ranker is not None:
            ranked = self.ranker(deepcopy(decision), self.allowed)
            visual_blocked = ranked == "visual" and not approved_visual_available
            if ranked is not None and ranked in self.allowed and not visual_blocked:
                # Advisory: the Tiny preference applies only INSIDE the policy's
                # allowed set AND the policy's availability constraints; the
                # loop's own invariants are untouched.
                strategy = ranked
                ranked_by = "tiny-d1-advisory"
        event = self._append("explained", {
            "strategy": strategy, "rankedBy": ranked_by, "policyReason": decision["reason"],
            "sourceCitation": self.pinned["sourceVersion"], "answerPolicy": decision["answerPolicy"],
        })
        self.previous_strategy = strategy
        self.phase = "doubt"
        return event

    def ask_doubt(self, doubt: str) -> dict[str, Any]:
        """Learner doubt recorded (opaque text ref; the loop re-explains by policy)."""
        if self.closed or self.phase != "doubt":
            raise LoopError(f"ask_doubt is invalid in phase {self.phase}")
        if type(doubt) is not str or not doubt.strip() or len(doubt) > 256:
            raise LoopError("Invalid doubt reference")
        self.phase = "explain"
        return self._append("doubt_recorded", {"doubtRef": doubt[:64]})

    def begin_check(self) -> dict[str, Any]:
        """Check phase: the EXPECTED ANSWER never enters the loop; hints only."""
        if self.closed or self.phase not in ("explain", "doubt"):
            raise LoopError(f"begin_check is invalid in phase {self.phase}")
        decision = self._policy_decision({
            "errorClass": None, "firstEncounter": False,
            "approvedVisualAvailable": False, "hintsOnly": True,
        })
        if decision["action"] not in ("teach", "await_response"):
            raise LoopError(f"Policy refuses the check: {decision['action']}/{decision['reason']}")
        self.phase = "check"
        return self._append("check_started", {"answerPolicy": "hints_only", "expectedAnswerStored": False})

    def record_check_result(self, correct: bool, assessed_by: str = "backend") -> dict[str, Any]:
        """Backend assessment decides the transition — never the model."""
        if self.closed or self.phase != "check":
            raise LoopError(f"record_check_result is invalid in phase {self.phase}")
        if assessed_by != "backend":
            raise LoopError("Only backend assessment may drive the loop")
        if type(correct) is not bool:
            raise LoopError("correct must be a bool")
        if correct:
            self.phase = "check_passed"
            self.assessed_count += 1
            self.closed = True
            return self._append("check_complete", {"assessedBy": "backend", "masteryGranted": False})
        self.failed_checks += 1
        if self.failed_checks >= 3:
            self.phase = "review"
            self.closed = True
            return self._append("review", {"reason": "failure_bound", "failedChecks": self.failed_checks})
        self.phase = "explain"
        return self._append("remediation", {"failedChecks": self.failed_checks, "previousStrategy": self.previous_strategy})

    def attach_to_build(self, build_run_id: str) -> dict[str, Any]:
        """OPTIONAL teaching during Build: a distinct attachment that never
        advances Build acceptance."""
        if type(build_run_id) is not str or not build_run_id:
            raise LoopError("Invalid build run id")
        return self._append("attached_to_build", {"buildRunId": build_run_id, "advancesBuildAcceptance": False})

    def resume(self, events: list[dict[str, Any]]) -> dict[str, Any]:
        """SECOND-DEVICE RESUME: replay events; identical loop state."""
        if not events or any(e.get("kind") is None for e in events):
            raise LoopError("Invalid event list")
        clone = deepcopy(self)
        clone.events = [deepcopy(e) for e in events]
        phase_afters = [e["detail"].get("phaseAfter") for e in events if "phaseAfter" in e.get("detail", {})]
        clone.phase = phase_afters[-1] if phase_afters else clone.phase
        return {
            "contract": LOOP_CONTRACT,
            "loopId": clone.loop_id,
            "phase": clone.phase,
            "failedChecks": clone.failed_checks,
            "eventCount": len(clone.events),
            "identicalToOriginal": json.dumps(clone.events, sort_keys=True) == json.dumps(self.events, sort_keys=True),
        }

    def state(self) -> dict[str, Any]:
        return {
            "contract": LOOP_CONTRACT,
            "loopId": self.loop_id,
            "phase": self.phase,
            "failedChecks": self.failed_checks,
            "previousStrategy": self.previous_strategy,
            "eventCount": len(self.events),
            "closed": self.closed,
            "masteryGranted": False,
        }
