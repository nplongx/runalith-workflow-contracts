# Public API

**Package:** `@runalith/workflow-contracts`
**Package version:** `0.1.0` (experimental package release)
**Artifact schema version:** `1`
**Success contract schema version:** `1`
**Module:** ESM
**Runtime:** Node.js `>=22.13`

Package SemVer and DTO schema versions are independent. Strict validators reject unknown fields, so adding a field can be a data-contract breaking change even when algorithm code remains unchanged.

## Artifact DTO exports

| Export | Purpose |
|---|---|
| `ArtifactType` | Frozen list of supported artifact type identifiers. |
| `ArtifactStatus` | Frozen lifecycle labels: active, superseded, invalidated. These labels are not persisted-state verification. |
| `hashArtifactContent(content)` | Canonical safe JSON snapshot + SHA-256 content digest. Rejects non-JSON values, accessors, symbol keys, cycles, sparse arrays and unsafe prototypes. |
| `createArtifactRecord(input)` | Creates an immutable typed artifact DTO with safe content/evidence snapshots and content hash. |
| `validateArtifact(record)` | Validates required DTO identity/status/schema/evidence/content fields and recomputes content hash. |
| `validateArtifactContent(type, content)` | Validates the type-specific content shape. |
| `artifactSchemaForType(type)` | Returns schema-version and required-content-field metadata. |

Artifact identity fields: `artifact_id`, `job_id`, `task_id`, `type`, `schema_version`, `producer_role`, `content`, `evidence`, `status`, `created_at`, `supersedes`, `content_hash`.

## Success-contract exports

| Export | Purpose |
|---|---|
| `normalizeSuccessContract(input, fallbackGoal?)` | Normalizes a version-1 success contract with bounded unique constraint/criterion IDs. |
| `validateSuccessContract(contract)` | Revalidates and requires canonical normalized form. |
| `hasEnforcedSuccessCriteria(contract)` | Returns whether typed constraints or criteria exist. |
| `evaluateSuccessPredicate(predicate, context)` | Evaluates one normalized predicate against caller-supplied `{ plan, tasks, artifacts }` read models. |
| `validateSuccessAssessment(contract, assessment, context)` | Validates exact assessment row coverage/status and checks predicate/evidence bindings. |
| `successContractPrompt(contract)` | Renders immutable goal, constraints and criteria as prompt text. |

Predicate types:

- `all_tasks_completed`
- `workflow_id_equals`
- `task_status_equals`
- `execution_exit_code_equals`
- `task_role_present`, `task_role_absent`
- `local_execution_only`
- `artifact_exists`
- `artifact_field_equals`, `artifact_field_includes`, `artifact_field_non_empty`

Maximum constraints or criteria: 32 each. Predicate IDs use lowercase slug syntax. Task IDs and role IDs are bounded lowercase slugs. Artifact types must be in `ArtifactType`. Unknown predicate types and fields reject.

The evaluator is a pure function over caller-provided data. It does not query current task rows or independently decide whether supplied artifacts are active/trusted. In particular, `validateSuccessAssessment` accepts an eligible artifact set from its caller; that set must have been independently verified before use.

## Strict JSON parser exports

| Export | Purpose |
|---|---|
| `MAX_STRICT_JSON_BYTES` | Default input bound: 32 MiB. |
| `parseStrictJson(input, label?, options?)` | Strict JSON parse from string or bytes, rejecting duplicate decoded keys, malformed JSON, invalid UTF-8, unpaired surrogates, excess nesting/node count and over-limit input. |

Caller may set `options.maxBytes` from 1 byte to 256 MiB. Parser input node count and nesting are separately bounded.

## Compatibility policy

- Root exports form the package surface for `0.x`; experimental incompatibilities are possible until `1.0.0`.
- Artifact and success contract schemas are independently versioned and explicit.
- Unknown DTO/predicate fields reject. Do not infer forward compatibility from ignored-field behavior.
- Deterministic content hashes are stable for the accepted plain JSON snapshot representation; unsupported JavaScript values are rejected rather than coerced.

## Explicitly excluded APIs

This package does not export Runalith role/action-intent contracts because compiled action-intent validation currently depends on AGG-owned semantic policy. It also excludes workflow definitions/compiler, immutable plan compilation, policy/custom-role persistence, role overlays, workspace capability contracts, approval, trust verification and execution dispatch. Those remain host adapters or separate future packages.
