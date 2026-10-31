import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ArtifactType,
  ArtifactStatus,
  artifactSchemaForType,
  createArtifactRecord,
  hashArtifactContent,
  validateArtifact,
  validateArtifactContent,
  normalizeSuccessContract,
  validateSuccessContract,
  hasEnforcedSuccessCriteria,
  evaluateSuccessPredicate,
  validateSuccessAssessment,
  successContractPrompt,
  MAX_STRICT_JSON_BYTES,
  parseStrictJson
} from '../index.js';

const timestamp = '2026-10-31T12:00:00.000Z';

function requirementsArtifact() {
  return createArtifactRecord({
    artifact_id: 'artifact-requirements-1',
    job_id: 'job-1',
    task_id: 'task-product-owner',
    type: ArtifactType.REQUIREMENTS,
    producer_role: 'product-owner',
    content: {
      scope: 'Build a public API',
      acceptance_criteria: ['The API validates exact inputs'],
      non_goals: ['No database deployment split']
    },
    evidence: ['source:requirements.md'],
    created_at: timestamp
  });
}

function successFixture() {
  const contract = normalizeSuccessContract({
    goal: 'Deliver a validated workflow package',
    constraints: [
      { id: 'all-done', type: 'all_tasks_completed' },
      { id: 'local-only', type: 'local_execution_only' }
    ],
    success_criteria: [
      { id: 'requirements-scope', type: 'artifact_field_equals', artifact_type: 'requirements',
        producer_role: 'product-owner', field: 'scope', expected: 'Build a public API' }
    ]
  });
  const artifact = requirementsArtifact();
  const plan = {
    workflow_id: 'standard-engineering',
    workflow_version: 3,
    custom_workflow: false,
    required_operations: [],
    workspace_write_scopes: [],
    children: [
      { id: 'engineer', role: 'engineer', execution: { deterministic: true, executor: 'ExecutionManager' } }
    ],
    synthesis: { id: 'cto', role: 'cto', execution: { deterministic: false, executor: 'ChatOnSteroidsHost', execution_mode: 'host-conversation' } }
  };
  const tasks = [{
    task_id: 'task-engineer', status: 'completed', created_at: timestamp, durable_rowid: 1,
    metadata_json: JSON.stringify({ workflow_plan_task_id: 'engineer' }),
    execution_status: 'completed', execution_exit_code: 0
  }];
  const context = { plan, tasks, artifacts: [artifact] };
  const assessment = {
    goal_status: 'achieved',
    summary: 'The requirements contract and local execution constraints are satisfied.',
    constraints: [
      { id: 'all-done', status: 'satisfied', evidence_refs: [] },
      { id: 'local-only', status: 'satisfied', evidence_refs: [] }
    ],
    criteria: [
      { id: 'requirements-scope', status: 'met', evidence_refs: [artifact.artifact_id] }
    ]
  };
  return { contract, artifact, plan, tasks, context, assessment };
}

test('artifact schemas expose strict content contracts and create immutable content-addressed records', () => {
  assert.equal(ArtifactStatus.ACTIVE, 'active');
  assert.deepEqual(artifactSchemaForType('requirements'), {
    type: 'requirements', schema_version: 1,
    required_content_fields: ['scope', 'acceptance_criteria', 'non_goals']
  });
  const artifact = requirementsArtifact();
  assert.equal(validateArtifact(artifact), true);
  assert.match(artifact.content_hash, /^[a-f0-9]{64}$/);
  assert.equal(Object.isFrozen(artifact), true);
  assert.equal(Object.isFrozen(artifact.content), true);
  assert.throws(() => artifactSchemaForType('unknown-artifact'), /unknown artifact type/);
  assert.throws(() => validateArtifactContent(ArtifactType.REQUIREMENTS, {
    scope: 'x', acceptance_criteria: []
  }), /missing non_goals/);
});

test('artifact hashes reject content mutation, non-JSON values, inherited fields and executable toJSON hooks', () => {
  const original = requirementsArtifact();
  const changed = { ...original, content: { ...original.content, scope: 'Changed after signing' } };
  assert.throws(() => validateArtifact(changed), /content_hash mismatch/);
  assert.throws(() => hashArtifactContent({ value: Number.NaN }), /non-finite number/);
  assert.throws(() => hashArtifactContent({ value: undefined }), /non-JSON value/);

  let toJSONCalls = 0;
  const malicious = { scope: 'x', acceptance_criteria: [], non_goals: [] };
  Object.defineProperty(malicious, 'toJSON', { enumerable: true, value() { toJSONCalls++; return {}; } });
  assert.throws(() => hashArtifactContent(malicious), /non-JSON value/);
  assert.equal(toJSONCalls, 0);

  const inherited = Object.create({ non_goals: [] });
  inherited.scope = 'x';
  inherited.acceptance_criteria = [];
  assert.throws(() => validateArtifactContent(ArtifactType.REQUIREMENTS, inherited), /missing non_goals/);
});

