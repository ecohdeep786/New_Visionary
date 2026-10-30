"""BUILD-LAUNCH-03 (KAN-134) — publication contracts (synthetic)."""
import unittest

from vmm.publication import PublicationAuthority, PublicationError

OWNER = {"uid": "uid_builder", "role": "owner"}
CUSTODIAN = {"uid": "uid_custodian", "role": "custodian"}
STRANGER = {"uid": "uid_stranger", "role": "user"}

DIGEST = "a" * 64
DIGEST_V2 = "b" * 64


class PublicationContracts(unittest.TestCase):
    def test_owner_requests_custodian_approves_then_publishes(self):
        pub = PublicationAuthority()
        pub.request_publication(OWNER, DIGEST, revision=1)
        pub.approve(CUSTODIAN, DIGEST, revision=1)
        published = pub.publish(OWNER, DIGEST, revision=1, artifact_bytes=b"artifact")
        self.assertEqual(published["status"], "published")
        self.assertFalse(published["credentialValuesExposed"])

    def test_duplicate_publication_refused(self):
        pub = PublicationAuthority()
        pub.request_publication(OWNER, DIGEST, revision=1)
        pub.approve(CUSTODIAN, DIGEST, revision=1)
        pub.publish(OWNER, DIGEST, revision=1, artifact_bytes=b"artifact")
        with self.assertRaises(PublicationError):
            pub.publish(OWNER, DIGEST, revision=1, artifact_bytes=b"artifact")

    def test_publication_without_approval_refused(self):
        pub = PublicationAuthority()
        pub.request_publication(OWNER, DIGEST, revision=1)
        with self.assertRaises(PublicationError):
            pub.publish(OWNER, DIGEST, revision=1, artifact_bytes=b"artifact")

    def test_publication_without_request_refused(self):
        pub = PublicationAuthority()
        with self.assertRaises(PublicationError):
            pub.publish(OWNER, DIGEST, revision=1, artifact_bytes=b"artifact")

    def test_non_owner_cannot_request_or_publish(self):
        pub = PublicationAuthority()
        with self.assertRaises(PublicationError):
            pub.request_publication(STRANGER, DIGEST, revision=1)
        with self.assertRaises(PublicationError):
            pub.publish(STRANGER, DIGEST, revision=1, artifact_bytes=b"artifact")


class RevocationContracts(unittest.TestCase):
    def test_revoked_approval_refuses_publication(self):
        pub = PublicationAuthority()
        pub.request_publication(OWNER, DIGEST, revision=1)
        pub.approve(CUSTODIAN, DIGEST, revision=1)
        pub.revoke_approval(CUSTODIAN, DIGEST, revision=1)
        with self.assertRaises(PublicationError):
            pub.publish(OWNER, DIGEST, revision=1, artifact_bytes=b"artifact")

    def test_revoked_after_publication_stops_serving(self):
        pub = PublicationAuthority()
        pub.request_publication(OWNER, DIGEST, revision=1)
        pub.approve(CUSTODIAN, DIGEST, revision=1)
        pub.publish(OWNER, DIGEST, revision=1, artifact_bytes=b"artifact")
        pub.revoke_approval(CUSTODIAN, DIGEST, revision=1)
        status = pub._published.get(f"{DIGEST}:1", {})
        self.assertEqual(status.get("status"), "revoked", "published artifact stops serving after revocation")

    def test_wrong_digest_or_revision_approval_refused(self):
        pub = PublicationAuthority()
        pub.request_publication(OWNER, DIGEST, revision=1)
        with self.assertRaises(PublicationError):
            pub.approve(CUSTODIAN, "b" * 64, revision=1)  # wrong digest
        with self.assertRaises(PublicationError):
            pub.approve(CUSTODIAN, DIGEST, revision=2)  # wrong revision


class ConnectorContracts(unittest.TestCase):
    def test_credential_refs_stay_private_never_values(self):
        pub = PublicationAuthority()
        pub.register_connector(OWNER, "conn-storage", "storage", "vault:secret/storage-key")
        ref = pub.connector_credential_ref(OWNER, "conn-storage")
        self.assertTrue(ref.startswith("vault:"), "credential is a REF, not a value")
        self.assertNotIn("secret/storage-key", ref.replace("vault:secret/storage-key", ""), "no raw credential value")

    def test_non_owner_cannot_read_credential_refs(self):
        pub = PublicationAuthority()
        pub.register_connector(OWNER, "conn-db", "database", "vault:secret/db-key")
        with self.assertRaises(PublicationError):
            pub.connector_credential_ref(STRANGER, "conn-db")

    def test_credential_must_be_a_vault_ref_never_a_value(self):
        pub = PublicationAuthority()
        with self.assertRaises(PublicationError):
            pub.register_connector(OWNER, "conn-x", "storage", "sk-live-1234567890")  # raw value, not a ref

    def test_publication_with_unregistered_connector_refused(self):
        pub = PublicationAuthority()
        pub.request_publication(OWNER, DIGEST, revision=1, connector_refs=["conn-ghost"])
        pub.approve(CUSTODIAN, DIGEST, revision=1)
        with self.assertRaises(PublicationError):
            pub.publish(OWNER, DIGEST, revision=1, artifact_bytes=b"artifact")

    def test_publication_with_registered_connectors(self):
        pub = PublicationAuthority()
        pub.register_connector(OWNER, "conn-storage", "storage", "vault:secret/storage-key")
        pub.request_publication(OWNER, DIGEST, revision=1, connector_refs=["conn-storage"])
        pub.approve(CUSTODIAN, DIGEST, revision=1)
        published = pub.publish(OWNER, DIGEST, revision=1, artifact_bytes=b"artifact")
        self.assertEqual(published["connectorRefs"], ["conn-storage"])
        self.assertFalse(published["credentialValuesExposed"])


class RollbackContracts(unittest.TestCase):
    def test_rollback_to_earlier_published_revision(self):
        pub = PublicationAuthority()
        pub.request_publication(OWNER, DIGEST, revision=1)
        pub.approve(CUSTODIAN, DIGEST, revision=1)
        pub.publish(OWNER, DIGEST, revision=1, artifact_bytes=b"v1")
        pub.request_publication(OWNER, DIGEST_V2, revision=2)
        pub.approve(CUSTODIAN, DIGEST_V2, revision=2)
        pub.publish(OWNER, DIGEST_V2, revision=2, artifact_bytes=b"v2")
        # Rollback uses the TARGET revision's own digest to find the published entry.
        receipt = pub.rollback(OWNER, DIGEST, from_revision=2, to_revision=1)
        self.assertEqual(receipt["rolledBackTo"], 1)
        self.assertFalse(receipt["userRecordsChanged"])
        with self.assertRaises(PublicationError):
            pub.rollback(OWNER, DIGEST, from_revision=1, to_revision=2)  # forward refused


if __name__ == "__main__":
    unittest.main()
