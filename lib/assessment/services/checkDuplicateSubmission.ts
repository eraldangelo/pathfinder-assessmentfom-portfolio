export type DuplicateSubmissionResult = {
  exists: boolean;
  branch: string | null;
};

const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const checkDuplicateSubmission = async (
  fullName: string,
  dateOfBirth: string,
): Promise<DuplicateSubmissionResult> => {
  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch('/api/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          dateOfBirth,
        }),
      });

      const data = await response.json().catch(() => null);
      if (response.ok && data?.ok) {
        return {
          exists: Boolean(data?.exists),
          branch: typeof data?.branch === 'string' ? data.branch : null,
        };
      }

      const errorMessage = data?.message ?? 'Duplicate check failed.';
      if (attempt < maxAttempts && RETRYABLE_STATUSES.has(response.status)) {
        await wait(250);
        continue;
      }
      throw new Error(errorMessage);
    } catch (error) {
      if (attempt < maxAttempts) {
        await wait(250);
        continue;
      }
      if (error instanceof Error) throw error;
      throw new Error('Duplicate check failed.');
    }
  }

  throw new Error('Duplicate check failed.');
};
