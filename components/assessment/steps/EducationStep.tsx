type EducationStepProps = {
  highestEducationalAttainment: string;
  onHighestEducationalAttainmentChange: (value: string) => void;
  englishTest: string;
  onEnglishTestChange: (value: string) => void;
  hasWorked: string;
  onHasWorkedChange: (value: string) => void;
  hasVisaRefusal: string;
  onHasVisaRefusalChange: (value: string) => void;
  showValidation: boolean;
};

const attainmentOptions = [
  'High School Graduate (Old Curriculum)',
  'Junior High School Graduate K-12',
  'Senior High School Graduate K-12',
  'SHS + SAT/ACT',
  'International Baccalaureate',
  'General Certificate of Education Advanced Level (A-Level)',
  "Incomplete Studies / Did not finish Bachelor's Degree",
  'TESDA - NC II Certificates',
  'Associate Degree/Diploma Course',
  "Bachelor's Degree",
  "Master's Degree",
  'Doctorate Degree',
] as const;

export default function EducationStep({
  highestEducationalAttainment,
  onHighestEducationalAttainmentChange,
  englishTest,
  onEnglishTestChange,
  hasWorked,
  onHasWorkedChange,
  hasVisaRefusal,
  onHasVisaRefusalChange,
  showValidation,
}: EducationStepProps) {
  const attainmentId = 'education-attainment-select';
  const englishTestId = 'english-test-select';
  const workedId = 'has-worked-select';
  const visaRefusalId = 'visa-refusal-select';
  const showAttainmentError = showValidation && !highestEducationalAttainment;
  const showEnglishTestError = showValidation && !englishTest;
  const showWorkedError = showValidation && !hasWorked;
  const showVisaRefusalError = showValidation && !hasVisaRefusal;

  return (
    <>
      <div className="space-y-2">
        <label htmlFor={attainmentId} className="text-sm font-semibold text-slate-600">
          Your Highest Educational Attainment<span className="text-red-500 ml-1">*</span>
        </label>
        <div
          className={`rounded-xl border ${
            showAttainmentError ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'
          }`}
        >
          <select
            id={attainmentId}
            data-testid={attainmentId}
            className="w-full bg-white rounded-xl px-3 pr-10 py-2.5 text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={highestEducationalAttainment}
            onChange={(event) => onHighestEducationalAttainmentChange(event.target.value)}
            aria-invalid={showAttainmentError}
            aria-describedby={showAttainmentError ? 'education-attainment-error' : undefined}
          >
            <option value="">Select an option</option>
            {attainmentOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        {showAttainmentError && (
          <p id="education-attainment-error" className="text-xs text-red-500" role="alert">
            Please select your highest educational attainment.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor={englishTestId} className="text-sm font-semibold text-slate-600">
          English Test (IELTS, PTE, TOEFL)<span className="text-red-500 ml-1">*</span>
        </label>
        <div
          className={`rounded-xl border ${
            showEnglishTestError ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'
          }`}
        >
          <select
            id={englishTestId}
            data-testid={englishTestId}
            className="w-full bg-white rounded-xl px-3 pr-10 py-2.5 text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={englishTest}
            onChange={(event) => onEnglishTestChange(event.target.value)}
            aria-invalid={showEnglishTestError}
            aria-describedby={showEnglishTestError ? 'english-test-error' : undefined}
          >
            <option value="">Select an option</option>
            <option value="IELTS - Academic">IELTS - Academic</option>
            <option value="PTE - Academic">PTE - Academic</option>
            <option value="TOEFL">TOEFL</option>
            <option value="International Baccalaureate">International Baccalaureate</option>
            <option value="I plan to sit for an English Test in the future">
              I plan to sit for an English Test in the future
            </option>
          </select>
        </div>
        {showEnglishTestError && (
          <p id="english-test-error" className="text-xs text-red-500" role="alert">
            Please select your English test.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor={workedId} className="text-sm font-semibold text-slate-600">
          Have you already worked?<span className="text-red-500 ml-1">*</span>
        </label>
        <div
          className={`rounded-xl border ${
            showWorkedError ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'
          }`}
        >
          <select
            id={workedId}
            data-testid={workedId}
            className="w-full bg-white rounded-xl px-3 pr-10 py-2.5 text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={hasWorked}
            onChange={(event) => onHasWorkedChange(event.target.value)}
            aria-invalid={showWorkedError}
            aria-describedby={showWorkedError ? 'has-worked-error' : undefined}
          >
            <option value="">Select an option</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        {showWorkedError && (
          <p id="has-worked-error" className="text-xs text-red-500" role="alert">
            Please select if you have worked.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor={visaRefusalId} className="text-sm font-semibold text-slate-600">
          Have you been refused to a visa application to any country?<span className="text-red-500 ml-1">*</span>
        </label>
        <div
          className={`rounded-xl border ${
            showVisaRefusalError ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'
          }`}
        >
          <select
            id={visaRefusalId}
            data-testid={visaRefusalId}
            className="w-full bg-white rounded-xl px-3 pr-10 py-2 text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={hasVisaRefusal}
            onChange={(event) => onHasVisaRefusalChange(event.target.value)}
            aria-invalid={showVisaRefusalError}
            aria-describedby={showVisaRefusalError ? 'visa-refusal-error' : undefined}
          >
            <option value="">Select an option</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        {showVisaRefusalError && (
          <p id="visa-refusal-error" className="text-xs text-red-500" role="alert">
            Please select your visa refusal status.
          </p>
        )}
      </div>
    </>
  );
}
