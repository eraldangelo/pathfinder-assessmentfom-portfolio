import assert from 'node:assert/strict';
import test from 'node:test';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import admin from 'firebase-admin';

import { POST as checkContactUsagePost } from '../../app/api/check-contact-usage/route';
import { POST as checkDuplicatePost } from '../../app/api/check-duplicate/route';
import { POST as submitPost } from '../../app/api/submit/route';
import { getAdminApp } from '../../lib/firebaseAdmin';
import { normalizeEmail, normalizePhilippineMobile } from '../../lib/assessment/domain/normalization';
import { DUPLICATE_INDEX_COLLECTION } from '../../lib/assessment/server/duplicateIndex';
import { CONTACT_INDEX_COLLECTION } from '../../lib/assessment/server/leadContactUsage';
import { buildDuplicateKey, buildEmailIndexId, buildMobileIndexId } from '../../lib/assessment/server/leadIndexKeys';

const adminDb = getFirestore(getAdminApp());
const baseUrl = 'http://localhost:3000';

const buildNextWeekdayIso = () => {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  while (next.getDay() === 0 || next.getDay() === 6) next.setDate(next.getDate() + 1);
  return next.toISOString().slice(0, 10);
};

const makeJsonRequest = (path: string, payload: Record<string, unknown>) =>
  new Request(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '203.0.113.10',
    },
    body: JSON.stringify(payload),
  }) as any;

const deleteAdminApps = async () => {
  for (const app of admin.apps) {
    if (app) {
      await app.delete();
    }
  }
};

const cleanCollection = async (name: string) => {
  const snapshot = await adminDb.collection(name).get();
  if (snapshot.empty) return;
  const batch = adminDb.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
};

const resetData = async () => {
  for (const collection of ['leads', CONTACT_INDEX_COLLECTION, DUPLICATE_INDEX_COLLECTION, 'personnel', 'resumeScanQueue']) {
    await cleanCollection(collection);
  }
};

const buildValidPayload = () => ({
  currentLocation: 'Makati City',
  preferredBranch: 'Manila',
  referredByStaff: 'no',
  referredStaffId: '',
  referredStaffName: '',
  referredStaffBranch: '',
  fullName: 'Juan Dela Cruz',
  mobileNumber: '09171112222',
  emailAddress: 'juan.integration@example.com',
  dateOfBirth: '1999-05-12',
  isUsPassportHolder: 'no',
  highestEducationalAttainment: "Bachelor's Degree",
  englishTest: 'IELTS - Academic',
  hasWorked: 'yes',
  hasVisaRefusal: 'no',
  studyDestinations: ['Australia'],
  otherStudyDestination: '',
  preferredCoursesOfStudy: ["Master's Degree - Coursework"],
  otherPreferredCourseOfStudy: '',
  plannedStudyStart: '2099-03',
  preferredConsultationMethod: 'Online Consultation (Zoom, Teams, Meets)',
  preferredConsultationDate: buildNextWeekdayIso(),
  preferredConsultationTime: '11:00',
  discoverySources: ['Official Website'],
  otherDiscoverySource: '',
  referralCode: '',
  'cf-turnstile-response': 'integration-token',
});

const seedLeadWithIndexes = async (payload: ReturnType<typeof buildValidPayload>) => {
  const normalizedEmail = normalizeEmail(payload.emailAddress);
  const normalizedMobile = normalizePhilippineMobile(payload.mobileNumber);
  const duplicateKey = buildDuplicateKey(payload.fullName, payload.dateOfBirth);
  const leadRef = adminDb.collection('leads').doc();

  await leadRef.set({
    fullName: payload.fullName,
    dateOfBirth: payload.dateOfBirth,
    preferredBranch: payload.preferredBranch,
    emailAddress: payload.emailAddress,
    mobileNumber: payload.mobileNumber,
    normalizedEmail,
    normalizedMobile,
    duplicateKey,
    createdAt: FieldValue.serverTimestamp(),
  });
  await adminDb.collection(CONTACT_INDEX_COLLECTION).doc(buildEmailIndexId(normalizedEmail)).set({
    type: 'email',
    normalizedValue: normalizedEmail,
    leadRefPath: leadRef.path,
    preferredBranch: payload.preferredBranch,
    createdAt: FieldValue.serverTimestamp(),
  });
  await adminDb.collection(CONTACT_INDEX_COLLECTION).doc(buildMobileIndexId(normalizedMobile)).set({
    type: 'mobile',
    normalizedValue: normalizedMobile,
    leadRefPath: leadRef.path,
    preferredBranch: payload.preferredBranch,
    createdAt: FieldValue.serverTimestamp(),
  });
  await adminDb.collection(DUPLICATE_INDEX_COLLECTION).doc(duplicateKey).set({
    duplicateKey,
    preferredBranch: payload.preferredBranch,
    leadRefPath: leadRef.path,
    createdAt: FieldValue.serverTimestamp(),
  });
};

const seedLegacyLeadWithoutIndexes = async (overrides: Partial<ReturnType<typeof buildValidPayload>> = {}) => {
  const base = buildValidPayload();
  const payload = { ...base, ...overrides };
  const leadRef = adminDb.collection('leads').doc();
  await leadRef.set({
    fullName: payload.fullName,
    dateOfBirth: payload.dateOfBirth,
    preferredBranch: payload.preferredBranch,
    emailAddress: payload.emailAddress,
    mobileNumber: payload.mobileNumber,
    createdAt: FieldValue.serverTimestamp(),
  });
};

test.beforeEach(async () => {
  await resetData();
});

