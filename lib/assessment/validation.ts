import type { WizardStep } from './types';
import { getStepValidationErrorFromSchema, type SubmissionInput } from './schema';

export type ValidationState = {
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
  resumeFile: File | null;
  discoverySources: string[];
  otherDiscoverySource: string;
  referralCode: string;
};

type ValidationContext = {
  isStaffRequired: boolean;
};

const toSchemaInput = (state: ValidationState): SubmissionInput => ({
  currentLocation: state.currentLocation,
  preferredBranch: state.preferredBranch as SubmissionInput['preferredBranch'],
  referredByStaff: state.referredByStaff as 'yes' | 'no',
  referredStaffId: state.referredStaffId,
  referredStaffName: null,
  referredStaffBranch: null,
  fullName: state.fullName,
  mobileNumber: state.mobileNumber,
  emailAddress: state.emailAddress,
  dateOfBirth: state.dateOfBirth,
  isUsPassportHolder: state.isUsPassportHolder as 'yes' | 'no',
  highestEducationalAttainment: state.highestEducationalAttainment,
  englishTest: state.englishTest,
  hasWorked: state.hasWorked as 'yes' | 'no',
  hasVisaRefusal: state.hasVisaRefusal as 'yes' | 'no',
  studyDestinations: state.studyDestinations,
  otherStudyDestination: state.otherStudyDestination,
  preferredCoursesOfStudy: state.preferredCoursesOfStudy,
  otherPreferredCourseOfStudy: state.otherPreferredCourseOfStudy,
  plannedStudyStart: state.plannedStudyStart,
  preferredConsultationMethod: state.preferredConsultationMethod as SubmissionInput['preferredConsultationMethod'],
  preferredConsultationDate: state.preferredConsultationDate,
  preferredConsultationTime: state.preferredConsultationTime as SubmissionInput['preferredConsultationTime'],
  discoverySources: state.discoverySources,
  otherDiscoverySource: state.otherDiscoverySource,
  referralCode: state.referralCode,
});

export const getStepValidationError = (
  currentStep: WizardStep,
  state: ValidationState,
  _context: ValidationContext,
) => {
  const step = currentStep as 1 | 2 | 3 | 4 | 5 | 6;
  return getStepValidationErrorFromSchema(step, toSchemaInput(state));
};

export const shouldShowStepValidation = (
  currentStep: WizardStep,
  state: ValidationState,
  { isStaffRequired }: ValidationContext,
) => {
  if (currentStep === 1) {
    return (
      !!state.currentLocation.trim()
      || !!state.preferredBranch
      || !!state.referredByStaff
      || (isStaffRequired && !!state.referredStaffId)
    );
  }
  if (currentStep === 2) {
    return (
      !!state.fullName.trim()
      || !!state.mobileNumber.trim()
      || !!state.emailAddress.trim()
      || !!state.dateOfBirth
      || !!state.isUsPassportHolder
    );
  }
  if (currentStep === 3) {
    return (
      !!state.highestEducationalAttainment
      || !!state.englishTest
      || !!state.hasWorked
      || !!state.hasVisaRefusal
    );
  }
  if (currentStep === 4) {
    return (
      state.studyDestinations.length > 0
      || !!state.otherStudyDestination.trim()
      || state.preferredCoursesOfStudy.length > 0
      || !!state.otherPreferredCourseOfStudy.trim()
      || !!state.plannedStudyStart
    );
  }
  if (currentStep === 5) {
    return (
      !!state.preferredConsultationMethod
      || !!state.preferredConsultationDate
      || !!state.preferredConsultationTime
      || !!state.resumeFile
    );
  }
  if (currentStep === 6) {
    return (
      state.discoverySources.length > 0
      || !!state.otherDiscoverySource.trim()
      || !!state.referralCode.trim()
    );
  }
  return false;
};

