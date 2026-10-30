"""VMM-24 (KAN-196) — goals/planning contracts (synthetic)."""
import unittest

from vmm.goals import GOALS_CONTRACT, GoalError, GoalPlanner

PINNED = {"curriculumVersion": "curr-v1", "sourceVersion": "source-v1", "criteriaVersion": "rubric-v1"}
OWNER = {"kind": "user", "uid": "uid_learner"}
CONCEPTS = ["newton", "photosynthesis", "ratios"]
EXAM = {"board": "CBSE", "examDate": "2027-03-15"}


def projections():
    return [
        {"conceptId": "newton", "pKnown": 0.9, "attemptCount": 6, "uncertainty": {"abstainRecommended": False, "band": "tight"}},
        {"conceptId": "ratios", "pKnown": 0.4, "attemptCount": 3, "uncertainty": {"abstainRecommended": False, "band": "moderate"}},
        # photosynthesis has NO evidence -> unassessed
    ]


def planner():
    return GoalPlanner(PINNED, exam_ready_threshold=0.8, evidence_projections=projections())


def goal(planner):
    return planner.create_goal(OWNER, "goal-1", "Board exam readiness", CONCEPTS, EXAM)


class GoalContracts(unittest.TestCase):
    def test_goal_is_versioned_and_amendments_byte_stable(self):
        p = planner()
        g1 = goal(p)
        import json as _json
        snapshot = _json.dumps(g1, sort_keys=True)
        g2 = p.amend_goal(g1, exam={"board": "ICSE", "examDate": "2027-04-10"})
        self.assertEqual(g2["version"], 2)
        self.assertEqual(_json.dumps(g1, sort_keys=True), snapshot, "earlier version byte-stable")

    def test_invalid_goal_inputs_fail_closed(self):
        p = planner()
        with self.assertRaises(GoalError):
            p.create_goal({"kind": "backend-service", "uid": "svc"}, "g", "t", CONCEPTS)  # not owner-scoped
        with self.assertRaises(GoalError):
            p.create_goal(OWNER, "", "t", CONCEPTS)
        with self.assertRaises(GoalError):
            p.create_goal(OWNER, "g", "t", [])
        with self.assertRaises(GoalError):
            p.create_goal(OWNER, "g", "t", CONCEPTS, exam={"board": "CBSE"})  # missing examDate
        with self.assertRaises(GoalError):
            p.create_goal(OWNER, "g", "t", CONCEPTS, exam={"board": "CBSE", "examDate": "soon"})


class PlanningContracts(unittest.TestCase):
    def test_plan_is_curriculum_aware_deterministic_and_weakest_first(self):
        p = planner()
        g = goal(p)
        plan_a = p.replan(g)
        plan_b = p.replan(g)
        self.assertEqual(plan_a["items"], plan_b["items"], "deterministic plan")
        assessed = [i for i in plan_a["items"] if i["state"] == "assessed"]
        self.assertEqual([i["conceptId"] for i in assessed], ["ratios", "newton"], "weakest assessed first")
        unassessed = [i for i in plan_a["items"] if i["state"] == "unassessed"]
        self.assertEqual([i["conceptId"] for i in unassessed], ["photosynthesis"])

    def test_assessed_attempt_updates_home_state(self):
        p = planner()
        g = goal(p)
        before = p.home_state(g)
        self.assertEqual(before["perConceptReadiness"]["newton"]["state"], "ready")
        self.assertEqual(before["nextReview"], "ratios")
        # A new assessed attempt moves ratios' pKnown up.
        p.evidence["ratios"] = {"conceptId": "ratios", "pKnown": 0.95, "attemptCount": 8, "uncertainty": {"abstainRecommended": False, "band": "tight"}}
        after = p.home_state(g)
        self.assertEqual(after["nextReview"], "newton", "Home recomputed after the assessed attempt")

    def test_exam_date_and_board_changes_regenerate_deterministically(self):
        p = planner()
        g1 = goal(p)
        plan_before = p.replan(g1)
        g2 = p.amend_goal(g1, exam={"board": "ICSE", "examDate": "2027-04-10"})
        plan_after = p.replan(g2)
        self.assertEqual(plan_before["items"], plan_after["items"], "same evidence -> same items")
        self.assertEqual(plan_after["exam"]["board"], "ICSE")
        g3 = p.amend_goal(g2, exam={"board": "ICSE", "examDate": "2027-05-01"})
        self.assertEqual(p.replan(g3)["items"], plan_after["items"], "date-only change keeps item order deterministic")

    def test_duplicate_events_are_idempotent(self):
        p = planner()
        event = {"eventId": "evt-1", "kind": "assessed_attempt", "conceptId": "newton"}
        self.assertTrue(p.record_event(event)["recorded"])
        duplicate = p.record_event(event)
        self.assertFalse(duplicate["recorded"])
        self.assertTrue(duplicate["duplicate"])
        self.assertEqual(len(p._events), 1)

    def test_second_device_resume_identical(self):
        p = planner()
        g = goal(p)
        events = [{"eventId": f"e{i}", "kind": "assessed_attempt"} for i in range(3)]
        for e in events:
            p.record_event(e)
        resumed = p.resume(g, events)
        self.assertTrue(resumed["identicalToOriginal"])


class ReadinessContracts(unittest.TestCase):
    def test_no_invented_readiness_unassessed_is_unknown(self):
        p = planner()
        g = goal(p)
        home = p.home_state(g)
        self.assertEqual(home["perConceptReadiness"]["photosynthesis"]["state"], "unknown")
        self.assertIsNone(home["perConceptReadiness"]["photosynthesis"]["pKnown"])
        self.assertTrue(home["readinessIncomplete"], "incomplete coverage is reported")
        self.assertIsNone(home["overallReadinessClaim"], "no fabricated total readiness")

    def test_readiness_only_from_assessed_evidence(self):
        p = planner()
        g = goal(p)
        home = p.home_state(g)
        self.assertEqual(home["perConceptReadiness"]["newton"]["state"], "ready")
        self.assertEqual(home["perConceptReadiness"]["ratios"]["state"], "in_progress")
        self.assertEqual(home["assessedReadyFraction"], 0.5)
        self.assertFalse(home["readinessComplete"])

    def test_pinned_source_version_enforced(self):
        with self.assertRaises(GoalError):
            GoalPlanner({"curriculumVersion": "curr-v1", "sourceVersion": "", "criteriaVersion": "rubric-v1"})


if __name__ == "__main__":
    unittest.main()
