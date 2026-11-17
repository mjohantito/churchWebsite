import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useContentItem, useDeleteContent, useSaveContent } from '../data/admin/hooks';
import type { ContentTable, Input, Row } from '../data/admin/content';
import { useToast } from './Toast';
import { useAdminError } from './useAdminError';
import { useUnsavedGuard } from './useUnsavedGuard';

type Status = 'draft' | 'published';
export type Errors<F> = Partial<Record<keyof F, string>>;

interface Options<T extends ContentTable, F> {
  table: T;
  id: string | null; // null = new
  basePath: string; // e.g. /admin/daily-bread
  empty: () => F;
  fromRow: (row: Row<T>) => F;
  toInput: (form: F, status: Status) => Input<T>;
  validate: (form: F) => Errors<F>;
}

/**
 * Shared logic for every content form: load, edit, validate, save as draft
 * or publish, delete (admin), unsaved-changes guard, toasts.
 */
export function useContentEditor<T extends ContentTable, F extends object>(o: Options<T, F>) {
  const { t } = useTranslation();
  const toast = useToast();
  const onError = useAdminError();
  const navigate = useNavigate();
  const item = useContentItem(o.table, o.id);
  const save = useSaveContent(o.table);
  const del = useDeleteContent(o.table);

  const [form, setForm] = useState<F>(o.empty);
  const [baseline, setBaseline] = useState<string>(() => JSON.stringify(o.empty()));
  const [errors, setErrors] = useState<Errors<F>>({});
  const [uploading, setUploading] = useState(false);
  const loadedId = useRef<string | null>(null);

  // Load the row once per id.
  useEffect(() => {
    if (item.data && loadedId.current !== o.id) {
      const f = o.fromRow(item.data);
      setForm(f);
      setBaseline(JSON.stringify(f));
      loadedId.current = o.id;
    }
  }, [item.data, o]);

  const dirty = useMemo(() => JSON.stringify(form) !== baseline, [form, baseline]);
  const guard = useUnsavedGuard(dirty);
  const status: Status = (item.data as { status?: Status } | undefined)?.status ?? 'draft';

  const set = <K extends keyof F>(key: K, value: F[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const submit = async (nextStatus: Status) => {
    const found = o.validate(form);
    setErrors(found);
    const firstKey = Object.keys(found).find((k) => found[k as keyof F]);
    if (firstKey) {
      toast.error(t('admin.errors.fixFields'));
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    try {
      const row = await save.mutateAsync({ id: o.id, input: o.toInput(form, nextStatus) });
      const saved = o.fromRow(row);
      setForm(saved);
      setBaseline(JSON.stringify(saved));
      toast.success(
        nextStatus === 'published' && status !== 'published'
          ? t('admin.toast.published')
          : nextStatus === 'draft' && status === 'published'
            ? t('admin.toast.unpublished')
            : t('admin.toast.saved'),
      );
      if (!o.id) {
        guard.allowNavigation();
        loadedId.current = (row as { id: string }).id;
        navigate(`${o.basePath}/${(row as { id: string }).id}`, { replace: true });
      }
    } catch (err) {
      onError(err);
    }
  };

  const remove = async () => {
    if (!item.data) return;
    try {
      await del.mutateAsync(item.data);
      toast.success(t('admin.toast.deleted'));
      guard.allowNavigation();
      navigate(o.basePath, { replace: true });
    } catch (err) {
      onError(err);
    }
  };

  return {
    form, set, errors, dirty, status, guard,
    isNew: !o.id,
    loading: Boolean(o.id) && item.isPending,
    loadError: item.isError ? item.error : null,
    saving: save.isPending,
    deleting: del.isPending,
    uploading, setUploading,
    submit, remove,
  };
}
