import type { Localized } from './types';

/** Build a Localized value from *_id / *_en columns. */
export function loc(id: string, en: string | null | undefined): Localized {
  return { id, en: en && en.trim() ? en : null };
}

/** Split a multi-line body into Localized lines, pairing ID and EN by index. */
export function lines(bodyId: string | null, bodyEn: string | null): Localized[] {
  const split = (s: string | null) => (s ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const ids = split(bodyId);
  const ens = split(bodyEn);
  return ids.map((id, i) => ({ id, en: ens.length === ids.length ? ens[i] : null }));
}

/** Throw a plain Error so callers never see raw PostgREST details. */
export function fail(context: string, error: unknown): never {
  if (import.meta.env.DEV) console.error(`[data] ${context}`, error);
  throw new Error(context);
}
