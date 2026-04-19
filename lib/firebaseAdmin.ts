import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

type ServiceAccount = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

const loadServiceAccountJson = (raw: string): ServiceAccount => {
  const trimmed = raw.trim();
  try {
    const json = trimmed.startsWith('{')
      ? trimmed
      : fs.readFileSync(path.isAbsolute(trimmed) ? trimmed : path.resolve(process.cwd(), trimmed), 'utf8');
    const parsed = JSON.parse(json) as ServiceAccount;
    if (parsed?.private_key) {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load FIREBASE_ADMIN_SDK_JSON:', err);
    throw new Error('Invalid FIREBASE_ADMIN_SDK_JSON');
  }
};

const getAdminConfig = (): ServiceAccount => {
  if (process.env.FIREBASE_ADMIN_SDK_JSON) {
    const parsed = loadServiceAccountJson(process.env.FIREBASE_ADMIN_SDK_JSON);
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
      throw new Error('FIREBASE_ADMIN_SDK_JSON is missing required fields');
    }
    return parsed;
  }

  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    throw new Error('Missing Firebase Admin credentials');
  }

  return {
    project_id: process.env.FIREBASE_PROJECT_ID,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  };
};

export const getAdminApp = () => {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const firestoreEmulatorHost = process.env.FIRESTORE_EMULATOR_HOST?.trim();
  if (firestoreEmulatorHost) {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'assessmentform-test';
    admin.initializeApp({
      projectId,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET ?? `${projectId}.appspot.com`,
    });
    return admin.app();
  }

  const config = getAdminConfig();
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.project_id,
      clientEmail: config.client_email,
      privateKey: config.private_key
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET ?? `${config.project_id}.appspot.com`
  });

  return admin.app();
};
