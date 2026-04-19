'use client';

import { useEffect, useMemo } from 'react';
import { formatPhoneHref, getBranchContact } from '../../lib/assessment/constants';

type DuplicateSubmissionModalProps = {
  open: boolean;
  branch: string | null;
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

export default function DuplicateSubmissionModal({ open, branch, onClose }: DuplicateSubmissionModalProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  const contact = useMemo(() => getBranchContact(branch), [branch]);

  if (!open) return null;

  const branchLabel = contact?.city ?? branch ?? 'our team';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 sm:p-4 bg-white/30 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="duplicate-title"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <div className="glass-card glass-modal my-3 sm:my-0 w-full max-w-2xl max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-2xl p-3 sm:p-8 space-y-3 sm:space-y-5">
        <div className="space-y-2 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/assessment-illustration-generic.svg"
            alt="Assessment illustration"
            className="w-20 sm:w-24 h-auto object-contain mx-auto"
            loading="eager"
          />
          <h2 id="duplicate-title" className="font-heading text-[1.16rem] sm:text-xl font-semibold text-[#004097]">
            Information Already Found!!
          </h2>
          <div className="space-y-2 sm:space-y-3 text-[0.86rem] sm:text-sm text-slate-800 text-center">
            <p>
              We currently have your information in our database. If you need assistance, follow up consultation, or want to change your
              preferred destination, please contact <span className="font-semibold">{branchLabel} Branch</span>.
            </p>
          </div>
        </div>

        {contact && (
          <div className="space-y-1.5 sm:space-y-2 text-center">
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
        )}

        <div className="flex items-center justify-center sm:justify-end pt-2">
          <button type="button" className="glass-btn rounded-xl px-5 py-2 font-semibold w-auto" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

