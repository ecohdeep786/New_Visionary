"""VOCR-04 (KAN-195) — hosted OCR acceptance tests.

Exercises the full end-to-end chain over the REAL VOCR-01 quarantine and the
REAL VOCR-03 provenance router: upload -> interpretation -> owner review with
user repair -> routing into Learn/Ask/Practice/Build, then the acceptance
negatives: cross-owner refusal, correction binding, stale-supersede fail-closed,
revocation/expiry, idempotent retry, rollout matrix gating, per-locale disable/
rollback, redacted logs and deterministic cross-device replay.
"""
import unittest

from vmm.ocr import OcrError, OcrQuarantine
from vmm.ocracceptance import (
    REQUIRED_EN_MODALITIES,
    OcrAcceptanceError,
    OcrAcceptanceHarness,
    RolloutMatrix,
    cer,
    wer,
)
from vmm.ocrouting import OcrProvenanceRouter, OcrRoutingError

PNG_BYTES = b"\x89PNG\r\n\x1a\n" + b"0" * 64
OWNER = {"kind": "user", "uid": "uid-learner"}
OTHER = {"kind": "user", "uid": "uid-stranger"}
SOURCE_VERSION = "ncert-g9-en-v3"
SOURCE_REVISION = 7


class FakeEngine:
    """Engine SEAM: deterministic recognition output for the harness tests."""

    def version(self) -> str:
        return "fake-ocr-1.0"

    def recognize(self, page_bytes: bytes) -> list[dict]:
        return [{"regions": [
            {"text": "The mtter is coposed of atos", "confidence": 0.81, "bbox": {"x": 1, "y": 2}},
            {"text": "Water boils at 100 degres", "confidence": 0.9, "bbox": {"x": 3, "y": 4}},
        ]}]


_QUARANTINE = OcrQuarantine(FakeEngine())


def fresh_result():
    """A fresh VOCR-01 result with a UNIQUE jobId (one shared quarantine)."""
    upload = _QUARANTINE.admit_upload(OWNER, "page.png", PNG_BYTES)
    job = _QUARANTINE.start_job(OWNER, upload["uploadId"])
    return _QUARANTINE.complete_job(OWNER, job["jobId"])


def router_always_current() -> OcrProvenanceRouter:
    return OcrProvenanceRouter(lambda source_version: SOURCE_REVISION)


