import type { Firestore } from 'firebase-admin/firestore';
import { normalizeIsoDate, normalizeNameForDuplicateKey } from '../domain/normalization';
import { buildDuplicateKey } from './leadIndexKeys';
import { isLegacyBroadFallbackEnabled } from './precheckConfig';
export const DUPLICATE_INDEX_COLLECTION = 'leadDuplicateIndex';
const warnedFallbackLabels = new Set<string>();
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
  console.warn(`[duplicate-index] Fallback query index unavailable (${label}).`, error);
};
type LookupDiagnostics = {
  compatibilityFallbackUsed: boolean;
  broadLegacyFallbackUsed: boolean;
  broadLegacyFallbackEnabled: boolean;
  indexIssueDetected: boolean;
  duplicateKeyGroupQuerySucceeded: boolean;
};
type QuerySnapshotLike = {
  empty: boolean;
  docs: Array<{ data: () => Record<string, unknown> }>;
};
const querySnapshotSafely = async (
  diagnostics: LookupDiagnostics,
  label: string,
  lookup: () => Promise<QuerySnapshotLike>,
) => {
  try {
    return await lookup();
  } catch (error) {
    if (isFailedPrecondition(error)) {
      diagnostics.indexIssueDetected = true;
      warnIndexFallbackOnce(label, error);
      return null;
    }
    throw error;
  }
};
const readBranch = (data: Record<string, unknown>) =>
  typeof data.preferredBranch === 'string'
    ? data.preferredBranch
    : (typeof data.branch === 'string' ? data.branch : null);
