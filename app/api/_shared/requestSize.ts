import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const parseContentLength = (raw: string | null): number | null => {
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.floor(value);
};

export const rejectIfBodyTooLarge = (
  request: NextRequest,
  maxBytes: number,
): NextResponse | null => {
  const length = parseContentLength(request.headers.get('content-length'));
  if (length === null) return null;
  if (length <= maxBytes) return null;

  return NextResponse.json(
    { ok: false, message: 'Request payload is too large.' },
    { status: 413 },
  );
};
