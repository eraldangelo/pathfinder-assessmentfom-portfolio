'use client';
import { useEffect, useRef, useState } from 'react';
type PrivacyNoticeModalProps = { open: boolean; onAgree: () => void };
export default function PrivacyNoticeModal({ open, onAgree }: PrivacyNoticeModalProps) {
  const [view, setView] = useState<'notice' | 'policy'>('notice');
  const [isSwitching, setIsSwitching] = useState(false);
  const switchTimerRef = useRef<number | null>(null);
  const switchRafRef = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (switchTimerRef.current) window.clearTimeout(switchTimerRef.current);
      if (switchRafRef.current) window.cancelAnimationFrame(switchRafRef.current);
    };
  }, []);
  const handleAgree = () => {
    if (switchTimerRef.current) window.clearTimeout(switchTimerRef.current);
    if (switchRafRef.current) window.cancelAnimationFrame(switchRafRef.current);
    setIsSwitching(false);
    setView('notice');
    onAgree();
  };
  const handleViewChange = (nextView: 'notice' | 'policy') => {
    if (nextView === view || isSwitching) return;
    setIsSwitching(true);
    if (switchTimerRef.current) window.clearTimeout(switchTimerRef.current);
    if (switchRafRef.current) window.cancelAnimationFrame(switchRafRef.current);
    switchTimerRef.current = window.setTimeout(() => {
      setView(nextView);
      switchRafRef.current = window.requestAnimationFrame(() => setIsSwitching(false));
    }, 160);
  };
  return (
    <div
      className={[
        'fixed inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-md p-4 transition-opacity duration-200',
        open ? 'opacity-100' : 'opacity-0 pointer-events-none',
      ].join(' ')}
      style={open ? { animation: 'privacyOverlayIn 180ms ease-out both' } : undefined}
      role="dialog"
      aria-modal="true"
      aria-label="Privacy notice and consent"
      aria-hidden={!open}
    >
      <div
        className={[
          'glass-card glass-modal w-full max-w-2xl rounded-2xl p-5 sm:p-7 space-y-4 transition-all duration-200',
          open ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-[0.98] translate-y-2',
        ].join(' ')}
        style={open ? { animation: 'privacyCardIn 240ms cubic-bezier(0.16, 1, 0.3, 1) both' } : undefined}
      >
        <div
          className={[
            'transition-all duration-200',
            isSwitching ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0',
          ].join(' ')}
        >
          {view === 'notice' ? (
            <>
            <div className="grid gap-4 sm:grid-cols-[auto,1fr] sm:gap-x-6 sm:gap-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/assessment-illustration-generic.svg"
                alt="Assessment illustration"
                className="hidden sm:block w-32 h-32 object-contain shrink-0 mx-auto sm:mx-0 sm:row-span-2 sm:self-center"
                loading="eager"
              />
              <header className="space-y-1 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/assessment-illustration-generic.svg"
                  alt="Assessment illustration"
                  className="sm:hidden w-24 h-24 object-contain mx-auto"
                  loading="eager"
                />
                <h2 className="font-heading text-[1.02rem] sm:text-xl font-semibold text-[#004097]">
                  Before You Continue
                </h2>
                <p className="text-[0.72rem] sm:text-sm text-slate-500">
                  Please review this privacy notice and consent.
                </p>
              </header>
              <div className="space-y-3 text-[0.78rem] sm:text-sm text-slate-700 max-h-[60dvh] sm:max-h-[38dvh] overflow-y-auto pr-1 sm:col-start-2">
                <p>
                  This form collects <span className="font-semibold">personal details</span> (such as your name, mobile number, email, date of
                  birth, education/work background, and study preferences) so <span className="font-semibold">our team</span> can{' '}
                  <span className="font-semibold">assess your inquiry</span> and assist you with next steps.
                </p>
                <p>
                  By continuing, you <span className="font-semibold">consent</span> to be contacted by{' '}
                  <span className="font-semibold">our team</span> via <span className="font-semibold">SMS and email</span> about your
                  submission and related services, typically within <span className="font-semibold">24-48 hours</span> after you submit the form.
                </p>
                <p>
                  We comply with the <span className="font-semibold">Data Privacy Act of 2012 (Republic Act No. 10173)</span>. You may request{' '}
                  <span className="font-semibold">access</span> to, <span className="font-semibold">correction</span> of, or{' '}
                  <span className="font-semibold">deletion</span> of your personal information by contacting us at{' '}
                  <a className="font-semibold text-[#004097] underline" href="mailto:privacy@example.com">
                    privacy@example.com
                  </a>
                  .
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end pt-2 sm:pt-4">
              <button
                type="button"
                className="glass-btn gray rounded-xl px-4 py-2 font-semibold w-full sm:w-auto"
                onClick={() => handleViewChange('policy')}
              >
                Privacy Policy
              </button>
              <button
                type="button"
                className="glass-btn brand-blue rounded-xl px-4 py-2 font-semibold w-full sm:w-auto"
                onClick={handleAgree}
              >
                I Agree &amp; Continue
              </button>
            </div>
            </>
          ) : (
            <>
            <div className="grid gap-4 sm:grid-cols-[auto,1fr] sm:gap-x-6 sm:gap-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/assessment-illustration-generic.svg"
                alt="Assessment illustration"
                className="hidden sm:block w-32 h-32 object-contain shrink-0 mx-auto sm:mx-0 sm:row-span-2 sm:self-center"
                loading="eager"
              />
              <header className="space-y-1 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/assessment-illustration-generic.svg"
                  alt="Assessment illustration"
                  className="sm:hidden w-24 h-24 object-contain mx-auto"
                  loading="eager"
                />
                <h2 className="font-heading text-[1.02rem] sm:text-xl font-semibold text-[#004097]">
                  Privacy Policy
                </h2>
                <p className="text-[0.72rem] sm:text-sm text-slate-500">
                  Last updated: April 19, 2026
                </p>
              </header>
              <div className="space-y-3 text-[0.75rem] sm:text-sm text-slate-700 max-h-[60dvh] sm:max-h-[46dvh] overflow-y-auto pr-1 sm:col-start-2">
              <p>
                <span className="font-semibold">Portfolio Demo Team</span> (we, us, or our) respects your privacy. This Privacy
                Policy explains how we <span className="font-semibold">collect, use, store, and share personal information</span> when you use
                our assessment form and related services. We comply with the{' '}
                <span className="font-semibold">Data Privacy Act of 2012 (Republic Act No. 10173)</span> and its implementing rules and
                regulations.
              </p>
              <p>
                <span className="font-semibold">Company details:</span> Portfolio Demo Team, Philippines.{' '}
                <span className="font-semibold">Privacy contact:</span>{' '}
                <span className="font-semibold">privacy@example.com</span>.
              </p>
              <p className="font-semibold text-slate-800">Information we collect</p>
              <p>
                <span className="font-semibold">Information submitted through the assessment form:</span> name, mobile number, email address,
                date of birth, passport-holder status, education and work background, visa refusal information (if applicable), study
                destination preferences, preferred course(s) of study, planned study start date, consultation method, preferred date and time
                (as applicable), <span className="font-semibold">resume/CV (file upload)</span>, and referral and branch-related details (where
                applicable).
              </p>
              <p>
                <span className="font-semibold">Additional documents and details during the application process (if you proceed):</span>
                passports, employment certificates, birth certificates, marriage certificates, school transcripts and diplomas, and family
                details and supporting documents for dependents.
              </p>
              <p className="font-semibold text-slate-800">How we use your information</p>
              <p>
                We use your information to <span className="font-semibold">process and evaluate your inquiry</span>,{' '}
                <span className="font-semibold">contact you via SMS and email</span> regarding your submission, schedule consultations, support
                applications to schools/university partners, and assist with <span className="font-semibold">visa applications</span>,{' '}
                <span className="font-semibold">visa extensions</span>, and future related services (including subsequent applications for
                dependents).
              </p>
              <p className="font-semibold text-slate-800">How we share your information</p>
              <p>
                We share information only as needed with relevant <span className="font-semibold">our branches</span> and with{' '}
                <span className="font-semibold">school and university partners</span> to support your inquiry or application.{' '}
                <span className="font-semibold">We do not sell your personal information.</span>
              </p>
              <p className="font-semibold text-slate-800">Storage and security</p>
              <p>
                We store form data in <span className="font-semibold">Firestore Database</span> and uploaded files in{' '}
                <span className="font-semibold">Firebase Storage</span>. We take <span className="font-semibold">reasonable measures</span> to
                protect your information, but no method of transmission or storage is completely secure.
              </p>
              <p className="font-semibold text-slate-800">Retention</p>
              <p>
                We retain information <span className="font-semibold">as long as necessary</span> to provide services, assist with{' '}
                <span className="font-semibold">visa extensions</span>, or support <span className="font-semibold">subsequent applications for
                dependents</span>, and to meet applicable requirements.
              </p>
              <p className="font-semibold text-slate-800">Your rights</p>
              <p>
                You may request <span className="font-semibold">access</span> to, <span className="font-semibold">correction</span> of
                (modification), or <span className="font-semibold">deletion</span> of your personal information, and you may{' '}
                <span className="font-semibold">withdraw your consent</span> by contacting{' '}
                <span className="font-semibold">privacy@example.com</span>.
              </p>
              <p className="font-semibold text-slate-800">Communications</p>
              <p>
                If you submit the assessment form, we may contact you via <span className="font-semibold">SMS and email</span> about your
                submission and related services. You can <span className="font-semibold">stop receiving communications</span> by contacting{' '}
                <span className="font-semibold">privacy@example.com</span>.
              </p>
              <p className="font-semibold text-slate-800">Cookies and analytics</p>
              <p>
                We <span className="font-semibold">do not use analytics or cookies</span> for tracking purposes on the assessment form
                experience.
              </p>
              <p className="font-semibold text-slate-800">Changes to this policy</p>
              <p>
                We may update this policy from time to time. We will update the <span className="font-semibold">Last updated</span> date at
                the top when changes are made.
              </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end pt-2 sm:pt-4">
              <button
                type="button"
                className="glass-btn gray rounded-xl px-4 py-2 font-semibold w-full sm:w-auto"
                onClick={() => handleViewChange('notice')}
              >
                Back to Notice
              </button>
              <button
                type="button"
                className="glass-btn brand-blue rounded-xl px-4 py-2 font-semibold w-full sm:w-auto"
                onClick={handleAgree}
              >
                I Agree &amp; Continue
              </button>
            </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}