export type DuplicateLookupResult = {
  exists: boolean;
  branch: string | null;
  duplicateKey: string;
  lookupMode: 'indexed' | 'compatibility_fallback';
  broadLegacyFallbackEnabled: boolean;
  broadLegacyFallbackUsed: boolean;
  indexIssueDetected: boolean;
};
const fallbackDuplicateLookup = async (
  adminDb: Firestore,
  duplicateKey: string,
  diagnostics: LookupDiagnostics,
) => {
  diagnostics.compatibilityFallbackUsed = true;
  const groupSnapshot = await querySnapshotSafely(diagnostics, 'collectionGroup-duplicateKey', () =>
    adminDb
      .collectionGroup('leads')
      .where('duplicateKey', '==', duplicateKey)
      .limit(1)
      .get(),
  );
  if (groupSnapshot) {
    diagnostics.duplicateKeyGroupQuerySucceeded = true;
    if (!groupSnapshot.empty) {
      const data = groupSnapshot.docs[0]?.data() ?? {};
      return readBranch(data);
    }
    // `collectionGroup('leads')` already covers root + nested leads collections.
    return null;
  }
  const rootSnapshot = await querySnapshotSafely(diagnostics, 'root-duplicateKey', () =>
    adminDb
      .collection('leads')
      .where('duplicateKey', '==', duplicateKey)
      .limit(1)
      .get(),
  );
  if (!rootSnapshot || rootSnapshot.empty) return null;
  return readBranch(rootSnapshot.docs[0]?.data() ?? {});
};
const fallbackLegacyDuplicateLookup = async (
  adminDb: Firestore,
  fullName: string,
  dateOfBirth: string,
  diagnostics: LookupDiagnostics,
) => {
  if (!diagnostics.broadLegacyFallbackEnabled) {
    return null;
  }
  diagnostics.compatibilityFallbackUsed = true;
  diagnostics.broadLegacyFallbackUsed = true;
  const normalizedName = normalizeNameForDuplicateKey(fullName);
  const normalizedDob = normalizeIsoDate(dateOfBirth);
  if (!normalizedName || !normalizedDob) return null;
  const findBranch = (data: Record<string, unknown>) => {
    const candidateName = typeof data.fullName === 'string'
      ? normalizeNameForDuplicateKey(data.fullName)
      : '';
    const candidateDob = typeof data.dateOfBirth === 'string'
      ? normalizeIsoDate(data.dateOfBirth)
      : '';
    if (candidateName !== normalizedName || candidateDob !== normalizedDob) {
      return null;
    }
    return readBranch(data);
  };
  const findMatchingBranch = (docs: Array<{ data: () => Record<string, unknown> }>) => {
    for (const doc of docs) {
      const branch = findBranch(doc.data() ?? {});
      if (branch) return branch;
    }
    return null;
  };
  const snapshot = await querySnapshotSafely(diagnostics, 'collectionGroup-legacyNameDob', () =>
    adminDb
      .collectionGroup('leads')
      .where('dateOfBirth', '==', normalizedDob)
      .get(),
  );
  if (snapshot) {
    return findMatchingBranch(snapshot.docs);
  }
  const rootSnapshot = await querySnapshotSafely(diagnostics, 'root-legacyNameDob', () =>
    adminDb
      .collection('leads')
      .where('dateOfBirth', '==', normalizedDob)
      .get(),
  );
  if (rootSnapshot) {
    const branch = findMatchingBranch(rootSnapshot.docs);
    if (branch) return branch;
  }
  // Last-resort scan for environments where filtered fallback queries are blocked by index state.
  const broadSnapshot = await querySnapshotSafely(diagnostics, 'collectionGroup-legacyNameDobScan', () =>
    adminDb.collectionGroup('leads').select('fullName', 'dateOfBirth', 'preferredBranch', 'branch').get(),
  );
  if (broadSnapshot) {
    const branch = findMatchingBranch(broadSnapshot.docs);
    if (branch) return branch;
  }
  const broadRootSnapshot = await querySnapshotSafely(diagnostics, 'root-legacyNameDobScan', () =>
    adminDb.collection('leads').select('fullName', 'dateOfBirth', 'preferredBranch', 'branch').get(),
  );
  if (!broadRootSnapshot) return null;
  return findMatchingBranch(broadRootSnapshot.docs);
};
const fallbackDuplicateLookupFromBroadScan = async (
  adminDb: Firestore,
  duplicateKey: string,
  diagnostics: LookupDiagnostics,
) => {
  if (!diagnostics.broadLegacyFallbackEnabled) return null;
  diagnostics.compatibilityFallbackUsed = true;
  diagnostics.broadLegacyFallbackUsed = true;
  const findMatchingBranch = (docs: Array<{ data: () => Record<string, unknown> }>) => {
    for (const doc of docs) {
      const data = doc.data() ?? {};
      const candidateKey = typeof data.duplicateKey === 'string' ? data.duplicateKey : '';
      if (candidateKey === duplicateKey) {
        return readBranch(data);
      }
    }
    return null;
  };
  const broadSnapshot = await querySnapshotSafely(diagnostics, 'collectionGroup-broadDuplicateScan', () =>
    adminDb.collectionGroup('leads').select('duplicateKey', 'preferredBranch', 'branch').get(),
  );
  if (broadSnapshot) {
    const branch = findMatchingBranch(broadSnapshot.docs);
    if (branch) return branch;
  }
  const broadRootSnapshot = await querySnapshotSafely(diagnostics, 'root-broadDuplicateScan', () =>
    adminDb.collection('leads').select('duplicateKey', 'preferredBranch', 'branch').get(),
  );
  if (!broadRootSnapshot) return null;
  return findMatchingBranch(broadRootSnapshot.docs);
};
export const lookupDuplicateByNameAndDob = async (
  adminDb: Firestore,
  fullName: string,
  dateOfBirth: string,
): Promise<DuplicateLookupResult> => {
  const diagnostics: LookupDiagnostics = {
    compatibilityFallbackUsed: false,
    broadLegacyFallbackUsed: false,
    broadLegacyFallbackEnabled: isLegacyBroadFallbackEnabled(),
    indexIssueDetected: false,
    duplicateKeyGroupQuerySucceeded: false,
  };
  const duplicateKey = buildDuplicateKey(fullName, dateOfBirth);
  const indexDoc = await adminDb.collection(DUPLICATE_INDEX_COLLECTION).doc(duplicateKey).get();
  if (indexDoc.exists) {
    const data = indexDoc.data() ?? {};
    const branch = typeof data.preferredBranch === 'string' ? data.preferredBranch : null;
    return {
      exists: true,
      branch,
      duplicateKey,
      lookupMode: 'indexed',
      broadLegacyFallbackEnabled: diagnostics.broadLegacyFallbackEnabled,
      broadLegacyFallbackUsed: false,
      indexIssueDetected: false,
    };
  }
  const fallbackBranch = await fallbackDuplicateLookup(adminDb, duplicateKey, diagnostics);
  const fallbackBranchFromBroadScan = fallbackBranch || diagnostics.duplicateKeyGroupQuerySucceeded
    ? null
    : await fallbackDuplicateLookupFromBroadScan(adminDb, duplicateKey, diagnostics);
  const fallbackLegacyBranch = fallbackBranch || fallbackBranchFromBroadScan
    ? null
    : await fallbackLegacyDuplicateLookup(adminDb, fullName, dateOfBirth, diagnostics);
  const resolvedFallbackBranch = fallbackBranch || fallbackBranchFromBroadScan || fallbackLegacyBranch;
  return {
    exists: Boolean(resolvedFallbackBranch),
    branch: resolvedFallbackBranch,
    duplicateKey,
    lookupMode: diagnostics.compatibilityFallbackUsed ? 'compatibility_fallback' : 'indexed',
    broadLegacyFallbackEnabled: diagnostics.broadLegacyFallbackEnabled,
    broadLegacyFallbackUsed: diagnostics.broadLegacyFallbackUsed,
    indexIssueDetected: diagnostics.indexIssueDetected,
  };
};
