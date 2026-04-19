export type RawSubmissionBody = Record<string, unknown>;

export type SubmissionPayload = {
  contentType: string;
  body: RawSubmissionBody;
  formData: FormData | null;
  resumeFile: File | null;
};

export type ParsedSubmissionFields = {
  currentLocation: string;
  preferredBranch: string;
  referredByStaff: string;
  referredStaffId: string | null;
  referredStaffName: string | null;
  referredStaffBranch: string | null;
  fullName: string;
  mobileNumber: string;
  emailAddress: string;
  dateOfBirth: string;
  isUsPassportHolderRaw: string;
  highestEducationalAttainment: string;
  englishTest: string;
  hasWorkedRaw: string;
  hasVisaRefusalRaw: string;
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
  referralCode: string | null;
};

export type ValidatedSubmissionFields = Omit<
  ParsedSubmissionFields,
  'referredByStaff' | 'isUsPassportHolderRaw' | 'hasWorkedRaw' | 'hasVisaRefusalRaw'
> & {
  referredByStaff: boolean;
  isUsPassportHolder: boolean;
  hasWorked: boolean;
  hasVisaRefusal: boolean;
  staffBranch: string | null;
  normalizedEmail: string;
  normalizedMobile: string;
  duplicateKey: string;
};

export type ResumeUploadResult = {
  resumeStoragePath: string | null;
  resumeFileName: string | null;
  resumeContentType: string | null;
  resumeFileSize: number | null;
};

export type ReferredStaffResolution = {
  effectiveReferredStaffName: string | null;
  effectiveReferredStaffBranch: string | null;
  assignedCounsellor: string | null;
  assignedCounsellorUid: string | null;
};