class OcrAcceptanceEndToEndTest(unittest.TestCase):
    def test_upload_interpret_review_route_reaches_all_surfaces(self):
        raw = fresh_result()
        harness = OcrAcceptanceHarness()
        harness.register_result(OWNER, raw)
        reviewed = harness.review(OWNER, raw, corrections=[
            {"page": 1, "regionIndex": 0, "correctedText": "The matter is composed of atoms"},
        ])
        self.assertTrue(reviewed["reviewed"])
        self.assertEqual(reviewed["ownerUid"], "uid-learner")
        self.assertEqual(reviewed["correctionSeq"], 1)
        router = router_always_current()
        for surface in ("learn", "ask", "practice", "build"):
            payload = harness.route(OWNER, reviewed, surface, SOURCE_VERSION, SOURCE_REVISION, router)
            self.assertEqual(payload["surface"], surface)
            self.assertEqual(payload["routedAs"], "correction")
            self.assertFalse(payload["sourceAuthorized"])
        self.assertEqual(len(harness.routed()), 4)

    def test_review_is_owner_only_and_corrections_bind_to_the_transcript(self):
        raw = fresh_result()
        harness = OcrAcceptanceHarness()
        harness.register_result(OWNER, raw)
        with self.assertRaises(OcrAcceptanceError):
            harness.review(OTHER, raw, corrections=[])
        with self.assertRaises(OcrAcceptanceError):
            harness.review(OWNER, raw, corrections=[{"page": 9, "regionIndex": 0, "correctedText": "x"}])
        with self.assertRaises(OcrAcceptanceError):
            harness.review(OWNER, raw, corrections=[{"page": 1, "regionIndex": 99, "correctedText": "x"}])
        with self.assertRaises(OcrAcceptanceError):
            harness.review(OWNER, raw, corrections=[{"page": 1, "regionIndex": 0, "correctedText": "<script>alert(1)</script>"}])
        unregistered = fresh_result()
        with self.assertRaises(OcrAcceptanceError):
            harness.review(OWNER, unregistered, corrections=[])

    def test_new_correction_supersedes_stale_downstream_fail_closed(self):
        raw = fresh_result()
        harness = OcrAcceptanceHarness()
        harness.register_result(OWNER, raw)
        first = harness.review(OWNER, raw, corrections=[])
        router = router_always_current()
        payload = harness.route(OWNER, first, "practice", SOURCE_VERSION, SOURCE_REVISION, router)
        self.assertFalse(payload.get("superseded", False))
        repaired = harness.apply_correction(OWNER, raw["jobId"], raw, [
            {"page": 1, "regionIndex": 1, "correctedText": "Water boils at 100 degrees"},
        ])
        self.assertEqual(repaired["correctionSeq"], 1)
        routed = harness.routed()
        self.assertTrue(routed[0]["superseded"], "the earlier routed proposal is marked superseded")
        with self.assertRaises(OcrAcceptanceError):
            harness.route(OWNER, first, "practice", SOURCE_VERSION, SOURCE_REVISION, router)
        again = harness.route(OWNER, repaired, "practice", SOURCE_VERSION, SOURCE_REVISION, router)
        self.assertEqual(again["correctionSeq"], 1)

    def test_stale_source_revision_is_refused_through_the_real_router(self):
        raw = fresh_result()
        harness = OcrAcceptanceHarness()
        harness.register_result(OWNER, raw)
        reviewed = harness.review(OWNER, raw, corrections=[])
        moved = OcrProvenanceRouter(lambda source_version: SOURCE_REVISION + 1)
        with self.assertRaises(OcrAcceptanceError):
            harness.route(OWNER, reviewed, "learn", SOURCE_VERSION, SOURCE_REVISION, moved)

    def test_revocation_and_expiry_invalidate_immediately(self):
        raw = fresh_result()
        harness = OcrAcceptanceHarness()
        harness.register_result(OWNER, raw)
        reviewed = harness.review(OWNER, raw, corrections=[])
        router = router_always_current()
        harness.route(OWNER, reviewed, "learn", SOURCE_VERSION, SOURCE_REVISION, router)
        with self.assertRaises(OcrAcceptanceError):
            harness.revoke(OTHER, raw["jobId"], "not mine")
        harness.revoke(OWNER, raw["jobId"], "user deleted the capture")
        self.assertTrue(all(r["invalidated"] for r in harness.routed()))
        with self.assertRaises(OcrAcceptanceError):
            harness.review(OWNER, raw, corrections=[])
        with self.assertRaises(OcrAcceptanceError):
            harness.route(OWNER, reviewed, "ask", SOURCE_VERSION, SOURCE_REVISION, router)
        raw2 = fresh_result()
        harness.register_result(OWNER, raw2)
        harness.review(OWNER, raw2, corrections=[])
        harness.expire(raw2["jobId"], "permission window elapsed")
        with self.assertRaises(OcrAcceptanceError):
            harness.review(OWNER, raw2, corrections=[])

    def test_review_is_idempotent_for_an_identical_retry(self):
        raw = fresh_result()
        harness = OcrAcceptanceHarness()
        harness.register_result(OWNER, raw)
        corrections = [{"page": 1, "regionIndex": 0, "correctedText": "The matter is composed of atoms"}]
        first = harness.review(OWNER, raw, corrections=corrections)
        second = harness.review(OWNER, raw, corrections=corrections)
        self.assertEqual(first, second, "a retried identical review returns the same reviewed result")
        review_events = [e for e in harness.events() if e["type"] == "reviewed"]
        self.assertEqual(len(review_events), 1, "the retry did not double-log or re-sequence")


