import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabase } from '../../lib/supabase';
import type { Database } from '../../types/database';

export type Tables = Database['public']['Tables'];

/**
 * Untyped view of the client for the generic admin helpers. Public functions
 * in src/data/admin/* re-apply the generated row types.
 */
export const untyped = () => getSupabase() as unknown as SupabaseClient;
export const db = getSupabase;
