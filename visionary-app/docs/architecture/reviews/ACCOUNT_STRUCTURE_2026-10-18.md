# Permanent account structure — KAN-161

18 October 2026. Implementer: Codex. Review state: separately approved implementation075e082fc084261ab7fbacc30bade178361d92db; see the independent delivery review. This contract finalizes account organization; future domain functionality is not implemented by a directory entry.

The founder requests one original account after authentication, with understandable sections for every activity. The canonical identity remains the verified Firebase UID. All devices and roles reuse it. There is one Firestore account root; connected private records are its children. Other owning stores use that same UID and a scoped account entry point, rather than creating a competing person account. The operative schema and full sixteen-section map are in [USER_ACCOUNT_STORAGE](../../../integration/USER_ACCOUNT_STORAGE.md).

```text
Firebase Authentication UID
  └─ visionary_accounts/{same UID}
       ├─ identity / profile / onboarding
       ├─ structure/account              map of all account sections
       ├─ authEvents/{event}
       ├─ devices/{browser session}
       ├─ billing/test
       │    ├─ commands/{command}
       │    └─ invoices/{invoice}
       ├─ feedback/{submission}
       ├─ feedbackState/admission
       └─ domainLinks/{domain}           reserved; actual provisioning required
            learning / conversations / practice / projects / progress
            connections / teaching / family / career / organization
            privacy / support
```

The directory states what is connected and what remains unconnected. Its future entry points are locations in the ownership contract, not empty databases or invented usage. Learning, workspace, classroom and Build integration remain the existing domain backlog. D-075's SQL/object-store authority is preserved: one owning record per object and one UID throughout, with current authorization whenever an account follows a shared-domain link. Institution roles and Family plans never confer access to private learning history by themselves.

The first fresh verified-email sign-in atomically creates/reuses account, directory, Free base billing and device/history. Registration pending email verification stays in Auth. The directory is derived metadata with its own schema version. It includes no credentials, user history, payment values or grant. Newer incompatible versions and foreign ownership fail closed. Additive reconciliation changes only the directory and can be replayed without writes. No existing user path is renamed and no account is merged by name/email/IP.

Operational auth lookup/security indexes, payment deduplication maps and shared relationships remain service-owned. Historical legacy billing remains preserved and is not an active writer. Moving these physically under a user would prevent some lookups before the UID is resolved or duplicate shared authority. The account directory makes the owning user tree understandable without weakening those operations.

The current-tree verifier checks current ownership, directory, invoice/command claims, due queue and security mirror consistency. The old migration equality verifier remains explicitly migration-only because retained historical billing legitimately diverges after activity. The new verifier reports differences without displaying protected records or applying repairs. It is a quiet-snapshot maintenance check, not a global transactional snapshot, production load benchmark or release acceptance.

Acceptance requires unit/service/HTTP evidence, separate exact-SHA review, relevant integrated checks, an additive live-directory plan/apply/replay/readback and native Jira closeout. No main promotion, provider configuration, payment transaction, data purge or hosted release belongs to this task. Follow [the mandatory handoff](../delivery/TASK_REVIEW_TEMPLATE.md). A subsequent incompatible field/storage change needs a reviewed versioned migration; future features must extend the same account contract.
