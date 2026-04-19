import type { PublicEnvKey } from './publicEnvKeys';
import type { PublicRuntimeEnv } from './publicRuntimeEnv.server';

const BUILD_ENV: Record<PublicEnvKey, string> = {
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '',
};

const clean = (value: string | undefined) => (value || '').trim();

const runtimeEnv = (): PublicRuntimeEnv => {
  if (typeof window === 'undefined') return {};
  const meta = window.document.querySelector('meta[name="assessment-public-env"]');
  const raw = meta?.getAttribute('content');
  if (!raw) return {};
  try {
    const decoded = decodeURIComponent(raw);
    const parsed = JSON.parse(decoded) as PublicRuntimeEnv;
    return parsed || {};
  } catch {
    return {};
  }
};

export const getPublicEnv = (key: PublicEnvKey): string => {
  const built = clean(BUILD_ENV[key]);
  if (built) return built;
  return clean(runtimeEnv()[key]);
};
