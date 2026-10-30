"""VMM-13 (KAN-181) — bounded tutor loop contracts (synthetic)."""
import json
import unittest

from vmm.teachingloop import BoundedTutorLoop, LoopError

PINNED = {
    "policyVersion": "doc03-reference-v1",
    "criteriaVersion": "rubric-v1",
    "graphVersion": "graph-v1",
    "sourceVersion": "source-v1",
}
ALLOWED = ["socratic", "worked_example", "analogy", "visual", "practice"]


def loop(**overrides):
    base = dict(loop_id="loop-1", pinned=PINNED, concept_id="newton", p_known=0.4,
                assessed_count=3, allowed_strategies=ALLOWED)
    base.update(overrides)
    return BoundedTutorLoop(**base)


class FlowContracts(unittest.TestCase):
    def test_real_flow_explain_doubt_check_complete(self):
        session = loop()
        session.explain(first_encounter=True, approved_visual_available=False)
        self.assertEqual(session.phase, "doubt")
        session.ask_doubt("why does the apple fall?")
        session.begin_check()
        self.assertEqual(session.phase, "check")
        event = session.record_check_result(True)
        self.assertEqual(event["kind"], "check_complete")
        self.assertTrue(session.closed)
        self.assertFalse(session.state()["masteryGranted"])

    def test_remediation_changes_strategy_and_stays_bounded(self):
        session = loop()
        session.explain(first_encounter=False, approved_visual_available=False)
        session.begin_check()
        session.record_check_result(False)
        self.assertEqual(session.phase, "explain")
        self.assertEqual(session.failed_checks, 1)
        self.assertNotEqual(session.previous_strategy, None)
        # Exhaust the bound: review at maxFailedChecks.
        for _ in range(2):
            session.explain(first_encounter=False, approved_visual_available=False)
            session.begin_check()
            session.record_check_result(False)
        self.assertEqual(session.phase, "review")
        self.assertTrue(session.closed, "correct stop behavior: review at the failure bound")

    def test_loop_is_never_unbounded(self):
        session = loop()
        steps = 0
        while not session.closed and steps < 20:
            steps += 1
            if session.phase == "explain":
                session.explain(first_encounter=False, approved_visual_available=False)
            elif session.phase == "doubt":
                session.begin_check()
            elif session.phase == "check":
                session.record_check_result(False)
        self.assertTrue(session.closed, "the loop always terminates")
        self.assertLessEqual(session.failed_checks, 3)


class AdvisoryRankingContracts(unittest.TestCase):
    def test_tiny_ranking_applied_inside_allowed_set_with_provenance(self):
        session = loop(ranker=lambda decision, allowed: "socratic" if "socratic" in allowed else None)
        event = session.explain(first_encounter=False, approved_visual_available=False)
        self.assertEqual(event["detail"]["rankedBy"], "tiny-d1-advisory")
        self.assertIn(event["detail"]["strategy"], ALLOWED)

    def test_ranking_outside_allowed_set_is_ignored_policy_decides(self):
        session = loop(ranker=lambda decision, allowed: "hypnosis")
        event = session.explain(first_encounter=False, approved_visual_available=False)
        self.assertEqual(event["detail"]["rankedBy"], "policy")
        self.assertIn(event["detail"]["strategy"], ALLOWED)

    def test_model_cannot_skip_the_assessed_check(self):
        session = loop(p_known=0.99, ranker=lambda decision, allowed: "practice")
        session.explain(first_encounter=False, approved_visual_available=False)
        session.begin_check()
        # Even at pKnown 0.99 the loop demands the backend-assessed check.
        with self.assertRaises(LoopError):
            session.record_check_result(True, assessed_by="tiny-d1")
        event = session.record_check_result(True, assessed_by="backend")
        self.assertEqual(event["detail"]["assessedBy"], "backend")


class ProtectionContracts(unittest.TestCase):
    def test_source_citations_pinned_on_explanations(self):
        session = loop()
        event = session.explain(first_encounter=False, approved_visual_available=False)
        self.assertEqual(event["detail"]["sourceCitation"], "source-v1")

    def test_protected_answers_never_stored(self):
        session = loop()
        session.explain(first_encounter=False, approved_visual_available=False)
        event = session.begin_check()
        self.assertFalse(event["detail"]["expectedAnswerStored"])
        self.assertEqual(event["detail"]["answerPolicy"], "hints_only")
        self.assertNotIn("answer", json.dumps(session.events).lower().replace("answerpolicy", "").replace("expectedanswerstored", ""))

    def test_visual_fallback_when_no_approved_visual(self):
        session = loop(ranker=lambda decision, allowed: "visual")
        event = session.explain(first_encounter=True, approved_visual_available=False)
        self.assertNotEqual(event["detail"]["strategy"], "visual", "no approved visual -> policy fallback")

    def test_unpinned_versions_refused(self):
        with self.assertRaises(LoopError):
            loop(pinned={"policyVersion": "unpinned", "criteriaVersion": "c", "graphVersion": "g", "sourceVersion": "s"})


class BuildAndResumeContracts(unittest.TestCase):
    def test_optional_teaching_during_build_never_advances_acceptance(self):
        session = loop()
        session.explain(first_encounter=False, approved_visual_available=False)
        event = session.attach_to_build("run-9")
        self.assertFalse(event["detail"]["advancesBuildAcceptance"])

    def test_second_device_resume_identical(self):
        session = loop()
        session.explain(first_encounter=False, approved_visual_available=False)
        session.begin_check()
        resumed = session.resume(session.events)
        self.assertTrue(resumed["identicalToOriginal"])
        self.assertEqual(resumed["phase"], "check")

    def test_pinned_versions_enforced_and_mastery_never_granted(self):
        session = loop()
        session.explain(first_encounter=False, approved_visual_available=False)
        session.begin_check()
        session.record_check_result(True)
        self.assertFalse(session.state()["masteryGranted"])


if __name__ == "__main__":
    unittest.main()