test('success contracts normalize, validate canonical form and reject unknown predicate fields', () => {
  const contract = normalizeSuccessContract({
    goal: 'Complete work',
    criteria: [{ id: 'scope-exists', type: 'artifact_field_non_empty', artifact_type: 'requirements', field: 'scope' }]
  });
  assert.equal(contract.schema_version, 1);
  assert.equal(validateSuccessContract(contract).goal, 'Complete work');
  assert.equal(hasEnforcedSuccessCriteria(contract), true);
  assert.equal(hasEnforcedSuccessCriteria(normalizeSuccessContract({ goal: 'No typed gates' })), false);
  assert.throws(() => normalizeSuccessContract({
    goal: 'Broken', success_criteria: [{ id: 'bad', type: 'artifact_exists', artifact_type: 'requirements', extra: true }]
  }), /unsupported fields/);
  assert.throws(() => validateSuccessContract({ ...contract, unrecognized: true }), /not in canonical normalized form/);
});

test('success predicate evaluation binds immutable plan IDs, durable task state and validated artifacts', () => {
  const { contract, artifact, context } = successFixture();
  assert.equal(evaluateSuccessPredicate(contract.constraints[0], context).passed, true);
  assert.equal(evaluateSuccessPredicate(contract.constraints[1], context).passed, true);
  const artifactResult = evaluateSuccessPredicate(contract.success_criteria[0], context);
  assert.equal(artifactResult.passed, true);
  assert.deepEqual(artifactResult.evidence_artifact_ids, [artifact.artifact_id]);
  const staleTaskContext = { ...context, tasks: [{ ...context.tasks[0], status: 'failed' }] };
  assert.equal(evaluateSuccessPredicate(contract.constraints[0], staleTaskContext).passed, false);
  assert.equal(evaluateSuccessPredicate({ id: 'missing', type: 'task_status_equals', task_id: 'unknown', expected: 'completed' }, context).actual, 'missing');
});

test('success assessment requires exact predicate rows/status/evidence and cannot self-assert a pass', () => {
  const { contract, context, assessment, artifact } = successFixture();
  assert.deepEqual(validateSuccessAssessment(contract, assessment, context), { valid: true, errors: [] });
  assert.match(successContractPrompt(contract), /IMMUTABLE WORKFLOW SUCCESS CONTRACT/);

  const wrongStatus = structuredClone(assessment);
  wrongStatus.constraints[0].status = 'met';
  assert.equal(validateSuccessAssessment(contract, wrongStatus, context).valid, false);

  const wrongEvidence = structuredClone(assessment);
  wrongEvidence.criteria[0].evidence_refs = ['artifact-from-another-job'];
  assert.equal(validateSuccessAssessment(contract, wrongEvidence, context).valid, false);

  const omitted = structuredClone(assessment);
  omitted.criteria[0].evidence_refs = [];
  assert.equal(validateSuccessAssessment(contract, omitted, context).valid, false);

  const taskFailure = { ...context, tasks: [] };
  assert.ok(validateSuccessAssessment(contract, assessment, taskFailure).errors.some(message => message.includes('failed runtime evaluation')));
  assert.ok(artifact.artifact_id);
});

test('strict JSON rejects duplicate decoded members, invalid UTF-8, BOM and caller-exceeded bounds', () => {
  assert.equal(MAX_STRICT_JSON_BYTES, 32 * 1024 * 1024);
  assert.deepEqual(parseStrictJson('{"a":1,"b":[true,null]}'), { a: 1, b: [true, null] });
  assert.throws(() => parseStrictJson('{"a":1,"a":2}'), /duplicate/);
  assert.throws(() => parseStrictJson('{"a":1,"\\u0061":2}'), /duplicate/);
  assert.throws(() => parseStrictJson(Buffer.from([0xc3, 0x28])), /valid UTF-8/);
  assert.throws(() => parseStrictJson('\uFEFF{}'), /invalid/);
  assert.throws(() => parseStrictJson('{"value":"long"}', 'bounded', { maxBytes: 4 }), /exceeds the 4-byte limit/);
});
