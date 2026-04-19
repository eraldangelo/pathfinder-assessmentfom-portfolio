import type { Firestore } from 'firebase-admin/firestore';
import { normalizeEmail, normalizePhilippineMobile } from '../domain/normalization';
import { buildEmailIndexId, buildMobileIndexId } from './leadIndexKeys';
import { isLegacyBroadFallbackEnabled } from './precheckConfig';
type ContactLookupInput = {
  emailAddress?: string;
  mobileNumber?: string;
};
type ContactUsageResult = {
  emailInUse: boolean;
  mobileInUse: boolean;
  lookupMode: 'indexed' | 'compatibility_fallback';
  broadLegacyFallbackEnabled: boolean;
  broadLegacyFallbackUsed: boolean;
  indexIssueDetected: boolean;
};
export const CONTACT_INDEX_COLLECTION = 'leadContactIndex';
const warnedFallbackLabels = new Set<string>();
const COLLECTION_GROUP_INDEX_RETRY_COOLDOWN_MS = 30_000;
let collectionGroupIndexRetryAt = 0;
type LookupDiagnostics = {
  compatibilityFallbackUsed: boolean;
  broadLegacyFallbackUsed: boolean;
  broadLegacyFallbackEnabled: boolean;
  indexIssueDetected: boolean;
  collectionGroupIndexUnavailable: boolean;
};
const isCollectionGroupFallbackLabel = (label: string) => label.startsWith('collectionGroup-');
const isCollectionGroupRetrySuppressed = () => Date.now() < collectionGroupIndexRetryAt;
const suppressCollectionGroupRetriesTemporarily = () => {
  collectionGroupIndexRetryAt = Date.now() + COLLECTION_GROUP_INDEX_RETRY_COOLDOWN_MS;
};
type QueryMatchResult = 'matched' | 'not_matched' | 'index_unavailable';
const isFailedPrecondition = (error: unknown) => {
  const code = (error as { code?: unknown })?.code;
  if (code === 9 || code === '9' || code === 'failed-precondition' || code === 'FAILED_PRECONDITION') {
    return true;
  }
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /FAILED_PRECONDITION|requires an index/i.test(message);
};
const warnIndexFallbackOnce = (label: string, error: unknown) => {
  if (warnedFallbackLabels.has(label)) return;
  warnedFallbackLabels.add(label);
  console.warn(`[contact-usage] Fallback query index unavailable (${label}).`, error);
};
const queryMatchSafely = async (
  diagnostics: LookupDiagnostics,
  label: string,
  lookup: () => Promise<{ empty: boolean }>,
): Promise<QueryMatchResult> => {
  if (
    isCollectionGroupFallbackLabel(label)
    && (diagnostics.collectionGroupIndexUnavailable || isCollectionGroupRetrySuppressed())
  ) {
    diagnostics.indexIssueDetected = true;
    diagnostics.collectionGroupIndexUnavailable = true;
    return 'index_unavailable';
  }
  try {
    const snapshot = await lookup();
    return snapshot.empty ? 'not_matched' : 'matched';
  } catch (error) {
    if (isFailedPrecondition(error)) {
      diagnostics.indexIssueDetected = true;
      if (isCollectionGroupFallbackLabel(label)) {
        diagnostics.collectionGroupIndexUnavailable = true;
        suppressCollectionGroupRetriesTemporarily();
      }
      warnIndexFallbackOnce(label, error);
      return 'index_unavailable';
    }
    throw error;
  }
};
const hasLegacyCaseInsensitiveEmailMatch = (
  docs: Array<{ data: () => Record<string, unknown> }>,
  normalizedEmail: string,
) =>
  docs.some((doc) => {
    const emailAddress = doc.data()?.emailAddress;
    return typeof emailAddress === 'string' && normalizeEmail(emailAddress) === normalizedEmail;
  });
