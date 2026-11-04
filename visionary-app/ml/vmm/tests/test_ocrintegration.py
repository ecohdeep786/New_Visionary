"""VMM-16 (KAN-184) — OCR into the fixed VATS L1 teaching loop, end to end.

Drives the REAL chain: OcrQuarantine capture -> OcrAcceptanceHarness owner
review/repair -> OcrProvenanceRouter learn-surface routing -> L1OcrIntegration
admission -> BoundedTutorLoop explain with the visual input — plus the deny
paths (unreviewed capture, cross-user use, unadmitted capture, feature gate,
rollout disable/rollback) and the attempt ledger's provenance rules.
"""
import unittest

from vmm.ocr import OcrError, OcrQuarantine
from vmm.ocracceptance import REQUIRED_EN_MODALITIES, OcrAcceptanceError, OcrAcceptanceHarness
from vmm.ocrouting import OcrProvenanceRouter
from vmm.ocrintegration import L1OcrIntegration, L1OcrIntegrationError
from vmm.teachingloop import BoundedTutorLoop

PNG_BYTES = b"\x89PNG\r\n\x1a\n" + b"0" * 64
OWNER = {"kind": "user", "uid": "uid-learner"}
OTHER = {"kind": "user", "uid": "uid-stranger"}
SOURCE_VERSION = "ncert-g9-en-v3"
SOURCE_REVISION = 7
PINNED = {"policyVersion": "doc03-reference-v1", "criteriaVersion": "crit-1", "graphVersion": "graph-1", "sourceVersion": SOURCE_VERSION}
GOOD = [("reference text one", "reference text one"),
        ("reference text two", "reference text too"),
        ("reference text three", "reference text three")]


class FakeEngine:
    def version(self) -> str:
        return "fake-ocr-1.0"

    def recognize(self, page_bytes: bytes) -> list[dict]:
        return [{"regions": [{"text": "The mtter is coposed of atos", "confidence": 0.8, "bbox": {}}]}]


_QUARANTINE = OcrQuarantine(FakeEngine())


def fresh_result() -> dict:
    upload = _QUARANTINE.admit_upload(OWNER, "page.png", PNG_BYTES)
    job = _QUARANTINE.start_job(OWNER, upload["uploadId"])
    return _QUARANTINE.complete_job(OWNER, job["jobId"])


def make_loop() -> BoundedTutorLoop:
    return BoundedTutorLoop("loop-1", dict(PINNED), "concept-matter", 0.4, 3,
                            ["socratic", "worked_example", "analogy", "visual", "practice"])


def qualified_harness() -> OcrAcceptanceHarness:
    harness = OcrAcceptanceHarness()
    for modality in REQUIRED_EN_MODALITIES:
        harness.rollout.qualify("en", modality, GOOD)
    return harness


