"""VMM-03 (KAN-171) — seed dataset + ontology contracts (synthetic; no provider/DB)."""
import json
from copy import deepcopy
import unittest

from vmm.seeddata import (
    ContaminationError,
    RECORD_FIELDS,
    SEED_CONTRACT,
    BenchmarkExclusions,
    SeedDatasetRegistry,
    SeedError,
    VersionedOntology,
    assert_no_benchmark_contamination,
    build_record,
    content_digest,
)
from vmm.supplychain import build_manifest as vmm_manifest, verify_lineage

KEY = b"local-ignored-config-signing-key-0123456789abcdef"

SOURCE_BYTES = b"rights-cleared source paragraph v1"
SOURCE_DIGEST = content_digest(SOURCE_BYTES)


def make_ontologies():
    mc = VersionedOntology("misconception-ontology", "MC")
    mc.register("rate-ratio confusion", "Learner treats a rate as a ratio of totals.")
    mc.register("unit-of-measure slip", "Learner mixes units when comparing quantities.")
    act = VersionedOntology("pedagogical-action-ontology", "ACT")
    for label in ("socratic", "worked_example", "analogy", "visual", "practice"):
        act.register(label, f"VATS L3 strategy: {label}.")
    return mc, act


def valid_record(mc, act, **overrides):
    base = dict(
        record_id="rec-1",
        dataset_id="seed-l1-core",
        dataset_version=1,
        mode="learn",
        role="student",
        age_group="adult",
        admission_approved=False,
        language="hi",
        script="devanagari",
        source_ref="src-consented-001",
        license="internal-consented-v1",
        consent_ref="consent-001",
        content_digest=SOURCE_DIGEST,
        misconception_ontology=mc,
        action_ontology=act,
        misconception_labels=["MC-001"],
        pedagogical_action="ACT-001",
    )
    base.update(overrides)
    return build_record(**base)


class OntologyContracts(unittest.TestCase):
    def test_versions_are_append_only_and_earlier_versions_byte_stable(self):
        mc, act = make_ontologies()
        v1 = mc.version(1)
        snapshot = json.dumps(v1, sort_keys=True)
        mc.register("sign-flip slip", "Learner flips an inequality sign.")
        v1_after = mc.version(1)
        self.assertEqual(json.dumps(v1_after, sort_keys=True), snapshot, "earlier version byte-stable")
        self.assertEqual(mc.version()["version"], 3, "three registrations, each its own version")
        self.assertEqual(v1["entries"][0]["code"], "MC-001")
        self.assertEqual(act.codes(), frozenset({"ACT-001", "ACT-002", "ACT-003", "ACT-004", "ACT-005"}))

    def test_unknown_codes_are_refused(self):
        mc, act = make_ontologies()
        with self.assertRaises(SeedError):
            valid_record(mc, act, misconception_labels=["MC-999"])
        with self.assertRaises(SeedError):
            valid_record(mc, act, pedagogical_action="hypnosis")


class RecordContracts(unittest.TestCase):
    def test_valid_record_and_distinct_label_fields(self):
        mc, act = make_ontologies()
        record = valid_record(mc, act)
        self.assertEqual(set(record.keys()), set(RECORD_FIELDS))
        self.assertEqual(record["contract"], SEED_CONTRACT)
        # Separation by schema: action label, build success and preferences are
        # DISTINCT fields; a build-success record carries no auto action label.
        build_only = valid_record(
            mc, act, record_id="rec-2", mode="build", pedagogical_action=None,
            build_outcome={"successful": True, "criteriaRef": "criteria-v3"},
        )
        self.assertIsNone(build_only["pedagogicalAction"])
        self.assertIsNotNone(build_only["buildOutcome"])
        self.assertIsNone(build_only["preferenceSignals"])
        pref = valid_record(mc, act, record_id="rec-3", pedagogical_action=None, preference_signals={"likes_analogies": True})
        self.assertIsNone(pref["pedagogicalAction"])
        self.assertEqual(pref["preferenceSignals"], {"likes_analogies": True})

    def test_minor_cohorts_require_approved_admission(self):
        mc, act = make_ontologies()
        for age in ("child", "minor"):
            with self.subTest(age):
                with self.assertRaises(SeedError):
                    valid_record(mc, act, age_group=age, admission_approved=False)
                self.assertTrue(valid_record(mc, act, age_group=age, admission_approved=True))

    def test_invalid_records_fail_closed(self):
        mc, act = make_ontologies()
        for bad in [
            {"record_id": ""},
            {"dataset_version": 0},
            {"mode": "chat"},
            {"role": "ghost"},
            {"age_group": "unknown"},
            {"language": ""},
            {"license": ""},
            {"consent_ref": ""},
            {"content_digest": "nothex"},
            {"source_ref": ""},
        ]:
            with self.subTest(bad):
                self.assertRaises(SeedError, valid_record, mc, act, **bad)

    def test_registry_stores_opaque_refs_never_raw_text(self):
        mc, act = make_ontologies()
        registry = SeedDatasetRegistry("seed-l1-core", 1)
        record = valid_record(mc, act)
        registry.add(record)
        self.assertNotIn("rights-cleared source paragraph", json.dumps(registry.records()), "raw source text never enters the registry")


