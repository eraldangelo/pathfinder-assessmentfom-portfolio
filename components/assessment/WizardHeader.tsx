import type { WizardStep } from '../../lib/assessment/types';

type WizardHeaderProps = {
  step: WizardStep;
};

const titles: Record<WizardStep, string> = {
  1: 'Assessment Form',
  2: 'Your Personal Details',
  3: 'Education and Work Background',
  4: 'Study Destination',
  5: 'Consultation Method',
  6: 'How did you hear about us?',
};

const subtitles: Partial<Record<WizardStep, string>> = {
  1: 'Answer a few quick questions so we can guide you to the best study options and next steps.',
};

export default function WizardHeader({ step }: WizardHeaderProps) {
  const progressValue = Math.round((step / 6) * 100);

  return (
    <header className="space-y-2 text-center">
      <div
        className="sr-only"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressValue}
        aria-label="Assessment progress"
      />
      <h1 className={`font-heading font-semibold text-[#004097] ${step === 1 ? 'text-xl' : 'text-base text-left'}`}>
        {titles[step]}
      </h1>
      {subtitles[step] ? <p className="text-sm text-slate-600">{subtitles[step]}</p> : null}
    </header>
  );
}

