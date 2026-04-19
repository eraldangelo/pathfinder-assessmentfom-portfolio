import { NextResponse } from 'next/server';

export type JsonObject = Record<string, unknown>;

type ParseResult =
  | { ok: true; data: JsonObject }
  | { ok: false; response: NextResponse };

export const parseJsonObjectBody = async (request: Request): Promise<ParseResult> => {
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, message: 'Invalid JSON payload.' }, { status: 400 }),
    };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, message: 'Request body must be a JSON object.' }, { status: 422 }),
    };
  }

  return { ok: true, data: parsed as JsonObject };
};

export const readTrimmedString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');
