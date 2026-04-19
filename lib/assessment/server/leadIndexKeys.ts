import crypto from 'crypto';

import { normalizeIsoDate, normalizeNameForDuplicateKey } from '../domain/normalization';

const hashValue = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

export const buildEmailIndexId = (normalizedEmail: string) => `email_${hashValue(normalizedEmail)}`;

export const buildMobileIndexId = (normalizedMobile: string) => `mobile_${hashValue(normalizedMobile)}`;

export const buildDuplicateKey = (fullName: string, dateOfBirth: string) => {
  const normalizedName = normalizeNameForDuplicateKey(fullName);
  const normalizedDob = normalizeIsoDate(dateOfBirth);
  return hashValue(`${normalizedName}|${normalizedDob}`);
};
