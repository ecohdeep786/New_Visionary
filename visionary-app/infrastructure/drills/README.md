# KAN-52 recovery runbook

Production Firestore uses the named database default in visionary-research, region asia-south1. Confirm the project, location and database before each recovery operation.

```sh
gcloud firestore databases describe --database=default --project=visionary-research
gcloud firestore backups schedules list --database=default --project=visionary-research
gcloud firestore backups list --location=asia-south1 --project=visionary-research
```

Expect delete protection, seven-day point-in-time recovery, and a daily backup schedule with 30-day retention. Compare the target recovery time with the reported earliest version time. Verify the schedule and backup inventory separately.

For a synthetic drill, use a source database that contains only synthetic fixtures with known IDs and owners. Select a READY backup that matches the source and snapshot time. Restore it to a unique new database that the application does not use. Wait for the restore operation to finish. Verify the expected IDs, owner fields and content hashes, and confirm that post-snapshot changes are absent. Verify indexes and reapply security rules and TTL policies before any operational cutover. Firebase Authentication identities require separately managed recovery.

For document-level PITR, read Firestore at the intended readTime. Compare the recovered fields, including owner identity, before writing a recovered copy. Use Firestore preconditions for live writes to prevent overwriting a newer version.

For Cloud Storage recovery, record the synthetic object generation and checksum. Verify live absence after deletion. Restore the soft-deleted generation with ifGenerationMatch=0, then read the restored bytes and compare the checksum. Remove the live drill copy by generation. Soft-deleted drill copies expire under the bucket policy.

From visionary-app/infrastructure/drills, run python -m unittest discover -s tests -v. This local suite checks snapshot checksums, owner preservation, point-in-time selection, and retention behavior.

The production Firestore settings and schedule were verified by read-back. A hosted document-version drill recovered all expected synthetic fields and preserved the owner. Both probe records were removed. A hosted storage drill in the private visionaryrag bucket restored the original synthetic bytes and checksum. Its temporary live object was removed. The first scheduled Firestore backup and a synthetic database restore remain pending. Project inventory returned zero Cloud SQL instances.