test('contact usage API reads indexed contact data', async () => {
  const payload = buildValidPayload();
  await seedLeadWithIndexes(payload);
  const response = await checkContactUsagePost(makeJsonRequest('/api/check-contact-usage', {
    emailAddress: payload.emailAddress,
    mobileNumber: payload.mobileNumber,
  }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.emailInUse, true);
  assert.equal(body.mobileInUse, true);
});

test('duplicate API resolves deterministic duplicate key path', async () => {
  const payload = buildValidPayload();
  await seedLeadWithIndexes(payload);
  const response = await checkDuplicatePost(makeJsonRequest('/api/check-duplicate', {
    fullName: payload.fullName,
    dateOfBirth: payload.dateOfBirth,
  }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.exists, true);
  assert.equal(body.branch, 'Manila');
});

test('duplicate API resolves legacy duplicate without duplicateKey/index fields', async () => {
  await seedLegacyLeadWithoutIndexes({
    fullName: 'JUAN DELA CRUZ',
    dateOfBirth: '1999-05-12',
    preferredBranch: 'Cebu',
    emailAddress: 'legacy.duplicate@example.com',
    mobileNumber: '09175550123',
  });
  const response = await checkDuplicatePost(makeJsonRequest('/api/check-duplicate', {
    fullName: 'Juan Dela Cruz',
    dateOfBirth: '1999-05-12',
  }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.exists, true);
  assert.equal(body.branch, 'Cebu');
});

test('contact usage API resolves legacy mixed-case email without normalized/index fields', async () => {
  await seedLegacyLeadWithoutIndexes({
    fullName: 'Legacy Email Holder',
    dateOfBirth: '1994-10-20',
    preferredBranch: 'Davao',
    emailAddress: 'Legacy.Mixed@Example.COM',
    mobileNumber: '09176660123',
  });
  const response = await checkContactUsagePost(makeJsonRequest('/api/check-contact-usage', {
    emailAddress: 'legacy.mixed@example.com',
    mobileNumber: '',
  }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.emailInUse, true);
});

test('submit API rejects missing captcha before write', async () => {
  const payload = buildValidPayload() as Record<string, unknown>;
  delete payload['cf-turnstile-response'];
  const response = await submitPost(makeJsonRequest('/api/submit', payload));
  assert.equal(response.status, 400);
});

test('submit API rejects validation failures with 422', async () => {
  const payload = buildValidPayload();
  payload.emailAddress = 'invalid-email';
  const response = await submitPost(makeJsonRequest('/api/submit', payload));
  assert.equal(response.status, 422);
});

test('submit API writes normalized lead + index documents', async () => {
  const payload = buildValidPayload();
  const response = await submitPost(makeJsonRequest('/api/submit', payload));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);

  const leads = await adminDb.collection('leads').get();
  assert.equal(leads.size, 1);
  const lead = leads.docs[0].data();
  assert.equal(lead.normalizedEmail, normalizeEmail(payload.emailAddress));
  assert.equal(lead.normalizedMobile, normalizePhilippineMobile(payload.mobileNumber));
  assert.equal(typeof lead.duplicateKey, 'string');
});

test('submit API rejects deterministic contact/duplicate conflicts', async () => {
  const payload = buildValidPayload();
  await seedLeadWithIndexes(payload);
  const response = await submitPost(makeJsonRequest('/api/submit', payload));
  assert.equal(response.status, 409);
  const body = await response.json();
  assert.equal(body.ok, false);
});

test('submit API keeps duplicate conflict semantics for legacy leads without index fields', async () => {
  await seedLegacyLeadWithoutIndexes({
    fullName: 'JUAN DELA CRUZ',
    dateOfBirth: '1999-05-12',
    preferredBranch: 'Manila',
    emailAddress: 'legacy.dup.submit@example.com',
    mobileNumber: '09178880123',
  });
  const payload = buildValidPayload();
  payload.emailAddress = 'fresh.unique@example.com';
  payload.mobileNumber = '09179990123';
  const response = await submitPost(makeJsonRequest('/api/submit', payload));
  assert.equal(response.status, 409);
  const body = await response.json();
  assert.equal(body.duplicate, true);
});

test('precheck APIs return explicit failures when internal exceptions occur', async () => {
  const previousFirestoreHost = process.env.FIRESTORE_EMULATOR_HOST;
  const previousAdminJson = process.env.FIREBASE_ADMIN_SDK_JSON;

  await deleteAdminApps();
  delete process.env.FIRESTORE_EMULATOR_HOST;
  process.env.FIREBASE_ADMIN_SDK_JSON = '{}';

  try {
    const duplicateResponse = await checkDuplicatePost(makeJsonRequest('/api/check-duplicate', {
      fullName: 'Exception Case',
      dateOfBirth: '1990-01-01',
    }));
    assert.equal(duplicateResponse.status, 503);
    const duplicateBody = await duplicateResponse.json();
    assert.equal(duplicateBody.ok, false);

    const contactResponse = await checkContactUsagePost(makeJsonRequest('/api/check-contact-usage', {
      emailAddress: 'exception@example.com',
      mobileNumber: '09171234567',
    }));
    assert.equal(contactResponse.status, 503);
    const contactBody = await contactResponse.json();
    assert.equal(contactBody.ok, false);
  } finally {
    if (previousFirestoreHost === undefined) {
      delete process.env.FIRESTORE_EMULATOR_HOST;
    } else {
      process.env.FIRESTORE_EMULATOR_HOST = previousFirestoreHost;
    }

    if (previousAdminJson === undefined) {
      delete process.env.FIREBASE_ADMIN_SDK_JSON;
    } else {
      process.env.FIREBASE_ADMIN_SDK_JSON = previousAdminJson;
    }

    await deleteAdminApps();
  }
});
