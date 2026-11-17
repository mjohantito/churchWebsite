import { useState, type FormEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { Loading, LoadError } from '../components/QueryState';
import { Button, ConfirmDialog, PageHead, StatusBadge } from './ui';

interface EditorLike {
  isNew: boolean;
  loading: boolean;
  loadError: unknown;
  status: 'draft' | 'published';
  saving: boolean;
  deleting: boolean;
  uploading: boolean;
  dirty: boolean;
  submit: (status: 'draft' | 'published') => Promise<void>;
  remove: () => Promise<void>;
  guard: { dialog: ReactNode };
}

/** Page frame + sticky action bar shared by every content editor. */
export function EditorFrame({
  editor, title, back, children,
}: { editor: EditorLike; title: string; back: { to: string; label: string }; children: ReactNode }) {
  const { t } = useTranslation();
  const { staff } = useAuth();
  const [confirm, setConfirm] = useState(false);
  const busy = editor.saving || editor.deleting || editor.uploading;

  if (editor.loading) return <Loading lines={6} className="max-w-xl" />;
  if (editor.loadError) {
    return (
      <>
        <PageHead title={title} back={back} />
        <LoadError />
      </>
    );
  }

  const published = editor.status === 'published';
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void editor.submit(published ? 'published' : 'draft');
  };

  return (
    <>
      <PageHead title={title} back={back} actions={!editor.isNew ? <StatusBadge status={editor.status} /> : undefined}>
        {editor.dirty && <span className="badge badge--warn">{t('admin.common.unsaved')}</span>}
      </PageHead>

      <form onSubmit={onSubmit} noValidate className="space-y-8 pb-28">
        {children}

        <div className="editor-actions" role="group" aria-label={t('admin.common.actions')}>
          {published ? (
            <>
              <Button type="submit" variant="primary" busy={editor.saving} disabled={busy}>{t('admin.common.saveChanges')}</Button>
              <Button disabled={busy} onClick={() => void editor.submit('draft')}>{t('admin.common.unpublish')}</Button>
            </>
          ) : (
            <>
              <Button variant="primary" busy={editor.saving} disabled={busy} onClick={() => void editor.submit('published')}>{t('admin.common.publish')}</Button>
              <Button type="submit" disabled={busy}>{t('admin.common.saveDraft')}</Button>
            </>
          )}
          {staff?.role === 'admin' && !editor.isNew && (
            <Button variant="danger" className="sm:ml-auto" icon="close-circle-linear" disabled={busy} onClick={() => setConfirm(true)}>
              {t('admin.common.delete')}
            </Button>
          )}
        </div>
      </form>

      <ConfirmDialog
        open={confirm}
        title={t('admin.confirmDelete.title')}
        body={t('admin.confirmDelete.body')}
        confirmLabel={t('admin.common.delete')}
        cancelLabel={t('admin.common.cancel')}
        danger
        busy={editor.deleting}
        onConfirm={() => {
          setConfirm(false);
          void editor.remove();
        }}
        onCancel={() => setConfirm(false)}
      />
      {editor.guard.dialog}
    </>
  );
}
