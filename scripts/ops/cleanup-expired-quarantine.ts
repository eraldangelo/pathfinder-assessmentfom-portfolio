import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

import { getAdminApp } from '../../lib/firebaseAdmin';
import {
  getResumeQuarantineRetentionDays,
  RESUME_SCAN_QUEUE_COLLECTION,
  RESUME_SCAN_STATUS,
} from '../../lib/assessment/server/resumeScanLifecycle';

const hasFlag = (name: string) => process.argv.includes(`--${name}`);
const shouldWrite = hasFlag('confirm');

const readDate = (value: unknown) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof (value as { toDate?: unknown }).toDate === 'function') {
    try {
      return (value as { toDate: () => Date }).toDate();
    } catch {
      return null;
    }
  }
  return null;
};

const getExpiryDate = (docData: Record<string, unknown>) => {
  const explicit = readDate(docData.quarantineDeleteAfter);
  if (explicit) return explicit;
  const createdAt = readDate(docData.createdAt);
  if (!createdAt) return null;
  const retentionDaysRaw = Number(docData.quarantineRetentionDays);
  const retentionDays = Number.isFinite(retentionDaysRaw) && retentionDaysRaw > 0
    ? retentionDaysRaw
    : getResumeQuarantineRetentionDays();
  return new Date(createdAt.getTime() + retentionDays * 24 * 60 * 60 * 1000);
};

const run = async () => {
  const adminApp = getAdminApp();
  const adminDb = getFirestore(adminApp);
  const bucket = getStorage(adminApp).bucket();
  const now = new Date();
  const actionableStatuses = [RESUME_SCAN_STATUS.pending, RESUME_SCAN_STATUS.scanError];
  const candidates: Array<{ id: string; data: Record<string, unknown> }> = [];

  for (const status of actionableStatuses) {
    const snapshot = await adminDb
      .collection(RESUME_SCAN_QUEUE_COLLECTION)
      .where('status', '==', status)
      .get();
    snapshot.docs.forEach((doc) => candidates.push({ id: doc.id, data: doc.data() ?? {} }));
  }

  const expired = candidates.filter(({ data }) => {
    const expiry = getExpiryDate(data);
    return Boolean(expiry && expiry <= now);
  });

  console.log('[resume-quarantine-cleanup] candidates', {
    scanned: candidates.length,
    expired: expired.length,
    shouldWrite,
  });

  if (!shouldWrite) {
    expired.slice(0, 20).forEach((item) => {
      console.log('[resume-quarantine-cleanup] dry-run expired doc', {
        id: item.id,
        storagePath: item.data.storagePath,
        status: item.data.status,
      });
    });
    if (expired.length > 20) {
      console.log(`[resume-quarantine-cleanup] ...and ${expired.length - 20} more docs.`);
    }
    console.log('[resume-quarantine-cleanup] dry-run complete (add --confirm to apply).');
    return;
  }

  for (const item of expired) {
    const storagePath = typeof item.data.storagePath === 'string' ? item.data.storagePath : '';
    if (storagePath) {
      await bucket.file(storagePath).delete({ ignoreNotFound: true });
    }
    await adminDb.collection(RESUME_SCAN_QUEUE_COLLECTION).doc(item.id).set({
      status: RESUME_SCAN_STATUS.expiredDeleted,
      decisionRequired: false,
      cleanupReason: 'retention_expired',
      quarantineDeletedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  console.log('[resume-quarantine-cleanup] applied', { expired: expired.length });
};

run().catch((error) => {
  console.error('[resume-quarantine-cleanup] failed', error);
  process.exit(1);
});
