"""VMM-12 (KAN-180) — evidence connector contracts (synthetic)."""
import json
import unittest

from vmm.evidence import EvidenceConnector, EvidenceError

BACKEND = {"kind": "backend-service", "serviceId": "backend-product"}
END_USER = {"kind": "user", "uid": "uid_learner"}


def receipt(receipt_id, concept="newton", correct=True, workspace="ws_personal", criteria=1, source="source-v1", assessed_by="backend", assessed_at="2026-10-30T10:00:00+00:00"):
    return {
        "receiptId": receipt_id,
        "workspaceId": workspace,
        "conceptId": concept,
        "correct": correct,
        "criteriaVersion": criteria,
        "sourceVersion": source,
        "assessedAt": assessed_at,
        "assessedBy": assessed_by,
    }


class IngestionContracts(unittest.TestCase):
    def test_backend_receipt_accepted_and_client_model_ocr_build_refused(self):
        connector = EvidenceConnector(pinned_criteria_version=1)
        self.assertTrue(connector.ingest(BACKEND, receipt("r1"))["ingested"])
        for assessor in ("client", "model", "ocr", "build-output"):
            with self.subTest(assessor):
                with self.assertRaises(EvidenceError):
                    connector.ingest(BACKEND, receipt(f"r-{assessor}", assessed_by=assessor))
        # Model/OCR/Build outputs can NEVER fabricate mastery.
        self.assertFalse(connector.project("ws_personal")["masteryGranted"])

    def test_end_users_cannot_ingest_evidence(self):
        connector = EvidenceConnector(pinned_criteria_version=1)
        with self.assertRaises(EvidenceError):
            connector.ingest(END_USER, receipt("r1"))

    def test_stale_criteria_version_refused_against_the_pin(self):
        connector = EvidenceConnector(pinned_criteria_version=2)
        with self.assertRaises(EvidenceError):
            connector.ingest(BACKEND, receipt("r1", criteria=1))

    def test_invalid_receipts_fail_closed(self):
        connector = EvidenceConnector(pinned_criteria_version=1)
        base = receipt("r-bad")
        for field, value in [
            ("correct", "yes"),
            ("criteriaVersion", 0),
            ("receiptId", ""),
            ("assessedAt", "not-a-date"),
            ("sourceVersion", ""),
            ("workspaceId", ""),
        ]:
            with self.subTest(field):
                bad = dict(base)
                bad[field] = value
                with self.assertRaises(EvidenceError):
                    connector.ingest(BACKEND, bad)
        # Required-field removals also fail closed.
        for field in ("receiptId", "assessedBy", "correct"):
            with self.subTest(f"missing-{field}"):
                bad = dict(base)
                del bad[field]
                with self.assertRaises(EvidenceError):
                    connector.ingest(BACKEND, bad)


class ReplayAndRebuildContracts(unittest.TestCase):
    def test_duplicates_are_idempotent_never_double_counted(self):
        connector = EvidenceConnector(pinned_criteria_version=1)
        first = connector.ingest(BACKEND, receipt("r1", correct=True))
        second = connector.ingest(BACKEND, receipt("r1", correct=True))
        self.assertTrue(first["ingested"])
        self.assertTrue(second["duplicate"])
        self.assertEqual(len(connector.receipts()), 1)
        self.assertEqual(connector.project("ws_personal")["projections"][0]["attemptCount"], 1)

    def test_replayed_receipt_with_different_content_is_refused(self):
        connector = EvidenceConnector(pinned_criteria_version=1)
        connector.ingest(BACKEND, receipt("r1", correct=True))
        with self.assertRaises(EvidenceError):
            connector.ingest(BACKEND, receipt("r1", correct=False))

    def test_out_of_order_replay_converges_projection_is_order_independent(self):
        a = EvidenceConnector(pinned_criteria_version=1)
        b = EvidenceConnector(pinned_criteria_version=1)
        receipts = [receipt("r1", correct=True), receipt("r2", correct=False), receipt("r3", correct=True)]
        for r in receipts:
            a.ingest(BACKEND, r)
        for r in reversed(receipts):
            b.ingest(BACKEND, r)
        pa = a.project("ws_personal")
        pb = b.project("ws_personal")
        self.assertEqual(pa["projections"], pb["projections"], "arrival order never matters")

    def test_rebuild_reproduces_the_projection_byte_identically(self):
        connector = EvidenceConnector(pinned_criteria_version=1)
        for i in range(5):
            connector.ingest(BACKEND, receipt(f"r{i}", concept=f"c{i % 2}", correct=(i % 2 == 0)))
        original = connector.project("ws_personal")
        rebuilt = connector.rebuild("ws_personal")
        self.assertEqual(original["projections"], rebuilt["projections"])


class ProjectionContracts(unittest.TestCase):
    def test_scm_projection_from_receipts_with_provenance(self):
        connector = EvidenceConnector(pinned_criteria_version=1)
        for i in range(6):
            connector.ingest(BACKEND, receipt(f"r{i}", correct=True))
        projection = connector.project("ws_personal")["projections"][0]
        self.assertGreater(projection["pKnown"], 0.9, "six corrects drive p(known) high")
        self.assertEqual(projection["attemptCount"], 6)
        self.assertFalse(projection["masteryGranted"])
        self.assertEqual(projection["provenance"]["criteriaVersion"], 1)

    def test_feature_projection_is_versioned_and_identity_free(self):
        connector = EvidenceConnector(pinned_criteria_version=1)
        connector.ingest(BACKEND, receipt("r1", correct=True))
        projection = connector.project("ws_personal")["projections"][0]
        self.assertEqual(projection["featureVersion"], 1)
        self.assertTrue(projection["featureVectorDigest"])
        self.assertNotIn("workspaceId", json.dumps(projection["uncertainty"]), "identity stays outside feature data")

    def test_uncertainty_reported_and_wide_with_few_attempts(self):
        connector = EvidenceConnector(pinned_criteria_version=1)
        connector.ingest(BACKEND, receipt("r1", correct=True))
        projection = connector.project("ws_personal")["projections"][0]
        self.assertTrue(projection["uncertainty"]["abstainRecommended"], "one attempt -> gather more evidence")

    def test_concept_without_receipts_has_no_projection_not_zero(self):
        connector = EvidenceConnector(pinned_criteria_version=1)
        connector.ingest(BACKEND, receipt("r1", concept="newton"))
        concepts = [p["conceptId"] for p in connector.project("ws_personal")["projections"]]
        self.assertNotIn("photosynthesis", concepts, "absence of evidence is not a zero estimate")

    def test_second_device_read_back_identical_projection(self):
        connector = EvidenceConnector(pinned_criteria_version=1)
        for i in range(4):
            connector.ingest(BACKEND, receipt(f"r{i}", correct=(i % 2 == 0)))
        first = connector.read_projection({"kind": "device", "workspaceId": "ws_personal"}, "ws_personal")
        second = connector.read_projection({"kind": "device", "workspaceId": "ws_personal"}, "ws_personal")
        self.assertEqual(first["projections"], second["projections"], "second-device read-back identical")
        with self.assertRaises(EvidenceError):
            connector.read_projection({"kind": "device", "workspaceId": "ws_other"}, "ws_personal")


if __name__ == "__main__":
    unittest.main()
