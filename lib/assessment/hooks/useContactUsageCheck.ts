'use client';

import { useCallback, useEffect, useState } from 'react';

import { normalizePhilippineMobile } from '../utils/contact';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const retryableStatuses = new Set([429, 502, 503, 504]);

type UseContactUsageCheckArgs = {
  step: number;
  emailAddress: string;
  mobileNumber: string;
};

type ContactUsagePayload = {
  emailAddress: string;
  mobileNumber: string;
};

type ContactUsageResult = {
  ok: true;
  emailInUse: boolean;
  mobileInUse: boolean;
} | {
  ok: false;
  message: string;
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const buildPayload = (emailAddress: string, mobileNumber: string): ContactUsagePayload | null => {
  const emailInput = emailAddress.trim();
  const mobileInput = mobileNumber.trim();
  const shouldCheckEmail = emailPattern.test(emailInput);
  const shouldCheckMobile = normalizePhilippineMobile(mobileInput).length === 10;

  if (!shouldCheckEmail && !shouldCheckMobile) return null;
  return {
    emailAddress: shouldCheckEmail ? emailInput : '',
    mobileNumber: shouldCheckMobile ? mobileInput : '',
  };
};

const checkContactUsage = async (
  payload: ContactUsagePayload,
  signal: AbortSignal,
): Promise<ContactUsageResult> => {
  const maxAttempts = 2;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch('/api/check-contact-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal,
      });
      const data = await response.json().catch(() => null);
      if (response.ok && data?.ok) {
        return {
          ok: true,
          emailInUse: Boolean(data?.emailInUse),
          mobileInUse: Boolean(data?.mobileInUse),
        };
      }

      const message = data?.message ?? 'Contact usage check failed.';
      if (attempt < maxAttempts && retryableStatuses.has(response.status)) {
        await wait(250);
        continue;
      }
      return { ok: false, message };
    } catch (error) {
      if (signal.aborted) {
        throw error;
      }
      if (attempt < maxAttempts) {
        await wait(250);
        continue;
      }
      return { ok: false, message: 'Contact usage check failed.' };
    }
  }
  return { ok: false, message: 'Contact usage check failed.' };
};

export default function useContactUsageCheck({
  step,
  emailAddress,
  mobileNumber,
}: UseContactUsageCheckArgs) {
  const [isCheckingContactUsage, setIsCheckingContactUsage] = useState(false);
  const [emailAlreadyUsed, setEmailAlreadyUsed] = useState(false);
  const [mobileAlreadyUsed, setMobileAlreadyUsed] = useState(false);
  const [contactUsageError, setContactUsageError] = useState<string | null>(null);

  const resetContactUsage = useCallback(() => {
    setIsCheckingContactUsage(false);
    setEmailAlreadyUsed(false);
    setMobileAlreadyUsed(false);
    setContactUsageError(null);
  }, []);

  const runContactUsageCheck = useCallback(async () => {
    if (step !== 2) return false;
    const payload = buildPayload(emailAddress, mobileNumber);
    if (!payload) {
      resetContactUsage();
      return false;
    }

    const controller = new AbortController();
    setIsCheckingContactUsage(true);
    setContactUsageError(null);

    try {
      const result = await checkContactUsage(payload, controller.signal);
      if (!result.ok) {
        setEmailAlreadyUsed(false);
        setMobileAlreadyUsed(false);
        setContactUsageError(result.message);
        return false;
      }
      setEmailAlreadyUsed(result.emailInUse);
      setMobileAlreadyUsed(result.mobileInUse);
      setContactUsageError(null);
      return true;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Contact usage precheck unavailable.', error);
      }
      setEmailAlreadyUsed(false);
      setMobileAlreadyUsed(false);
      setContactUsageError('Contact usage check failed.');
      return false;
    } finally {
      setIsCheckingContactUsage(false);
    }
  }, [emailAddress, mobileNumber, resetContactUsage, step]);

  useEffect(() => {
    if (step !== 2) {
      resetContactUsage();
      return;
    }

    const payload = buildPayload(emailAddress, mobileNumber);
    if (!payload) {
      resetContactUsage();
      return;
    }

    let isCancelled = false;
    const controller = new AbortController();
    setIsCheckingContactUsage(true);
    setContactUsageError(null);

    const timeout = setTimeout(async () => {
      try {
        const result = await checkContactUsage(payload, controller.signal);
        if (!result.ok) {
          if (!isCancelled) {
            setEmailAlreadyUsed(false);
            setMobileAlreadyUsed(false);
            setContactUsageError(result.message);
          }
          return;
        }
        if (!isCancelled) {
          setEmailAlreadyUsed(result.emailInUse);
          setMobileAlreadyUsed(result.mobileInUse);
          setContactUsageError(null);
        }
      } catch (err) {
        if (!controller.signal.aborted && !isCancelled) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('Contact usage precheck unavailable.', err);
          }
          setEmailAlreadyUsed(false);
          setMobileAlreadyUsed(false);
          setContactUsageError('Contact usage check failed.');
        }
      } finally {
        if (!isCancelled) {
          setIsCheckingContactUsage(false);
        }
      }
    }, 350);

    return () => {
      isCancelled = true;
      controller.abort();
      clearTimeout(timeout);
    };
  }, [emailAddress, mobileNumber, resetContactUsage, step]);

  return {
    isCheckingContactUsage,
    emailAlreadyUsed,
    mobileAlreadyUsed,
    contactUsageError,
    retryContactUsageCheck: runContactUsageCheck,
    resetContactUsage,
  };
}
