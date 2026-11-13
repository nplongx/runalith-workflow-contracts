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

## AGG External Checkpoint v2 JSON/JCS exports

The package exports the JavaScript binding for the same constrained JSON/JCS profile implemented by nplongx/protocol-contracts, module agg_checkpoint_v2.

| Export | Purpose |
|---|---|
| AGG_CHECKPOINT_V2_PROTOCOL_ID | runalith.agg.external-checkpoint. |
| AGG_CHECKPOINT_V2_PROTOCOL_VERSION | Protocol version 2. |
| AGG_CHECKPOINT_V2_MAX_JSON_BYTES | Maximum raw JSON and canonical output size: 1 MiB. |
| AGG_CHECKPOINT_V2_MAX_JSON_DEPTH | Maximum JSON nesting depth: 256, root at depth zero. |
| AGG_CHECKPOINT_V2_MAX_JSON_NODES | Maximum materialized JSON value nodes: 1,000,000. |
| parseAggCheckpointV2Json(input, options?) | Parse original Uint8Array bytes. Strings are rejected so prior decoding cannot erase duplicate raw keys or byte identity. |
| canonicalizeAggCheckpointV2Jcs(value) | Canonicalize a constrained I-JSON value with RFC 8785 key ordering/number serialization and protocol bounds. |
| canonicalizeAggCheckpointV2JcsBytes(value) | Return canonical UTF-8 bytes. |
| createAggCheckpointV2DigestEnvelope({domain,version,payload}) | Create the protocol/version/domain/component-version envelope used for digest separation. |
| computeAggCheckpointV2DomainDigest({domain,version,payload}) | SHA-256 digest of canonical envelope bytes. |

The constrained value profile rejects non-finite numbers, negative zero, unsafe integer-valued numbers, unpaired surrogates, cycles, proxies/accessors, sparse or custom-prototype arrays, non-plain objects, symbol keys, excessive depth/nodes and canonical output over 1 MiB. Domain identifiers use lowercase protocol syntax and component versions must be positive safe integers.

Raw input rule: externally supplied JSON must first pass through parseAggCheckpointV2Json(originalBytes). Passing an object produced by a different parser to the canonicalizer cannot reveal duplicate names already discarded by that parser.

Security limit: a canonical digest proves deterministic representation of supplied content. It is not a signature, trust-root verification, custody proof, source/commit attestation or approval decision. Those remain separate Trust Governance and host responsibilities.

The JavaScript tests consume the exact shared vector file from nplongx/protocol-contracts at tests/fixtures/agg-checkpoint-v2-jcs-vectors.json. The copied fixture SHA-256 is d4034f928c2afa7ce9c3f0e23ec7562d4a1a8fbeeebb18e2db08b3273261452a. Rust and JavaScript must continue to pass those same vectors before a normative protocol change is accepted.


## Owner Approval v1 pure contract exports

The package exports the host-neutral vocabulary and canonicalization rules used by the local Owner Approval v1 envelope. These exports do not verify signatures or issue approvals.

| Export | Purpose |
|---|---|
| `OWNER_APPROVAL_SCHEMA_VERSION` | Envelope schema version `1`. |
| `OWNER_APPROVAL_DOMAIN` | `runalith.owner-approval.v1`. |
| `OWNER_APPROVAL_SCOPE` | `workflow.dispatch`. |
| `OWNER_APPROVAL_MAX_TTL_MS` | Maximum owner approval TTL: 15 minutes. |
| `OWNER_APPROVAL_DISPATCH_OPERATION_ID` | `runalith.workflow.dispatch.v1`. |
| `OWNER_APPROVAL_DISPATCH_OPERATION_VERSION` | Operation version `1`. |
| `OWNER_APPROVAL_HUMAN_PRESENCE` | `controlling_tty.v1`. |
| `OWNER_APPROVAL_ALLOWED_ACTION_IDS` | Frozen allowlist; currently empty, so no business action is enabled. |
| `canonicalOwnerApprovalJson(value)` | Deterministic canonical JSON for plain JSON-compatible values, arrays and safe integers. Rejects cycles, unsupported prototypes, unpaired Unicode, negative zero, unsafe integers and undefined. |
| `ownerApprovalDispatchArgumentsDigest(input)` | SHA-256 digest of exact job/plan/role/action tuple. Requires a currently allowlisted action ID; with the current empty allowlist it fails closed. |

The owner-approval implementation in the host remains responsible for key loading, Ed25519 signing/verification, trust-root disjointness, key rotation/revocation, signature scope/freshness, nonce consumption and durable audit. This pure contract exports must not be interpreted as cryptographic verification or an approval decision.
