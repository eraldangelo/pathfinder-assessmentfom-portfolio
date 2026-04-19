type PersonalStepProps = {
  fullName: string;
  onFullNameChange: (value: string) => void;
  mobileNumber: string;
  onMobileNumberChange: (value: string) => void;
  mobileAlreadyUsed: boolean;
  emailAddress: string;
  onEmailAddressChange: (value: string) => void;
  emailAlreadyUsed: boolean;
  dateOfBirth: string;
  onDateOfBirthChange: (value: string) => void;
  isUsPassportHolder: string;
  onIsUsPassportHolderChange: (value: string) => void;
  showValidation: boolean;
};

export default function PersonalStep({
  fullName,
  onFullNameChange,
  mobileNumber,
  onMobileNumberChange,
  mobileAlreadyUsed,
  emailAddress,
  onEmailAddressChange,
  emailAlreadyUsed,
  dateOfBirth,
  onDateOfBirthChange,
  isUsPassportHolder,
  onIsUsPassportHolderChange,
  showValidation,
}: PersonalStepProps) {
  const fullNameId = 'full-name-input';
  const mobileId = 'mobile-number-input';
  const emailId = 'email-address-input';
  const dobId = 'date-of-birth-input';
  const passportId = 'us-passport-select';
  const showFullNameError = showValidation && !fullName.trim();
  const showMobileError = showValidation && !mobileNumber.trim();
  const showEmailError = showValidation && !emailAddress.trim();
  const showMobileInUse = !!mobileNumber.trim() && mobileAlreadyUsed;
  const showEmailInUse = !!emailAddress.trim() && emailAlreadyUsed;
  const showDateOfBirthError = showValidation && !dateOfBirth;
  const showPassportError = showValidation && !isUsPassportHolder;

  return (
    <>
      <div className="space-y-2">
        <label htmlFor={fullNameId} className="text-sm font-semibold text-slate-600">
          Full Name<span className="text-red-500 ml-1">*</span>
        </label>
        <div
          className={`rounded-xl border ${
            showFullNameError ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'
          }`}
        >
          <input
            id={fullNameId}
            data-testid={fullNameId}
            type="text"
            className="w-full bg-white rounded-xl px-3 py-2.5 text-slate-700 placeholder:italic focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={fullName}
            onChange={(event) => onFullNameChange(event.target.value)}
            placeholder="Juan Dela Cruz"
            aria-invalid={showFullNameError}
            aria-describedby={showFullNameError ? 'full-name-error' : undefined}
          />
        </div>
        {showFullNameError && (
          <p id="full-name-error" className="text-xs text-red-500" role="alert">
            Please enter your full name.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor={mobileId} className="text-sm font-semibold text-slate-600">
          Mobile Number<span className="text-red-500 ml-1">*</span>
        </label>
        <div
          className={`rounded-xl border ${
            showMobileError || showMobileInUse ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'
          }`}
        >
          <input
            id={mobileId}
            data-testid={mobileId}
            type="tel"
            className="w-full bg-white rounded-xl px-3 py-2.5 text-slate-700 placeholder:italic focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={mobileNumber}
            onChange={(event) => onMobileNumberChange(event.target.value)}
            placeholder="e.g. +63 9XX XXX XXXX"
            inputMode="tel"
            autoComplete="tel"
            aria-invalid={showMobileError || showMobileInUse}
            aria-describedby={
              showMobileError || showMobileInUse
                ? showMobileInUse
                  ? 'mobile-in-use-error'
                  : 'mobile-required-error'
                : undefined
            }
          />
        </div>
        {showMobileError && !showMobileInUse && (
          <p id="mobile-required-error" className="text-xs text-red-500" role="alert">
            Please enter your mobile number.
          </p>
        )}
        {showMobileInUse && (
          <p id="mobile-in-use-error" className="text-xs text-red-500" role="alert">
            Mobile number is already in use.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor={emailId} className="text-sm font-semibold text-slate-600">
          Email Address<span className="text-red-500 ml-1">*</span>
        </label>
        <div
          className={`rounded-xl border ${
            showEmailError || showEmailInUse ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'
          }`}
        >
          <input
            id={emailId}
            data-testid={emailId}
            type="email"
            className="w-full bg-white rounded-xl px-3 py-2.5 text-slate-700 placeholder:italic focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={emailAddress}
            onChange={(event) => onEmailAddressChange(event.target.value)}
            placeholder="e.g. name@email.com"
            inputMode="email"
            autoComplete="email"
            aria-invalid={showEmailError || showEmailInUse}
            aria-describedby={
              showEmailError || showEmailInUse
                ? showEmailInUse
                  ? 'email-in-use-error'
                  : 'email-required-error'
                : undefined
            }
          />
        </div>
        {showEmailError && !showEmailInUse && (
          <p id="email-required-error" className="text-xs text-red-500" role="alert">
            Please enter your email address.
          </p>
        )}
        {showEmailInUse && (
          <p id="email-in-use-error" className="text-xs text-red-500" role="alert">
            Email address is already in use.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor={dobId} className="text-sm font-semibold text-slate-600">
          Date of Birth<span className="text-red-500 ml-1">*</span>
        </label>
        <div
          className={`rounded-xl border ${
            showDateOfBirthError ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'
          }`}
        >
          <input
            id={dobId}
            data-testid={dobId}
            type="date"
            className="w-full bg-white rounded-xl px-3 py-2.5 text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={dateOfBirth}
            onChange={(event) => onDateOfBirthChange(event.target.value)}
            aria-invalid={showDateOfBirthError}
            aria-describedby={showDateOfBirthError ? 'date-of-birth-error' : undefined}
          />
        </div>
        {showDateOfBirthError && (
          <p id="date-of-birth-error" className="text-xs text-red-500" role="alert">
            Please select your date of birth.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor={passportId} className="text-sm font-semibold text-slate-600">
          Are you a US Passport holder?<span className="text-red-500 ml-1">*</span>
        </label>
        <div
          className={`rounded-xl border ${
            showPassportError ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'
          }`}
        >
          <select
            id={passportId}
            data-testid={passportId}
            className="w-full bg-white rounded-xl px-3 pr-12 py-2.5 text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={isUsPassportHolder}
            onChange={(event) => onIsUsPassportHolderChange(event.target.value)}
            aria-invalid={showPassportError}
            aria-describedby={showPassportError ? 'passport-error' : undefined}
          >
            <option value="">Select an option</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        {showPassportError && (
          <p id="passport-error" className="text-xs text-red-500" role="alert">
            Please select your passport holder status.
          </p>
        )}
      </div>
    </>
  );
}
