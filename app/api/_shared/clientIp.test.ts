import test from 'node:test';
import assert from 'node:assert/strict';

import { getClientIp } from './clientIp';

test('getClientIp returns first valid forwarded ip when trusted', () => {
  const previous = process.env.TRUST_PROXY_HEADERS;
  process.env.TRUST_PROXY_HEADERS = 'true';
  const request = new Request('https://example.test', {
    headers: { 'x-forwarded-for': '203.0.113.9, 10.0.0.1' },
  });
  assert.equal(getClientIp(request as any), '203.0.113.9');
  process.env.TRUST_PROXY_HEADERS = previous;
});

test('getClientIp falls back to localhost when headers are untrusted', () => {
  const previousProxy = process.env.TRUST_PROXY_HEADERS;
  const previousCloudflare = process.env.TRUST_CLOUDFLARE_CONNECTING_IP;
  process.env.TRUST_PROXY_HEADERS = 'false';
  process.env.TRUST_CLOUDFLARE_CONNECTING_IP = 'false';
  const request = new Request('https://example.test', {
    headers: {
      'x-forwarded-for': '203.0.113.9',
      'cf-connecting-ip': '203.0.113.11',
    },
  });
  assert.equal(getClientIp(request as any), '127.0.0.1');
  process.env.TRUST_PROXY_HEADERS = previousProxy;
  process.env.TRUST_CLOUDFLARE_CONNECTING_IP = previousCloudflare;
});

test('getClientIp trusts cf-connecting-ip only when explicitly enabled', () => {
  const previousProxy = process.env.TRUST_PROXY_HEADERS;
  const previousCloudflare = process.env.TRUST_CLOUDFLARE_CONNECTING_IP;
  process.env.TRUST_PROXY_HEADERS = 'false';
  process.env.TRUST_CLOUDFLARE_CONNECTING_IP = 'true';
  const request = new Request('https://example.test', {
    headers: { 'cf-connecting-ip': '203.0.113.77' },
  });
  assert.equal(getClientIp(request as any), '203.0.113.77');
  process.env.TRUST_PROXY_HEADERS = previousProxy;
  process.env.TRUST_CLOUDFLARE_CONNECTING_IP = previousCloudflare;
});
