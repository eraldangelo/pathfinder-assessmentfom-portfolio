import type { WizardStep } from '../../lib/assessment/types';

type WizardFooterProps = {
  step: WizardStep;
  onBack: () => void;
  onReset: () => void;
  onNext: () => void;
  onSubmitIntent?: () => void;
  isSubmitting?: boolean;
  canProceed?: boolean;
};

export default function WizardFooter({
  step,
  onBack,
  onReset,
  onNext,
  onSubmitIntent,
  isSubmitting,
  canProceed = true,
}: WizardFooterProps) {
  const footerClass = 'flex items-center justify-between py-1.5';

  const isFinalStep = step === 6;

  return (
    <footer className={footerClass}>
      {step !== 1 ? (
        <div className="flex items-center gap-2">
          <button
            data-testid="wizard-back-button"
            type="button"
            className="glass-btn brand-yellow rounded-full h-11 w-11 p-0 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Back"
            title="Back"
            disabled={Boolean(isSubmitting)}
            onClick={onBack}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <button
            data-testid="wizard-reset-button"
            type="button"
            className="glass-btn brand-red rounded-full h-11 w-11 p-0 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Restart"
            title="Restart"
            disabled={Boolean(isSubmitting)}
            onClick={onReset}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M1 4v6h6" />
              <path d="M3.51 15a9 9 0 1 0 .49-5H1" />
            </svg>
          </button>
        </div>
      ) : (
        <span />
      )}

      {isFinalStep ? (
        <button
          data-testid="wizard-submit-button"
          type="submit"
          form="assessment-form"
          className="glass-btn brand-green rounded-full h-11 w-11 p-0 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={isSubmitting ? 'Submitting' : 'Submit'}
          aria-controls="assessment-form"
          title={isSubmitting ? 'Submitting...' : 'Submit'}
          disabled={isSubmitting || !canProceed}
          onClick={onSubmitIntent}
        >
          {isSubmitting ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 animate-spin"
            >
              <circle cx="12" cy="12" r="8" className="opacity-25" />
              <path d="M20 12a8 8 0 0 0-8-8" className="opacity-90" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          )}
        </button>
      ) : (
        <button
          data-testid="wizard-next-button"
          type="button"
          className="glass-btn brand-blue rounded-full h-11 w-11 p-0 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next"
          aria-controls="assessment-form"
          title="Next"
          disabled={!canProceed}
          onClick={onNext}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      )}
    </footer>
  );
}

