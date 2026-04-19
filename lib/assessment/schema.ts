import { z } from 'zod';

import { branches, consultationMethods, consultationTimes, getStaffBranch, OFFICE_NOW_VALUE } from './constants';
import { normalizeEmail, normalizePhilippineMobile } from './domain/normalization';
import { isTomorrowOrLater, isValidIsoDate, isWeekday } from './rules/consultationDate';

const yesNoSchema = z.enum(['yes', 'no']);
const branchSchema = z.enum(branches);
const consultationMethodSchema = z.enum(consultationMethods);
const consultationTimeSchema = z.enum(consultationTimes);
const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
const emailSchema = z.string().trim().max(254).email('Please enter a valid email address.');
const mobileSchema = z
  .string()
  .trim()
  .max(32)
  .refine((value) => normalizePhilippineMobile(value).length === 10, 'Please enter a valid mobile number.');

const stringArray = (maxItemLength: number) =>
  z.array(z.string().trim().min(1).max(maxItemLength));

const nonEmptyTrimmed = (max: number, message: string) =>
  z.string().trim().min(1, message).max(max, message);

export const submissionSchema = z
  .object({
    currentLocation: nonEmptyTrimmed(120, 'Please enter your current location.'),
    preferredBranch: branchSchema,
    referredByStaff: yesNoSchema,
    referredStaffId: z
      .union([z.string().trim().max(120), z.null()])
      .optional()
      .transform((value) => (typeof value === 'string' ? value : '')),
    referredStaffName: z.string().trim().max(120).optional().nullable(),
    referredStaffBranch: z.string().trim().max(60).optional().nullable(),
    fullName: nonEmptyTrimmed(140, 'Please enter your full name.'),
    mobileNumber: mobileSchema,
    emailAddress: emailSchema,
    dateOfBirth: z
      .string()
      .trim()
      .regex(isoDateRegex, 'Please provide a valid date of birth.')
      .refine((value) => isValidIsoDate(value), 'Please provide a valid date of birth.'),
    isUsPassportHolder: yesNoSchema,
    highestEducationalAttainment: nonEmptyTrimmed(120, 'Please select your highest educational attainment.'),
    englishTest: nonEmptyTrimmed(120, 'Please select your English test.'),
    hasWorked: yesNoSchema,
    hasVisaRefusal: yesNoSchema,
    studyDestinations: stringArray(80)
      .min(1, 'Please select at least one study destination.')
      .transform((items) => Array.from(new Set(items))),
    otherStudyDestination: z.string().trim().max(80).optional().default(''),
    preferredCoursesOfStudy: stringArray(120)
      .min(1, 'Please select at least one preferred course of study.')
      .transform((items) => Array.from(new Set(items))),
    otherPreferredCourseOfStudy: z.string().trim().max(120).optional().default(''),
    plannedStudyStart: z
      .string()
      .trim()
      .regex(monthRegex, 'Please select when you plan to start your study abroad.'),
    preferredConsultationMethod: consultationMethodSchema,
    preferredConsultationDate: z
      .string()
      .trim()
      .regex(isoDateRegex, 'Please select a valid consultation date.')
      .refine((value) => isValidIsoDate(value), 'Please select a valid consultation date.'),
    preferredConsultationTime: consultationTimeSchema,
    discoverySources: stringArray(120)
      .min(1, 'Please select how you heard about us.')
      .transform((items) => Array.from(new Set(items))),
    otherDiscoverySource: z.string().trim().max(120).optional().default(''),
    referralCode: z.string().trim().max(80).nullable().optional().default(''),
  })
  .superRefine((data, ctx) => {
    const staffBranch = getStaffBranch(data.preferredBranch);
    if (data.referredByStaff === 'yes' && staffBranch && !data.referredStaffId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['referredStaffId'],
        message: 'Please select a staff member.',
      });
    }

    if (data.studyDestinations.includes('Other') && !data.otherStudyDestination) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['otherStudyDestination'],
        message: 'Please specify your other study destination.',
      });
    }

    if (data.preferredCoursesOfStudy.includes('Others') && !data.otherPreferredCourseOfStudy) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['otherPreferredCourseOfStudy'],
        message: 'Please specify your other preferred course of study.',
      });
    }

    if (data.preferredConsultationMethod !== OFFICE_NOW_VALUE) {
      if (!isTomorrowOrLater(data.preferredConsultationDate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['preferredConsultationDate'],
          message: 'Please select a consultation date starting tomorrow.',
        });
      } else if (!isWeekday(data.preferredConsultationDate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['preferredConsultationDate'],
          message: 'Please select a weekday (Monday to Friday).',
        });
      }
    }

    if (data.discoverySources.includes('Others') && !data.otherDiscoverySource) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['otherDiscoverySource'],
        message: 'Please specify how you heard about us.',
      });
    }
  });

