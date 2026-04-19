import test from 'node:test';
import assert from 'node:assert/strict';

import { assertAllowedOutboundUrl, isAllowedOutboundUrl } from './safeFetch';

test('isAllowedOutboundUrl accepts allowed https host', () => {
  const allowed = isAllowedOutboundUrl(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    ['challenges.cloudflare.com'],
  );
  assert.equal(allowed, true);
});

test('isAllowedOutboundUrl blocks non-https and unknown hosts', () => {
  assert.equal(
    isAllowedOutboundUrl('http://challenges.cloudflare.com/turnstile/v0/siteverify', [
      'challenges.cloudflare.com',
    ]),
    false,
  );
  assert.equal(
    isAllowedOutboundUrl('https://example.com/turnstile/v0/siteverify', ['challenges.cloudflare.com']),
    false,
  );
});

test('assertAllowedOutboundUrl throws for blocked targets', () => {
  assert.throws(
    () => assertAllowedOutboundUrl('https://example.com/foo', ['challenges.cloudflare.com']),
    /Blocked outbound request host/,
  );
});
