import assert from 'node:assert/strict';

import { validateSubmissionFields } from '../../app/api/submit/lib/validation';
import type { ParsedSubmissionFields } from '../../app/api/submit/lib/types';
import { OFFICE_NOW_VALUE } from '../../lib/assessment/constants';
import { getStepValidationError, type ValidationState } from '../../lib/assessment/validation';

const baseValidationState: ValidationState = {
  currentLocation: 'Makati City',
  preferredBranch: 'Manila',
  referredByStaff: 'no',
  referredStaffId: '',
  fullName: 'Juan Dela Cruz',
  mobileNumber: '+63 917 111 2222',
  emailAddress: 'juan@example.com',
  dateOfBirth: '1999-05-12',
  isUsPassportHolder: 'no',
  highestEducationalAttainment: "Bachelor's Degree",
  englishTest: 'IELTS - Academic',
  hasWorked: 'yes',
  hasVisaRefusal: 'no',
  studyDestinations: ['Australia'],
  otherStudyDestination: '',
  preferredCoursesOfStudy: ["Master's Degree - Coursework"],
  otherPreferredCourseOfStudy: '',
  plannedStudyStart: '2027-03',
  preferredConsultationMethod: 'Online Consultation (Zoom, Teams, Meets)',
  preferredConsultationDate: '2099-10-08',
  preferredConsultationTime: '11:00',
  resumeFile: null,
  discoverySources: ['Official Website'],
  otherDiscoverySource: '',
  referralCode: '',
};

const baseApiFields: ParsedSubmissionFields = {
  currentLocation: 'Makati City',
  preferredBranch: 'Manila',
  referredByStaff: 'no',
  referredStaffId: null,
  referredStaffName: null,
  referredStaffBranch: null,
  fullName: 'Juan Dela Cruz',
  mobileNumber: '+63 917 111 2222',
  emailAddress: 'juan@example.com',
  dateOfBirth: '1999-05-12',
  isUsPassportHolderRaw: 'no',
  highestEducationalAttainment: "Bachelor's Degree",
  englishTest: 'IELTS - Academic',
  hasWorkedRaw: 'yes',
  hasVisaRefusalRaw: 'no',
  studyDestinations: ['Australia'],
  otherStudyDestination: '',
  preferredCoursesOfStudy: ["Master's Degree - Coursework"],
  otherPreferredCourseOfStudy: '',
  plannedStudyStart: '2027-03',
  preferredConsultationMethod: 'Online Consultation (Zoom, Teams, Meets)',
  preferredConsultationDate: '2099-10-08',
  preferredConsultationTime: '11:00',
  discoverySources: ['Official Website'],
  otherDiscoverySource: '',
  referralCode: null,
};

const addDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
};

const nextWeekdayDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
};

const nextWeekendDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  while (date.getDay() !== 6 && date.getDay() !== 0) {
    date.setDate(date.getDate() + 1);
  }
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
};

const readValidationMessage = async (response: Response) => {
  const body = (await response.json()) as { message?: unknown };
  return typeof body.message === 'string' ? body.message : '';
};

export const runValidationRegression = async () => {
  const checks: string[] = [];
  const weekdayIso = nextWeekdayDate();
  baseValidationState.preferredConsultationDate = weekdayIso;
  baseApiFields.preferredConsultationDate = weekdayIso;

  for (const step of [1, 2, 3, 4, 5, 6] as const) {
    const error = getStepValidationError(step, baseValidationState, { isStaffRequired: false });
    assert.equal(error, null);
  }
  checks.push('step validation baseline passes for all steps');

  const staffRequiredError = getStepValidationError(
    1,
    { ...baseValidationState, referredByStaff: 'yes' },
    { isStaffRequired: true },
  );
  assert.equal(staffRequiredError, 'Please select a staff member.');
  checks.push('step 1 enforces staff selection when required');

  const officeNowState: ValidationState = {
    ...baseValidationState,
    preferredConsultationMethod: OFFICE_NOW_VALUE,
    preferredConsultationDate: addDays(-1),
  };
  assert.equal(getStepValidationError(5, officeNowState, { isStaffRequired: false }), null);
  checks.push('office-now bypass keeps consultation date validation behavior');

  const weekendState: ValidationState = {
    ...baseValidationState,
    preferredConsultationDate: nextWeekendDate(),
  };
  assert.equal(
    getStepValidationError(5, weekendState, { isStaffRequired: false }),
    'Please select a weekday (Monday to Friday).',
  );
  checks.push('frontend weekend consultation guard is enforced');

  const apiValid = validateSubmissionFields(baseApiFields);
  assert.equal(apiValid.ok, true);
  if (apiValid.ok) {
    assert.equal(apiValid.data.referredByStaff, false);
    assert.equal(apiValid.data.staffBranch, 'Manila');
  }
  checks.push('api payload validation baseline passes');

  const badBranch = validateSubmissionFields({ ...baseApiFields, preferredBranch: 'Seoul' });
  assert.equal(badBranch.ok, false);
  if (!badBranch.ok) {
    assert.equal(await readValidationMessage(badBranch.response), 'Please select a preferred branch.');
  }
  checks.push('api branch guard is enforced');

  const badWeekend = validateSubmissionFields({
    ...baseApiFields,
    preferredConsultationDate: nextWeekendDate(),
  });
  assert.equal(badWeekend.ok, false);
  if (!badWeekend.ok) {
    assert.equal(
      await readValidationMessage(badWeekend.response),
      'Please select a weekday (Monday to Friday).',
    );
  }
  checks.push('api weekend consultation guard is enforced');

  return checks;
};
