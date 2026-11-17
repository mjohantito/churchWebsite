import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toAdminError } from '../data/admin/errors';
import { useAuth } from '../auth/AuthContext';
import { useToast } from './Toast';

/**
 * Shows a friendly toast for any admin error. When the session has expired,
 * signs out locally: RequireStaff then sends the user to /login and back here.
 */
export function useAdminError() {
  const { t } = useTranslation();
  const toast = useToast();
  const { signOut } = useAuth();
  return useCallback(
    (err: unknown) => {
      const e = toAdminError(err);
      if (e.code === 'aborted') return;
      toast.error(t(`admin.errors.${e.code}`));
      if (e.code === 'session') void signOut();
    },
    [t, toast, signOut],
  );
}
