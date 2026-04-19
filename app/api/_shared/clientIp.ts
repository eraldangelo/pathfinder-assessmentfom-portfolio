import type { NextRequest } from 'next/server';
import { isIP } from 'node:net';

const normalize = (value: string | null | undefined): string => (value || '').trim();

const pickFirstValidIp = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .find((item) => Boolean(item) && isIP(item) !== 0);

const shouldTrustProxyHeaders = () => {
  const explicit = normalize(process.env.TRUST_PROXY_HEADERS).toLowerCase();
  if (explicit === 'true') return true;
  if (explicit === 'false') return false;
  return process.env.NODE_ENV === 'production';
};

const shouldTrustCloudflareConnectingIp = () => {
  const explicit = normalize(process.env.TRUST_CLOUDFLARE_CONNECTING_IP).toLowerCase();
  return explicit === 'true';
};

export const getClientIp = (request: NextRequest): string => {
  if (shouldTrustProxyHeaders()) {
    const forwarded = normalize(request.headers.get('x-forwarded-for'));
    if (forwarded) {
      const first = pickFirstValidIp(forwarded);
      if (first) return first;
    }

    const realIp = normalize(request.headers.get('x-real-ip'));
    if (realIp && isIP(realIp) !== 0) return realIp;
  }

  if (shouldTrustCloudflareConnectingIp()) {
    const fallback = normalize(request.headers.get('cf-connecting-ip'));
    if (fallback && isIP(fallback) !== 0) return fallback;
  }

  return '127.0.0.1';
};