class RolloutMatrixTest(unittest.TestCase):
    GOOD = [("reference text one", "reference text one"),
            ("reference text two", "reference text too"),
            ("reference text three", "reference text three")]
    BAD = [("photosynthesis converts light energy into chemical energy", "fotosinthess convrts ligth energ into chemcal energ"),
           ("the quadratic formula gives both roots of the equation", "the quadratik formyla givs both rots of teh eqution"),
           ("acceleration is the derivative of velocity with respect to time", "aceleration is teh derivativ of velocty wrt time")]

    def test_metrics_functions(self):
        self.assertEqual(cer("abc", "abc"), 0.0)
        self.assertEqual(cer("abc", "abd"), round(1 / 3, 6))
        self.assertEqual(wer("a b c", "a b c"), 0.0)
        self.assertGreater(wer("a b c", "a x y"), 0.0)

    def test_failing_required_english_modality_blocks_the_release(self):
        matrix = RolloutMatrix()
        verdict = matrix.release_ready()
        self.assertFalse(verdict["ready"])
        self.assertEqual(sorted(verdict["blockedBy"]), sorted(REQUIRED_EN_MODALITIES))
        for modality in REQUIRED_EN_MODALITIES:
            matrix.qualify("en", modality, self.GOOD)
        self.assertTrue(matrix.release_ready()["ready"])
        matrix.qualify("en", "formulas", self.BAD)
        verdict = matrix.release_ready()
        self.assertFalse(verdict["ready"])
        self.assertEqual(verdict["blockedBy"], ["formulas"])

    def test_expansion_locales_stay_unavailable_and_never_block_launch(self):
        matrix = RolloutMatrix()
        self.assertEqual(matrix.status("hi")["reason"], "not_qualified")
        self.assertFalse(matrix.status("hi")["available"])
        for modality in REQUIRED_EN_MODALITIES:
            matrix.qualify("en", modality, self.GOOD)
        matrix.qualify("hi", "print", self.BAD)
        self.assertFalse(matrix.status("hi")["available"], "a failing expansion locale stays visibly unavailable")
        self.assertTrue(matrix.release_ready()["ready"], "expansion failure never blocks the English launch")

    def test_disable_is_fail_closed_and_rollback_restores_exactly(self):
        harness = OcrAcceptanceHarness()
        matrix = harness.rollout
        for modality in REQUIRED_EN_MODALITIES:
            matrix.qualify("en", modality, self.GOOD)
        healthy_version = matrix.snapshot_version()
        raw = fresh_result()
        harness.register_result(OWNER, raw)
        reviewed = harness.review(OWNER, raw, corrections=[])
        matrix.disable("en", "quality incident")
        self.assertFalse(matrix.status("en")["enabled"])
        with self.assertRaises(OcrAcceptanceError):
            harness.review(OWNER, raw, corrections=[])
        router = router_always_current()
        with self.assertRaises(OcrAcceptanceError):
            harness.route(OWNER, reviewed, "learn", SOURCE_VERSION, SOURCE_REVISION, router)
        matrix.rollback(healthy_version)
        self.assertTrue(matrix.status("en")["enabled"])
        self.assertTrue(matrix.release_ready()["ready"])
        with self.assertRaises(OcrAcceptanceError):
            matrix.rollback(9999)

    def test_unknown_matrix_operations_refuse(self):
        matrix = RolloutMatrix()
        with self.assertRaises(OcrAcceptanceError):
            matrix.qualify("en", "print", [("a", "a")])
        with self.assertRaises(OcrAcceptanceError):
            matrix.disable("de", "nope")
        with self.assertRaises(OcrAcceptanceError):
            matrix.enable("de")


class ObservabilityAndRecoveryTest(unittest.TestCase):
    def test_logs_are_redacted_and_replay_rebuilds_state(self):
        harness = OcrAcceptanceHarness()
        raw = fresh_result()
        harness.register_result(OWNER, raw)
        reviewed = harness.review(OWNER, raw, corrections=[
            {"page": 1, "regionIndex": 0, "correctedText": "The matter is composed of atoms"},
        ])
        harness.route(OWNER, reviewed, "learn", SOURCE_VERSION, SOURCE_REVISION, router_always_current())
        harness.revoke(OWNER, raw["jobId"], "user deleted the capture")
        events = harness.events()
        self.assertTrue(OcrAcceptanceHarness.log_events_are_redacted(events),
                        "no event may carry OCR text or correction text")
        recovered = OcrAcceptanceHarness.replay_state(events)
        expected = harness.recovery_state()
        self.assertEqual(recovered["routedCount"], expected["routedCount"])
        self.assertEqual(recovered["reviewedCount"], expected["reviewedCount"])
        self.assertEqual(recovered["revokedCount"], expected["revokedCount"])
        self.assertEqual(recovered["contract"], expected["contract"])

    def test_wrong_operator_is_refused_at_the_real_router_layer_too(self):
        raw = fresh_result()
        harness = OcrAcceptanceHarness()
        harness.register_result(OWNER, raw)
        reviewed = harness.review(OWNER, raw, corrections=[])
        router = router_always_current()
        with self.assertRaises(OcrRoutingError):
            router.route(OTHER, reviewed, "learn", SOURCE_VERSION, SOURCE_REVISION)
        with self.assertRaises(OcrAcceptanceError):
            harness.route(OTHER, reviewed, "learn", SOURCE_VERSION, SOURCE_REVISION, router)


if __name__ == "__main__":
    unittest.main()
