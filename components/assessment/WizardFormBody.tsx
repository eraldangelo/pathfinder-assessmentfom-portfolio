import BranchStep from './steps/BranchStep';
import ConsultationStep from './steps/ConsultationStep';
import EducationStep from './steps/EducationStep';
import DiscoveryStep from './steps/DiscoveryStep';
import PersonalStep from './steps/PersonalStep';
import StudyDestinationStep from './steps/StudyDestinationStep';
import { useWizardContext } from './WizardContext';

export default function WizardFormBody() {
  const { wizard, turnstile } = useWizardContext();
  const {
    hasTurnstileKey,
    turnstileClientError,
    turnstileToken,
    turnstileContainerRef,
  } = turnstile;

  return (
    <>
      {wizard.step === 1 ? (
        <BranchStep
          currentLocation={wizard.currentLocation}
          onCurrentLocationChange={wizard.setCurrentLocation}
          preferredBranch={wizard.preferredBranch}
          onPreferredBranchChange={wizard.setPreferredBranch}
          referredByStaff={wizard.referredByStaff}
          onReferredByStaffChange={wizard.setReferredByStaff}
          referredStaffId={wizard.referredStaffId}
          onReferredStaffIdChange={wizard.setReferredStaffId}
          staffBranch={wizard.staffBranch}
          staffLoading={wizard.staffLoading}
          staffOptions={wizard.staffOptions}
          isStaffRequired={wizard.isStaffRequired}
          showValidation={wizard.showStepValidation}
        />
      ) : wizard.step === 2 ? (
        <PersonalStep
          fullName={wizard.fullName}
          onFullNameChange={wizard.setFullName}
          mobileNumber={wizard.mobileNumber}
          onMobileNumberChange={wizard.setMobileNumber}
          emailAddress={wizard.emailAddress}
          onEmailAddressChange={wizard.setEmailAddress}
          emailAlreadyUsed={wizard.emailAlreadyUsed}
          dateOfBirth={wizard.dateOfBirth}
          onDateOfBirthChange={wizard.setDateOfBirth}
          mobileAlreadyUsed={wizard.mobileAlreadyUsed}
          isUsPassportHolder={wizard.isUsPassportHolder}
          onIsUsPassportHolderChange={wizard.setIsUsPassportHolder}
          showValidation={wizard.showStepValidation}
        />
      ) : wizard.step === 3 ? (
        <EducationStep
          highestEducationalAttainment={wizard.highestEducationalAttainment}
          onHighestEducationalAttainmentChange={wizard.setHighestEducationalAttainment}
          englishTest={wizard.englishTest}
          onEnglishTestChange={wizard.setEnglishTest}
          hasWorked={wizard.hasWorked}
          onHasWorkedChange={wizard.setHasWorked}
          hasVisaRefusal={wizard.hasVisaRefusal}
          onHasVisaRefusalChange={wizard.setHasVisaRefusal}
          showValidation={wizard.showStepValidation}
        />
      ) : wizard.step === 4 ? (
        <StudyDestinationStep
          studyDestinations={wizard.studyDestinations}
          onStudyDestinationsChange={wizard.setStudyDestinations}
          otherStudyDestination={wizard.otherStudyDestination}
          onOtherStudyDestinationChange={wizard.setOtherStudyDestination}
          preferredCoursesOfStudy={wizard.preferredCoursesOfStudy}
          onPreferredCoursesOfStudyChange={wizard.setPreferredCoursesOfStudy}
          otherPreferredCourseOfStudy={wizard.otherPreferredCourseOfStudy}
          onOtherPreferredCourseOfStudyChange={wizard.setOtherPreferredCourseOfStudy}
          plannedStudyStart={wizard.plannedStudyStart}
          onPlannedStudyStartChange={wizard.setPlannedStudyStart}
          showValidation={wizard.showStepValidation}
        />
      ) : wizard.step === 5 ? (
        <ConsultationStep
          preferredConsultationMethod={wizard.preferredConsultationMethod}
          onPreferredConsultationMethodChange={wizard.setPreferredConsultationMethod}
          preferredConsultationDate={wizard.preferredConsultationDate}
          onPreferredConsultationDateChange={wizard.handlePreferredConsultationDateChange}
          isConsultationDateWeekend={wizard.isConsultationDateWeekend}
          preferredConsultationTime={wizard.preferredConsultationTime}
          onPreferredConsultationTimeChange={wizard.setPreferredConsultationTime}
          resumeFile={wizard.resumeFile}
          resumeFileError={wizard.resumeFileError}
          onResumeFileChange={wizard.handleResumeFileChange}
          showValidation={wizard.showStepValidation}
        />
      ) : (
        <DiscoveryStep
          discoverySources={wizard.discoverySources}
          onDiscoverySourcesChange={wizard.setDiscoverySources}
          otherDiscoverySource={wizard.otherDiscoverySource}
          onOtherDiscoverySourceChange={wizard.setOtherDiscoverySource}
          referralCode={wizard.referralCode}
          onReferralCodeChange={wizard.setReferralCode}
          showValidation={wizard.showStepValidation}
        />
      )}
      {wizard.step === 6 && (
        <div className="mt-4 flex flex-col items-center justify-center">
          <input type="hidden" name="cf-turnstile-response" value={turnstileToken} readOnly />
          {hasTurnstileKey ? (
            <div ref={turnstileContainerRef} />
          ) : (
            <p className="text-sm text-red-700 text-center" role="alert">
              Turnstile site key is missing or invalid.
            </p>
          )}
          {turnstileClientError ? (
            <p className="mt-2 text-sm text-red-700 text-center" role="alert">
              {turnstileClientError}
            </p>
          ) : null}
        </div>
      )}
    </>
  );
}

