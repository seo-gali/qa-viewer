import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertPatchedNode } from '../server/runtime.mjs';

test('runtime accepts patched supported Node.js release lines', () => {
  for (const version of ['22.23.4', '22.24.0', '24.22.1', '24.23.0', '26.12.1', '26.13.0']) assert.doesNotThrow(() => assertPatchedNode(version), version);
});

test('runtime rejects older patches, unsupported majors and malformed versions', () => {
  for (const version of ['22.23.3', '24.22.0', '26.12.0', '20.19.0', '25.0.0', '28.0.0', '24.22', '24.22.1-rc.1', '24.23.-1']) assert.throws(() => assertPatchedNode(version), /Node\.js/, version);
});
