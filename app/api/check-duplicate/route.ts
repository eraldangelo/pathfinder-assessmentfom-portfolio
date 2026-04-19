import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { getAdminApp } from '../../../lib/firebaseAdmin';
import { lookupDuplicateByNameAndDob } from '../../../lib/assessment/server/duplicateIndex';
import { shouldLogIndexedPrecheckMode } from '../../../lib/assessment/server/precheckConfig';
import { parseJsonObjectBody, readTrimmedString } from '../_shared/bodyValidation';
import { enforceRateLimit } from '../_shared/rateLimit';
import { rejectIfBodyTooLarge } from '../_shared/requestSize';
import { isValidIsoDate } from '../../../lib/assessment/rules/consultationDate';

export async function POST(request: NextRequest) {
  const rate = await enforceRateLimit(request, { bucket: 'check-duplicate', maxHits: 90, windowMs: 60_000 });
  if (rate.blocked) return rate.response;

  const sizeError = rejectIfBodyTooLarge(request, 16 * 1024);
  if (sizeError) return sizeError;

  try {
    const parsed = await parseJsonObjectBody(request);
    if (!parsed.ok) return parsed.response;

    const fullName = readTrimmedString(parsed.data.fullName);
    const dateOfBirth = readTrimmedString(parsed.data.dateOfBirth);

    if (!fullName || !dateOfBirth) {
      return NextResponse.json({ ok: false, message: 'Missing required fields.' }, { status: 422 });
    }
    if (fullName.length < 2 || fullName.length > 140) {
      return NextResponse.json({ ok: false, message: 'Invalid full name.' }, { status: 422 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) || !isValidIsoDate(dateOfBirth)) {
      return NextResponse.json({ ok: false, message: 'Invalid date of birth.' }, { status: 422 });
    }

    const adminDb = getFirestore(getAdminApp());
    const duplicate = await lookupDuplicateByNameAndDob(adminDb, fullName, dateOfBirth);
    const shouldLogIndexed = shouldLogIndexedPrecheckMode();
    if (duplicate.lookupMode !== 'indexed' || duplicate.indexIssueDetected || shouldLogIndexed) {
      console.info('[duplicate-precheck] lookup-mode', {
        mode: duplicate.lookupMode,
        exists: duplicate.exists,
        indexIssueDetected: duplicate.indexIssueDetected,
        broadLegacyFallbackEnabled: duplicate.broadLegacyFallbackEnabled,
        broadLegacyFallbackUsed: duplicate.broadLegacyFallbackUsed,
      });
    }

    return NextResponse.json({
      ok: true,
      exists: duplicate.exists,
      branch: duplicate.branch,
    });
  } catch (err) {
    console.error('[duplicate-precheck] lookup-mode', { mode: 'failed', reason: 'exception', err });
    return NextResponse.json({
      ok: false,
      message: 'Duplicate precheck is temporarily unavailable. Please retry.',
    }, { status: 503 });
  }
}
