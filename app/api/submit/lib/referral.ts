import { FieldValue, type Firestore } from 'firebase-admin/firestore';

import type { ReferredStaffResolution } from './types';

const asString = (value: unknown) => (typeof value === 'string' ? value : '');

const normalizeValue = (value: unknown) =>
  (typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').toLowerCase() : '');

const normalizeBranchKey = (value: unknown) => {
  const normalized = normalizeValue(value);
  if (normalized === 'makati') return 'manila';
  return normalized;
};

const isAssessmentNotificationRole = (value: unknown) => {
  const role = normalizeValue(value);
  return role === 'administrative staff' || role === 'satellite office staff';
};

const matchesRole = (roleValue: unknown, targetRole: string) => {
  const role = normalizeValue(roleValue);
  const target = normalizeValue(targetRole);
  if (!role || !target) return false;
  return role === target || role.startsWith(target) || role.includes(target);
};

const isAutoEndorsementRole = (value: unknown) =>
  matchesRole(value, 'education consultant')
  || matchesRole(value, 'education counsellor')
  || matchesRole(value, 'education counselor')
  || matchesRole(value, 'branch manager');

const getPersonnelDisplayName = (data: Record<string, unknown>) => {
  const name = asString(data.name).trim();
  if (name) return name;
  const firstName = asString(data.firstName).trim();
  const lastName = asString(data.lastName).trim();
  const fullName = `${firstName} ${lastName}`.trim();
  if (fullName) return fullName;
  const preferredName = asString(data.preferredName).trim();
  if (preferredName) return preferredName;
  return '';
};

type ResolveReferredStaffArgs = {
  adminDb: Firestore;
  referredByStaff: boolean;
  referredStaffId: string | null;
  referredStaffName: string | null;
  referredStaffBranch: string | null;
};

export const resolveReferredStaff = async ({
  adminDb,
  referredByStaff,
  referredStaffId,
  referredStaffName,
  referredStaffBranch,
}: ResolveReferredStaffArgs): Promise<ReferredStaffResolution> => {
  let effectiveReferredStaffName = referredStaffName;
  let effectiveReferredStaffBranch = referredStaffBranch;
  let assignedCounsellor: string | null = null;
  let assignedCounsellorUid: string | null = null;

  if (referredByStaff === true && referredStaffId) {
    try {
      const referredStaffSnapshot = await adminDb.collection('personnel').doc(referredStaffId).get();
      if (!referredStaffSnapshot.exists) {
        console.warn('Referred staff id not found in personnel', { referredStaffId });
        return {
          effectiveReferredStaffName,
          effectiveReferredStaffBranch,
          assignedCounsellor,
          assignedCounsellorUid,
        };
      }

      const referredStaffData = (referredStaffSnapshot.data() ?? {}) as Record<string, unknown>;
      const resolvedName = getPersonnelDisplayName(referredStaffData);
      const resolvedBranch = asString(referredStaffData.branch).trim();

      if (resolvedName) {
        effectiveReferredStaffName = resolvedName;
      }
      if (resolvedBranch) {
        effectiveReferredStaffBranch = resolvedBranch;
      }

      if (isAutoEndorsementRole(referredStaffData.role)) {
        assignedCounsellorUid = referredStaffSnapshot.id;
        assignedCounsellor = resolvedName || effectiveReferredStaffName || null;
      }
    } catch (err) {
      console.error('Failed to resolve referred staff for auto endorsement:', err);
    }
  }

  return {
    effectiveReferredStaffName,
    effectiveReferredStaffBranch,
    assignedCounsellor,
    assignedCounsellorUid,
  };
};

type NotifyAssessmentRecipientsArgs = {
  adminDb: Firestore;
  staffBranch: string | null;
  fullName: string;
  preferredBranch: string;
};

export const notifyAssessmentRecipients = async ({
  adminDb,
  staffBranch,
  fullName,
  preferredBranch,
}: NotifyAssessmentRecipientsArgs) => {
  if (!staffBranch) return;
  try {
    const targetBranchKey = normalizeBranchKey(staffBranch);
    const personnelSnapshot = await adminDb.collection('personnel').get();
    const recipients = personnelSnapshot.docs.filter((doc) => {
      const data = doc.data() ?? {};
      return isAssessmentNotificationRole(data.role) && normalizeBranchKey(data.branch) === targetBranchKey;
    });

    if (recipients.length === 0) {
      console.warn('No assessment notification recipients found', { staffBranch, targetBranchKey });
      return;
    }

    const displayName = fullName || 'New student';
    const branchLabel = preferredBranch || staffBranch;
    const message = branchLabel
      ? `New assessment submission from [[${displayName}]] (${branchLabel})`
      : `New assessment submission from [[${displayName}]]`;
    const batch = adminDb.batch();

    recipients.forEach((doc) => {
      const notifRef = adminDb.collection('personnel').doc(doc.id).collection('notifications').doc();
      batch.set(notifRef, {
        message,
        createdAt: FieldValue.serverTimestamp(),
        read: false,
        eventKey: 'newSubmission',
        requesterName: displayName,
        requesterBranch: branchLabel,
        requesterRole: 'assessment submission',
      });
    });

    await batch.commit();
  } catch (err) {
    console.error('Failed to send assessment submission notifications:', err);
  }
};

