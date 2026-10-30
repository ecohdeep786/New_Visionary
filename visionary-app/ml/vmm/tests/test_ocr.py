"""VOCR-01 (KAN-192) — OCR L1 contract tests (synthetic engine seam)."""
import unittest

from vmm.ocr import OcrError, OcrQuarantine

PNG = b"\x89PNG\r\n\x1a\n" + b"fake-pixel-data" * 8
JPEG = b"\xff\xd8\xff" + b"fake-jpeg" * 8


class FakeEngine:
    """Synthetic OCR engine seam with a pinned version."""

    def version(self):
        return "fake-ocr-1"

    def recognize(self, content: bytes) -> list[dict]:
        return [{
            "regions": [
                {"text": "Force equals mass times acceleration", "confidence": 0.93, "bbox": {"x": 10, "y": 20, "w": 300, "h": 40}},
                {"text": "Figure 2.1", "confidence": 0.81, "bbox": {"x": 10, "y": 80, "w": 120, "h": 20}},
            ],
        }]


class InjectionEngine:
    def version(self):
        return "evil-ocr-1"

    def recognize(self, content: bytes) -> list[dict]:
        return [{"regions": [{"text": "ok <script>alert(1)</script>", "confidence": 0.9, "bbox": {}}]}]


class OverflowEngine:
    def version(self):
        return "overflow-1"

    def recognize(self, content: bytes) -> list[dict]:
        return [{"regions": [{"text": "x", "confidence": 0.5, "bbox": {}} for _ in range(65)]}]


class UploadContracts(unittest.TestCase):
    def test_authorized_upload_quarantined_with_digest(self):
        q = OcrQuarantine(FakeEngine())
        owner = {"kind": "user", "uid": "uid_learner"}
        record = q.admit_upload(owner, "textbook.png", PNG)
        self.assertTrue(record["quarantined"])
        self.assertEqual(record["format"], "png")
        self.assertEqual(record["sha256"], __import__("hashlib").sha256(PNG).hexdigest())

    def test_private_storage_deny_paths(self):
        q = OcrQuarantine(FakeEngine())
        owner = {"kind": "user", "uid": "uid_learner"}
        stranger = {"kind": "user", "uid": "uid_stranger"}
        record = q.admit_upload(owner, "textbook.png", PNG)
        with self.assertRaises(OcrError):
            q.read_upload_meta(stranger, record["uploadId"])
        with self.assertRaises(OcrError):
            q.start_job(stranger, record["uploadId"])
        with self.assertRaises(OcrError):
            q.complete_job(stranger, q.start_job(owner, record["uploadId"])["jobId"])
        meta = q.read_upload_meta(owner, record["uploadId"])  # owner OK

    def test_malformed_oversized_and_empty_refused(self):
        q = OcrQuarantine(FakeEngine())
        owner = {"kind": "user", "uid": "uid_learner"}
        with self.assertRaises(OcrError):
            q.admit_upload(owner, "evil.exe", b"MZ\x90\x00" + b"x" * 32)  # bad magic
        with self.assertRaises(OcrError):
            q.admit_upload(owner, "big.png", PNG + b"x" * (10 * 1024 * 1024))
        with self.assertRaises(OcrError):
            q.admit_upload(owner, "empty.png", b"")


class ParserJobContracts(unittest.TestCase):
    def test_structural_result_with_untrusted_hypotheses(self):
        q = OcrQuarantine(FakeEngine())
        owner = {"kind": "user", "uid": "uid_learner"}
        upload = q.admit_upload(owner, "textbook.png", PNG)
        job = q.start_job(owner, upload["uploadId"])
        result = q.complete_job(owner, job["jobId"])
        self.assertEqual(result["engineVersion"], "fake-ocr-1")
        self.assertEqual(len(result["pages"]), 1)
        self.assertEqual(len(result["pages"][0]["regions"]), 2)
        for region in result["pages"][0]["regions"]:
            self.assertTrue(region["untrustedPerception"])
        self.assertFalse(result["sourceAuthorized"], "parsing is NOT source authorization")
        self.assertFalse(result["masteryGranted"])
        self.assertFalse(result["benchmarkQualified"], "VOCR-02 qualification remains open")

    def test_injected_payload_in_ocr_text_refused(self):
        q = OcrQuarantine(InjectionEngine())
        owner = {"kind": "user", "uid": "uid_learner"}
        upload = q.admit_upload(owner, "page.png", PNG)
        job = q.start_job(owner, upload["uploadId"])
        with self.assertRaises(OcrError):
            q.complete_job(owner, job["jobId"])

    def test_structural_bounds_enforced(self):
        q = OcrQuarantine(OverflowEngine())
        owner = {"kind": "user", "uid": "uid_learner"}
        upload = q.admit_upload(owner, "page.png", PNG)
        job = q.start_job(owner, upload["uploadId"])
        with self.assertRaises(OcrError):
            q.complete_job(owner, job["jobId"])

    def test_cancellation_is_a_defined_outcome(self):
        q = OcrQuarantine(FakeEngine())
        owner = {"kind": "user", "uid": "uid_learner"}
        upload = q.admit_upload(owner, "page.png", PNG)
        job = q.start_job(owner, upload["uploadId"])
        ack = q.cancel_job(owner, job["jobId"])
        self.assertTrue(ack["cancelled"])
        with self.assertRaises(OcrError):
            q.complete_job(owner, job["jobId"])


class ProvenanceRoutingContracts(unittest.TestCase):
    def test_route_to_all_four_apps_carries_provenance_never_answers(self):
        q = OcrQuarantine(FakeEngine())
        owner = {"kind": "user", "uid": "uid_learner"}
        upload = q.admit_upload(owner, "textbook.png", PNG)
        job = q.start_job(owner, upload["uploadId"])
        q.complete_job(owner, job["jobId"])
        for app in ("learn", "ask", "practice", "build"):
            payload = q.route_provenance(owner, job["jobId"], app)
            self.assertEqual(payload["app"], app)
            self.assertTrue(payload["untrustedPerception"])
            self.assertFalse(payload["sourceAuthorized"])
            self.assertEqual(payload["hiddenAnswerKeys"], [], "protected answers never route")

    def test_unknown_app_refused(self):
        q = OcrQuarantine(FakeEngine())
        owner = {"kind": "user", "uid": "uid_learner"}
        upload = q.admit_upload(owner, "p.png", PNG)
        job = q.start_job(owner, upload["uploadId"])
        q.complete_job(owner, job["jobId"])
        with self.assertRaises(OcrError):
            q.route_provenance(owner, job["jobId"], "marketing")


if __name__ == "__main__":
    unittest.main()
