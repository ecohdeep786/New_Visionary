"""VMM-33 (KAN-205) — OKF adapter contracts (synthetic)."""
import json
import unittest

from vmm.okf import OKFError, OKFAdapter

KEY = b"local-ignored-config-signing-key-0123456789abcdef"
TENANT = "tenant-visionary"


def seed_records():
    return [
        {
            "recordId": "rec-1", "title": "Newton", "text": "Force equals mass times acceleration",
            "sourceRef": "src-1", "license": "cc-by-4", "consentRef": "consent-1", "contentDigest": "a" * 64,
        },
        {
            "recordId": "rec-2", "title": "Ratios", "text": "A rate compares two quantities with different units",
            "sourceRef": "src-2", "license": "cc-by-4", "consentRef": "consent-2", "contentDigest": "b" * 64,
        },
    ]


class RoundTripContracts(unittest.TestCase):
    def test_export_import_round_trip_is_faithful(self):
        adapter = OKFAdapter(KEY, TENANT)
        records = seed_records()
        bundle = adapter.export_bundle(records)
        imported = adapter.import_bundle(bundle)
        self.assertEqual(imported["count"], 2)
        by_id = {r["recordId"]: r for r in imported["imported"]}
        self.assertEqual(by_id["rec-1"]["text"], "Force equals mass times acceleration")
        self.assertEqual(by_id["rec-1"]["license"], "cc-by-4")
        self.assertEqual(by_id["rec-1"]["sourceRef"], "src-1")
        # Interchange conventions are NOT proof of truth: verified stays False.
        self.assertFalse(by_id["rec-1"]["verified"])

    def test_pinned_spec_version_in_bundle(self):
        adapter = OKFAdapter(KEY, TENANT)
        bundle = adapter.export_bundle(seed_records())
        self.assertEqual(bundle["specVersion"], "0.2")


class RefusalContracts(unittest.TestCase):
    def test_restricted_exports_excluded(self):
        adapter = OKFAdapter(KEY, TENANT)
        records = seed_records()
        private = {**records[0], "recordId": "rec-private", "license": "", "consentRef": ""}
        bundle = adapter.export_bundle(records + [private])
        self.assertEqual(bundle["count"] if "count" in bundle else len(bundle["records"]), 2, "private record excluded")
        self.assertIn("rights_missing", [e["reason"] for e in bundle["excluded"]])

    def test_withdrawal_propagates(self):
        adapter = OKFAdapter(KEY, TENANT)
        adapter.withdraw("rec-1")
        bundle = adapter.export_bundle(seed_records())
        self.assertEqual(len(bundle["records"]), 1)
        self.assertIn("withdrawn", [e["reason"] for e in bundle["excluded"]])
        # Re-import of a bundle still carrying the withdrawn record is refused.
        forged = json.loads(json.dumps(bundle))
        forged["records"].append({"recordId": "rec-1", "markdown": "# x\n\ny", "yamlMeta": {"specVersion": "0.2", "tenant": TENANT, "provenance": {"sourceRef": "s", "license": "l", "consentRef": "c"}, "verification": {"contentDigest": "a" * 64, "bundleDigest": "b" * 64, "signature": "c" * 64}, "lifecycle": "active"}})
        with self.assertRaises(OKFError):
            adapter.import_bundle(forged)

    def test_forged_signature_refused(self):
        adapter = OKFAdapter(KEY, TENANT)
        bundle = adapter.export_bundle(seed_records())
        bundle["bundleSignature"] = "f" * 64
        with self.assertRaises(OKFError):
            adapter.import_bundle(bundle)

    def test_changed_content_with_old_signoff_refused(self):
        adapter = OKFAdapter(KEY, TENANT)
        bundle = adapter.export_bundle(seed_records())
        bundle["records"][0]["markdown"] = "# Newton\n\nPoisoned changed text"
        with self.assertRaises(OKFError):
            adapter.import_bundle(bundle)

    def test_stale_spec_version_refused(self):
        adapter = OKFAdapter(KEY, TENANT)
        bundle = adapter.export_bundle(seed_records())
        bundle["specVersion"] = "0.1"
        with self.assertRaises(OKFError):
            adapter.import_bundle(bundle)

    def test_cross_tenant_refused(self):
        adapter = OKFAdapter(KEY, TENANT)
        bundle = adapter.export_bundle(seed_records())
        with self.assertRaises(OKFError):
            adapter.import_bundle(bundle, tenant="tenant-other")

    def test_poisoned_text_refused_at_export(self):
        adapter = OKFAdapter(KEY, TENANT)
        poisoned = [{**seed_records()[0], "recordId": "rec-poison", "text": "ok <script>alert(1)</script>"}]
        with self.assertRaises(OKFError):
            adapter.export_bundle(poisoned)


class ConditionalContracts(unittest.TestCase):
    def test_adapter_is_not_an_authoritative_database(self):
        adapter = OKFAdapter(KEY, TENANT)
        # The adapter exposes NO methods that grant rights or store canonical truth.
        self.assertFalse(hasattr(adapter, "authorize"))
        self.assertFalse(hasattr(adapter, "grant_rights"))
        self.assertFalse(hasattr(adapter, "store_canonical"))
        imported = adapter.import_bundle(adapter.export_bundle(seed_records()))
        for record in imported["imported"]:
            self.assertFalse(record["verified"], "format conformance is not proof of truth")


if __name__ == "__main__":
    unittest.main()
