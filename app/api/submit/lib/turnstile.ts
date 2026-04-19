import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getClientIp } from '../../_shared/clientIp';
import { safeFetch } from '../../_shared/safeFetch';
import { TURNSTILE_SECRET_PLACEHOLDER } from '../../../../lib/config/envPlaceholders';

const parseErrorCodes = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TURNSTILE_ALLOWED_HOSTS = ['challenges.cloudflare.com'];
const DEFAULT_ACTION = 'assessment_submit';

const readExpectedHostnames = () => {
  const explicit = (process.env.TURNSTILE_EXPECTED_HOSTNAMES || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  if (explicit.length > 0) return explicit;
  const canonical = (process.env.APP_CANONICAL_HOST || '').trim().toLowerCase();
  if (canonical && process.env.NODE_ENV === 'production') return [canonical];
  return [];
};

export const verifyTurnstileToken = async (
  request: NextRequest,
  token: string,
): Promise<NextResponse | null> => {
  if (process.env.NODE_ENV === 'test' && process.env.TURNSTILE_TEST_BYPASS === 'true') {
    return null;
  }

  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY?.trim();
  const expectedAction = (process.env.TURNSTILE_EXPECTED_ACTION || DEFAULT_ACTION).trim();
  const expectedHostnames = readExpectedHostnames();

  if (!turnstileSecret || turnstileSecret === TURNSTILE_SECRET_PLACEHOLDER) {
    console.error('[turnstile] TURNSTILE_SECRET_KEY is not set.');
    return NextResponse.json(
      { ok: false, message: 'Captcha server configuration error.' },
      { status: 500 },
    );
  }

  const verificationParams = new URLSearchParams({
    secret: turnstileSecret,
    response: token.trim(),
  });

  const clientIp = getClientIp(request);
  if (clientIp && clientIp !== '127.0.0.1') {
    verificationParams.set('remoteip', clientIp);
  }

  const verifyResponse = await safeFetch(
    {
      url: TURNSTILE_VERIFY_URL,
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: verificationParams,
      signal: AbortSignal.timeout(10_000),
    },
    TURNSTILE_ALLOWED_HOSTS,
  );

  const verification = (await verifyResponse.json()) as {
    success?: boolean;
    hostname?: unknown;
    action?: unknown;
    ['error-codes']?: unknown;
  };

  const verificationHostname = typeof verification.hostname === 'string' ? verification.hostname.toLowerCase() : null;
  const verificationAction = typeof verification.action === 'string' ? verification.action : null;
  const hasHostnameMismatch = expectedHostnames.length > 0
    && (!verificationHostname || !expectedHostnames.includes(verificationHostname));
  const hasActionMismatch = !!expectedAction && !!verificationAction && verificationAction !== expectedAction;

  if (verification.success && !hasHostnameMismatch && !hasActionMismatch) {
    return null;
  }

  const errorCodes = parseErrorCodes(verification['error-codes']);
  console.warn('[turnstile] Verification failed', {
    errorCodes,
    hostname: verificationHostname,
    action: verificationAction,
    expectedHostnames,
    expectedAction,
    hasClientIp: Boolean(clientIp),
  });

  if (hasHostnameMismatch || hasActionMismatch) {
    return NextResponse.json({ ok: false, message: 'Captcha verification context mismatch.' }, { status: 403 });
  }

  if (errorCodes.includes('invalid-input-secret') || errorCodes.includes('missing-input-secret')) {
    return NextResponse.json(
      { ok: false, message: 'Captcha server configuration error.' },
      { status: 500 },
    );
  }

  if (errorCodes.includes('timeout-or-duplicate')) {
    return NextResponse.json({ ok: false, message: 'Captcha expired. Please retry.' }, { status: 403 });
  }

  return NextResponse.json({ ok: false, message: 'Captcha verification failed.' }, { status: 403 });
};
