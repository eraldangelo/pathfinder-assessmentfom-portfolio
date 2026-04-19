'use client';

import { createContext, useContext, type ReactNode } from 'react';

import type { default as useAssessmentWizard } from '../../lib/assessment/useAssessmentWizard';

type WizardState = ReturnType<typeof useAssessmentWizard>;

type TurnstileState = {
  hasTurnstileKey: boolean;
  turnstileClientError: string | null;
  turnstileToken: string;
  canSubmitFinalStep: boolean;
  turnstileContainerRef: { current: HTMLDivElement | null };
};

type WizardContextValue = {
  wizard: WizardState;
  turnstile: TurnstileState;
};

const WizardContext = createContext<WizardContextValue | null>(null);

export const WizardContextProvider = ({
  children,
  value,
}: {
  children: ReactNode;
  value: WizardContextValue;
}) => <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;

export const useWizardContext = () => {
  const value = useContext(WizardContext);
  if (!value) throw new Error('useWizardContext must be used inside WizardContextProvider');
  return value;
};
