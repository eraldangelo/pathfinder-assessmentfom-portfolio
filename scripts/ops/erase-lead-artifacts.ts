import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

import { getAdminApp } from '../../lib/firebaseAdmin';
import { normalizeEmail, normalizePhilippineMobile } from '../../lib/assessment/domain/normalization';
import { DUPLICATE_INDEX_COLLECTION } from '../../lib/assessment/server/duplicateIndex';
import { CONTACT_INDEX_COLLECTION } from '../../lib/assessment/server/leadContactUsage';
import { buildDuplicateKey, buildEmailIndexId, buildMobileIndexId } from '../../lib/assessment/server/leadIndexKeys';
import { RESUME_SCAN_QUEUE_COLLECTION } from '../../lib/assessment/server/resumeScanLifecycle';

const readArg = (name: string) => {
  const index = process.argv.indexOf(`--${name}`);
  if (index < 0) return '';
  return (process.argv[index + 1] || '').trim();
};

const hasFlag = (name: string) => process.argv.includes(`--${name}`);

const leadId = readArg('lead-id');
const shouldWrite = hasFlag('confirm');

if (!leadId) {
  console.error('Usage: tsx scripts/ops/erase-lead-artifacts.ts --lead-id <firestore-lead-doc-id> [--confirm]');
  process.exit(1);
}

const run = async () => {
  const adminApp = getAdminApp();
  const adminDb = getFirestore(adminApp);
  const bucket = getStorage(adminApp).bucket();
  const leadRef = adminDb.collection('leads').doc(leadId);
  const leadDoc = await leadRef.get();
  if (!leadDoc.exists) {
    throw new Error(`Lead not found: leads/${leadId}`);
  }

  const lead = leadDoc.data() ?? {};
  const fullName = typeof lead.fullName === 'string' ? lead.fullName : '';
  const dateOfBirth = typeof lead.dateOfBirth === 'string' ? lead.dateOfBirth : '';
  const emailAddress = typeof lead.emailAddress === 'string' ? lead.emailAddress : '';
  const mobileNumber = typeof lead.mobileNumber === 'string' ? lead.mobileNumber : '';
  const normalizedEmail = typeof lead.normalizedEmail === 'string'
    ? lead.normalizedEmail
    : normalizeEmail(emailAddress);
  const normalizedMobile = typeof lead.normalizedMobile === 'string'
    ? lead.normalizedMobile
    : normalizePhilippineMobile(mobileNumber);
  const duplicateKey = typeof lead.duplicateKey === 'string'
    ? lead.duplicateKey
    : (fullName && dateOfBirth ? buildDuplicateKey(fullName, dateOfBirth) : '');
  const resumeStoragePath = typeof lead.resumeStoragePath === 'string' ? lead.resumeStoragePath : '';

  const emailIndexRef = normalizedEmail
    ? adminDb.collection(CONTACT_INDEX_COLLECTION).doc(buildEmailIndexId(normalizedEmail))
    : null;
  const mobileIndexRef = normalizedMobile
    ? adminDb.collection(CONTACT_INDEX_COLLECTION).doc(buildMobileIndexId(normalizedMobile))
    : null;
  const duplicateIndexRef = duplicateKey
    ? adminDb.collection(DUPLICATE_INDEX_COLLECTION).doc(duplicateKey)
    : null;

  const [emailIndexDoc, mobileIndexDoc, duplicateIndexDoc] = await Promise.all([
    emailIndexRef?.get() ?? Promise.resolve(null),
    mobileIndexRef?.get() ?? Promise.resolve(null),
    duplicateIndexRef?.get() ?? Promise.resolve(null),
  ]);

  const queueDocs = resumeStoragePath
    ? await adminDb.collection(RESUME_SCAN_QUEUE_COLLECTION).where('storagePath', '==', resumeStoragePath).get()
    : null;

  const deletions = {
    leadPath: leadRef.path,
    deleteEmailIndex: Boolean(emailIndexDoc?.exists && emailIndexDoc.data()?.leadRefPath === leadRef.path),
    deleteMobileIndex: Boolean(mobileIndexDoc?.exists && mobileIndexDoc.data()?.leadRefPath === leadRef.path),
    deleteDuplicateIndex: Boolean(duplicateIndexDoc?.exists && duplicateIndexDoc.data()?.leadRefPath === leadRef.path),
    deleteResumeObject: Boolean(resumeStoragePath),
    deleteScanQueueDocs: queueDocs?.size || 0,
    shouldWrite,
  };
  console.log('[lead-erasure] plan', deletions);

  if (!shouldWrite) {
    console.log('[lead-erasure] dry-run complete (add --confirm to apply).');
    return;
  }

  const batch = adminDb.batch();
  batch.delete(leadRef);
  if (deletions.deleteEmailIndex && emailIndexRef) batch.delete(emailIndexRef);
  if (deletions.deleteMobileIndex && mobileIndexRef) batch.delete(mobileIndexRef);
  if (deletions.deleteDuplicateIndex && duplicateIndexRef) batch.delete(duplicateIndexRef);
  queueDocs?.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();

  if (resumeStoragePath) {
    await bucket.file(resumeStoragePath).delete({ ignoreNotFound: true });
  }

  console.log('[lead-erasure] completed successfully.');
};

run().catch((error) => {
  console.error('[lead-erasure] failed', error);
  process.exit(1);
});
