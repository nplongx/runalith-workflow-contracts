# Security policy

## Scope

Pure DTO validation, safe JSON snapshotting, typed success predicates and strict JSON parsing.

## Important limitations

- Artifact content hashes prove byte identity only, not source authenticity, producer identity or truth.
- `ArtifactStatus` is a DTO field, not an authenticated lifecycle lookup.
- Success predicate evaluation trusts the plan/task/artifact read models supplied by the caller. It does not read or verify current durable state.
- Eligible artifact membership must be established by an external verified-lineage adapter before `validateSuccessAssessment` is called.
- This package does not approve, authorize, persist, dispatch, or execute workflows.

Report security issues privately to repository maintainers. Do not publish exploit details before a fix is available.
