# KAN-46 product image review

The original branch supplied a historical receipt. Review found that a parent-directory exception in the Docker ignore file admitted a synthetic file outside the stated allowlist. The builder also stamped a source revision onto mutable checkout contents. The corrected builder exports allowlisted, tracked Git blobs from the exact checkout commit, rejects recognized credential material and unsupported entries, and records the source manifest alongside the image ID.

The product image runs as a non-root user with root-owned application files. The production entry point checks its Firebase realm, canonical origin, rate-limit configuration, port and emulator settings before listening. It configures HTTP connection budgets and closes connections on shutdown. Browser review identified SPA fallback for dotfiles. The production handler now rejects dot paths, including encoded variants.

The checks job builds the full image alongside the API target. Full-image smoke verifies probes, static and JSON route separation, source revision, secure CSRF, private path rejection, nine invalid startup configurations and SIGTERM with a pending request. The local Chromium harness uses a loopback HTTPS proxy and a container with networking disabled to validate the compiled bundle, browser cookie attributes and anonymous write denial.

Record the exact reviewer decision, CI runs and integrated image evidence in the PR and Jira. Hosted staging, provider acceptance and production rollout have separate acceptance criteria.
