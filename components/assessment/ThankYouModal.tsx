'use client';

import { useEffect } from 'react';
import { allBranchContacts, formatPhoneHref } from '../../lib/assessment/constants';

type ThankYouModalProps = {
  open: boolean;
  onClose: () => void;
};


function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-[#ffd032]"
      aria-hidden="true"
    >
      <path d="M4 4h16v16H4z" />
      <path d="M22 6l-10 7L2 6" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-[#ffd032]"
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.86 19.86 0 0 1 3 5.18 2 2 0 0 1 5.11 3h3a2 2 0 0 1 2 1.72c.12.86.3 1.7.54 2.51a2 2 0 0 1-.45 2.11L9.09 10.91a16 16 0 0 0 4 4l1.57-1.57a2 2 0 0 1 2.11-.45c.81.24 1.65.42 2.51.54A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

export default function ThankYouModal({ open, onClose }: ThankYouModalProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  useEffect(() => {
    if (!open) return;

    const timeoutId = window.setTimeout(() => onClose(), 30_000);
    return () => window.clearTimeout(timeoutId);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 sm:p-4 bg-white/30 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="thank-you-title"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <div className="glass-card glass-modal my-3 sm:my-0 w-full max-w-2xl max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-2xl p-3 sm:p-8 space-y-3 sm:space-y-5">
        <div className="grid gap-3 sm:grid-cols-[auto,1fr] sm:gap-x-6 sm:gap-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/assessment-illustration-generic.svg"
            alt="Assessment illustration"
            className="hidden sm:block w-32 h-auto shrink-0 mx-auto sm:mx-0 sm:row-span-2"
            loading="eager"
          />

          <header className="space-y-2 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/assessment-illustration-generic.svg"
              alt="Assessment illustration"
              className="sm:hidden w-24 h-24 object-contain mx-auto"
              loading="eager"
            />
            <h2 id="thank-you-title" className="font-heading text-[1.2rem] sm:text-xl font-semibold text-[#004097]">
              Thank you for completing the Assessment Form!
            </h2>
          </header>

          <div className="space-y-2 sm:space-y-3 text-[0.88rem] sm:text-sm text-slate-800 text-center sm:col-start-2">
            <p>
              Please keep your lines open. Our team will reach out within <span className="font-semibold">24-48 hours</span>, and you will
              receive a <span className="font-semibold">text message</span> and an <span className="font-semibold">email</span> to confirm
              that your form was <span className="font-semibold">submitted successfully</span>.
            </p>
            <p>
              If you do not receive a <span className="font-semibold">text</span>, <span className="font-semibold">call</span>, or{' '}
              <span className="font-semibold">email</span> from our staff after{' '}
              <span className="font-semibold">24-48 hours</span>, you can reach us at:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:gap-x-8 sm:gap-y-6 justify-items-center">
          {allBranchContacts.map((contact) => (
            <div key={contact.city} className="space-y-1.5 sm:space-y-2 text-center">
              <div className="text-[0.95rem] sm:text-[1rem] font-semibold text-[#004097]">
                {contact.city}
              </div>
              <div className="flex items-center justify-center gap-1 sm:gap-2 text-[0.78rem] sm:text-sm text-slate-700">
                <MailIcon />
                <a
                  href={`mailto:${contact.email}`}
                  className="break-all font-semibold underline decoration-transparent hover:decoration-current transition-[text-decoration-color] duration-150 text-[0.72rem] sm:text-[0.82rem]"
                >
                  {contact.email}
                </a>
              </div>
              {contact.phone && (
                <>
                  <a
                    href={`tel:${formatPhoneHref(contact.phone)}`}
                    className="flex items-center justify-center gap-1 text-[0.78rem] text-slate-700 sm:hidden"
                  >
                    <PhoneIcon />
                    <span className="break-words font-semibold">{contact.phone}</span>
                  </a>
                  <div className="hidden sm:flex items-center justify-center gap-2 text-sm text-slate-700">
                    <PhoneIcon />
                    <span className="break-words font-semibold">{contact.phone}</span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end pt-2">
          <button type="button" className="glass-btn rounded-xl px-5 py-2 font-semibold w-auto" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

