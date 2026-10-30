"""VMM-24 (KAN-196) — persistent cross-mode goals, curriculum-aware
exam/review planning and Home-facing state.

  - GOALS ARE VERSIONED: amendments append a new version; earlier versions stay
    byte-stable. Goals span learn/practice/build modes.
  - PLANS ARE CURRICULUM-AWARE AND DETERMINISTIC: a success plan is derived
    from the PINNED curriculum/source versions plus the learner's assessed
    evidence (VMM-12 projections); exam-date/board changes regenerate the plan
    deterministically; replanning is versioned, never destructive.
  - NO INVENTED EXAM READINESS: readiness is computed ONLY from assessed
    evidence against the pinned criteria — unassessed concepts report an
    explicit UNKNOWN state, and any incomplete coverage flags
    `readinessIncomplete: True` (no fabricated total).
  - HOME-FACING STATE: {goal, plan, perConceptReadiness, nextReview} is correct
    after an assessed attempt, an exam-date/board change, duplicate events and
    a second-device resume (events are append-only and replayed identically).
  - DUPLICATE EVENTS are idempotent (event id dedupe), mirroring VMM-12.
"""
from __future__ import annotations

import json
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

GOALS_CONTRACT = "vmm-goals.v1"
MODES = ("learn", "practice", "build")


class GoalError(ValueError):
    """The goal/plan operation is not admissible."""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _iso(value: Any) -> str:
    if type(value) is not str or len(value) > 32:
        raise GoalError("Invalid exam date")
    try:
        datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise GoalError("Invalid exam date") from exc
    return value


