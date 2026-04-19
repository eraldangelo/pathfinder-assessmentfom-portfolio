import test from 'node:test';
import assert from 'node:assert/strict';

import { rejectIfBodyTooLarge } from './requestSize';

test('rejectIfBodyTooLarge returns null when content-length is under limit', () => {
  const request = new Request('https://example.test', { headers: { 'content-length': '1024' } });
  const response = rejectIfBodyTooLarge(request as any, 2048);
  assert.equal(response, null);
});

test('rejectIfBodyTooLarge returns 413 when content-length exceeds limit', async () => {
  const request = new Request('https://example.test', { headers: { 'content-length': '4096' } });
  const response = rejectIfBodyTooLarge(request as any, 2048);
  assert.ok(response);
  assert.equal(response.status, 413);
  const payload = await response.json();
  assert.equal(payload.ok, false);
});

test('rejectIfBodyTooLarge ignores missing content-length', () => {
  const request = new Request('https://example.test');
  const response = rejectIfBodyTooLarge(request as any, 2048);
  assert.equal(response, null);
});
