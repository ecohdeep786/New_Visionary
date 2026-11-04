"""VMM-20 (KAN-188) — hardening probes over the REAL composed stack: the OCR
quarantine's adversarial bounds, the Build workflow's gates under a kill
switch, capacity across concurrent real operations, and secret redaction."""
import unittest

from vmm.buildgen import BuildWorkflowError, FrontierBuildWorkflow
from vmm.hardening import HardeningError, IndependentHardening
from vmm.ocr import OcrError, OcrQuarantine
from vmm.providers import ProviderQualification

OWNER = {"kind": "user", "uid": "uid-learner"}
CUSTODIAN = {"uid": "uid_custodian", "role": "custodian"}
THRESHOLDS = {"minTaskQuality": 0.75, "maxLatencyMs": 2000, "maxPerTaskCostUsd": 0.01, "minEnglishGrounding": 0.9, "minSamples": 4}
TASKS = [{"grounded": True, "toolsUsed": ["read-source"]} for _ in range(5)]


class GoodEngine:
    def version(self):
        return "fake-ocr-1.0"
    def recognize(self, page_bytes):
        return [{"regions": [{"text": "clean text", "confidence": 0.9, "bbox": {}}]}]


class SpyEngine(GoodEngine):
    """Records that refused attacks never touched the engine."""
    def __init__(self):
        self.calls = 0
    def recognize(self, page_bytes):
        self.calls += 1
        return super().recognize(page_bytes)


def build_registry() -> ProviderQualification:
    q = ProviderQualification()
    q.preregister_thresholds(CUSTODIAN, THRESHOLDS)
    q.register_profile("provider-alpha", ["build"], "adp-1", {"retention": "90d", "region": "in", "trainingUse": "none"}, True, ["read-source"])
    class A:
        def version(self): return "adp-1"
        def invoke(self, task): return {"score": 0.9, "latencyMs": 800, "costUsd": 0.004}
    q.measure("provider-alpha", A(), TASKS)
    q.qualify("provider-alpha", CUSTODIAN)
    return q


class HardeningTest(unittest.TestCase):
    def test_adversarial_uploads_are_refused_and_leave_the_engine_unchanged(self):
        engine = SpyEngine()
        quarantine = OcrQuarantine(engine)
        with self.assertRaises(OcrError):
            quarantine.admit_upload(OWNER, "huge.png", b"\x89PNG\r\n\x1a\n" + b"0" * (10 * 1024 * 1024 + 1))
        with self.assertRaises(OcrError):
            quarantine.admit_upload(OWNER, "fake.png", b"MZ not-an-image")
        with self.assertRaises(OcrError):
            quarantine.admit_upload(OWNER, "empty.png", b"")
        self.assertEqual(engine.calls, 0, "refused attacks never reached the engine")
        upload = quarantine.admit_upload(OWNER, "ok.png", b"\x89PNG\r\n\x1a\n" + b"0" * 64)
        self.assertTrue(upload["quarantined"])

    def test_kill_switch_refuses_new_work_and_recovery_keeps_state(self):
        workflow = FrontierBuildWorkflow(build_registry())
        workflow.generate({"uid": "uid-builder"}, "brief", ["index.html"])
        workflow.record_test({"uid": "uid-builder"}, "art_1", 1, True, ["renders"])
        workflow.record_explanation({"uid": "uid-builder"}, "art_1", 1, "ok", [{"revision": 1, "file": "index.html"}])
        hardening = IndependentHardening()
        hardening.engage_kill_switch("quality incident")
        with self.assertRaises(HardeningError):
            hardening.guard(lambda: workflow.generate({"uid": "uid-builder"}, "new", ["x.js"]))
        self.assertEqual(len(workflow.history({"uid": "uid-builder"}, "art_1")), 1, "completed state stays intact")
        with self.assertRaises(HardeningError):
            hardening.guard(lambda: workflow.deploy({"uid": "uid-builder"}, "art_1", 1, "sandbox"))  # fail closed even for completed work
        self.assertEqual(len(workflow.history({"uid": "uid-builder"}, "art_1")), 1, "completed state stays intact")
        hardening.release_kill_switch()
        receipt = hardening.guard(lambda: workflow.deploy({"uid": "uid-builder"}, "art_1", 1, "sandbox"))
        self.assertEqual(receipt["revision"], 1)
        new_art = hardening.guard(lambda: workflow.generate({"uid": "uid-builder"}, "post-incident", ["x.js"]))
        self.assertEqual(new_art["artifactId"], "art_2", "recovery continues the sequence without loss")

    def test_capacity_probe_over_real_concurrent_operations(self):
        workflow = FrontierBuildWorkflow(build_registry())
        probe = IndependentHardening()
        verdict = probe.capacity_probe(
            lambda: workflow.generate({"uid": "uid-builder"}, f"brief-{id(workflow)}", ["index.html"]),
            n=32, deadline_ms=30000,
        )
        self.assertEqual(verdict["operations"], 32)
        self.assertEqual(verdict["completed"] + verdict["refused"], 32)
        self.assertEqual(verdict["hung"], 0)
        self.assertTrue(verdict["withinDeadline"])

    def test_capacity_bounds_refuse(self):
        probe = IndependentHardening()
        with self.assertRaises(HardeningError):
            probe.capacity_probe(lambda: None, n=0, deadline_ms=1000)
        with self.assertRaises(HardeningError):
            probe.capacity_probe(lambda: None, n=1000, deadline_ms=1000)

    def test_redaction_sweep(self):
        sweep = IndependentHardening.redaction_sweep([
            '{"event":"deployed","target":"sandbox"}',
            'error: bad pin pin_9f8e7d6c leaked',
            'Authorization: Bearer sk-abcdefghijklmnop1234',
        ])
        self.assertFalse(sweep["clean"])
        self.assertEqual(len(sweep["leaks"]), 2)
        self.assertTrue(IndependentHardening.redaction_sweep(['{"event":"routed","refDigest":"content:abcd"}'])["clean"])


if __name__ == "__main__":
    unittest.main()
