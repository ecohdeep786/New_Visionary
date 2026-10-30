"""VOCR-03 (KAN-194) — OCR provenance routing contracts (synthetic)."""
import unittest

from vmm.ocrouting import OcrProvenanceRouter, OcrRoutingError

OWNER = {"uid": "uid_learner"}
REVIEWER = {"uid": "uid_reviewer", "role": "reviewer"}
STRANGER = {"uid": "uid_stranger"}

REVISIONS = {"source-v1": 3, "source-v2": 1}


def reviewed_result():
    return {
        "contract": "vmm-ocr.v1",
        "jobId": "job_1",
        "uploadSha256": "a" * 64,
        "ownerUid": "uid_learner",
        "engineVersion": "fake-ocr-1",
        "pages": [{"page": 1, "regions": [{"text": "Force equals mass times acceleration", "confidence": 0.93, "bbox": {}, "untrustedPerception": True}]}],
        "untrustedPerception": True,
        "sourceAuthorized": False,
        "masteryGranted": False,
        "reviewed": True,
    }


def router():
    r = OcrProvenanceRouter(lambda source_version: REVISIONS.get(source_version, 1))
    return r


class RoutingContracts(unittest.TestCase):
    def test_reviewed_result_routes_to_all_four_surfaces_with_versions(self):
        r = router()
        result = reviewed_result()
        for surface in ("learn", "ask", "practice", "build"):
            payload = r.route(OWNER, result, surface, source_version="source-v1", source_revision=3)
            self.assertEqual(payload["surface"], surface)
            self.assertEqual(payload["pages"], [{"page": 1, "regionCount": 1}], "exact page versions survive")
            self.assertEqual(payload["sourceVersion"], "source-v1")
            self.assertEqual(payload["sourceRevision"], 3)
            self.assertEqual(payload["routedAs"], "reviewed-ocr")

    def test_raw_unreviewed_perception_cannot_route(self):
        r = router()
        raw = {**reviewed_result(), "reviewed": False}
        with self.assertRaises(OcrRoutingError):
            r.route(OWNER, raw, "learn", "source-v1", 3)

    def test_wrong_operator_refused_reviewer_allowed(self):
        r = router()
        with self.assertRaises(OcrRoutingError):
            r.route(STRANGER, reviewed_result(), "learn", "source-v1", 3)
        payload = r.route(REVIEWER, reviewed_result(), "learn", "source-v1", 3)
        self.assertEqual(payload["ownerUid"], "uid_learner")

    def test_stale_transcript_refused_cannot_silently_affect_assessment(self):
        r = router()
        with self.assertRaises(OcrRoutingError):
            r.route(OWNER, reviewed_result(), "practice", source_version="source-v1", source_revision=2)  # stale
        # Current revision still routes.
        payload = r.route(OWNER, reviewed_result(), "practice", source_version="source-v1", source_revision=3)
        self.assertEqual(payload["sourceRevision"], 3)

    def test_unknown_surface_refused(self):
        r = router()
        with self.assertRaises(OcrRoutingError):
            r.route(OWNER, reviewed_result(), "marketing", "source-v1", 3)

    def test_invalid_page_versions_refused(self):
        r = router()
        broken = reviewed_result()
        broken["pages"] = [{"page": "one", "regions": []}]
        with self.assertRaises(OcrRoutingError):
            r.route(OWNER, broken, "learn", "source-v1", 3)


class CorrectionRoutingContracts(unittest.TestCase):
    def test_corrections_route_as_corrections_bound_to_the_transcript(self):
        r = router()
        payload = r.route(OWNER, reviewed_result(), "learn", source_version="source-v1", source_revision=3, correction_seq=2)
        self.assertEqual(payload["routedAs"], "correction")
        self.assertEqual(payload["correctionSeq"], 2)

    def test_correction_with_stale_source_refused(self):
        r = router()
        with self.assertRaises(OcrRoutingError):
            r.route(OWNER, reviewed_result(), "learn", source_version="source-v1", source_revision=1, correction_seq=1)


class NoCompetingStoreContracts(unittest.TestCase):
    def test_build_surface_never_receives_answer_keys(self):
        r = router()
        payload = r.route(OWNER, reviewed_result(), "build", source_version="source-v1", source_revision=3)
        self.assertEqual(payload["hiddenAnswerKeys"], [])

    def test_no_new_competing_source_store(self):
        self.assertTrue(OcrProvenanceRouter.no_new_source_store(), "no source-store mutation API exists")
        r = router()
        payload = r.route(OWNER, reviewed_result(), "ask", "source-v1", 3)
        self.assertFalse(payload["newSourceStore"], "payloads reference the existing source contract")
        self.assertEqual(payload["sourceVersion"], "source-v1", "routed payloads pin the EXISTING source version")

    def test_routing_ledger_is_append_only_and_inspectable(self):
        r = router()
        r.route(OWNER, reviewed_result(), "learn", "source-v1", 3)
        r.route(OWNER, reviewed_result(), "ask", "source-v1", 3)
        self.assertEqual(len(r.routed()), 2)


if __name__ == "__main__":
    unittest.main()
