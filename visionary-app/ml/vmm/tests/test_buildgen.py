"""VMM-17 (KAN-185) — frontier Build workflow tests over the REAL provider
qualification chain: generate → revise → test → explain → learn → deploy,
plus the deny paths (unqualified provider, cross-owner, test/explanation
gates) and the redacted event log.
"""
import unittest

from vmm.buildgen import BUILD_CONTRACT, BuildWorkflowError, FrontierBuildWorkflow
from vmm.providers import ProviderError, ProviderQualification

CUSTODIAN = {"uid": "uid_custodian", "role": "custodian"}
THRESHOLDS = {"minTaskQuality": 0.75, "maxLatencyMs": 2000, "maxPerTaskCostUsd": 0.01, "minEnglishGrounding": 0.9, "minSamples": 4}
DATA_TERMS = {"retention": "90d", "region": "in", "trainingUse": "none"}
TASKS = [{"grounded": True, "toolsUsed": ["read-source"]} for _ in range(5)]
OWNER = {"uid": "uid-builder"}
OTHER = {"uid": "uid-other"}


class SyntheticAdapter:
    def __init__(self, version="adp-1", score=0.9, latency_ms=800, cost_usd=0.004):
        self._v, self._s, self._l, self._c = version, score, latency_ms, cost_usd
    def version(self):
        return self._v
    def invoke(self, task):
        return {"score": self._s, "latencyMs": self._l, "costUsd": self._c}


def qualified_build_registry() -> ProviderQualification:
    q = ProviderQualification()
    q.preregister_thresholds(CUSTODIAN, THRESHOLDS)
    q.register_profile("provider-alpha", ["build"], "adp-1", DATA_TERMS, consumer_chat_available=True, tools=["read-source"])
    q.measure("provider-alpha", SyntheticAdapter(), TASKS)
    q.qualify("provider-alpha", CUSTODIAN)
    return q


class BuildWorkflowTest(unittest.TestCase):
    def test_generate_revise_test_explain_learn_deploy_end_to_end(self):
        workflow = FrontierBuildWorkflow(qualified_build_registry())
        first = workflow.generate(OWNER, "Build a fractions quiz page", ["index.html", "quiz.js"])
        self.assertEqual(first["revision"]["revision"], 1)
        self.assertEqual(first["revision"]["providerId"], "provider-alpha")
        workflow.record_test(OWNER, "art_1", 1, True, ["renders", "no-console-errors"])
        workflow.record_explanation(OWNER, "art_1", 1, "Uses the file quiz.js for scoring", [{"revision": 1, "file": "quiz.js"}])
        ref = workflow.learn_reference(OWNER, "art_1", 1)
        self.assertEqual(ref["artifactId"], "art_1")
        self.assertIsNotNone(ref["explanationDigest"])
        receipt = workflow.deploy(OWNER, "art_1", 1, "sandbox-preview")
        self.assertEqual(receipt["contract"], BUILD_CONTRACT)
        self.assertEqual(receipt["revision"], 1)
        second = workflow.revise(OWNER, "art_1", "Split quiz into two parts", ["index.html", "quiz.js", "part2.js"])
        self.assertEqual(second["revision"]["revision"], 2)
        self.assertEqual(second["revision"]["parentRevision"], 1)
        # v1 stays deployable — multi-revision ownership pins exact revisions.
        receipt_v1 = workflow.deploy(OWNER, "art_1", 1, "sandbox-preview")
        self.assertEqual(receipt_v1["revision"], 1)
        self.assertEqual(len(workflow.history(OWNER, "art_1")), 2)

    def test_unqualified_provider_refuses_before_any_artifact(self):
        empty = FrontierBuildWorkflow(ProviderQualification())
        with self.assertRaises(BuildWorkflowError):
            empty.generate(OWNER, "anything", ["index.html"])
        self.assertEqual(empty.events(), [])

    def test_gates_refuse_deploy_without_passed_test_or_explanation(self):
        workflow = FrontierBuildWorkflow(qualified_build_registry())
        workflow.generate(OWNER, "b", ["index.html"])
        with self.assertRaises(BuildWorkflowError):
            workflow.deploy(OWNER, "art_1", 1, "sandbox-preview")  # no test
        workflow.record_test(OWNER, "art_1", 1, False, ["renders"])
        with self.assertRaises(BuildWorkflowError):
            workflow.deploy(OWNER, "art_1", 1, "sandbox-preview")  # failed test
        workflow.record_test(OWNER, "art_1", 1, True, ["renders"])
        with self.assertRaises(BuildWorkflowError):
            workflow.deploy(OWNER, "art_1", 1, "sandbox-preview")  # no explanation
        workflow.record_explanation(OWNER, "art_1", 1, "ok", [{"revision": 1, "file": "index.html"}])
        workflow.deploy(OWNER, "art_1", 1, "sandbox-preview")

    def test_explanation_must_reference_the_actual_revision_and_files(self):
        workflow = FrontierBuildWorkflow(qualified_build_registry())
        workflow.generate(OWNER, "b", ["index.html"])
        with self.assertRaises(BuildWorkflowError):
            workflow.record_explanation(OWNER, "art_1", 1, "wrong file", [{"revision": 1, "file": "ghost.js"}])
        with self.assertRaises(BuildWorkflowError):
            workflow.record_explanation(OWNER, "art_1", 1, "wrong revision", [{"revision": 2, "file": "index.html"}])

    def test_cross_owner_is_refused_at_every_stage(self):
        workflow = FrontierBuildWorkflow(qualified_build_registry())
        workflow.generate(OWNER, "b", ["index.html"])
        with self.assertRaises(BuildWorkflowError):
            workflow.revise(OTHER, "art_1", "hijack", ["index.html"])
        with self.assertRaises(BuildWorkflowError):
            workflow.record_test(OTHER, "art_1", 1, True, ["renders"])
        with self.assertRaises(BuildWorkflowError):
            workflow.record_explanation(OTHER, "art_1", 1, "x", [{"revision": 1, "file": "index.html"}])
        with self.assertRaises(BuildWorkflowError):
            workflow.deploy(OTHER, "art_1", 1, "sandbox-preview")
        with self.assertRaises(BuildWorkflowError):
            workflow.history(OTHER, "art_1")

    def test_unknown_artifact_revision_and_empty_checks_refuse(self):
        workflow = FrontierBuildWorkflow(qualified_build_registry())
        workflow.generate(OWNER, "b", ["index.html"])
        with self.assertRaises(BuildWorkflowError):
            workflow.record_test(OWNER, "art_ghost", 1, True, ["renders"])
        with self.assertRaises(BuildWorkflowError):
            workflow.record_test(OWNER, "art_1", 9, True, ["renders"])
        with self.assertRaises(BuildWorkflowError):
            workflow.record_test(OWNER, "art_1", 1, True, [])

    def test_events_are_redacted(self):
        workflow = FrontierBuildWorkflow(qualified_build_registry())
        workflow.generate(OWNER, "a secret brief nobody may log", ["index.html"])
        self.assertTrue(FrontierBuildWorkflow.events_are_redacted(workflow.events()))


if __name__ == "__main__":
    unittest.main()
