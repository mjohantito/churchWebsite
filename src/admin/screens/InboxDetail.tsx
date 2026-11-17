import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loading, LoadError } from '../../components/QueryState';
import { Icon } from '../../components/Icon';
import { useDeleteSubmission, useStaffList, useSubmission, useUpdateSubmission } from '../../data/admin/hooks';
import type { SubmissionStatus } from '../../data/admin/inbox';
import { useAuth } from '../../auth/AuthContext';
import { Button, Card, ConfirmDialog, PageHead, TextArea } from '../ui';
import { useToast } from '../Toast';
import { useAdminError } from '../useAdminError';
import { useUnsavedGuard } from '../useUnsavedGuard';
import { STATUSES, useDateTime } from './Inbox';

const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

export default function InboxDetail() {
  const { t } = useTranslation();
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { staff, session } = useAuth();
  const toast = useToast();
  const onError = useAdminError();
  const fmt = useDateTime();
  const q = useSubmission(id);
  const update = useUpdateSubmission();
  const del = useDeleteSubmission();
  const staffList = useStaffList(); // admins: everyone; editors: only themselves
  const [notes, setNotes] = useState('');
  const [confirm, setConfirm] = useState(false);
  const guard = useUnsavedGuard(Boolean(q.data) && notes !== (q.data?.staff_notes ?? ''));

  useEffect(() => {
    if (q.data) setNotes(q.data.staff_notes ?? '');
  }, [q.data?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const back = { to: '/admin/inbox', label: t('admin.inbox.back') };
  if (q.isPending) return <Loading lines={6} className="max-w-xl" />;
  if (q.isError || !q.data) return (<><PageHead title={t('admin.nav.inbox')} back={back} /><LoadError onRetry={() => void q.refetch()} /></>);
  const s = q.data;

  const setStatus = async (status: SubmissionStatus) => {
    if (status === s.status) return;
    try {
      await update.mutateAsync({ id: s.id, patch: { status } });
      toast.success(t('admin.inbox.statusSaved', { status: t(`admin.inbox.statuses.${status}`) }));
    } catch (err) {
      onError(err);
    }
  };
  const saveNotes = async () => {
    try {
      await update.mutateAsync({ id: s.id, patch: { staff_notes: notes.trim() ? notes.trim() : null } });
      toast.success(t('admin.toast.saved'));
    } catch (err) {
      onError(err);
    }
  };
  const remove = async () => {
    setConfirm(false);
    try {
      await del.mutateAsync(s.id);
      toast.success(t('admin.toast.deleted'));
      guard.allowNavigation();
      navigate('/admin/inbox', { replace: true });
    } catch (err) {
      onError(err);
    }
  };

  const handler = !s.handled_by
    ? t('admin.inbox.notHandled')
    : s.handled_by === session?.user.id
      ? t('admin.inbox.handledByYou')
      : staffList.data?.find((x) => x.user_id === s.handled_by)?.full_name ?? t('admin.inbox.handledByOther');
  const extra = (s.extra && typeof s.extra === 'object' && !Array.isArray(s.extra) ? s.extra : {}) as Record<string, unknown>;

  return (
    <>
      <PageHead title={s.full_name} back={back}
        actions={<span className={`badge badge--${s.status}`}>{t(`admin.inbox.statuses.${s.status}`)}</span>}>
        {t(`admin.inbox.types.${s.type}`)} · {t('admin.inbox.received')} {fmt(s.created_at)}
      </PageHead>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <Card>
            <div className="flex flex-wrap gap-2">
              {s.phone && (
                <a href={telHref(s.phone)} className="abtn abtn--primary">
                  <Icon name="phone-linear" className="h-5 w-5" />
                  {t('admin.inbox.call')} {s.phone}
                </a>
              )}
              {s.email && (
                <a href={`mailto:${s.email}`} className="abtn abtn--secondary">
                  <Icon name="letter-linear" className="h-5 w-5" />
                  <span className="break-all">{s.email}</span>
                </a>
              )}
            </div>
            <h2 className="admin-h2 mt-6">{t('admin.inbox.message')}</h2>
            <p className="mt-2 whitespace-pre-wrap leading-relaxed">{s.message || '—'}</p>
            {typeof extra.voice_part === 'string' && (
              <p className="mt-4 text-sm"><strong>{t('admin.inbox.voicePart')}:</strong> {t(`forms.voiceParts.${extra.voice_part as 'alto'}`)}</p>
            )}
            {typeof extra.lang === 'string' && (
              <p className="mt-1 text-sm text-stone-600">{t('admin.inbox.formLanguage')}: {extra.lang.toUpperCase()}</p>
            )}
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-5">
          <Card>
            <fieldset>
              <legend className="admin-h2">{t('admin.inbox.statusLabel')}</legend>
              <div className="seg mt-3" role="radiogroup" aria-label={t('admin.inbox.statusLabel')}>
                {STATUSES.map((st) => (
                  <label key={st} className={`seg__opt ${s.status === st ? 'is-on' : ''}`}>
                    <input type="radio" name="status" value={st} checked={s.status === st} disabled={update.isPending}
                      onChange={() => void setStatus(st)} />
                    {t(`admin.inbox.statuses.${st}`)}
                  </label>
                ))}
              </div>
            </fieldset>
            <p className="mt-4 text-sm text-stone-600">{t('admin.inbox.handledBy')}: <strong>{handler}</strong></p>
          </Card>
          <Card>
            <TextArea label={t('admin.inbox.notes')} hint={t('admin.inbox.notesHint')} rows={5} value={notes} onChange={setNotes} maxLength={4000} />
            <Button className="mt-3" busy={update.isPending} disabled={notes === (s.staff_notes ?? '')} onClick={() => void saveNotes()}>
              {t('admin.inbox.saveNotes')}
            </Button>
          </Card>
          {staff?.role === 'admin' && (
            <Button variant="danger" icon="close-circle-linear" busy={del.isPending} onClick={() => setConfirm(true)}>
              {t('admin.common.delete')}
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog open={confirm} title={t('admin.confirmDelete.title')} body={t('admin.confirmDelete.body')}
        confirmLabel={t('admin.common.delete')} cancelLabel={t('admin.common.cancel')} danger busy={del.isPending}
        onConfirm={() => void remove()} onCancel={() => setConfirm(false)} />
      {guard.dialog}
    </>
  );
}
