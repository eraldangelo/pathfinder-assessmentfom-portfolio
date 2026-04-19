import type { NextRequest } from 'next/server';

import type { ParsedSubmissionFields, SubmissionPayload } from './types';

const getFormValue = (formData: FormData | null, key: string) => {
  const value = formData?.get(key);
  return typeof value === 'string' ? value : '';
};

export const asString = (value: unknown) => (typeof value === 'string' ? value : '');

const parseStringArray = (value: unknown) => {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  if (typeof value !== 'string') return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    // ignore parse failures
  }
  return [];
};

export const readSubmissionPayload = async (request: NextRequest): Promise<SubmissionPayload> => {
  const contentType = request.headers.get('content-type') ?? '';
  let body: Record<string, unknown> = {};
  let resumeFile: File | null = null;
  let formData: FormData | null = null;

  if (contentType.includes('multipart/form-data')) {
    formData = await request.formData();
    body = {
      currentLocation: getFormValue(formData, 'currentLocation'),
      preferredBranch: getFormValue(formData, 'preferredBranch'),
      referredByStaff: getFormValue(formData, 'referredByStaff'),
      referredStaffId: getFormValue(formData, 'referredStaffId'),
      referredStaffName: getFormValue(formData, 'referredStaffName'),
      referredStaffBranch: getFormValue(formData, 'referredStaffBranch'),
      fullName: getFormValue(formData, 'fullName'),
      mobileNumber: getFormValue(formData, 'mobileNumber'),
      emailAddress: getFormValue(formData, 'emailAddress'),
      dateOfBirth: getFormValue(formData, 'dateOfBirth'),
      isUsPassportHolder: getFormValue(formData, 'isUsPassportHolder'),
      highestEducationalAttainment: getFormValue(formData, 'highestEducationalAttainment'),
      englishTest: getFormValue(formData, 'englishTest'),
      hasWorked: getFormValue(formData, 'hasWorked'),
      hasVisaRefusal: getFormValue(formData, 'hasVisaRefusal'),
      studyDestinations: getFormValue(formData, 'studyDestinations'),
      otherStudyDestination: getFormValue(formData, 'otherStudyDestination'),
      preferredCoursesOfStudy: getFormValue(formData, 'preferredCoursesOfStudy'),
      otherPreferredCourseOfStudy: getFormValue(formData, 'otherPreferredCourseOfStudy'),
      plannedStudyStart: getFormValue(formData, 'plannedStudyStart'),
      preferredConsultationMethod: getFormValue(formData, 'preferredConsultationMethod'),
      preferredConsultationDate: getFormValue(formData, 'preferredConsultationDate'),
      preferredConsultationTime: getFormValue(formData, 'preferredConsultationTime'),
      discoverySources: getFormValue(formData, 'discoverySources'),
      otherDiscoverySource: getFormValue(formData, 'otherDiscoverySource'),
      referralCode: getFormValue(formData, 'referralCode'),
    };
    const fileValue = formData.get('resumeFile');
    if (fileValue && typeof fileValue !== 'string') {
      resumeFile = fileValue;
    }
  } else {
    let parsed: unknown;
    try {
      parsed = await request.json();
    } catch {
      throw new Error('Invalid JSON payload.');
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Request body must be a JSON object.');
    }
    body = parsed as Record<string, unknown>;
  }

  return {
    contentType,
    body,
    formData,
    resumeFile,
  };
};

export const readTurnstileToken = (payload: SubmissionPayload): unknown =>
  payload.contentType.includes('multipart/form-data')
    ? payload.formData?.get('cf-turnstile-response')
    : payload.body['cf-turnstile-response'];

export const parseSubmissionFields = (body: Record<string, unknown>): ParsedSubmissionFields => ({
  currentLocation: asString(body.currentLocation).trim(),
  preferredBranch: asString(body.preferredBranch),
  referredByStaff: asString(body.referredByStaff).trim(),
  referredStaffId: asString(body.referredStaffId).trim() || null,
  referredStaffName: asString(body.referredStaffName).trim() || null,
  referredStaffBranch: asString(body.referredStaffBranch).trim() || null,
  fullName: asString(body.fullName).trim(),
  mobileNumber: asString(body.mobileNumber).trim(),
  emailAddress: asString(body.emailAddress).trim(),
  dateOfBirth: asString(body.dateOfBirth).trim(),
  isUsPassportHolderRaw: asString(body.isUsPassportHolder).trim(),
  highestEducationalAttainment: asString(body.highestEducationalAttainment).trim(),
  englishTest: asString(body.englishTest).trim(),
  hasWorkedRaw: asString(body.hasWorked).trim(),
  hasVisaRefusalRaw: asString(body.hasVisaRefusal).trim(),
  studyDestinations: parseStringArray(body.studyDestinations),
  otherStudyDestination: asString(body.otherStudyDestination).trim(),
  preferredCoursesOfStudy: parseStringArray(body.preferredCoursesOfStudy),
  otherPreferredCourseOfStudy: asString(body.otherPreferredCourseOfStudy).trim(),
  plannedStudyStart: asString(body.plannedStudyStart).trim(),
  preferredConsultationMethod: asString(body.preferredConsultationMethod).trim(),
  preferredConsultationDate: asString(body.preferredConsultationDate).trim(),
  preferredConsultationTime: asString(body.preferredConsultationTime).trim(),
  discoverySources: parseStringArray(body.discoverySources),
  otherDiscoverySource: asString(body.otherDiscoverySource).trim(),
  referralCode: asString(body.referralCode).trim() || null,
});

