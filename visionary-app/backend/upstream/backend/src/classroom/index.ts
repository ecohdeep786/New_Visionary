export * from './classroom-types';
export * from './classroom-lookups';
export * from './classroom-service';
// ROLE-01 (KAN-93) — verified teacher/class ownership, enrollment/join/
// invitation lifecycle and workspace actions with an independent check on
// every class, attachment and learner operation.
//
//   - only a SERVER-verified teacher creates classes (self-claimed status is
//     never authority); the class owner is recorded server-side and every
//     class operation re-derives authority from the authenticated caller
//     (uniform not_owner, no existence leak, workspace isolation);
//   - learner-bound invites carry an opaque code, expiry and revocation;
//     joining requires the exact invited learner + valid unexpired unrevoked
//     code (uniform refusal, no leak); duplicate joins converge idempotently
//     to exactly ONE enrollment record;
//   - EVERY class/attachment/learner operation is checked at call time:
//     teacher-only actions refuse learners; learner reads require CURRENT
//     enrollment (a removed learner loses access immediately — no cached
//     role); archived classes refuse lifecycle actions.
//
// Exit: verified teacher/class ownership with checked enrollment/join/
// invitation lifecycle and workspace-scoped actions.
