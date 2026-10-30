"""VMM-27 (KAN-199) — typed planning contracts (synthetic)."""
import json
import unittest

from vmm.planning import PlanningError, TypedPlanner

BACKEND = {"kind": "backend-service", "serviceId": "backend-product"}
OWNER = {"uid": "uid_owner", "role": "owner"}

BOUNDS = {"deadlineMs": 5000, "maxRetries": 2, "maxStepCostUsd": 0.05}


def passing_verifier(step):
    return True


def failing_verifier(step):
    return False


class DurabilityContracts(unittest.TestCase):
    def test_checkpoint_replays_identically_across_context_reset(self):
        verifiers = {"policy-check": passing_verifier}
        planner = TypedPlanner("plan-1", max_total_cost_usd=1.0, verifiers=verifiers)
        planner.add_step("s1", "delegation", BOUNDS, verifier="policy-check")
        planner.add_step("s2", "approval", BOUNDS)
        planner.delegate(BACKEND, "s1", "tiny-d1-worker")
        checkpoint = planner.checkpoint()
        self.assertNotIn("callable", json.dumps(checkpoint), "callables never serialize")
        # Context reset: a fresh planner restores from the checkpoint.
        restored = TypedPlanner.restore(checkpoint, verifiers=verifiers)
        self.assertTrue(planner.identical_state(restored))
        # The restored planner continues seamlessly.
        restored.record_outcome("s1", True, 0.01)
        restored.verify_step(BACKEND, "s1")
        restored.complete_step(OWNER, "s1")
        self.assertEqual(restored._steps["s1"]["status"], "completed")


class BoundedDelegationContracts(unittest.TestCase):
    def test_retry_bound_exceeded_fails_closed(self):
        planner = TypedPlanner("p", max_total_cost_usd=1.0, verifiers={"policy-check": passing_verifier, "policy-check-fail": failing_verifier})
        planner.add_step("s", "delegation", {**BOUNDS, "maxRetries": 1}, verifier="policy-check")
        planner.delegate(BACKEND, "s", "worker-a")
        planner.record_outcome("s", False, 0.0)
        planner.delegate(BACKEND, "s", "worker-b")
        planner.record_outcome("s", False, 0.0)
        with self.assertRaises(PlanningError):
            planner.delegate(BACKEND, "s", "worker-c")  # retry bound exceeded
        self.assertEqual(planner._steps["s"]["status"], "failed")

    def test_cost_budget_enforced(self):
        planner = TypedPlanner("p", max_total_cost_usd=0.05, verifiers={"policy-check": passing_verifier})
        planner.add_step("s", "delegation", {**BOUNDS, "maxStepCostUsd": 0.04}, verifier="policy-check")
        planner.delegate(BACKEND, "s", "worker")
        with self.assertRaises(PlanningError):
            planner.record_outcome("s", True, 0.05)  # exceeds step + total budget
        self.assertEqual(planner._steps["s"]["status"], "failed")

    def test_delegation_requires_independent_verifier_at_add_time(self):
        planner = TypedPlanner("p", max_total_cost_usd=1.0, verifiers={"policy-check": passing_verifier, "policy-check-fail": failing_verifier})
        with self.assertRaises(PlanningError):
            planner.add_step("s", "delegation", BOUNDS, verifier=None)


class IndependentVerificationContracts(unittest.TestCase):
    def test_model_self_reported_success_is_never_completion(self):
        planner = TypedPlanner("p", max_total_cost_usd=1.0, verifiers={"policy-check": passing_verifier, "policy-check-fail": failing_verifier})
        planner.add_step("s", "delegation", BOUNDS, verifier="policy-check")
        planner.delegate(BACKEND, "s", "worker")
        planner.record_outcome("s", True, 0.01)
        # Even with a claimed success, the step cannot complete unverified.
        with self.assertRaises(PlanningError):
            planner.complete_step(OWNER, "s")

    def test_independent_check_gates_completion(self):
        planner = TypedPlanner("p", max_total_cost_usd=1.0, verifiers={"policy-check": passing_verifier, "policy-check-fail": failing_verifier})
        planner.add_step("s-fail", "delegation", BOUNDS, verifier="policy-check-fail")
        planner.add_step("s-pass", "delegation", BOUNDS, verifier="policy-check")
        for sid in ("s-fail", "s-pass"):
            planner.delegate(BACKEND, sid, "worker")
            planner.record_outcome(sid, True, 0.01)
        with self.assertRaises(PlanningError):
            planner.verify_step(BACKEND, "s-fail")
        self.assertEqual(planner._steps["s-fail"]["status"], "failed")
        planner.verify_step(BACKEND, "s-pass")
        planner.complete_step(OWNER, "s-pass")
        self.assertEqual(planner._steps["s-pass"]["status"], "completed")


class EffectContracts(unittest.TestCase):
    def test_no_duplicate_effects(self):
        planner = TypedPlanner("p", max_total_cost_usd=1.0, verifiers={"policy-check": passing_verifier, "policy-check-fail": failing_verifier})
        planner.add_step("s", "tool", BOUNDS)
        planner.verify_step(BACKEND, "s")
        planner.complete_step(OWNER, "s")
        with self.assertRaises(PlanningError):
            planner.complete_step(OWNER, "s")  # duplicate effect refused

    def test_approval_steps_require_an_explicit_approver_model_cannot_approve(self):
        planner = TypedPlanner("p", max_total_cost_usd=1.0, verifiers={"policy-check": passing_verifier, "policy-check-fail": failing_verifier})
        planner.add_step("a", "approval", BOUNDS)
        planner.verify_step(BACKEND, "a")
        with self.assertRaises(PlanningError):
            planner.complete_step({"kind": "model", "uid": "tiny-d1"}, "a")
        planner.complete_step(OWNER, "a")
        self.assertEqual(planner._steps["a"]["status"], "completed")


class AdaptiveReplanContracts(unittest.TestCase):
    def test_replan_new_revision_and_late_effects_refused(self):
        planner = TypedPlanner("p", max_total_cost_usd=1.0, verifiers={"policy-check": passing_verifier, "policy-check-fail": failing_verifier})
        planner.add_step("s", "tool", BOUNDS)
        planner.verify_step(BACKEND, "s")
        planner.replan(BACKEND, new_bounds={"deadlineMs": 1000})
        self.assertEqual(planner.revision, 2)
        # Late effect against the OLD revision refused.
        with self.assertRaises(PlanningError):
            planner.complete_step(OWNER, "s", effect_revision=1)
        planner.complete_step(OWNER, "s", effect_revision=2)

    def test_replan_is_backend_authorized(self):
        planner = TypedPlanner("p", max_total_cost_usd=1.0, verifiers={"policy-check": passing_verifier, "policy-check-fail": failing_verifier})
        with self.assertRaises(PlanningError):
            planner.replan({"kind": "user", "uid": "x"})

    def test_delegation_steps_require_backend_caller(self):
        planner = TypedPlanner("p", max_total_cost_usd=1.0, verifiers={"policy-check": passing_verifier, "policy-check-fail": failing_verifier})
        planner.add_step("s", "delegation", BOUNDS, verifier="policy-check")
        with self.assertRaises(PlanningError):
            planner.delegate({"kind": "user", "uid": "x"}, "s", "worker")


if __name__ == "__main__":
    unittest.main()
