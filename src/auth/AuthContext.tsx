import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AUTH_AVAILABLE, getSession, getStaffProfile, onAuthChange, signIn, signOut, type SignInResult } from '../data/auth';
import type { StaffProfile } from '../data/types';

type SessionStatus = 'loading' | 'signedOut' | 'signedIn';
type StaffStatus = 'idle' | 'loading' | 'staff' | 'notStaff' | 'error';

interface AuthValue {
  status: SessionStatus;
  session: Session | null;
  staff: StaffProfile | null;
  staffStatus: StaffStatus;
  available: boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<void>;
  retryStaff: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

/**
 * Session + staff role for the whole app.
 * supabase-js keeps the session in localStorage, refreshes the access token
 * before it expires (and when the tab becomes visible again), and emits
 * SIGNED_OUT if a refresh fails, so an expired session lands on /login.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<SessionStatus>(AUTH_AVAILABLE ? 'loading' : 'signedOut');

  useEffect(() => {
    if (!AUTH_AVAILABLE) return;
    let active = true;
    void getSession()
      .then((s) => {
        if (!active) return;
        setSession(s);
        setStatus(s ? 'signedIn' : 'signedOut');
      })
      .catch(() => active && setStatus('signedOut'));

    // Keep this callback synchronous: never await Supabase calls inside it.
    const unsubscribe = onAuthChange((event, s) => {
      setSession(s);
      setStatus(s ? 'signedIn' : 'signedOut');
      if (event === 'SIGNED_OUT') queryClient.removeQueries({ queryKey: ['staff'] });
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [queryClient]);

  const userId = session?.user.id ?? null;
  const staffQuery = useQuery({
    queryKey: ['staff', userId],
    queryFn: () => getStaffProfile(userId!),
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const staffStatus: StaffStatus = !userId
    ? 'idle'
    : staffQuery.isPending
      ? 'loading'
      : staffQuery.isError
        ? 'error'
        : staffQuery.data
          ? 'staff'
          : 'notStaff';

  const doSignOut = useCallback(async () => {
    await signOut();
    setSession(null);
    setStatus('signedOut');
    queryClient.removeQueries({ queryKey: ['staff'] });
  }, [queryClient]);

  const value = useMemo<AuthValue>(
    () => ({
      status,
      session,
      staff: staffQuery.data ?? null,
      staffStatus,
      available: AUTH_AVAILABLE,
      signIn,
      signOut: doSignOut,
      retryStaff: () => void staffQuery.refetch(),
    }),
    [status, session, staffQuery, staffStatus, doSignOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
