import { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '../components/Icon';
import { publicFileUrl } from '../lib/supabase';
import { BUCKETS, checkFile, uploadFile, type Bucket } from '../data/admin/storage';
import { toAdminError } from '../data/admin/errors';
import { Button, formatBytes } from './ui';

interface Props {
  label: string;
  hint?: string;
  bucket: Bucket;
  kind: 'audio' | 'image' | 'document';
  value: string | null;
  onChange: (path: string | null) => void;
  onUploadingChange?: (uploading: boolean) => void;
}

/**
 * Upload with validation (type + size before sending), a progress bar,
 * cancel, and a preview of the current file.
 * Replacing or removing a file does not delete the old one from storage
 * (editors cannot delete files); admins' record deletes clean files up.
 */
export function FileField({ label, hint, bucket, kind, value, onChange, onUploadingChange }: Props) {
  const { t } = useTranslation();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const abort = useRef<AbortController | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [picked, setPicked] = useState<{ name: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const url = publicFileUrl(bucket, value);
  const rules = BUCKETS[bucket];
  const accept = rules.ext.map((e) => `.${e}`).join(',');

  const start = async (file: File) => {
    setError(null);
    setPicked({ name: file.name, size: file.size });
    try {
      checkFile(bucket, file);
    } catch (err) {
      setError(t(`admin.errors.${toAdminError(err).code}`, { size: formatBytes(rules.maxBytes) }));
      return;
    }
    abort.current = new AbortController();
    setProgress(0);
    onUploadingChange?.(true);
    try {
      const path = await uploadFile(bucket, file, { onProgress: setProgress, signal: abort.current.signal });
      onChange(path);
    } catch (err) {
      const code = toAdminError(err).code;
      if (code !== 'aborted') setError(t(`admin.errors.${code}`, { size: formatBytes(rules.maxBytes) }));
    } finally {
      setProgress(null);
      onUploadingChange?.(false);
      if (input.current) input.current.value = '';
    }
  };

  const fileName = value?.split('/').pop()?.replace(/^\d+-/, '');

  return (
    <div className="file-field">
      <p className="field-label" id={`${id}-label`}>
        {label}
        <span className="field-flag">{t('admin.common.optional')}</span>
      </p>

      {url && progress === null && (
        <div className="file-current">
          {kind === 'audio' && <audio controls preload="none" src={url} className="w-full" aria-labelledby={`${id}-label`} />}
          {kind === 'image' && <img src={url} alt="" className="max-h-56 rounded-lg border border-stone-200 object-contain" />}
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <Icon name="document-text-linear" className="h-4 w-4" />
            <a href={url} target="_blank" rel="noopener noreferrer" className="prose-link break-all">{fileName}</a>
          </p>
        </div>
      )}

      {progress !== null && (
        <div className="mt-2">
          <p className="text-sm" aria-live="polite">
            {t('admin.file.uploading', { percent: Math.round(progress * 100) })}
            {picked && ` · ${picked.name} (${formatBytes(picked.size)})`}
          </p>
          <progress className="file-progress" max={1} value={progress} aria-labelledby={`${id}-label`} />
          <Button variant="ghost" className="mt-2" onClick={() => abort.current?.abort()}>{t('admin.file.cancelUpload')}</Button>
        </div>
      )}

      {progress === null && (
        <div className="mt-2 flex flex-wrap gap-2">
          <input ref={input} id={id} type="file" accept={accept} className="sr-only" aria-describedby={`${id}-hint`}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void start(f);
            }} />
          <label htmlFor={id} className="abtn abtn--secondary cursor-pointer">
            <Icon name="download-minimalistic-linear" className="h-5 w-5 rotate-180" />
            {value ? t('admin.file.replace') : t('admin.file.choose')}
          </label>
          {value && <Button variant="ghost" onClick={() => onChange(null)}>{t('admin.file.remove')}</Button>}
        </div>
      )}

      <p id={`${id}-hint`} className="field-hint">
        {hint ? `${hint} ` : ''}
        {t('admin.file.limits', { types: rules.ext.join(', ').toUpperCase(), size: formatBytes(rules.maxBytes) })}
        {picked && progress === null && !error && ` ${t('admin.file.lastPicked', { name: picked.name, size: formatBytes(picked.size) })}`}
      </p>
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}
