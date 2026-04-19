import type { StaffOption } from '../types';

type BuildSubmissionPayloadArgs = {
  currentLocation: string;
  preferredBranch: string;
  referredByStaff: string;
  referredStaffId: string;
  staffBranch: string | null;
  staffOptions: StaffOption[];
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
  resumeFile: File | null;
};

export const buildSubmissionPayload = ({
  currentLocation,
  preferredBranch,
  referredByStaff,
  referredStaffId,
  staffBranch,
  staffOptions,
  fullName,
  mobileNumber,
  emailAddress,
  dateOfBirth,
  isUsPassportHolder,
  highestEducationalAttainment,
  englishTest,
  hasWorked,
  hasVisaRefusal,
  studyDestinations,
  otherStudyDestination,
  preferredCoursesOfStudy,
  otherPreferredCourseOfStudy,
  plannedStudyStart,
  preferredConsultationMethod,
  preferredConsultationDate,
  preferredConsultationTime,
  discoverySources,
  otherDiscoverySource,
  referralCode,
  resumeFile,
}: BuildSubmissionPayloadArgs) => {
  const selectedStaff = staffOptions.find((staff) => staff.id === referredStaffId) ?? null;
  const payload = new FormData();

  payload.append('currentLocation', currentLocation);
  payload.append('preferredBranch', preferredBranch);
  payload.append('referredByStaff', referredByStaff);
  payload.append('referredStaffId', selectedStaff?.id ?? '');
  payload.append('referredStaffName', selectedStaff?.name ?? '');
  payload.append('referredStaffBranch', selectedStaff?.branch ?? staffBranch ?? '');
  payload.append('fullName', fullName);
  payload.append('mobileNumber', mobileNumber);
  payload.append('emailAddress', emailAddress);
  payload.append('dateOfBirth', dateOfBirth);
  payload.append('isUsPassportHolder', isUsPassportHolder);
  payload.append('highestEducationalAttainment', highestEducationalAttainment);
  payload.append('englishTest', englishTest);
  payload.append('hasWorked', hasWorked);
  payload.append('hasVisaRefusal', hasVisaRefusal);
  payload.append('studyDestinations', JSON.stringify(studyDestinations));
  payload.append('otherStudyDestination', otherStudyDestination);
  payload.append('preferredCoursesOfStudy', JSON.stringify(preferredCoursesOfStudy));
  payload.append('otherPreferredCourseOfStudy', otherPreferredCourseOfStudy);
  payload.append('plannedStudyStart', plannedStudyStart);
  payload.append('preferredConsultationMethod', preferredConsultationMethod);
  payload.append('preferredConsultationDate', preferredConsultationDate);
  payload.append('preferredConsultationTime', preferredConsultationTime);
  payload.append('discoverySources', JSON.stringify(discoverySources));
  payload.append('otherDiscoverySource', otherDiscoverySource);
  payload.append('referralCode', referralCode);

  if (resumeFile) {
    payload.append('resumeFile', resumeFile, resumeFile.name);
  }

  return payload;
};

