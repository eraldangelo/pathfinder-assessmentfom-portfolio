import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

import { getAdminApp } from '../../../lib/firebaseAdmin';
import { findContactUsageAcrossLeadCollections } from '../../../lib/assessment/server/leadContactUsage';
import { DUPLICATE_INDEX_COLLECTION, lookupDuplicateByNameAndDob } from '../../../lib/assessment/server/duplicateIndex';
import { buildEmailIndexId, buildMobileIndexId } from '../../../lib/assessment/server/leadIndexKeys';
import { CONTACT_INDEX_COLLECTION } from '../../../lib/assessment/server/leadContactUsage';

import { readSubmissionPayload, readTurnstileToken, parseSubmissionFields } from './lib/payload';
import { notifyAssessmentRecipients, resolveReferredStaff } from './lib/referral';
import { uploadResumeIfPresent } from './lib/resume';
import { verifyTurnstileToken } from './lib/turnstile';
import { validateSubmissionFields } from './lib/validation';
import { enforceRateLimit } from '../_shared/rateLimit';
import { rejectIfBodyTooLarge } from '../_shared/requestSize';
import { assertSubmitEnv } from '../../../lib/config/env.server';

class SubmissionConflictError extends Error {
  constructor(public readonly fields: string[], message: string) {
    super(message);
    this.name = 'SubmissionConflictError';
  }
}

