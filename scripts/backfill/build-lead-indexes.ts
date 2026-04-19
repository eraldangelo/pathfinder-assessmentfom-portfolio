import { FieldValue, getFirestore } from 'firebase-admin/firestore';

import { normalizeEmail, normalizePhilippineMobile } from '../../lib/assessment/domain/normalization';
import { DUPLICATE_INDEX_COLLECTION } from '../../lib/assessment/server/duplicateIndex';
import { CONTACT_INDEX_COLLECTION } from '../../lib/assessment/server/leadContactUsage';
import { buildDuplicateKey, buildEmailIndexId, buildMobileIndexId } from '../../lib/assessment/server/leadIndexKeys';
import { getAdminApp } from '../../lib/firebaseAdmin';

const DRY_RUN = process.argv.includes('--dry-run');

const chunk = <T>(items: T[], size: number) => {
  const output: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    output.push(items.slice(index, index + size));
  }
  return output;
};

const run = async () => {
  const adminDb = getFirestore(getAdminApp());
  const snapshot = await adminDb.collectionGroup('leads').get();
  console.log(`Found ${snapshot.size} lead docs to evaluate.`);

  const writes: Array<() => Promise<void>> = [];
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const fullName = typeof data.fullName === 'string' ? data.fullName : '';
    const dateOfBirth = typeof data.dateOfBirth === 'string' ? data.dateOfBirth : '';
    const emailAddress = typeof data.emailAddress === 'string' ? data.emailAddress : '';
    const mobileNumber = typeof data.mobileNumber === 'string' ? data.mobileNumber : '';
    if (!fullName || !dateOfBirth) continue;

    const normalizedEmail = normalizeEmail(emailAddress);
    const normalizedMobile = normalizePhilippineMobile(mobileNumber);
    const duplicateKey = buildDuplicateKey(fullName, dateOfBirth);
    const preferredBranch = typeof data.preferredBranch === 'string' ? data.preferredBranch : null;

    writes.push(async () => {
      const batch = adminDb.batch();
      batch.set(doc.ref, { normalizedEmail, normalizedMobile, duplicateKey }, { merge: true });
      if (normalizedEmail) {
        batch.set(adminDb.collection(CONTACT_INDEX_COLLECTION).doc(buildEmailIndexId(normalizedEmail)), {
          type: 'email',
          normalizedValue: normalizedEmail,
          leadRefPath: doc.ref.path,
          preferredBranch,
          createdAt: FieldValue.serverTimestamp(),
        }, { merge: true });
      }
      if (normalizedMobile) {
        batch.set(adminDb.collection(CONTACT_INDEX_COLLECTION).doc(buildMobileIndexId(normalizedMobile)), {
          type: 'mobile',
          normalizedValue: normalizedMobile,
          leadRefPath: doc.ref.path,
          preferredBranch,
          createdAt: FieldValue.serverTimestamp(),
        }, { merge: true });
      }
      batch.set(adminDb.collection(DUPLICATE_INDEX_COLLECTION).doc(duplicateKey), {
        duplicateKey,
        preferredBranch,
        fullName,
        dateOfBirth,
        leadRefPath: doc.ref.path,
        createdAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      if (!DRY_RUN) await batch.commit();
    });
  }

  const batches = chunk(writes, 100);
  let completed = 0;
  for (const group of batches) {
    await Promise.all(group.map((work) => work()));
    completed += group.length;
    console.log(`${DRY_RUN ? '[dry-run] ' : ''}Processed ${completed}/${writes.length} lead updates.`);
  }

  console.log(`Backfill complete.${DRY_RUN ? ' (no writes committed)' : ''}`);
};

run().catch((error) => {
  console.error('Backfill failed:', error);
  process.exit(1);
});
