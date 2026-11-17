// The ONE entry point every public form uses.
// Inserts into form_submissions (anon may INSERT only; RLS blocks reading).
import { USE_MOCK } from '../lib/env';
import { getSupabase } from '../lib/supabase';
import type { Enums, Json } from '../types/database';

export type FormType = Enums<'form_type'>; // 'new_member' | 'prayer' | 'choir' | 'baptism' | 'contact'

export interface FormPayload {
  name: string;
  phone?: string;
  email?: string;
  /** message / prayer request text */
  message?: string;
  /** form-specific fields (e.g. voice_part) */
  extra?: Record<string, string>;
  /** honeypot: real people never fill this */
  website?: string;
  lang?: string;
}

export type SubmitErrorCode = 'throttled' | 'failed';
export class SubmitError extends Error {
  constructor(public code: SubmitErrorCode) {
    super(code);
  }
}

const THROTTLE_MS = 30_000;
const memoryLast = new Map<FormType, number>();
const storageKey = (type: FormType) => `sb-form-last-${type}`;

function lastSubmitted(type: FormType): number {
  let stored = 0;
  try {
    stored = Number(window.localStorage.getItem(storageKey(type))) || 0;
  } catch {
    /* storage unavailable: fall back to memory */
  }
  return Math.max(stored, memoryLast.get(type) ?? 0);
}

function markSubmitted(type: FormType) {
  const now = Date.now();
  memoryLast.set(type, now);
  try {
    window.localStorage.setItem(storageKey(type), String(now));
  } catch {
    /* ignore */
  }
}

const clean = (v: string | undefined, max: number) => {
  const t = (v ?? '').trim();
  return t ? t.slice(0, max) : null;
};

/**
 * Saves a submission. Resolves on success; throws SubmitError('throttled')
 * within 30 s of a previous submission of the same type, or
 * SubmitError('failed') for anything else (raw database errors are never exposed).
 */
export async function submitForm(type: FormType, payload: FormPayload): Promise<void> {
  if (Date.now() - lastSubmitted(type) < THROTTLE_MS) throw new SubmitError('throttled');

  // Honeypot filled: pretend it worked, save nothing.
  if (payload.website && payload.website.trim()) {
    await new Promise((r) => setTimeout(r, 600));
    markSubmitted(type);
    return;
  }

  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 900));
    if (import.meta.env.DEV) console.info('[submitForm mock]', type, payload);
    markSubmitted(type);
    return;
  }

  const extra: Record<string, Json> = { source: 'website', ...(payload.extra ?? {}) };
  if (payload.lang) extra.lang = payload.lang;

  try {
    // No .select(): anon has no read access, and we never need the row back.
    const { error } = await getSupabase()
      .from('form_submissions')
      .insert({
        type,
        full_name: (payload.name ?? '').trim().slice(0, 120),
        phone: clean(payload.phone, 32),
        email: clean(payload.email, 254),
        message: clean(payload.message, 4000),
        extra,
        consented_at: new Date().toISOString(),
      });
    if (error) throw error;
  } catch (error) {
    if (import.meta.env.DEV) console.error('[submitForm]', error);
    throw new SubmitError('failed');
  }
  markSubmitted(type);
}
