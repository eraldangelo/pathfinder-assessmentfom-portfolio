export const PUBLIC_ENV_KEYS = ['NEXT_PUBLIC_TURNSTILE_SITE_KEY'] as const;

export type PublicEnvKey = (typeof PUBLIC_ENV_KEYS)[number];