class ExclusionAndRevocationContracts(unittest.TestCase):
    def test_benchmark_exclusions_are_versioned_and_contamination_refused(self):
        mc, act = make_ontologies()
        exclusions = BenchmarkExclusions()
        v1 = exclusions.version()
        contaminated_digest = content_digest(b"licensed benchmark question bytes")
        exclusions.exclude("heldout-math-bench", "licensed-no-train", [contaminated_digest])
        self.assertEqual(exclusions.version()["version"], 2)
        self.assertEqual(json.dumps(exclusions.version(1), sort_keys=True), json.dumps(v1, sort_keys=True), "exclusion history byte-stable")

        clean = valid_record(mc, act, record_id="rec-clean")
        dirty = valid_record(mc, act, record_id="rec-dirty", content_digest=contaminated_digest)
        self.assertTrue(assert_no_benchmark_contamination([clean], exclusions)["ok"])
        with self.assertRaises(ContaminationError):
            assert_no_benchmark_contamination([clean, dirty], exclusions)

    def test_source_revocation_makes_records_untrainable_and_is_append_only(self):
        mc, act = make_ontologies()
        registry = SeedDatasetRegistry("seed-l1-core", 1)
        registry.add(valid_record(mc, act, record_id="rec-a", source_ref="src-1"))
        registry.add(valid_record(mc, act, record_id="rec-b", source_ref="src-2"))
        entry = registry.revoke_source("src-1", "license withdrawn by source")
        self.assertEqual(entry["affectedRecords"], ["rec-a"])
        self.assertEqual([r["recordId"] for r in registry.trainable_records()], ["rec-b"], "revoked source records fail closed")
        self.assertRaises(SeedError, registry.revoke_source, "src-1", "again")
        self.assertEqual(len(registry.revocations()), 1, "revocation ledger is append-only")


class SupplyChainIntegration(unittest.TestCase):
    def test_dataset_registers_as_signed_manifest_with_source_lineage(self):
        mc, act = make_ontologies()
        registry = SeedDatasetRegistry("seed-l1-core", 1)
        registry.add(valid_record(mc, act, record_id="rec-a", source_ref="src-1"))
        registry.add(valid_record(mc, act, record_id="rec-b", source_ref="src-2"))

        source_manifest = vmm_manifest(
            kind="dataset", artifact_id="src-consented-bundle", version=1,
            digest=SOURCE_DIGEST, producer="mle@visionary", license="internal-consented-v1",
            storage_class="private",
        )
        signed = registry.dataset_manifest("mle@visionary", KEY, source_manifests=[source_manifest])
        self.assertTrue(SeedDatasetRegistry.verify_dataset_manifest(signed, KEY))
        self.assertEqual(signed["recordCount"], 2)
        report = verify_lineage([source_manifest, signed["manifest"]])
        self.assertTrue(report["ok"])

        # Tampering with the record set breaks the manifest binding.
        tampered_registry = SeedDatasetRegistry("seed-l1-core", 1)
        tampered_registry.add(valid_record(mc, act, record_id="rec-a", source_ref="src-1"))
        tampered = tampered_registry.dataset_manifest("mle@visionary", KEY, source_manifests=[source_manifest])
        self.assertFalse(SeedDatasetRegistry.verify_dataset_manifest(tampered, KEY) and tampered["manifest"]["digest"] == signed["manifest"]["digest"])

    def test_okf_independence_core_schema_has_no_okf_fields(self):
        self.assertFalse(any("okf" in field.lower() for field in RECORD_FIELDS), "OKF (KAN-205) is an adapter, not part of the core schema")


if __name__ == "__main__":
    unittest.main()
