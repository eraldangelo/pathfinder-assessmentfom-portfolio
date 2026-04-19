import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

import { getClientIp } from './clientIp';
import { assertRateLimitEnv } from '../../../lib/config/env.server';

type Entry = {
  count: number;
  resetAt: number;
};

type Options = {
  bucket: string;
  maxHits: number;
  windowMs: number;
};

const store = new Map<string, Entry>();
let redisClient: Redis | null | undefined;
let warnedMissingRedisConfig = false;
let warnedDistributedUnavailable = false;

const now = () => Date.now();
const warnMissingRedisConfigOnce = () => {
  if (warnedMissingRedisConfig || process.env.NODE_ENV !== 'production') return;
  warnedMissingRedisConfig = true;
  console.warn('UPSTASH_REDIS_REST_* not configured; using in-memory rate limiting fallback.');
};
const warnDistributedUnavailableOnce = (error: unknown) => {
  if (warnedDistributedUnavailable) return;
  warnedDistributedUnavailable = true;
  console.warn('Distributed rate limiter unavailable; falling back to in-memory limiter.', error);
};

const getLocalEntry = (key: string, windowMs: number): Entry => {
  const existing = store.get(key);
  const currentTime = now();
  if (!existing || existing.resetAt <= currentTime) {
    const fresh = { count: 0, resetAt: currentTime + windowMs };
    store.set(key, fresh);
    return fresh;
  }
  return existing;
};

const setHeaders = (response: NextResponse, maxHits: number, remaining: number, resetAt: number) => {
  response.headers.set('X-RateLimit-Limit', String(maxHits));
  response.headers.set('X-RateLimit-Remaining', String(Math.max(0, remaining)));
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));
};

const getRedisClient = () => {
  if (redisClient !== undefined) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    warnMissingRedisConfigOnce();
    redisClient = null;
    return redisClient;
  }
  redisClient = new Redis({ url, token });
  return redisClient;
};

const parseNumeric = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const touchDistributedCounter = async (key: string, windowMs: number): Promise<Entry | null> => {
  const client = getRedisClient();
  if (!client) return null;

  const pipeline = client.pipeline();
  pipeline.incr(key);
  pipeline.pttl(key);
  const [rawCount, rawTtl] = await pipeline.exec();
  const count = parseNumeric(rawCount);
  const ttl = parseNumeric(rawTtl);
  if (count === null) {
    throw new Error('Rate limit counter update failed.');
  }

  if (count === 1 || ttl === null || ttl < 0) {
    await client.pexpire(key, windowMs);
    return { count, resetAt: now() + windowMs };
  }

  return { count, resetAt: now() + ttl };
};

const touchLocalCounter = (key: string, windowMs: number): Entry => {
  if (store.size > 5000) {
    const currentTime = now();
    for (const [entryKey, entryValue] of store.entries()) {
      if (entryValue.resetAt <= currentTime) {
        store.delete(entryKey);
      }
    }
  }
  const entry = getLocalEntry(key, windowMs);
  entry.count += 1;
  return entry;
};

const buildLimitResponse = (options: Options, entry: Entry) => {
  const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now()) / 1000));
  const response = NextResponse.json(
    { ok: false, message: 'Too many requests. Please try again shortly.' },
    { status: 429 },
  );
  response.headers.set('Retry-After', String(retryAfterSeconds));
  setHeaders(response, options.maxHits, 0, entry.resetAt);
  return response;
};

export const enforceRateLimit = (
  request: NextRequest,
  options: Options,
): Promise<{ blocked: true; response: NextResponse } | { blocked: false }> => {
  try {
    assertRateLimitEnv();
  } catch (error) {
    console.error(error);
    return Promise.resolve({
      blocked: true,
      response: NextResponse.json(
        { ok: false, message: 'Rate limiter configuration error.' },
        { status: 500 },
      ),
    });
  }

  const ip = getClientIp(request);
  const key = `rate:${options.bucket}:${ip}`;
  return (async () => {
    try {
      const distributedEntry = await touchDistributedCounter(key, options.windowMs);
      if (distributedEntry) {
        if (distributedEntry.count > options.maxHits) {
          return { blocked: true, response: buildLimitResponse(options, distributedEntry) };
        }
        return { blocked: false };
      }
    } catch (error) {
      warnDistributedUnavailableOnce(error);
    }

    const localEntry = touchLocalCounter(key, options.windowMs);
    if (localEntry.count > options.maxHits) {
      return { blocked: true, response: buildLimitResponse(options, localEntry) };
    }
    return { blocked: false };
  })();
};
