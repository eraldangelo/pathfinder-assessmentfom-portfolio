import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const CANONICAL_HOST =
  process.env.APP_CANONICAL_HOST?.trim() || 'assessment-form.example.com';

const buildCsp = () => {
  const base = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "object-src 'none'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline'",
    "connect-src 'self' https://challenges.cloudflare.com",
    "frame-src 'self' https://challenges.cloudflare.com",
  ];
  if (process.env.NODE_ENV === 'production') {
    return [...base, "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com"].join('; ');
  }
  return [...base, "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com"].join('; ');
};

const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy': buildCsp(),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'X-DNS-Prefetch-Control': 'off',
};

if (process.env.NODE_ENV === 'production') {
  SECURITY_HEADERS['Strict-Transport-Security'] = 'max-age=63072000; includeSubDomains; preload';
}

const applySecurityHeaders = (response: NextResponse) => {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
};

const shouldRedirectToCanonical = (request: NextRequest): boolean => {
  if (process.env.NODE_ENV !== 'production') return false;
  const forwardedHost = request.headers.get('x-forwarded-host')?.trim().toLowerCase();
  if (!forwardedHost) return false;
  if (!forwardedHost.endsWith('.run.app')) return false;
  return forwardedHost !== CANONICAL_HOST.toLowerCase();
};

export function proxy(request: NextRequest) {
  if (shouldRedirectToCanonical(request)) {
    const redirected = request.nextUrl.clone();
    redirected.hostname = CANONICAL_HOST;
    redirected.port = '';
    return applySecurityHeaders(NextResponse.redirect(redirected, 308));
  }
  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/:path*'],
};

