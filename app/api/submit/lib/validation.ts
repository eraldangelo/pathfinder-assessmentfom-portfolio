import { NextResponse } from 'next/server';

import { getStaffBranch } from '../../../../lib/assessment/constants';
import { submissionSchema, toCanonicalContactFields, toUserFacingValidationMessage } from '../../../../lib/assessment/schema';
import { buildDuplicateKey } from '../../../../lib/assessment/server/leadIndexKeys';

import type { ParsedSubmissionFields, ValidatedSubmissionFields } from './types';

type ValidationResult =
  | { ok: true; data: ValidatedSubmissionFields }
  | { ok: false; response: NextResponse };

const toNullable = (value: string) => (value ? value : null);

export const validateSubmissionFields = (fields: ParsedSubmissionFields): ValidationResult => {
  const parsed = submissionSchema.safeParse({
    currentLocation: fields.currentLocation,
    preferredBranch: fields.preferredBranch,
    referredByStaff: fields.referredByStaff,
    referredStaffId: fields.referredStaffId,
    referredStaffName: fields.referredStaffName,
    referredStaffBranch: fields.referredStaffBranch,
    fullName: fields.fullName,
    mobileNumber: fields.mobileNumber,
    emailAddress: fields.emailAddress,
    dateOfBirth: fields.dateOfBirth,
    isUsPassportHolder: fields.isUsPassportHolderRaw,
    highestEducationalAttainment: fields.highestEducationalAttainment,
    englishTest: fields.englishTest,
    hasWorked: fields.hasWorkedRaw,
    hasVisaRefusal: fields.hasVisaRefusalRaw,
    studyDestinations: fields.studyDestinations,
    otherStudyDestination: fields.otherStudyDestination,
    preferredCoursesOfStudy: fields.preferredCoursesOfStudy,
    otherPreferredCourseOfStudy: fields.otherPreferredCourseOfStudy,
    plannedStudyStart: fields.plannedStudyStart,
    preferredConsultationMethod: fields.preferredConsultationMethod,
    preferredConsultationDate: fields.preferredConsultationDate,
    preferredConsultationTime: fields.preferredConsultationTime,
    discoverySources: fields.discoverySources,
    otherDiscoverySource: fields.otherDiscoverySource,
    referralCode: fields.referralCode,
  });
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, message: toUserFacingValidationMessage(firstIssue) },
        { status: 422 },
      ),
    };
  }

  const data = parsed.data;
  const canonical = toCanonicalContactFields(data);
  const staffBranch = getStaffBranch(data.preferredBranch);

  return {
    ok: true,
    data: {
      currentLocation: data.currentLocation,
      preferredBranch: data.preferredBranch,
      referredByStaff: data.referredByStaff === 'yes',
      referredStaffId: toNullable(data.referredStaffId),
      referredStaffName: data.referredStaffName || null,
      referredStaffBranch: data.referredStaffBranch || null,
      fullName: data.fullName,
      mobileNumber: data.mobileNumber,
      emailAddress: data.emailAddress,
      dateOfBirth: data.dateOfBirth,
      highestEducationalAttainment: data.highestEducationalAttainment,
      englishTest: data.englishTest,
      studyDestinations: data.studyDestinations,
      otherStudyDestination: data.otherStudyDestination,
      preferredCoursesOfStudy: data.preferredCoursesOfStudy,
      otherPreferredCourseOfStudy: data.otherPreferredCourseOfStudy,
      plannedStudyStart: data.plannedStudyStart,
      preferredConsultationMethod: data.preferredConsultationMethod,
      preferredConsultationDate: data.preferredConsultationDate,
      preferredConsultationTime: data.preferredConsultationTime,
      discoverySources: data.discoverySources,
      otherDiscoverySource: data.otherDiscoverySource,
      referralCode: toNullable(data.referralCode || ''),
      isUsPassportHolder: data.isUsPassportHolder === 'yes',
      hasWorked: data.hasWorked === 'yes',
      hasVisaRefusal: data.hasVisaRefusal === 'yes',
      staffBranch,
      normalizedEmail: canonical.normalizedEmail,
      normalizedMobile: canonical.normalizedMobile,
      duplicateKey: buildDuplicateKey(data.fullName, data.dateOfBirth),
    },
  };
};

