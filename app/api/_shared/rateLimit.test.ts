import test from 'node:test';
import assert from 'node:assert/strict';

import { enforceRateLimit } from './rateLimit';

test('enforceRateLimit blocks when max hits exceeded', async () => {
  const env = process.env as Record<string, string | undefined>;
  const previousNodeEnv = process.env.NODE_ENV;
  try {
    env.NODE_ENV = 'test';

    const request = new Request('https://example.test', {
      headers: { 'x-forwarded-for': '203.0.113.10' },
    });
    const options = { bucket: `unit-${Date.now()}`, maxHits: 2, windowMs: 60_000 };

    const first = await enforceRateLimit(request as any, options);
    const second = await enforceRateLimit(request as any, options);
    const third = await enforceRateLimit(request as any, options);

    assert.equal(first.blocked, false);
    assert.equal(second.blocked, false);
    assert.equal(third.blocked, true);
    if (third.blocked) {
      assert.equal(third.response.status, 429);
    }
  } finally {
    env.NODE_ENV = previousNodeEnv;
  }
});

test('enforceRateLimit falls back to local limiter when redis env is missing in production', async () => {
  const env = process.env as Record<string, string | undefined>;
  const previousNodeEnv = env.NODE_ENV;
  const previousRedisUrl = env.UPSTASH_REDIS_REST_URL;
  const previousRedisToken = env.UPSTASH_REDIS_REST_TOKEN;
  try {
    env.NODE_ENV = 'production';
    delete env.UPSTASH_REDIS_REST_URL;
    delete env.UPSTASH_REDIS_REST_TOKEN;

    const request = new Request('https://example.test', {
      headers: { 'x-forwarded-for': '203.0.113.11' },
    });
    const options = { bucket: `unit-prod-fallback-${Date.now()}`, maxHits: 2, windowMs: 60_000 };

    const first = await enforceRateLimit(request as any, options);
    const second = await enforceRateLimit(request as any, options);
    const third = await enforceRateLimit(request as any, options);

    assert.equal(first.blocked, false);
    assert.equal(second.blocked, false);
    assert.equal(third.blocked, true);
  } finally {
    env.NODE_ENV = previousNodeEnv;
    if (previousRedisUrl === undefined) delete env.UPSTASH_REDIS_REST_URL;
    else env.UPSTASH_REDIS_REST_URL = previousRedisUrl;
    if (previousRedisToken === undefined) delete env.UPSTASH_REDIS_REST_TOKEN;
    else env.UPSTASH_REDIS_REST_TOKEN = previousRedisToken;
  }
});