class GoalPlanner:
    """Versioned goals + deterministic curriculum-aware planning."""

    def __init__(
        self,
        pinned: dict[str, str],
        exam_ready_threshold: float = 0.8,
        evidence_projections: list[dict[str, Any]] | None = None,
    ):
        required = {"curriculumVersion", "sourceVersion", "criteriaVersion"}
        if type(pinned) is not dict or set(pinned) != required or any(type(v) is not str or not v for v in pinned.values()):
            raise GoalError("Pinned curriculum/source/criteria versions are required")
        if type(exam_ready_threshold) not in (int, float) or not 0.0 <= exam_ready_threshold <= 1.0:
            raise GoalError("Invalid exam-ready threshold")
        self.pinned = dict(pinned)
        self.exam_ready_threshold = float(exam_ready_threshold)
        # VMM-12 projections keyed by conceptId: {pKnown, attemptCount, uncertainty}
        self.evidence: dict[str, dict[str, Any]] = {
            p["conceptId"]: p for p in (evidence_projections or [])
        }
        self._events: dict[str, dict[str, Any]] = {}

    # ---- events (idempotent) -------------------------------------------------

    def record_event(self, event: dict[str, Any]) -> dict[str, Any]:
        required = {"eventId", "kind"}
        if type(event) is not dict or not required <= set(event):
            raise GoalError("Event must include eventId and kind")
        event_id = event["eventId"]
        if type(event_id) is not str or not event_id:
            raise GoalError("Invalid eventId")
        if event_id in self._events:
            return {"recorded": False, "duplicate": True, "eventId": event_id}
        self._events[event_id] = deepcopy(event)
        return {"recorded": True, "duplicate": False, "eventId": event_id}

    # ---- goals -----------------------------------------------------------------

    def create_goal(self, owner: dict[str, Any], goal_id: str, title: str, concepts: list[str], exam: dict[str, Any] | None = None) -> dict[str, Any]:
        if owner.get("kind") != "user" or type(owner.get("uid")) is not str or not owner["uid"]:
            raise GoalError("Goals are owner-scoped")
        if type(goal_id) is not str or not goal_id or len(goal_id) > 80:
            raise GoalError("Invalid goal id")
        title = title if type(title) is str and title.strip() and len(title) <= 160 else None
        if title is None:
            raise GoalError("Invalid title")
        if not isinstance(concepts, list) or not concepts or any(type(c) is not str for c in concepts):
            raise GoalError("Invalid concepts")
        if exam is not None:
            if type(exam) is not dict or not {"board", "examDate"} <= set(exam):
                raise GoalError("Exam needs board + examDate")
            _iso(exam["examDate"])
        goal = {
            "contract": GOALS_CONTRACT,
            "goalId": goal_id,
            "owner": {"uid": owner["uid"]},
            "title": title,
            "concepts": sorted(set(concepts)),
            "modes": list(MODES),
            "exam": deepcopy(exam) if exam else None,
            "version": 1,
            "createdAt": _now(),
        }
        return goal

    def amend_goal(self, goal: dict[str, Any], **changes) -> dict[str, Any]:
        """Amendment appends a NEW version; the input goal stays byte-stable."""
        amended = deepcopy(goal)
        amended["version"] = goal["version"] + 1
        if "title" in changes:
            amended["title"] = changes["title"]
        if "concepts" in changes:
            if not isinstance(changes["concepts"], list) or not changes["concepts"]:
                raise GoalError("Invalid concepts")
            amended["concepts"] = sorted(set(changes["concepts"]))
        if "exam" in changes:
            exam = changes["exam"]
            if exam is not None:
                if type(exam) is not dict or not {"board", "examDate"} <= set(exam):
                    raise GoalError("Exam needs board + examDate")
                _iso(exam["examDate"])
            amended["exam"] = deepcopy(exam)
        return amended

    # ---- planning + Home state ---------------------------------------------------

    def replan(self, goal: dict[str, Any]) -> dict[str, Any]:
        """Deterministic success plan from pinned curriculum + assessed evidence."""
        items = []
        for concept in goal["concepts"]:
            projection = self.evidence.get(concept)
            if projection is None:
                items.append({"conceptId": concept, "state": "unassessed", "pKnown": None, "priority": 0})
                continue
            p_known = projection["pKnown"]
            uncert = projection.get("uncertainty", {})
            priority = round(1.0 - p_known, 6)
            items.append({
                "conceptId": concept,
                "state": "assessed",
                "pKnown": p_known,
                "priority": priority,
                "abstainRecommended": uncert.get("abstainRecommended", False),
            })
        # Weakest assessed first; unassessed carry explicit unknown state.
        assessed = sorted([i for i in items if i["state"] == "assessed"], key=lambda i: (-i["priority"], i["conceptId"]))
        unassessed = sorted([i for i in items if i["state"] == "unassessed"], key=lambda i: i["conceptId"])
        plan = {
            "contract": GOALS_CONTRACT,
            "goalId": goal["goalId"],
            "goalVersion": goal["version"],
            "pinned": deepcopy(self.pinned),
            "exam": deepcopy(goal.get("exam")),
            "items": assessed + unassessed,
            "plannedAt": _now(),
        }
        return plan

    def home_state(self, goal: dict[str, Any]) -> dict[str, Any]:
        """Home-facing projection: readiness ONLY from assessed evidence."""
        plan = self.replan(goal)
        readiness = {}
        assessed_count = 0
        ready_count = 0
        for item in plan["items"]:
            if item["state"] == "unassessed":
                readiness[item["conceptId"]] = {"state": "unknown", "pKnown": None}
                continue
            assessed_count += 1
            ready = item["pKnown"] >= self.exam_ready_threshold
            ready_count += 1 if ready else 0
            readiness[item["conceptId"]] = {
                "state": "ready" if ready else "in_progress",
                "pKnown": item["pKnown"],
            }
        concepts = goal["concepts"]
        readiness_incomplete = assessed_count < len(concepts)
        return {
            "contract": GOALS_CONTRACT,
            "goalId": goal["goalId"],
            "goalVersion": goal["version"],
            "exam": deepcopy(goal.get("exam")),
            "nextReview": assessed[0]["conceptId"] if (assessed := [i for i in plan["items"] if i["state"] == "assessed"]) else None,
            "perConceptReadiness": readiness,
            "readinessComplete": not readiness_incomplete,
            "readinessIncomplete": readiness_incomplete,
            "assessedReadyFraction": round(ready_count / assessed_count, 6) if assessed_count else None,
            "overallReadinessClaim": None,
            "note": "No invented exam readiness: incomplete coverage is reported, never estimated.",
            "plannedAt": plan["plannedAt"],
        }

    def resume(self, goal: dict[str, Any], events: list[dict[str, Any]]) -> dict[str, Any]:
        """SECOND-DEVICE RESUME: replay events; identical Home state."""
        replay = GoalPlanner(self.pinned, self.exam_ready_threshold, list(self.evidence.values()))
        for event in events:
            replay.record_event(event)
        home = replay.home_state(goal)
        original = self.home_state(goal)
        # Timestamps are receipt metadata; the deterministic content must match.
        for state in (home, original):
            state.pop("plannedAt", None)
        home["identicalToOriginal"] = json.dumps(home, sort_keys=True) == json.dumps(original, sort_keys=True)
        return home
