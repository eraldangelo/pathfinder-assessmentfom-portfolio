import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { getAdminApp } from '../../../lib/firebaseAdmin';
import { findContactUsageAcrossLeadCollections } from '../../../lib/assessment/server/leadContactUsage';
import { shouldLogIndexedPrecheckMode } from '../../../lib/assessment/server/precheckConfig';
import { parseJsonObjectBody } from '../_shared/bodyValidation';
import { enforceRateLimit } from '../_shared/rateLimit';
import { rejectIfBodyTooLarge } from '../_shared/requestSize';

export async function POST(request: NextRequest) {
  const rate = await enforceRateLimit(request, { bucket: 'check-contact-usage', maxHits: 90, windowMs: 60_000 });
  if (rate.blocked) return rate.response;

  const sizeError = rejectIfBodyTooLarge(request, 16 * 1024);
  if (sizeError) return sizeError;

  try {
    const parsed = await parseJsonObjectBody(request);
    if (!parsed.ok) return parsed.response;

    const emailAddress = typeof parsed.data.emailAddress === 'string' ? parsed.data.emailAddress : '';
    const mobileNumber = typeof parsed.data.mobileNumber === 'string' ? parsed.data.mobileNumber : '';

    const adminDb = getFirestore(getAdminApp());
    const lookup = await findContactUsageAcrossLeadCollections(adminDb, {
      emailAddress,
      mobileNumber,
    });
    const shouldLogIndexed = shouldLogIndexedPrecheckMode();
    if (lookup.lookupMode !== 'indexed' || lookup.indexIssueDetected || shouldLogIndexed) {
      console.info('[contact-usage-precheck] lookup-mode', {
        mode: lookup.lookupMode,
        emailInUse: lookup.emailInUse,
        mobileInUse: lookup.mobileInUse,
        indexIssueDetected: lookup.indexIssueDetected,
        broadLegacyFallbackEnabled: lookup.broadLegacyFallbackEnabled,
        broadLegacyFallbackUsed: lookup.broadLegacyFallbackUsed,
      });
    }

    return NextResponse.json({
      ok: true,
      emailInUse: lookup.emailInUse,
      mobileInUse: lookup.mobileInUse,
    });
  } catch (err) {
    console.error('[contact-usage-precheck] lookup-mode', { mode: 'failed', reason: 'exception', err });
    return NextResponse.json({
      ok: false,
      message: 'Contact usage precheck is temporarily unavailable. Please retry.',
    }, { status: 503 });
  }
}
