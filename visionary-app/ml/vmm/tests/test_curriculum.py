"""VMM-CURR-01 (KAN-208) — curriculum registry + inbox manifest contracts."""
import unittest

from vmm.curriculum import CurriculumError, CurriculumRegistry, FounderInboxManifest

FOUNDER = {"uid": "uid_founder", "role": "founder"}
PNG = b"\x89PNG\r\n\x1a\n" + b"textbook-page" * 16
PDF_MAGIC = b"%PDF-1.4 " + b"textbook-content" * 16


def registry():
    r = CurriculumRegistry()
    r.register_source(
        "src-cbse-10-sci-2024", "Delhi", "CBSE", "10", "science", "English", "English",
        "Science", "2024-25", ["force-and-motion", "chemical-reactions", "life-processes"],
        "2024 edition", "NCERT", "ISBN-9788174505141", "textbooks/cbse-10-sci-2024.pdf",
        "government-open-license", "founder-consent-001",
    )
    r.register_source(
        "src-icse-10-phy-2024", "West Bengal", "CISCE", "10", "science", "English", "English",
        "Physics", "2024-25", ["kinematics", "dynamics"], "2024 edition", "Evergreen",
        "ISBN-9788174509999", "textbooks/icse-10-phy-2024.pdf",
        "government-open-license", "founder-consent-002", rights_status="approved",
    )
    return r


class RegistryContracts(unittest.TestCase):
    def test_source_registered_with_full_taxonomy(self):
        r = registry()
        src = r.source("src-cbse-10-sci-2024")
        self.assertEqual(src["board"], "CBSE")
        self.assertEqual(src["classGrade"], "10")
        self.assertEqual(src["stream"], "science")
        self.assertEqual(src["medium"], "English")
        self.assertEqual(src["subject"], "Science")
        self.assertEqual(src["rights"]["status"], "pending")
        self.assertEqual(src["chapterTopics"], ["chemical-reactions", "force-and-motion", "life-processes"])

    def test_invalid_sources_fail_closed(self):
        r = CurriculumRegistry()
        for overrides in [
            {"source_id": ""}, {"board": "UNKNOWN"}, {"stream": "dance"},
            {"rights_status": "maybe"}, {"chapter_topics": []},
            {"license": ""}, {"consent_ref": ""}, {"download_ref": ""},
        ]:
            with self.subTest(overrides):
                kwargs = dict(
                    source_id="s", state_or_ut="Delhi", board="CBSE", class_grade="10",
                    stream="science", medium="English", language="English", subject="Science",
                    academic_year="2024-25", chapter_topics=["ch1"], edition="e", publisher="p",
                    book_id="b", download_ref="d.pdf", license="l", consent_ref="c",
                )
                kwargs.update(overrides)
                self.assertRaises(CurriculumError, r.register_source, **kwargs)

    def test_duplicate_source_id_refused(self):
        r = registry()
        with self.assertRaises(CurriculumError):
            r.register_source(
                "src-cbse-10-sci-2024", "Delhi", "CBSE", "10", "science", "English", "English",
                "Science", "2024-25", ["ch1"], "e", "p", "b", "d.pdf", "l", "c",
            )

    def test_rights_status_transitions(self):
        r = registry()
        r.set_rights("src-cbse-10-sci-2024", "approved")
        self.assertEqual(r.source("src-cbse-10-sci-2024")["rights"]["status"], "approved")
        r.set_rights("src-cbse-10-sci-2024", "withdrawn")
        self.assertEqual(r.source("src-cbse-10-sci-2024")["rights"]["status"], "withdrawn")

    def test_approved_sources_only_returns_approved(self):
        r = registry()
        self.assertEqual(len(r.approved_sources()), 1, "only ICSE pre-approved")
        r.set_rights("src-cbse-10-sci-2024", "approved")
        self.assertEqual(len(r.approved_sources()), 2)


class InboxManifestContracts(unittest.TestCase):
    def test_declare_file_binds_to_approved_source(self):
        r = registry()
        inbox = FounderInboxManifest(r)
        entry = inbox.declare_file("cbse-10-sci.pdf", PDF_MAGIC, "src-icse-10-phy-2024")
        self.assertTrue(entry["sha256"])
        self.assertEqual(entry["sourceId"], "src-icse-10-phy-2024")

    def test_unapproved_source_file_refused(self):
        r = registry()
        inbox = FounderInboxManifest(r)
        with self.assertRaises(CurriculumError):
            inbox.declare_file("cbse.pdf", PDF_MAGIC, "src-cbse-10-sci-2024")  # pending

    def test_unknown_source_refused(self):
        r = registry()
        inbox = FounderInboxManifest(r)
        with self.assertRaises(CurriculumError):
            inbox.declare_file("f.pdf", PDF_MAGIC, "src-ghost")

    def test_empty_file_refused(self):
        r = registry()
        inbox = FounderInboxManifest(r)
        with self.assertRaises(CurriculumError):
            inbox.declare_file("empty.pdf", b"", "src-icse-10-phy-2024")

    def test_manifest_seal_is_founder_only(self):
        r = registry()
        inbox = FounderInboxManifest(r)
        inbox.declare_file("phy.pdf", PDF_MAGIC, "src-icse-10-phy-2024")
        with self.assertRaises(CurriculumError):
            inbox.seal({"uid": "x", "role": "user"})
        seal = inbox.seal(FOUNDER)
        self.assertEqual(seal["fileCount"], 1)

    def test_sealed_manifest_refuses_new_files(self):
        r = registry()
        inbox = FounderInboxManifest(r)
        inbox.declare_file("phy.pdf", PDF_MAGIC, "src-icse-10-phy-2024")
        inbox.seal(FOUNDER)
        with self.assertRaises(CurriculumError):
            inbox.declare_file("more.pdf", PNG, "src-icse-10-phy-2024")

    def test_ingest_eligibility_check(self):
        r = registry()
        inbox = FounderInboxManifest(r)
        inbox.declare_file("phy.pdf", PDF_MAGIC, "src-icse-10-phy-2024")
        inbox.seal(FOUNDER)
        check = inbox.validate_ingest_eligibility()
        self.assertTrue(check["readyForIngest"])
        self.assertTrue(check["allSourcesApproved"])


if __name__ == "__main__":
    unittest.main()
