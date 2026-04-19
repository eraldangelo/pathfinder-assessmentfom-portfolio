import { PUBLIC_ENV_KEYS, type PublicEnvKey } from './publicEnvKeys';

export type PublicRuntimeEnv = Partial<Record<PublicEnvKey, string>>;

const clean = (value: string | undefined) => (value || '').trim();

export const getPublicRuntimeEnv = (): PublicRuntimeEnv => {
  const result: PublicRuntimeEnv = {};
  for (const key of PUBLIC_ENV_KEYS) {
    const value = clean(process.env[key]);
    if (value) result[key] = value;
  }
  return result;
};
