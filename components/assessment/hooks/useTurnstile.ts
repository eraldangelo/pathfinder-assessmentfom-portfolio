'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useRef, useState } from 'react';

import type { WizardStep } from '../../../lib/assessment/types';
import { getPublicEnv } from '../../../lib/config/publicClientEnv';
import { TURNSTILE_SITE_KEY_PLACEHOLDER } from '../../../lib/config/envPlaceholders';

type TurnstileWidgetId = string | number;

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      theme?: 'auto' | 'light' | 'dark';
      'response-field'?: boolean;
      callback?: (token: string) => void;
      action?: string;
      'expired-callback'?: () => void;
      'error-callback'?: (errorCode?: string) => void;
    },
  ) => TurnstileWidgetId;
  remove: (widgetId: TurnstileWidgetId) => void;
  reset?: (widgetId: TurnstileWidgetId) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type UseTurnstileArgs = {
  step: WizardStep;
  statusMessage: string | null;
};

const TURNSTILE_ACTION = 'assessment_submit';

export default function useTurnstile({ step, statusMessage }: UseTurnstileArgs) {
  const [scriptReady, setScriptReady] = useState(false);
  const [turnstileClientError, setTurnstileClientError] = useState<string | null>(null);
  const [turnstileVerified, setTurnstileVerified] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetIdRef = useRef<TurnstileWidgetId | null>(null);
  const turnstileSiteKey = getPublicEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY');
  const hasTurnstileKey = Boolean(turnstileSiteKey && turnstileSiteKey !== TURNSTILE_SITE_KEY_PLACEHOLDER);

  useEffect(() => {
    if (step !== 6) {
      if (turnstileWidgetIdRef.current !== null && typeof window !== 'undefined' && window.turnstile) {
        window.turnstile.remove(turnstileWidgetIdRef.current);
        turnstileWidgetIdRef.current = null;
      }
      setTurnstileVerified(false);
      setTurnstileToken('');
      return;
    }

    if (
      !scriptReady
      || !hasTurnstileKey
      || !turnstileSiteKey
      || !turnstileContainerRef.current
      || typeof window === 'undefined'
      || !window.turnstile
      || turnstileWidgetIdRef.current !== null
    ) {
      return;
    }

    turnstileWidgetIdRef.current = window.turnstile.render(turnstileContainerRef.current, {
      sitekey: turnstileSiteKey,
      theme: 'light',
      action: TURNSTILE_ACTION,
      'response-field': false,
      callback: (token: string) => {
        if (token && token.trim().length > 0) {
          setTurnstileToken(token.trim());
          setTurnstileVerified(true);
          setTurnstileClientError(null);
        }
      },
      'expired-callback': () => {
        setTurnstileToken('');
        setTurnstileVerified(false);
        setTurnstileClientError('Captcha expired. Please retry.');
      },
      'error-callback': (errorCode?: string) => {
        setTurnstileToken('');
        setTurnstileVerified(false);
        if (errorCode?.startsWith('110200')) {
          setTurnstileClientError(
            'Turnstile domain is not authorized for this site key. Add localhost to allowed hostnames in Cloudflare.',
          );
          return;
        }
        setTurnstileClientError(`Turnstile failed to load (${errorCode ?? 'unknown error'}).`);
      },
    });
  }, [step, scriptReady, turnstileSiteKey, hasTurnstileKey]);

  useEffect(() => {
    if (step !== 6 || !statusMessage || !/captcha/i.test(statusMessage)) {
      return;
    }
    setTurnstileToken('');
    setTurnstileVerified(false);
    if (typeof window !== 'undefined' && window.turnstile && turnstileWidgetIdRef.current !== null) {
      window.turnstile.reset?.(turnstileWidgetIdRef.current);
    }
  }, [statusMessage, step]);

  const canSubmitFinalStep = step !== 6
    || (hasTurnstileKey && turnstileVerified && turnstileToken.length > 0 && !turnstileClientError);

  return {
    hasTurnstileKey,
    turnstileClientError,
    turnstileToken,
    turnstileContainerRef,
    canSubmitFinalStep,
    markTurnstileScriptReady: () => setScriptReady(true),
  };
}
