"""VMM-02 (KAN-170) — supply-chain control-plane contracts (synthetic; no provider/DB)."""
from copy import deepcopy
import unittest

from vmm.supplychain import (
    AccessDenied,
    LineageError,
    ManifestError,
    artifact_digest,
    authorize_read,
    build_manifest,
    canonical,
    sign_manifest,
    verify_lineage,
    verify_signature,
    THREAT_CATALOG,
)

KEY = b"local-ignored-config-signing-key-0123456789abcdef"


def dataset_manifest(**overrides):
    base = {
        "kind": "dataset",
        "artifact_id": "seed-l1-en",
        "version": 1,
        "digest": artifact_digest(b"rights-cleared seed bytes"),
        "producer": "mle@visionary",
        "license": "internal-consented-v1",
        "storage_class": "private",
        "lineage": [],
        "created": "2026-10-30T00:00:00+00:00",
        "notes": "",
    }
    base.update(overrides)
    return base


def model_manifest(lineage):
    return {
        "kind": "model",
        "artifact_id": "tiny-d1-checkpoint",
        "version": 3,
        "digest": artifact_digest(b"checkpoint bytes"),
        "producer": "mle@visionary",
        "license": "owner-only-v1",
        "storage_class": "private",
        "lineage": lineage,
        "created": "2026-10-30T00:00:00+00:00",
        "notes": "trained from seed-l1-en",
    }


class ManifestContracts(unittest.TestCase):
    def test_manifest_binds_exact_content_digest_and_canonicalizes_stably(self):
        manifest = build_manifest(**dataset_manifest())
        self.assertEqual(manifest["digest"], artifact_digest(b"rights-cleared seed bytes"))
        self.assertEqual(canonical(manifest), canonical(deepcopy(manifest)), "canonical form is key-order stable")

    def test_invalid_manifests_fail_closed(self):
        for bad in [
            {"kind": "weights"},
            {"artifact_id": ""},
            {"artifact_id": "x" * 200},
            {"version": 0},
            {"version": "1"},
            {"digest": "nothex"},
            {"digest": "a" * 63},
            {"producer": "  "},
            {"license": ""},
            {"storage_class": "bucket"},
            {"lineage": [{"id": "x"}]},
            {"lineage": [{"id": "x", "digest": "zz"}]},
            {"created": "not-a-date"},
        ]:
            with self.subTest(bad):
                self.assertRaises(ManifestError, build_manifest, **dataset_manifest(**bad))

    def test_signature_roundtrip_and_tamper_detection(self):
        manifest = build_manifest(**dataset_manifest())
        signature = sign_manifest(manifest, KEY)
        self.assertTrue(verify_signature(manifest, signature, KEY))
        self.assertFalse(verify_signature(manifest, signature, b"wrong-key-1234567890abcd"))

        tampered = deepcopy(manifest)
        tampered["license"] = "public-domain"
        self.assertFalse(verify_signature(tampered, signature, KEY), "any field change breaks the signature")
        self.assertFalse(verify_signature(manifest, "z" * 64, KEY))


class LineageContracts(unittest.TestCase):
    def test_valid_lineage_resolves_with_exact_parent_digests(self):
        dataset = build_manifest(**dataset_manifest())
        model = build_manifest(**model_manifest(lineage=[{"id": dataset["id"], "digest": dataset["digest"]}]))
        report = verify_lineage([dataset, model])
        self.assertTrue(report["ok"])
        self.assertEqual(report["lineageEdgesChecked"], 1)

    def test_missing_parent_or_moved_digest_breaks_provenance(self):
        dataset = build_manifest(**dataset_manifest())
        model = build_manifest(**model_manifest(lineage=[{"id": dataset["id"], "digest": dataset["digest"]}]))
        self.assertRaises(LineageError, verify_lineage, [model], )
        moved = build_manifest(**dataset_manifest(digest=artifact_digest(b"changed bytes")))
        self.assertRaises(LineageError, verify_lineage, [moved, model])

    def test_non_vmm_manifests_are_refused(self):
        dataset = build_manifest(**dataset_manifest())
        self.assertRaises(LineageError, verify_lineage, [dataset, {"contract": "other"}])


class AccessControlContracts(unittest.TestCase):
    def test_private_artifacts_never_reach_consumers(self):
        manifest = build_manifest(**dataset_manifest())
        self.assertTrue(authorize_read("owner", manifest)["allowed"])
        self.assertTrue(authorize_read("reviewer", manifest)["allowed"])
        self.assertRaises(AccessDenied, authorize_read, "consumer", manifest)
        self.assertRaises(AccessDenied, authorize_read, "ghost", manifest)

    def test_internal_and_public_are_readable_but_contract_true(self):
        internal = build_manifest(**dataset_manifest(storage_class="internal"))
        self.assertTrue(authorize_read("consumer", internal)["allowed"])
        public = build_manifest(**dataset_manifest(storage_class="public", license="cc-by-4"))
        self.assertTrue(authorize_read("consumer", public)["allowed"])
        self.assertRaises(AccessDenied, authorize_read, "consumer", {"contract": "other"})


class ThreatCatalog(unittest.TestCase):
    def test_every_threat_maps_to_an_implemented_control(self):
        self.assertTrue(len(THREAT_CATALOG) >= 6)
        for threat in THREAT_CATALOG:
            with self.subTest(threat["id"]):
                self.assertTrue(threat["control"])
                self.assertTrue(threat["implementedBy"])


if __name__ == "__main__":
    unittest.main()
