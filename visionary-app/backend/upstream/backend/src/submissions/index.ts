export * from './submissions-types';
export * from './submissions-lookups';
export * from './submissions-service';
// ROLE-03 (KAN-95) — immutable submission copies, duplicate-safe submit,
// teacher draft/release/return/request-revision and retained attempt/feedback
// history; no silent resubmission replacement (resubmission requires an
// explicit teacher revision request; attempts are bounded by granted
// revisions; every attempt is an immutable byte-stable copy; released grades
// are immutable; feedback is visible only once returned/revision_requested).
