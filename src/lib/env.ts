// Frontend environment. Only PUBLIC values belong here (Vite inlines them into
// the bundle). Never add the service_role key to any VITE_ variable.

/** VITE_USE_MOCK=true runs the site on the old mock data, fully offline. */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
export const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';

export const HAS_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
