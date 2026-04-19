'use client';

import { useState } from 'react';
import Script from 'next/script';

import useAssessmentWizard from '../../lib/assessment/useAssessmentWizard';
import useTurnstile from './hooks/useTurnstile';
import DuplicateSubmissionModal from './DuplicateSubmissionModal';
import PrivacyNoticeModal from './PrivacyNoticeModal';
import ThankYouModal from './ThankYouModal';
import WizardFormBody from './WizardFormBody';
import WizardFooter from './WizardFooter';
import WizardHeader from './WizardHeader';
import { WizardContextProvider } from './WizardContext';

export default function AssessmentWizard() {
  const [hasAcceptedPrivacy, setHasAcceptedPrivacy] = useState(false);
  const wizard = useAssessmentWizard();
  const {
    step,
    cardHeight,
    cardContentRef,
    statusMessage,
    statusKind,
    handleSubmit,
    handleBack,
    handleReset,
    handleNext,
    handleSubmitIntent,
    isSubmitting,
    isStepValid,
    isThankYouModalOpen,
    handleAnotherResponse,
    isDuplicateModalOpen,
    duplicateBranch,
    handleDuplicateModalClose,
  } = wizard;
  const turnstile = useTurnstile({ step, statusMessage });
  const canProceed = isStepValid && turnstile.canSubmitFinalStep;
  const isPrivacyNoticeOpen = step === 1 && !hasAcceptedPrivacy;

  return (
    <WizardContextProvider
      value={{
        wizard,
        turnstile: {
          hasTurnstileKey: turnstile.hasTurnstileKey,
          turnstileClientError: turnstile.turnstileClientError,
          turnstileToken: turnstile.turnstileToken,
          canSubmitFinalStep: turnstile.canSubmitFinalStep,
          turnstileContainerRef: turnstile.turnstileContainerRef,
        },
      }}
    >
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        async
        defer
        onLoad={turnstile.markTurnstileScriptReady}
        onReady={turnstile.markTurnstileScriptReady}
      />
      <div className="card-cover">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/assessment-cover-generic.svg"
          alt="Cover photo"
        />
      </div>
      <section
        className="glass-card wizard-card rounded-2xl overflow-hidden overflow-y-auto transition-[height] duration-300 ease-in-out"
        style={cardHeight ? { height: `${cardHeight}px` } : undefined}
      >
        <div
          ref={cardContentRef}
          className={
            step === 1
              ? 'px-8 pt-8 pb-5 space-y-6 transition-[padding] duration-300 ease-in-out'
              : 'px-8 pt-5 pb-5 space-y-5 transition-[padding] duration-300 ease-in-out'
          }
        >
          <WizardHeader step={step} />

          <form id="assessment-form" className="space-y-5" onSubmit={handleSubmit}>
            <WizardFormBody />
          </form>

          {statusMessage ? (
            <p
              className={`text-sm ${statusKind === 'error' ? 'text-red-700' : 'text-emerald-700'}`}
              role="alert"
            >
              {statusMessage}
            </p>
          ) : null}
        </div>
      </section>

      <div className="mt-3 px-8">
        <WizardFooter
          step={step}
          onBack={handleBack}
          onReset={handleReset}
          onNext={handleNext}
          onSubmitIntent={handleSubmitIntent}
          isSubmitting={isSubmitting}
          canProceed={canProceed}
        />
      </div>

      <ThankYouModal open={isThankYouModalOpen} onClose={handleAnotherResponse} />

      <DuplicateSubmissionModal
        open={isDuplicateModalOpen}
        branch={duplicateBranch}
        onClose={handleDuplicateModalClose}
      />

      <PrivacyNoticeModal open={isPrivacyNoticeOpen} onAgree={() => setHasAcceptedPrivacy(true)} />
    </WizardContextProvider>
  );
}

