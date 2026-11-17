import { useCallback, useEffect, useRef } from 'react';
import { useBlocker } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from './ui';

/**
 * Warns before leaving a form with unsaved changes: in-app navigation shows a
 * dialog; closing or reloading the tab shows the browser's own prompt.
 * Call `allowNavigation()` right before navigating after a successful save.
 */
export function useUnsavedGuard(dirty: boolean) {
  const { t } = useTranslation();
  const bypass = useRef(false);
  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }: { currentLocation: { pathname: string; search: string }; nextLocation: { pathname: string; search: string } }) =>
        dirty && !bypass.current && (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search),
      [dirty],
    ),
  );

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const dialog = (
    <ConfirmDialog
      open={blocker.state === 'blocked'}
      title={t('admin.unsaved.title')}
      body={t('admin.unsaved.body')}
      confirmLabel={t('admin.unsaved.leave')}
      cancelLabel={t('admin.unsaved.stay')}
      danger
      onConfirm={() => blocker.proceed?.()}
      onCancel={() => blocker.reset?.()}
    />
  );

  return {
    dialog,
    allowNavigation: () => {
      bypass.current = true;
    },
  };
}
