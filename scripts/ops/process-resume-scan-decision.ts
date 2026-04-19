import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

import { getAdminApp } from '../../lib/firebaseAdmin';
import {
  buildResumeCleanPath,
  RESUME_SCAN_QUEUE_COLLECTION,
  RESUME_SCAN_STATUS,
} from '../../lib/assessment/server/resumeScanLifecycle';

type Decision = 'clean' | 'reject';

const readArg = (name: string) => {
  const index = process.argv.indexOf(`--${name}`);
  if (index < 0) return '';
  return (process.argv[index + 1] || '').trim();
};

const hasFlag = (name: string) => process.argv.includes(`--${name}`);

const decision = readArg('decision') as Decision;
const queueDocId = readArg('queue-doc-id');
const scanner = readArg('scanner') || 'manual-operator';
const reason = readArg('reason') || null;
const shouldWrite = hasFlag('confirm');

if (!queueDocId || !['clean', 'reject'].includes(decision)) {
  console.error('Usage: tsx scripts/ops/process-resume-scan-decision.ts --queue-doc-id <id> --decision <clean|reject> [--scanner name] [--reason text] [--confirm]');
  process.exit(1);
}

const run = async () => {
  const adminApp = getAdminApp();
  const adminDb = getFirestore(adminApp);
  const bucket = getStorage(adminApp).bucket();
  const queueRef = adminDb.collection(RESUME_SCAN_QUEUE_COLLECTION).doc(queueDocId);
  const queueDoc = await queueRef.get();

  if (!queueDoc.exists) {
    throw new Error(`Queue document not found: ${queueDocId}`);
  }

  const queueData = queueDoc.data() ?? {};
  const status = typeof queueData.status === 'string' ? queueData.status : '';
  if (status !== RESUME_SCAN_STATUS.pending && status !== RESUME_SCAN_STATUS.scanError) {
    throw new Error(`Queue document ${queueDocId} is not actionable (status=${status || 'unknown'}).`);
  }

  const storagePath = typeof queueData.storagePath === 'string' ? queueData.storagePath : '';
  if (!storagePath) {
    throw new Error(`Queue document ${queueDocId} has no storagePath.`);
  }

  const quarantineFile = bucket.file(storagePath);
  const [exists] = await quarantineFile.exists();
  const promotedStoragePath = buildResumeCleanPath(storagePath);

  const plan = {
    queueDocId,
    decision,
    scanner,
    reason,
    shouldWrite,
    storagePath,
    storageObjectExists: exists,
    promotedStoragePath: decision === 'clean' ? promotedStoragePath : null,
  };
  console.log('[resume-scan-decision] plan', plan);

  if (!shouldWrite) {
    console.log('[resume-scan-decision] dry-run complete (add --confirm to apply).');
    return;
  }

  if (decision === 'clean') {
    if (!exists) throw new Error(`Cannot promote missing quarantine object: ${storagePath}`);
    const cleanFile = bucket.file(promotedStoragePath);
    await quarantineFile.copy(cleanFile);
    await cleanFile.setMetadata({
      metadata: {
        scanStatus: 'clean',
        scanDecision: 'clean',
        promotedFrom: storagePath,
      },
    });
    await quarantineFile.delete({ ignoreNotFound: true });

    await queueRef.set({
      status: RESUME_SCAN_STATUS.cleanPromoted,
      decisionRequired: false,
      scanDecision: 'clean',
      scanReason: reason,
      scanner,
      scannedAt: FieldValue.serverTimestamp(),
      promotedStoragePath,
      quarantineDeletedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  } else {
    await quarantineFile.delete({ ignoreNotFound: true });
    await queueRef.set({
      status: RESUME_SCAN_STATUS.rejectedDeleted,
      decisionRequired: false,
      scanDecision: 'reject',
      scanReason: reason,
      scanner,
      scannedAt: FieldValue.serverTimestamp(),
      promotedStoragePath: null,
      quarantineDeletedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  console.log('[resume-scan-decision] update applied successfully.');
};

run().catch((error) => {
  console.error('[resume-scan-decision] failed', error);
  process.exit(1);
});
