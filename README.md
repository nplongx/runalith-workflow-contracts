# Runalith Workflow Contracts

Pure JavaScript contract primitives for durable artifact DTOs, typed workflow success predicates, strict JSON parsing and AGG External Checkpoint v2 canonical JSON/digest contracts.

<p>
  <a href="https://github.com/nplongx/runalith-workflow-contracts/actions"><img alt="CI" src="https://github.com/nplongx/runalith-workflow-contracts/actions/workflows/ci.yml/badge.svg"></a>
  <img alt="Node.js 22.13+" src="https://img.shields.io/badge/node-%3E%3D22.13-green">
  <img alt="MIT License" src="https://img.shields.io/badge/license-MIT-blue">
</p>

## Install

```bash
npm install git+https://github.com/nplongx/runalith-workflow-contracts.git
```

Requires Node.js 22.13 or newer. ESM only. Zero external runtime dependencies.

## Public API

```js
import {
  createArtifactRecord,
  validateArtifact,
  normalizeSuccessContract,
  validateSuccessContract,
  evaluateSuccessPredicate,
  validateSuccessAssessment,
  parseStrictJson,
  parseAggCheckpointV2Json,
  canonicalizeAggCheckpointV2Jcs,
  computeAggCheckpointV2DomainDigest
} from '@runalith/workflow-contracts';
```

This package covers pure artifact/success contracts, strict JSON handling and the JavaScript binding for the AGG External Checkpoint v2 JSON/JCS profile. It does not include workflow compilation, role/action-intent profiles, custom workflow or policy persistence, plan storage, trust-root administration, approval, or execution.

## Contract semantics

- Artifact content is snapshotted as plain JSON, validated against artifact-type schemas and bound to SHA-256 content hashes.
- Success contracts use a strict typed predicate vocabulary with canonical normalization and duplicate/unknown-field rejection.
- Evaluation accepts caller-supplied plan, task and artifact read models. It does not open a database or independently verify that those observations are current or authentic.
- Success assessment validation checks exact predicate rows/statuses and binds artifact-based evidence references to artifact IDs in the supplied eligible set.
- `parseStrictJson` rejects duplicate decoded object keys, invalid UTF-8, malformed JSON and inputs beyond caller-selected bounds.

## Security and authority boundary

Passing a structural contract is not proof that a workflow was approved, a task actually ran, an artifact was produced by a trusted actor, or a claim is true. Artifact hash validation establishes byte identity only. The caller must independently resolve artifact status, producer/result/attempt/completion lineage, reviewer trust and current workflow authority before treating records as eligible evidence.

This package has no SQLite, filesystem, network, MCP, provider or approval implementation. Checkpoint JCS establishes canonical bytes/digests only; it does not verify signatures, trust roots, checkpoint custody or external continuity. It cannot dispatch work or mutate workflow state.

## Development

```bash
npm test
npm run pack:check
```

The public contract suite uses isolated in-memory/synthetic fixtures and has no dependency on the Runalith monorepo.

## Relationship to Runalith

This repository extracts the artifact and success-contract primitives used by [Runalith](https://github.com/nplongx/runalith). The host [subsystem architecture map](https://github.com/nplongx/runalith/blob/main/docs/subsystems/README.md) and [Workflow Contracts boundary note](https://github.com/nplongx/runalith/blob/main/docs/subsystems/workflow-contracts.md) describe the consumer and ownership boundaries. Workflow compiler, role/action-intent contracts, policy/custom-role stores, plan persistence and execution remain separate host-owned modules until their dependency and ownership boundaries are independently extracted.

## License

MIT. See [LICENSE](LICENSE).
