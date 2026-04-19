import test from 'node:test';
import assert from 'node:assert/strict';

import { validateSubmissionFields } from './validation';
import type { ParsedSubmissionFields } from './types';

const buildNextWeekdayIso = () => {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  while (next.getDay() === 0 || next.getDay() === 6) next.setDate(next.getDate() + 1);
  return [
    next.getFullYear(),
    String(next.getMonth() + 1).padStart(2, '0'),
    String(next.getDate()).padStart(2, '0'),
  ].join('-');
};

const baseFields: ParsedSubmissionFields = {
  currentLocation: 'Makati City',
  preferredBranch: 'Manila',
  referredByStaff: 'no',
  referredStaffId: null,
  referredStaffName: null,
  referredStaffBranch: null,
  fullName: 'Juan Dela Cruz',
  mobileNumber: '09171112222',
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
  plannedStudyStart: '2099-03',
  preferredConsultationMethod: 'Online Consultation (Zoom, Teams, Meets)',
  preferredConsultationDate: buildNextWeekdayIso(),
  preferredConsultationTime: '11:00',
  discoverySources: ['Official Website'],
  otherDiscoverySource: '',
  referralCode: null,
};

test('validateSubmissionFields returns canonicalized contact/index fields', async () => {
  const result = validateSubmissionFields(baseFields);
  if (!result.ok) {
    const body = await result.response.json();
    assert.fail(`Expected success but got: ${body.message}`);
  }
  assert.equal(result.data.normalizedEmail, 'juan@example.com');
  assert.equal(result.data.normalizedMobile, '9171112222');
  assert.equal(typeof result.data.duplicateKey, 'string');
  assert.equal(result.data.duplicateKey.length, 64);
});

test('validateSubmissionFields rejects invalid mobile/email values', async () => {
  const result = validateSubmissionFields({
    ...baseFields,
    emailAddress: 'not-an-email',
    mobileNumber: '12345',
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.response.status, 422);
    const body = await result.response.json();
    assert.equal(body.ok, false);
  }
});