const isLegacyEmailUsedByCaseInsensitiveScan = async (
  adminDb: Firestore,
  normalizedEmail: string,
  diagnostics: LookupDiagnostics,
) => {
  if (!diagnostics.broadLegacyFallbackEnabled) return false;
  diagnostics.compatibilityFallbackUsed = true;
  diagnostics.broadLegacyFallbackUsed = true;
  let shouldTryRootFallback = false;
  try {
    const snapshot = await adminDb.collectionGroup('leads').select('emailAddress').get();
    if (hasLegacyCaseInsensitiveEmailMatch(snapshot.docs, normalizedEmail)) return true;
  } catch (error) {
    if (isFailedPrecondition(error)) {
      diagnostics.indexIssueDetected = true;
      warnIndexFallbackOnce('collectionGroup-legacyEmailCaseScan', error);
      shouldTryRootFallback = true;
    } else {
      throw error;
    }
  }
  if (!shouldTryRootFallback) return false;
  const rootSnapshot = await adminDb.collection('leads').select('emailAddress').get();
  return hasLegacyCaseInsensitiveEmailMatch(rootSnapshot.docs, normalizedEmail);
};
const isEmailUsedByNormalizedQuery = async (
  adminDb: Firestore,
  normalizedEmail: string,
  diagnostics: LookupDiagnostics,
) => {
  if (!normalizedEmail) return false;
  diagnostics.compatibilityFallbackUsed = true;
  const normalizedMatch = await queryMatchSafely(diagnostics, 'collectionGroup-normalizedEmail', () =>
    adminDb
      .collectionGroup('leads')
      .where('normalizedEmail', '==', normalizedEmail)
      .limit(1)
      .get(),
  );
  if (normalizedMatch === 'matched') return true;
  if (normalizedMatch === 'index_unavailable') {
    const normalizedRootMatch = await queryMatchSafely(diagnostics, 'root-normalizedEmail', () =>
      adminDb
        .collection('leads')
        .where('normalizedEmail', '==', normalizedEmail)
        .limit(1)
        .get(),
    );
    if (normalizedRootMatch === 'matched') return true;
  }
  // Transitional fallback for legacy records without normalized fields.
  const legacyMatch = await queryMatchSafely(diagnostics, 'collectionGroup-legacyEmail', () =>
    adminDb
      .collectionGroup('leads')
      .where('emailAddress', '==', normalizedEmail)
      .limit(1)
      .get(),
  );
  if (legacyMatch === 'matched') return true;
  if (legacyMatch === 'index_unavailable') {
    const legacyRootMatch = await queryMatchSafely(diagnostics, 'root-legacyEmail', () =>
      adminDb
        .collection('leads')
        .where('emailAddress', '==', normalizedEmail)
        .limit(1)
        .get(),
    );
    if (legacyRootMatch === 'matched') return true;
  }
  return isLegacyEmailUsedByCaseInsensitiveScan(adminDb, normalizedEmail, diagnostics);
};
const isMobileUsedByNormalizedQuery = async (
  adminDb: Firestore,
  normalizedMobile: string,
  diagnostics: LookupDiagnostics,
) => {
  if (!normalizedMobile) return false;
  diagnostics.compatibilityFallbackUsed = true;
  const normalizedMatch = await queryMatchSafely(diagnostics, 'collectionGroup-normalizedMobile', () =>
    adminDb
      .collectionGroup('leads')
      .where('normalizedMobile', '==', normalizedMobile)
      .limit(1)
      .get(),
  );
  if (normalizedMatch === 'matched') return true;
  if (normalizedMatch === 'index_unavailable') {
    const normalizedRootMatch = await queryMatchSafely(diagnostics, 'root-normalizedMobile', () =>
      adminDb
        .collection('leads')
        .where('normalizedMobile', '==', normalizedMobile)
        .limit(1)
        .get(),
    );
    if (normalizedRootMatch === 'matched') return true;
  }
  // Transitional fallback for legacy records without normalized fields.
  const legacyCandidates = [`+63${normalizedMobile}`, `0${normalizedMobile}`, normalizedMobile];
  const legacyMatch = await queryMatchSafely(diagnostics, 'collectionGroup-legacyMobile', () =>
    adminDb
      .collectionGroup('leads')
      .where('mobileNumber', 'in', legacyCandidates)
      .limit(1)
      .get(),
  );
  if (legacyMatch === 'matched') return true;
  if (legacyMatch !== 'index_unavailable') return false;
  const legacyRootMatch = await queryMatchSafely(diagnostics, 'root-legacyMobile', () =>
    adminDb
      .collection('leads')
      .where('mobileNumber', 'in', legacyCandidates)
      .limit(1)
      .get(),
  );
  return legacyRootMatch === 'matched';
};
export const findContactUsageAcrossLeadCollections = async (
  adminDb: Firestore,
  { emailAddress = '', mobileNumber = '' }: ContactLookupInput,
): Promise<ContactUsageResult> => {
  const diagnostics: LookupDiagnostics = {
    compatibilityFallbackUsed: false,
    broadLegacyFallbackUsed: false,
    broadLegacyFallbackEnabled: isLegacyBroadFallbackEnabled(),
    indexIssueDetected: false,
    collectionGroupIndexUnavailable: false,
  };
  const normalizedEmail = normalizeEmail(emailAddress);
  const normalizedMobile = normalizePhilippineMobile(mobileNumber);
  if (!normalizedEmail && !normalizedMobile) {
    return {
      emailInUse: false,
      mobileInUse: false,
      lookupMode: 'indexed',
      broadLegacyFallbackEnabled: diagnostics.broadLegacyFallbackEnabled,
      broadLegacyFallbackUsed: false,
      indexIssueDetected: false,
    };
  }
  const emailIndexPromise = normalizedEmail
    ? adminDb.collection(CONTACT_INDEX_COLLECTION).doc(buildEmailIndexId(normalizedEmail)).get()
    : null;
  const mobileIndexPromise = normalizedMobile
    ? adminDb.collection(CONTACT_INDEX_COLLECTION).doc(buildMobileIndexId(normalizedMobile)).get()
    : null;
  const [emailIndexDoc, mobileIndexDoc] = await Promise.all([emailIndexPromise, mobileIndexPromise]);
  let emailInUse = Boolean(emailIndexDoc?.exists);
  let mobileInUse = Boolean(mobileIndexDoc?.exists);
  if (!emailInUse && normalizedEmail) {
    emailInUse = await isEmailUsedByNormalizedQuery(adminDb, normalizedEmail, diagnostics);
  }
  if (!mobileInUse && normalizedMobile) {
    mobileInUse = await isMobileUsedByNormalizedQuery(adminDb, normalizedMobile, diagnostics);
  }
  return {
    emailInUse,
    mobileInUse,
    lookupMode: diagnostics.compatibilityFallbackUsed ? 'compatibility_fallback' : 'indexed',
    broadLegacyFallbackEnabled: diagnostics.broadLegacyFallbackEnabled,
    broadLegacyFallbackUsed: diagnostics.broadLegacyFallbackUsed,
    indexIssueDetected: diagnostics.indexIssueDetected,
  };
};
