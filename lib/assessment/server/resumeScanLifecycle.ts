export const RESUME_SCAN_QUEUE_COLLECTION = 'resumeScanQueue';
export const RESUME_QUARANTINE_PREFIX = 'assessment-resumes/quarantine/';
export const RESUME_CLEAN_PREFIX = 'assessment-resumes/clean/';
export const DEFAULT_RESUME_QUARANTINE_RETENTION_DAYS = 30;

export const RESUME_SCAN_STATUS = {
  pending: 'pending',
  cleanPromoted: 'clean_promoted',
  rejectedDeleted: 'rejected_deleted',
  expiredDeleted: 'expired_deleted',
  scanError: 'scan_error',
} as const;

export const getResumeQuarantineRetentionDays = () => {
  const raw = (process.env.RESUME_QUARANTINE_RETENTION_DAYS || '').trim();
  if (!raw) return DEFAULT_RESUME_QUARANTINE_RETENTION_DAYS;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return DEFAULT_RESUME_QUARANTINE_RETENTION_DAYS;
  return Math.min(365, Math.max(1, parsed));
};

export const buildResumeCleanPath = (quarantinePath: string) =>
  quarantinePath.startsWith(RESUME_QUARANTINE_PREFIX)
    ? `${RESUME_CLEAN_PREFIX}${quarantinePath.slice(RESUME_QUARANTINE_PREFIX.length)}`
    : `${RESUME_CLEAN_PREFIX}${quarantinePath.split('/').pop() || 'resume'}`;
