import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { getAdminApp } from '../../../lib/firebaseAdmin';
import { enforceRateLimit } from '../_shared/rateLimit';

type PersonnelItem = {
  id: string;
  name: string;
  branch: string | null;
};

const allowedBranches = ['Pampanga', 'Cebu', 'Davao', 'Manila'];

const normalizeBranch = (value: string) => value.trim().toLowerCase();

const resolveBranch = (value: string) => {
  if (!value) return null;
  const normalized = normalizeBranch(value);
  for (const branch of allowedBranches) {
    if (normalizeBranch(branch) === normalized) return branch;
  }
  return null;
};

const normalizeDataBranch = (value: unknown) => (typeof value === 'string' ? normalizeBranch(value) : '');

const buildName = (data: Record<string, unknown>) => {
  const preferredName = typeof data.preferredName === 'string' ? data.preferredName.trim() : '';
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const firstName = typeof data.firstName === 'string' ? data.firstName.trim() : '';
  const lastName = typeof data.lastName === 'string' ? data.lastName.trim() : '';
  const email = typeof data.email === 'string' ? data.email.trim() : '';

  if (name) return name;
  if (firstName || lastName) return `${firstName} ${lastName}`.trim();
  if (preferredName) return preferredName;
  if (email) return email;
  return 'Unknown';
};

export async function GET(request: NextRequest) {
  const rate = await enforceRateLimit(request, { bucket: 'personnel-list', maxHits: 120, windowMs: 60_000 });
  if (rate.blocked) return rate.response;

  try {
    const { searchParams } = new URL(request.url);
    const branchInput = (searchParams.get('branch') ?? '').trim();
    const branch = resolveBranch(branchInput);

    if (!branch) {
      return NextResponse.json({ items: [] });
    }

    const adminDb = getFirestore(getAdminApp());
    const snapshot = await adminDb.collection('personnel').where('branch', '==', branch).get();
    const branchKey = normalizeBranch(branch);
    const docs =
      snapshot.docs.length > 0
        ? snapshot.docs
        : (await adminDb.collection('personnel').get()).docs.filter(
            (doc) => normalizeDataBranch(doc.data().branch) === branchKey
          );

    const items: PersonnelItem[] = docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      const rawBranch = typeof data.branch === 'string' ? data.branch.trim() : '';
      return {
        id: doc.id,
        name: buildName(data),
        branch: rawBranch ? rawBranch : null
      };
    });

    items.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ items });
  } catch (err) {
    console.error('API/personnel error', err);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}
