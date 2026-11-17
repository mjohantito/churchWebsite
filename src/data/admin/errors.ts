// Turns any Supabase / network error into a small set of codes the UI can
// translate. Raw database messages never reach the screen.

export type AdminErrorCode =
  | 'duplicate' | 'forbidden' | 'invalid' | 'session' | 'network'
  | 'tooLarge' | 'fileType' | 'notFound' | 'aborted' | 'unknown';

export class AdminError extends Error {
  constructor(public code: AdminErrorCode, public cause?: unknown) {
    super(code);
  }
}

export function toAdminError(err: unknown): AdminError {
  if (err instanceof AdminError) return err;
  const e = (err ?? {}) as { code?: string; status?: number; statusCode?: string | number; message?: string; name?: string };
  const msg = String(e.message ?? '');
  const status = Number(e.status ?? e.statusCode ?? 0);
  let code: AdminErrorCode = 'unknown';
  if (e.name === 'AbortError') code = 'aborted';
  else if (e.code === '23505') code = 'duplicate';
  else if (e.code === '42501' || status === 403 || /row-level security|permission denied/i.test(msg)) code = 'forbidden';
  else if (['23514', '22001', '23502', '22P02', '23503', '22007', '22008'].includes(e.code ?? '')) code = 'invalid';
  else if (e.code === 'PGRST301' || e.code === 'PGRST303' || status === 401 || /jwt|not authenticated/i.test(msg)) code = 'session';
  else if (status === 413 || /maximum allowed size|too large/i.test(msg)) code = 'tooLarge';
  else if (/mime type|invalid_mime|not supported/i.test(msg)) code = 'fileType';
  else if (e.code === 'PGRST116') code = 'notFound';
  else if (e.name === 'TypeError' || /fetch|network/i.test(msg)) code = 'network';
  if (import.meta.env.DEV) console.error('[admin]', code, err);
  return new AdminError(code, err);
}

/** Throws a mapped AdminError when a Supabase response has an error. */
export function unwrap<T>(res: { data: T; error: unknown }): T {
  if (res.error) throw toAdminError(res.error);
  return res.data;
}

/** Like unwrap, for list queries: null becomes []. */
export function unwrapList<T>(res: { data: T[] | null; error: unknown }): T[] {
  if (res.error) throw toAdminError(res.error);
  return res.data ?? [];
}
