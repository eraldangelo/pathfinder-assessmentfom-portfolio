const parseBoolean = (value: string | undefined, defaultValue: boolean) => {
  const normalized = (value || '').trim().toLowerCase();
  if (!normalized) return defaultValue;
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return defaultValue;
};

export const isLegacyBroadFallbackEnabled = () =>
  parseBoolean(process.env.ASSESSMENT_ENABLE_LEGACY_FALLBACKS, true);

export const shouldLogIndexedPrecheckMode = () =>
  parseBoolean(process.env.ASSESSMENT_LOG_INDEXED_PRECHECKS, false);
