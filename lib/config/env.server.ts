import { z } from 'zod';

import { TURNSTILE_SECRET_PLACEHOLDER, TURNSTILE_SITE_KEY_PLACEHOLDER } from './envPlaceholders';

const asTrimmed = (value: string | undefined) => (value || '').trim();

const submitEnvSchema = z.object({
  TURNSTILE_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1),
  TURNSTILE_EXPECTED_HOSTNAMES: z.string().optional().default(''),
  TURNSTILE_EXPECTED_ACTION: z.string().optional().default('assessment_submit'),
});

let submitEnvValidated = false;
let rateLimitEnvValidated = false;

export const assertSubmitEnv = () => {
  if (submitEnvValidated) return;
  const parsed = submitEnvSchema.safeParse({
    TURNSTILE_SECRET_KEY: asTrimmed(process.env.TURNSTILE_SECRET_KEY),
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: asTrimmed(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY),
    TURNSTILE_EXPECTED_HOSTNAMES: asTrimmed(process.env.TURNSTILE_EXPECTED_HOSTNAMES),
    TURNSTILE_EXPECTED_ACTION: asTrimmed(process.env.TURNSTILE_EXPECTED_ACTION),
  });

  if (!parsed.success) {
    throw new Error('Missing required submit environment configuration.');
  }

  if (parsed.data.TURNSTILE_SECRET_KEY === TURNSTILE_SECRET_PLACEHOLDER) {
    throw new Error('TURNSTILE_SECRET_KEY is still using placeholder value.');
  }
  if (parsed.data.NEXT_PUBLIC_TURNSTILE_SITE_KEY === TURNSTILE_SITE_KEY_PLACEHOLDER) {
    throw new Error('NEXT_PUBLIC_TURNSTILE_SITE_KEY is still using placeholder value.');
  }
  submitEnvValidated = true;
};

export const assertRateLimitEnv = () => {
  if (rateLimitEnvValidated || process.env.NODE_ENV === 'test') return;
  if (process.env.NODE_ENV !== 'production') {
    rateLimitEnvValidated = true;
    return;
  }
  const url = asTrimmed(process.env.UPSTASH_REDIS_REST_URL);
  const token = asTrimmed(process.env.UPSTASH_REDIS_REST_TOKEN);
  if (!url && !token) {
    rateLimitEnvValidated = true;
    return;
  }
  if (!url || !token) {
    throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be configured together.');
  }
  rateLimitEnvValidated = true;
};