export async function POST(request: NextRequest) {
  let uploadedResumePath: string | null = null;
  let adminApp: ReturnType<typeof getAdminApp> | null = null;
  const rate = await enforceRateLimit(request, { bucket: 'submit-assessment', maxHits: 30, windowMs: 60_000 });
  if (rate.blocked) return rate.response;

  const sizeError = rejectIfBodyTooLarge(request, 8 * 1024 * 1024);
  if (sizeError) return sizeError;

  try {
    assertSubmitEnv();

    const payload = await readSubmissionPayload(request);
    const turnstileToken = readTurnstileToken(payload);

    if (!turnstileToken || typeof turnstileToken !== 'string') {
      return NextResponse.json({ ok: false, message: 'Captcha verification required.' }, { status: 400 });
    }

    const turnstileError = await verifyTurnstileToken(request, turnstileToken);
    if (turnstileError) {
      return turnstileError;
    }

    const parsedFields = parseSubmissionFields(payload.body);
    const validation = validateSubmissionFields(parsedFields);
    if (!validation.ok) {
      return validation.response;
    }

    const fields = validation.data;
    adminApp = getAdminApp();
    const adminDb = getFirestore(adminApp);

    const duplicate = await lookupDuplicateByNameAndDob(adminDb, fields.fullName, fields.dateOfBirth);
    if (duplicate.exists) {
      return NextResponse.json(
        {
          ok: false,
          message: 'We already have your details on file. Please contact your assigned branch instead of submitting a new assessment form.',
          duplicate: true,
          branch: duplicate.branch,
        },
        { status: 409 },
      );
    }

    const { emailInUse, mobileInUse } = await findContactUsageAcrossLeadCollections(adminDb, {
      emailAddress: fields.emailAddress,
      mobileNumber: fields.mobileNumber,
    });

    if (emailInUse || mobileInUse) {
      const conflictingFields = [
        emailInUse ? 'email address' : null,
        mobileInUse ? 'mobile number' : null,
      ].filter(Boolean);
      return NextResponse.json(
        {
          ok: false,
          message: `This ${conflictingFields.join(' and ')} is already in use. Please contact your assigned branch instead of submitting a new assessment form.`,
        },
        { status: 409 },
      );
    }

    const referredStaff = await resolveReferredStaff({
      adminDb,
      referredByStaff: fields.referredByStaff,
      referredStaffId: fields.referredStaffId,
      referredStaffName: fields.referredStaffName,
      referredStaffBranch: fields.referredStaffBranch,
    });

    const resumeResult = await uploadResumeIfPresent(adminApp, payload.resumeFile);
    if (!resumeResult.ok) {
      return resumeResult.response;
    }
    uploadedResumePath = resumeResult.data.resumeStoragePath;

    const leadRef = adminDb.collection('leads').doc();
    const emailIndexRef = adminDb.collection(CONTACT_INDEX_COLLECTION).doc(buildEmailIndexId(fields.normalizedEmail));
    const mobileIndexRef = adminDb.collection(CONTACT_INDEX_COLLECTION).doc(buildMobileIndexId(fields.normalizedMobile));
    const duplicateIndexRef = adminDb.collection(DUPLICATE_INDEX_COLLECTION).doc(fields.duplicateKey);

    await adminDb.runTransaction(async (tx) => {
      const [emailIndexDoc, mobileIndexDoc, duplicateIndexDoc] = await tx.getAll(
        emailIndexRef,
        mobileIndexRef,
        duplicateIndexRef,
      );
      const conflicts: string[] = [];
      if (emailIndexDoc.exists) conflicts.push('email');
      if (mobileIndexDoc.exists) conflicts.push('mobile');
      if (duplicateIndexDoc.exists) conflicts.push('duplicate');
      if (conflicts.length > 0) {
        throw new SubmissionConflictError(conflicts, 'Detected duplicate submission conflict.');
      }

      tx.set(leadRef, {
        currentLocation: fields.currentLocation,
        preferredBranch: fields.preferredBranch,
        referredByStaff: fields.referredByStaff,
        referredStaffId: fields.referredStaffId,
        referredStaffName: referredStaff.effectiveReferredStaffName,
        referredStaffBranch: referredStaff.effectiveReferredStaffBranch,
        fullName: fields.fullName,
        mobileNumber: fields.mobileNumber,
        emailAddress: fields.emailAddress,
        normalizedEmail: fields.normalizedEmail,
        normalizedMobile: fields.normalizedMobile,
        duplicateKey: fields.duplicateKey,
        dateOfBirth: fields.dateOfBirth,
        isUsPassportHolder: fields.isUsPassportHolder,
        highestEducationalAttainment: fields.highestEducationalAttainment,
        englishTest: fields.englishTest,
        hasWorked: fields.hasWorked,
        hasVisaRefusal: fields.hasVisaRefusal,
        studyDestinations: fields.studyDestinations,
        otherStudyDestination: fields.otherStudyDestination || null,
        preferredCoursesOfStudy: fields.preferredCoursesOfStudy,
        otherPreferredCourseOfStudy: fields.otherPreferredCourseOfStudy || null,
        plannedStudyStart: fields.plannedStudyStart,
        preferredConsultationMethod: fields.preferredConsultationMethod,
        preferredConsultationDate: fields.preferredConsultationDate,
        preferredConsultationTime: fields.preferredConsultationTime,
        discoverySources: fields.discoverySources,
        otherDiscoverySource: fields.otherDiscoverySource || null,
        referralCode: fields.referralCode,
        resumeStoragePath: resumeResult.data.resumeStoragePath,
        resumeFileName: resumeResult.data.resumeFileName,
        resumeContentType: resumeResult.data.resumeContentType,
        resumeFileSize: resumeResult.data.resumeFileSize,
        assignedCounsellor: referredStaff.assignedCounsellor,
        assignedCounsellorUid: referredStaff.assignedCounsellorUid,
        createdAt: FieldValue.serverTimestamp(),
        source: 'assessment-form',
        version: 3,
      });

      tx.set(emailIndexRef, {
        type: 'email',
        normalizedValue: fields.normalizedEmail,
        leadRefPath: leadRef.path,
        preferredBranch: fields.preferredBranch,
        createdAt: FieldValue.serverTimestamp(),
      });
      tx.set(mobileIndexRef, {
        type: 'mobile',
        normalizedValue: fields.normalizedMobile,
        leadRefPath: leadRef.path,
        preferredBranch: fields.preferredBranch,
        createdAt: FieldValue.serverTimestamp(),
      });
      tx.set(duplicateIndexRef, {
        duplicateKey: fields.duplicateKey,
        preferredBranch: fields.preferredBranch,
        fullName: fields.fullName,
        dateOfBirth: fields.dateOfBirth,
        leadRefPath: leadRef.path,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    await notifyAssessmentRecipients({
      adminDb,
      staffBranch: fields.staffBranch,
      fullName: fields.fullName,
      preferredBranch: fields.preferredBranch,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (uploadedResumePath && adminApp) {
      try {
        await getStorage(adminApp).bucket().file(uploadedResumePath).delete({ ignoreNotFound: true });
      } catch (cleanupError) {
        console.error('Failed to cleanup quarantine upload after submit failure', cleanupError);
      }
    }
    if (err instanceof Error && ['Invalid JSON payload.', 'Request body must be a JSON object.'].includes(err.message)) {
      return NextResponse.json({ ok: false, message: err.message }, { status: 400 });
    }
    if (err instanceof SubmissionConflictError) {
      const isDuplicate = err.fields.includes('duplicate');
      const hasContactConflict = err.fields.includes('email') || err.fields.includes('mobile');
      if (isDuplicate) {
        return NextResponse.json(
          {
            ok: false,
            message: 'We already have your details on file. Please contact your assigned branch instead of submitting a new assessment form.',
            duplicate: true,
          },
          { status: 409 },
        );
      }
      if (hasContactConflict) {
        return NextResponse.json(
          {
            ok: false,
            message: 'This email address or mobile number is already in use. Please contact your assigned branch instead of submitting a new assessment form.',
          },
          { status: 409 },
        );
      }
    }
    console.error('API/submit error', err);
    return NextResponse.json({ ok: false, message: 'Submission failed.' }, { status: 500 });
  }
}

