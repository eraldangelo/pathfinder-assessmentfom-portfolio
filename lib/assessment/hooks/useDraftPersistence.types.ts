export type DraftValues = {
  currentLocation: string;
  preferredBranch: string;
  referredByStaff: string;
  referredStaffId: string;
  fullName: string;
  mobileNumber: string;
  emailAddress: string;
  dateOfBirth: string;
  isUsPassportHolder: string;
  highestEducationalAttainment: string;
  englishTest: string;
  hasWorked: string;
  hasVisaRefusal: string;
  studyDestinations: string[];
  otherStudyDestination: string;
  preferredCoursesOfStudy: string[];
  otherPreferredCourseOfStudy: string;
  plannedStudyStart: string;
  preferredConsultationMethod: string;
  preferredConsultationDate: string;
  preferredConsultationTime: string;
  discoverySources: string[];
  otherDiscoverySource: string;
  referralCode: string;
};

export type DraftSetters = {
  setCurrentLocation: (value: string) => void;
  setPreferredBranch: (value: string) => void;
  setReferredStaffId: (value: string) => void;
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
  setPreferredConsultationMethod: (value: string) => void;
  setPreferredConsultationDate: (value: string) => void;
  setPreferredConsultationTime: (value: string) => void;
  setDiscoverySources: (value: string[]) => void;
  setOtherDiscoverySource: (value: string) => void;
  setReferralCode: (value: string) => void;
};

export type UseDraftPersistenceArgs = {
  values: DraftValues;
  setters: DraftSetters;
  onReferredByStaffChange: (value: string) => void;
  setLastValidPreferredConsultationDate: (value: string) => void;
  setIsConsultationDateWeekend: (value: boolean) => void;
};