class OcrL1IntegrationTest(unittest.TestCase):
    def test_capture_review_route_attach_explain_end_to_end(self):
        raw = fresh_result()
        harness = qualified_harness()
        integration = L1OcrIntegration(harness, OcrProvenanceRouter(lambda sv: SOURCE_REVISION))
        harness.register_result(OWNER, raw)
        reviewed = harness.review(OWNER, raw, corrections=[{"page": 1, "regionIndex": 0, "correctedText": "The matter is composed of atoms"}])
        payload = integration.attach_capture(OWNER, reviewed, SOURCE_VERSION, SOURCE_REVISION)
        self.assertEqual(payload["surface"], "learn")
        loop = make_loop()
        outcome = integration.explain_with_capture(loop, OWNER, payload["jobId"], first_encounter=True)
        self.assertTrue(outcome["ocr"]["visualAvailable"])
        self.assertFalse(outcome["ocr"]["sourceAuthorized"])
        self.assertTrue(outcome["ocr"]["untrustedPerception"])
        self.assertEqual(loop.phase, "doubt")

    def test_unreviewed_capture_never_reaches_the_loop(self):
        raw = fresh_result()
        integration = L1OcrIntegration(qualified_harness(), OcrProvenanceRouter(lambda sv: SOURCE_REVISION))
        with self.assertRaises(OcrAcceptanceError):
            integration.attach_capture(OWNER, raw, SOURCE_VERSION, SOURCE_REVISION)
        with self.assertRaises(L1OcrIntegrationError):
            integration.explain_with_capture(make_loop(), OWNER, raw["jobId"], True)

    def test_cross_user_use_is_denied(self):
        raw = fresh_result()
        harness = qualified_harness()
        integration = L1OcrIntegration(harness, OcrProvenanceRouter(lambda sv: SOURCE_REVISION))
        harness.register_result(OWNER, raw)
        reviewed = harness.review(OWNER, raw, corrections=[])
        integration.attach_capture(OWNER, reviewed, SOURCE_VERSION, SOURCE_REVISION)
        with self.assertRaises(L1OcrIntegrationError):
            integration.explain_with_capture(make_loop(), OTHER, reviewed["jobId"], True)
        with self.assertRaises(L1OcrIntegrationError):
            integration.record_attempt(OTHER, reviewed["jobId"], True)

    def test_feature_gate_falls_back_visibly_and_rollback_restores(self):
        raw = fresh_result()
        harness = OcrAcceptanceHarness()  # NOT release-ready yet
        integration = L1OcrIntegration(harness, OcrProvenanceRouter(lambda sv: SOURCE_REVISION))
        self.assertFalse(integration.feature_status()["available"])
        harness.register_result(OWNER, raw)
        with self.assertRaises(L1OcrIntegrationError):
            integration.attach_capture(OWNER, harness.review(OWNER, raw, corrections=[]), SOURCE_VERSION, SOURCE_REVISION)
        for modality in REQUIRED_EN_MODALITIES:
            harness.rollout.qualify("en", modality, GOOD)
        harness.register_result(OWNER, raw)
        reviewed = harness.review(OWNER, raw, corrections=[])
        payload = integration.attach_capture(OWNER, reviewed, SOURCE_VERSION, SOURCE_REVISION)
        healthy_version = harness.rollout.snapshot_version()
        harness.rollout.disable("en", "quality incident")
        self.assertFalse(integration.feature_status()["available"])
        loop = make_loop()
        outcome = integration.explain_with_capture(loop, OWNER, payload["jobId"], first_encounter=True)
        self.assertFalse(outcome["ocr"]["visualAvailable"], "the visual input falls back visibly, the loop still runs")
        harness.rollout.rollback(healthy_version)
        self.assertTrue(integration.feature_status()["available"])

    def test_attempt_ledger_keeps_provenance_honest(self):
        raw = fresh_result()
        harness = qualified_harness()
        integration = L1OcrIntegration(harness, OcrProvenanceRouter(lambda sv: SOURCE_REVISION))
        harness.register_result(OWNER, raw)
        reviewed = harness.review(OWNER, raw, corrections=[])
        payload = integration.attach_capture(OWNER, reviewed, SOURCE_VERSION, SOURCE_REVISION)
        attempt = integration.record_attempt(OWNER, payload["jobId"], True)
        self.assertFalse(attempt["ocr"]["sourceAuthorized"])
        self.assertTrue(attempt["ocr"]["untrustedPerception"])
        self.assertFalse(attempt["ocr"]["masteryFromOcrAlone"])
        plain = integration.record_attempt(OWNER, None, False)
        self.assertIsNone(plain["ocr"])
        self.assertEqual(len(integration.attempts()), 2)
        # After revocation the capture cannot re-enter the session (fail closed).
        harness.revoke(OWNER, raw["jobId"], "user deleted the capture")
        with self.assertRaises(OcrAcceptanceError):
            integration.attach_capture(OWNER, reviewed, SOURCE_VERSION, SOURCE_REVISION)
        with self.assertRaises(L1OcrIntegrationError):
            integration.explain_with_capture(make_loop(), OWNER, payload["jobId"], True)


if __name__ == "__main__":
    unittest.main()
