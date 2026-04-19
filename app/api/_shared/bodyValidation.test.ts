import test from 'node:test';
import assert from 'node:assert/strict';

import { parseJsonObjectBody, readTrimmedString } from './bodyValidation';

test('parseJsonObjectBody accepts object payloads', async () => {
  const request = new Request('https://example.test', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Juan' }),
  });
  const result = await parseJsonObjectBody(request);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.name, 'Juan');
  }
});

test('parseJsonObjectBody rejects invalid json', async () => {
  const request = new Request('https://example.test', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{"name"',
  });
  const result = await parseJsonObjectBody(request);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.response.status, 400);
  }
});

test('readTrimmedString returns empty string for non-string values', () => {
  assert.equal(readTrimmedString('  hello  '), 'hello');
  assert.equal(readTrimmedString(123), '');
});
