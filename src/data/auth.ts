// Staff authentication (email + password). Public sign-up is disabled in
// Supabase; staff accounts are created in the dashboard.
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { USE_MOCK } from '../lib/env';
import { getSupabase } from '../lib/supabase';
import { fail } from './map';
import type { StaffProfile } from './types';

export const AUTH_AVAILABLE = !USE_MOCK;

export async function getSession(): Promise<Session | null> {
  if (!AUTH_AVAILABLE) return null;
  const { data } = await getSupabase().auth.getSession();
  return data.session;
}

export function onAuthChange(cb: (event: AuthChangeEvent, session: Session | null) => void): () => void {
  if (!AUTH_AVAILABLE) return () => {};
  const { data } = getSupabase().auth.onAuthStateChange(cb);
  return () => data.subscription.unsubscribe();
}

export type SignInResult = { ok: true } | { ok: false; reason: 'invalid' | 'unavailable' | 'network' };

export async function signIn(email: string, password: string): Promise<SignInResult> {
  if (!AUTH_AVAILABLE) return { ok: false, reason: 'unavailable' };
  try {
    const { error } = await getSupabase().auth.signInWithPassword({ email: email.trim(), password });
    if (!error) return { ok: true };
    // 400 = wrong credentials / unconfirmed; anything else is treated as a network/server problem.
    return { ok: false, reason: error.status === 400 ? 'invalid' : 'network' };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

export async function signOut(): Promise<void> {
  if (!AUTH_AVAILABLE) return;
  // 'local' always clears this browser even if the network call fails.
  await getSupabase().auth.signOut({ scope: 'local' });
}

/** The signed-in user's staff row (RLS returns only their own), or null if not staff. */
export async function getStaffProfile(userId: string): Promise<StaffProfile | null> {
  const { data, error } = await getSupabase()
    .from('staff_users')
    .select('full_name, role')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) fail('getStaffProfile', error);
  return data;
}
