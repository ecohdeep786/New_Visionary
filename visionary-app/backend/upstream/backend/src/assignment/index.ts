export * from './assignment-types';
export * from './assignment-lookups';
export * from './assignment-service';
// ROLE-02 (KAN-94) — fixed assignment/objective/source/rubric publication,
// scheduling/timezones, close/archive/restore and supported response types.
//
//   - FIXED PUBLICATION: the published version binds objective, permitted
//     source revision, rubric reference and supported response types; a
//     published version is immutable — edits are a new draft version, and
//     submissions bind the exact version;
//   - SCHEDULING/TIMEZONES: publish/close are wall-clock times in an explicit
//     IANA timezone recorded on the assignment and evaluated deterministically
//     in that timezone; a future publish time schedules;
//   - CLOSE/ARCHIVE/RESTORE: explicit close or a passed close time refuses
//     submissions; archive records the prior status; restore returns exactly
//     that prior status;
//   - SUPPORTED RESPONSE TYPES: submissions outside the published types or
//     failing the per-type schema refuse; duplicate (learner, version)
//     submissions converge idempotently;
//   - ROLE-AWARE authority: uniform not_owner for unknown/foreign workspace,
//     not_class_teacher for same-workspace non-teachers; submissions require
//     CURRENT class membership via the owning store.
//
// Exit: fixed assignment publication with timezone-deterministic scheduling,
// close/archive/restore and schema-checked supported response types.
