import assert from 'node:assert/strict';
import {
  OWNER_APPROVAL_SCHEMA_VERSION,
  OWNER_APPROVAL_DOMAIN,
  OWNER_APPROVAL_SCOPE,
  OWNER_APPROVAL_DISPATCH_OPERATION_ID,
  OWNER_APPROVAL_DISPATCH_OPERATION_VERSION,
  OWNER_APPROVAL_HUMAN_PRESENCE,
  OWNER_APPROVAL_MAX_TTL_MS,
  OWNER_APPROVAL_ALLOWED_ACTION_IDS,
  canonicalOwnerApprovalJson,
  ownerApprovalDispatchArgumentsDigest
} from '../src/runtime/workflow/owner-approval-contract.js';


assert.equal(OWNER_APPROVAL_SCHEMA_VERSION, 1);
assert.equal(OWNER_APPROVAL_DOMAIN, 'runalith.owner-approval.v1');
assert.equal(OWNER_APPROVAL_SCOPE, 'workflow.dispatch');
assert.equal(OWNER_APPROVAL_DISPATCH_OPERATION_ID, 'runalith.workflow.dispatch.v1');
assert.equal(OWNER_APPROVAL_DISPATCH_OPERATION_VERSION, 1);
assert.equal(OWNER_APPROVAL_HUMAN_PRESENCE, 'controlling_tty.v1');
assert.equal(OWNER_APPROVAL_MAX_TTL_MS, 15 * 60 * 1000);
assert.deepEqual(OWNER_APPROVAL_ALLOWED_ACTION_IDS, []);
assert.equal(Object.isFrozen(OWNER_APPROVAL_ALLOWED_ACTION_IDS), true);

assert.equal(canonicalOwnerApprovalJson({ z: 2, a: { y: true, b: 'x' } }),
  '{"a":{"b":"x","y":true},"z":2}');
assert.throws(() => canonicalOwnerApprovalJson({ number: -0 }), { code: 'RUNALITH_OWNER_APPROVAL_CANONICAL_VALUE_INVALID' });
assert.throws(() => canonicalOwnerApprovalJson({ value: undefined }), { code: 'RUNALITH_OWNER_APPROVAL_CANONICAL_VALUE_INVALID' });
assert.throws(() => canonicalOwnerApprovalJson({ value: '\uD800' }), { code: 'RUNALITH_OWNER_APPROVAL_CANONICAL_VALUE_INVALID' });
assert.throws(() => canonicalOwnerApprovalJson({ value: Number.MAX_SAFE_INTEGER + 1 }), { code: 'RUNALITH_OWNER_APPROVAL_CANONICAL_VALUE_INVALID' });
const cyclic = {}; cyclic.self = cyclic;
assert.throws(() => canonicalOwnerApprovalJson(cyclic), { code: 'RUNALITH_OWNER_APPROVAL_CANONICAL_VALUE_INVALID' });
const getter = {}; Object.defineProperty(getter, 'value', { enumerable: true, get() { throw new Error('getter must not run'); } });
assert.throws(() => canonicalOwnerApprovalJson(getter), /getter must not run/);
assert.throws(() => ownerApprovalDispatchArgumentsDigest({
  job_id: 'job', immutable_plan_sha256: 'a'.repeat(64), role: 'cto',
  approved_action_id: 'unselected', approved_action_version: 1
}), { code: 'RUNALITH_OWNER_APPROVAL_ACTION_NOT_SELECTED' });

console.log('OwnerApprovalContract v1 contract vocabulary, canonicalization and dependency boundary PASS');