export type SubmissionInput = z.input<typeof submissionSchema>;
export type SubmissionData = z.output<typeof submissionSchema>;

const fallbackFieldMessages: Record<string, string> = {
  currentLocation: 'Please enter your current location.',
  preferredBranch: 'Please select a preferred branch.',
  referredByStaff: 'Please select if you were referred by a staff member.',
  referredStaffId: 'Please select a staff member.',
  fullName: 'Please enter your full name.',
  mobileNumber: 'Please enter a valid mobile number.',
  emailAddress: 'Please enter a valid email address.',
  dateOfBirth: 'Please provide a valid date of birth.',
  isUsPassportHolder: 'Please select your passport holder status.',
  highestEducationalAttainment: 'Please select your highest educational attainment.',
  englishTest: 'Please select your English test.',
  hasWorked: 'Please select if you have worked.',
  hasVisaRefusal: 'Please select your visa refusal status.',
  studyDestinations: 'Please select at least one study destination.',
  otherStudyDestination: 'Please specify your other study destination.',
  preferredCoursesOfStudy: 'Please select at least one preferred course of study.',
  otherPreferredCourseOfStudy: 'Please specify your other preferred course of study.',
  plannedStudyStart: 'Please select when you plan to start your study abroad.',
  preferredConsultationMethod: 'Please select your preferred consultation method.',
  preferredConsultationDate: 'Please select a valid consultation date.',
  preferredConsultationTime: 'Please select your preferred consultation time.',
  discoverySources: 'Please select how you heard about us.',
  otherDiscoverySource: 'Please specify how you heard about us.',
};

export const toUserFacingValidationMessage = (issue?: z.ZodIssue) => {
  if (!issue) return 'Invalid submission payload.';
  const field = typeof issue.path[0] === 'string' ? issue.path[0] : '';
  if (field && (issue.message.startsWith('Invalid option') || issue.message.startsWith('Invalid input'))) {
    return fallbackFieldMessages[field] || issue.message;
  }
  return issue.message || fallbackFieldMessages[field] || 'Invalid submission payload.';
};

export const toCanonicalContactFields = (data: Pick<SubmissionData, 'emailAddress' | 'mobileNumber'>) => ({
  normalizedEmail: normalizeEmail(data.emailAddress),
  normalizedMobile: normalizePhilippineMobile(data.mobileNumber),
});

const stepFieldOrder: Record<1 | 2 | 3 | 4 | 5 | 6, Array<keyof SubmissionData>> = {
  1: ['currentLocation', 'preferredBranch', 'referredByStaff', 'referredStaffId'],
  2: ['fullName', 'mobileNumber', 'emailAddress', 'dateOfBirth', 'isUsPassportHolder'],
  3: ['highestEducationalAttainment', 'englishTest', 'hasWorked', 'hasVisaRefusal'],
  4: ['studyDestinations', 'otherStudyDestination', 'preferredCoursesOfStudy', 'otherPreferredCourseOfStudy', 'plannedStudyStart'],
  5: ['preferredConsultationMethod', 'preferredConsultationDate', 'preferredConsultationTime'],
  6: ['discoverySources', 'otherDiscoverySource'],
};

export const getStepValidationErrorFromSchema = (
  step: 1 | 2 | 3 | 4 | 5 | 6,
  input: SubmissionInput,
) => {
  const parsed = submissionSchema.safeParse(input);
  if (parsed.success) return null;
  const allowedFields = new Set(stepFieldOrder[step]);
  const issue = parsed.error.issues.find((item) => {
    const field = item.path[0];
    return typeof field === 'string' && allowedFields.has(field as keyof SubmissionData);
  });
  return issue ? toUserFacingValidationMessage(issue) : null;
};

