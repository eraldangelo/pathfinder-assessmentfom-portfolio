import { useCallback, useRef, useState } from 'react';
import { consultationTimes, OFFICE_NOW_VALUE } from '../../../lib/assessment/constants';

type ConsultationStepProps = {
  preferredConsultationMethod: string;
  onPreferredConsultationMethodChange: (value: string) => void;
  preferredConsultationDate: string;
  onPreferredConsultationDateChange: (value: string) => void;
  isConsultationDateWeekend: boolean;
  preferredConsultationTime: string;
  onPreferredConsultationTimeChange: (value: string) => void;
  resumeFile: File | null;
  resumeFileError?: string | null;
  onResumeFileChange: (file: File | null) => void;
  showValidation: boolean;
};

export default function ConsultationStep({
  preferredConsultationMethod,
  onPreferredConsultationMethodChange,
  preferredConsultationDate,
  onPreferredConsultationDateChange,
  isConsultationDateWeekend,
  preferredConsultationTime,
  onPreferredConsultationTimeChange,
  resumeFile,
  resumeFileError,
  onResumeFileChange,
  showValidation,
}: ConsultationStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0] ?? null;
      onResumeFileChange(file);
      // Reset so re-selecting the same file triggers onChange again
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [onResumeFileChange],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const showMethodError = showValidation && !preferredConsultationMethod;
  const showTimeError = showValidation && !preferredConsultationTime;
  const isOfficeNow = preferredConsultationMethod === OFFICE_NOW_VALUE;
  const minConsultationDate = (() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();
  const showDateError =
    showValidation &&
    (!preferredConsultationDate || (!isOfficeNow && isConsultationDateWeekend));

  return (
    <>
      <div className="space-y-2">
        <label htmlFor="consultation-method-select" className="text-sm font-semibold text-slate-600">
          Preferred Consultation Method<span className="text-red-500 ml-1">*</span>
        </label>
        <div
          className={`rounded-xl border ${
            showMethodError ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'
          }`}
        >
          <select
            id="consultation-method-select"
            data-testid="consultation-method-select"
            className="w-full bg-white rounded-xl px-3 pr-10 py-2.5 text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={preferredConsultationMethod}
            onChange={(event) => onPreferredConsultationMethodChange(event.target.value)}
            aria-invalid={showMethodError}
            aria-describedby={showMethodError ? 'consultation-method-error' : undefined}
          >
            <option value="">Select an option</option>
            <option value="In-Person (at the office for future date)">In-Person (at the office for future date)</option>
            <option value="Online Consultation (Zoom, Teams, Meets)">Online Consultation (Zoom, Teams, Meets)</option>
            <option value={OFFICE_NOW_VALUE}>{OFFICE_NOW_VALUE}</option>
          </select>
        </div>
        {showMethodError && (
          <p id="consultation-method-error" className="text-xs text-red-500" role="alert">Please select your preferred consultation method.</p>
        )}
      </div>
      <div className="space-y-2">
        <label htmlFor="consultation-date-input" className="text-sm font-semibold text-slate-600">
          Preferred Consultation Date<span className="text-red-500 ml-1">*</span>
        </label>
        <div
          className={`rounded-xl border ${
            showDateError ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'
          }`}
        >
          <input
            id="consultation-date-input"
            data-testid="consultation-date-input"
            type="date"
            className="w-full bg-white rounded-xl px-3 py-2.5 text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
            value={preferredConsultationDate}
            onChange={(event) => onPreferredConsultationDateChange(event.target.value)}
            min={minConsultationDate}
            disabled={isOfficeNow}
            aria-invalid={showDateError}
            aria-describedby={showDateError ? 'consultation-date-error' : undefined}
          />
        </div>
        {showDateError && (
          <p id="consultation-date-error" className="text-xs text-red-500" role="alert">Please select a valid consultation date.</p>
        )}
        {isConsultationDateWeekend && !isOfficeNow && (
          <p className="text-xs font-semibold text-red-500">
            Our business hours are Monday to Friday only.
          </p>
        )}
      </div>
      <div className="space-y-2">
        <label htmlFor="consultation-time-select" className="text-sm font-semibold text-slate-600">
          Preferred Consultation Time<span className="text-red-500 ml-1">*</span>
        </label>
        <div
          className={`rounded-xl border ${
            showTimeError ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'
          }`}
        >
          <select
            id="consultation-time-select"
            data-testid="consultation-time-select"
            className="w-full bg-white rounded-xl px-3 pr-10 py-2.5 text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={preferredConsultationTime}
            onChange={(event) => onPreferredConsultationTimeChange(event.target.value)}
            aria-invalid={showTimeError}
            aria-describedby={showTimeError ? 'consultation-time-error' : undefined}
          >
            <option value="">Select a time</option>
            {consultationTimes.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>
        {showTimeError && (
          <p id="consultation-time-error" className="text-xs text-red-500" role="alert">Please select your preferred consultation time.</p>
        )}
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-600">Resume / Curriculum Vitae</label>
        <div className="text-xs text-slate-500 space-y-1">
          <p>
            Please upload your resume or CV so the counselor can provide the best recommendation for your study-abroad plan.
            If you do not have one, you may click Next.
          </p>
          <p>
            Note: If your file is in OneDrive, make sure it is available offline (downloaded) before uploading.
          </p>
        </div>
        <input
          id="resume-upload-input"
          ref={fileInputRef}
          type="file"
          className="sr-only"
          tabIndex={-1}
          accept=".pdf,.doc,.docx,.jpg,.jpeg"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div
          role="button"
          tabIndex={0}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
              fileInputRef.current.click();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
                fileInputRef.current.click();
              }
            }
          }}
          className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-5 cursor-pointer transition-colors ${
            isDragOver
              ? 'border-blue-400 bg-blue-50/60'
              : resumeFile
                ? 'border-green-300 bg-green-50/40'
                : 'border-slate-300 bg-white/40 hover:border-slate-400 hover:bg-white/60'
          }`}
        >
          {resumeFile ? (
            <>
              <span className="text-sm font-medium text-green-700 truncate max-w-full">
                {resumeFile.name}
              </span>
              <span className="text-xs text-slate-500">
                Click or drag to replace
              </span>
            </>
          ) : (
            <>
              <span className="text-sm font-semibold text-slate-600">
                {isDragOver ? 'Drop file here' : 'Click to browse or drag & drop'}
              </span>
              <span className="text-xs text-slate-400">
                PDF, DOC/DOCX, or JPG up to 5 MB
              </span>
            </>
          )}
        </div>

        {resumeFileError && <p className="text-xs font-semibold text-red-500" role="alert">{resumeFileError}</p>}
      </div>
    </>
  );
}
