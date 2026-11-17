import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import { HAS_SUPABASE, SUPABASE_ANON_KEY, SUPABASE_URL, USE_MOCK } from './env';

/**
 * The ONE Supabase client. Only the data layer (src/data/*) and the auth
 * context import it; pages and components never call Supabase directly.
 * Uses the public (publishable/anon) key: every request is limited by RLS.
 */
const isBrowser = typeof window !== 'undefined';

let client: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> {
  if (USE_MOCK) throw new Error('Supabase is disabled because VITE_USE_MOCK=true');
  if (!HAS_SUPABASE) throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  if (!client) {
    client = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        // Build-time prerender runs in Node: no session storage there.
        persistSession: isBrowser,
        autoRefreshToken: isBrowser,
        detectSessionInUrl: false,
        storageKey: 'sb-setia-bakti-auth',
      },
    });
  }
  return client;
}

/** Public URL for a file in a public bucket (null when no file). */
export function publicFileUrl(bucket: 'daily-bread-audio' | 'sermon-slides' | 'announcement-images', path: string | null) {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return getSupabase().storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
