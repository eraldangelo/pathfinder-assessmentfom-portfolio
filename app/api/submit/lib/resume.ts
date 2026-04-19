import crypto from 'crypto';
import path from 'path';
import type { App } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { NextResponse } from 'next/server';

import type { ResumeUploadResult } from './types';
import {
  getResumeQuarantineRetentionDays,
  RESUME_QUARANTINE_PREFIX,
  RESUME_SCAN_QUEUE_COLLECTION,
  RESUME_SCAN_STATUS,
} from '../../../../lib/assessment/server/resumeScanLifecycle';

type UploadResumeResult =
  | { ok: true; data: ResumeUploadResult }
  | { ok: false; response: NextResponse };

type FileKind = 'pdf' | 'doc' | 'docx' | 'jpeg';

const emptyResumeResult: ResumeUploadResult = {
  resumeStoragePath: null,
  resumeFileName: null,
  resumeContentType: null,
  resumeFileSize: null,
};

const extensionToKind: Record<string, FileKind> = {
  '.pdf': 'pdf',
  '.doc': 'doc',
  '.docx': 'docx',
  '.jpg': 'jpeg',
  '.jpeg': 'jpeg',
};

const mimeToKind: Record<string, FileKind> = {
  'application/pdf': 'pdf',
  'application/x-pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.ms-word': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpeg',
};

const hasPrefix = (buffer: Buffer, signature: number[]) =>
  signature.every((value, index) => buffer[index] === value);

const detectFileKind = (buffer: Buffer): FileKind | null => {
  if (buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-') return 'pdf';
  if (buffer.length >= 3 && hasPrefix(buffer, [0xff, 0xd8, 0xff])) return 'jpeg';
  if (buffer.length >= 8 && hasPrefix(buffer, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return 'doc';
  if (buffer.length >= 4 && hasPrefix(buffer, [0x50, 0x4b, 0x03, 0x04])) {
    const text = buffer.toString('latin1');
    if (text.includes('[Content_Types].xml') && text.includes('word/')) return 'docx';
  }
  return null;
};

const queueResumeScan = async (
  adminApp: App,
  objectName: string,
  fileName: string,
  contentType: string,
  sha256: string,
) => {
  const adminDb = getFirestore(adminApp);
  const retentionDays = getResumeQuarantineRetentionDays();
  await adminDb.collection(RESUME_SCAN_QUEUE_COLLECTION).add({
    storagePath: objectName,
    fileName,
    contentType,
    sha256,
    status: RESUME_SCAN_STATUS.pending,
    lifecycleState: 'quarantine_pending_scan',
    quarantineRetentionDays: retentionDays,
    quarantineDeleteAfter: new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000),
    decisionRequired: true,
    createdAt: FieldValue.serverTimestamp(),
    source: 'assessment-form',
  });
};

const validateResumeFile = (file: File, buffer: Buffer): string | null => {
  const extension = path.extname(file.name).toLowerCase();
  const extensionKind = extensionToKind[extension];
  if (!extensionKind) return 'Unsupported resume file extension.';

  const mime = file.type.trim().toLowerCase();
  if (!mime || !mimeToKind[mime]) return 'Unsupported resume MIME type.';
  if (mimeToKind[mime] !== extensionKind) return 'Resume file extension and MIME type do not match.';

  const detectedKind = detectFileKind(buffer);
  if (!detectedKind) return 'Unable to verify resume file signature.';
  if (detectedKind !== extensionKind) return 'Resume file signature does not match extension.';

  return null;
};

export const uploadResumeIfPresent = async (
  adminApp: App,
  resumeFile: File | null,
): Promise<UploadResumeResult> => {
  if (!resumeFile || resumeFile.size <= 0) {
    return { ok: true, data: emptyResumeResult };
  }

  const maxSizeBytes = 5 * 1024 * 1024;
  if (resumeFile.size > maxSizeBytes) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, message: 'Resume file must be 5MB or smaller.' },
        { status: 422 },
      ),
    };
  }

  const buffer = Buffer.from(await resumeFile.arrayBuffer());
  const validationError = validateResumeFile(resumeFile, buffer);
  if (validationError) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, message: validationError },
        { status: 422 },
      ),
    };
  }

  const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');
  const bucket = getStorage(adminApp).bucket();
  const safeName = resumeFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const objectName = `${RESUME_QUARANTINE_PREFIX}${Date.now()}-${crypto.randomUUID()}-${safeName}`;
  const fileRef = bucket.file(objectName);

  await fileRef.save(buffer, {
    resumable: false,
    contentType: resumeFile.type || 'application/octet-stream',
    metadata: {
      cacheControl: 'private, max-age=0, no-transform',
      metadata: {
        scanStatus: 'pending',
        scanRequired: 'true',
        sha256: fileHash,
        scanLifecycleState: 'quarantine_pending_scan',
      },
    },
  });

  await queueResumeScan(adminApp, objectName, resumeFile.name, resumeFile.type || 'application/octet-stream', fileHash);

  return {
    ok: true,
    data: {
      resumeStoragePath: objectName,
      resumeFileName: resumeFile.name,
      resumeContentType: resumeFile.type || 'application/octet-stream',
      resumeFileSize: resumeFile.size,
    },
  };
};
