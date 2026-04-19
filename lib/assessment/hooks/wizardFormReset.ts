type ResetWizardFormArgs = {
  setCurrentLocation: (value: string) => void;
  setPreferredBranch: (value: string) => void;
  setStatusMessage: (value: string | null) => void;
  setStatusKind: (value: 'success' | 'error' | null) => void;
  setReferredByStaff: (value: string) => void;
  setReferredStaffId: (value: string) => void;
  setIsSubmitting: (value: boolean) => void;
  setFullName: (value: string) => void;
  setMobileNumber: (value: string) => void;
  setEmailAddress: (value: string) => void;
  setDateOfBirth: (value: string) => void;
  setIsUsPassportHolder: (value: string) => void;
  setHighestEducationalAttainment: (value: string) => void;
  setEnglishTest: (value: string) => void;
  setHasWorked: (value: string) => void;
  setHasVisaRefusal: (value: string) => void;
  setStudyDestinations: (value: string[]) => void;
  setOtherStudyDestination: (value: string) => void;
  setPreferredCoursesOfStudy: (value: string[]) => void;
  setOtherPreferredCourseOfStudy: (value: string) => void;
  setPlannedStudyStart: (value: string) => void;
  setPreferredConsultationMethodState: (value: string) => void;
  setPreferredConsultationDate: (value: string) => void;
  setLastValidPreferredConsultationDate: (value: string) => void;
  setIsConsultationDateWeekend: (value: boolean) => void;
  setPreferredConsultationTime: (value: string) => void;
  setResumeFile: (value: File | null) => void;
  setResumeFileError: (value: string | null) => void;
  setDiscoverySources: (value: string[]) => void;
  setOtherDiscoverySource: (value: string) => void;
  setReferralCode: (value: string) => void;
  clearStoredDraft: () => void;
};

export const resetWizardFormState = ({
  setCurrentLocation,
  setPreferredBranch,
  setStatusMessage,
  setStatusKind,
  setReferredByStaff,
  setReferredStaffId,
  setIsSubmitting,
  setFullName,
  setMobileNumber,
  setEmailAddress,
  setDateOfBirth,
  setIsUsPassportHolder,
  setHighestEducationalAttainment,
  setEnglishTest,
  setHasWorked,
  setHasVisaRefusal,
  setStudyDestinations,
  setOtherStudyDestination,
  setPreferredCoursesOfStudy,
  setOtherPreferredCourseOfStudy,
  setPlannedStudyStart,
  setPreferredConsultationMethodState,
  setPreferredConsultationDate,
  setLastValidPreferredConsultationDate,
  setIsConsultationDateWeekend,
  setPreferredConsultationTime,
  setResumeFile,
  setResumeFileError,
  setDiscoverySources,
  setOtherDiscoverySource,
  setReferralCode,
  clearStoredDraft,
}: ResetWizardFormArgs) => {
  setCurrentLocation('');
  setPreferredBranch('');
  setStatusMessage(null);
  setStatusKind(null);
  setReferredByStaff('');
  setReferredStaffId('');
  setIsSubmitting(false);
  setFullName('');
  setMobileNumber('');
  setEmailAddress('');
  setDateOfBirth('');
  setIsUsPassportHolder('');
  setHighestEducationalAttainment('');
  setEnglishTest('');
  setHasWorked('');
  setHasVisaRefusal('');
  setStudyDestinations([]);
  setOtherStudyDestination('');
  setPreferredCoursesOfStudy([]);
  setOtherPreferredCourseOfStudy('');
  setPlannedStudyStart('');
  setPreferredConsultationMethodState('');
  setPreferredConsultationDate('');
  setLastValidPreferredConsultationDate('');
  setIsConsultationDateWeekend(false);
  setPreferredConsultationTime('');
  setResumeFile(null);
  setResumeFileError(null);
  setDiscoverySources([]);
  setOtherDiscoverySource('');
  setReferralCode('');
  clearStoredDraft();
};


