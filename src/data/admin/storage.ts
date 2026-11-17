// File uploads for the admin page. Uses XHR (not supabase-js) so we can show
// upload progress. Same endpoint and auth as supabase-js storage.upload().
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../../lib/env';
import { getSupabase } from '../../lib/supabase';
import { AdminError, toAdminError } from './errors';

export type Bucket = 'daily-bread-audio' | 'sermon-slides' | 'announcement-images';

/** Client-side limits; the buckets enforce the same limits server-side. */
export const BUCKETS: Record<Bucket, { maxBytes: number; mime: string[]; ext: string[] }> = {
  'daily-bread-audio': {
    maxBytes: 15 * 1024 * 1024,
    mime: ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/m4a', 'audio/aac'],
    ext: ['mp3', 'm4a'],
  },
  'sermon-slides': {
    maxBytes: 50 * 1024 * 1024,
    mime: ['application/pdf', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    ext: ['pdf', 'pptx'],
  },
  'announcement-images': {
    maxBytes: 5 * 1024 * 1024,
    mime: ['image/jpeg', 'image/png', 'image/webp'],
    ext: ['jpg', 'jpeg', 'png', 'webp'],
  },
};

const EXT_MIME: Record<string, string> = {
  mp3: 'audio/mpeg', m4a: 'audio/mp4', pdf: 'application/pdf',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
};

const extOf = (name: string) => name.split('.').pop()?.toLowerCase() ?? '';

/** Validates type and size before uploading. Throws AdminError('fileType' | 'tooLarge'). */
export function checkFile(bucket: Bucket, file: File): string {
  const rules = BUCKETS[bucket];
  const ext = extOf(file.name);
  const type = file.type || EXT_MIME[ext] || '';
  if (!rules.ext.includes(ext) && !rules.mime.includes(type)) throw new AdminError('fileType');
  if (file.size > rules.maxBytes) throw new AdminError('tooLarge');
  return rules.mime.includes(type) ? type : EXT_MIME[ext];
}

function safeName(name: string) {
  const ext = extOf(name);
  const base = name.slice(0, name.length - ext.length - 1).normalize('NFKD')
    .replace(/[^\w-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 60) || 'file';
  return `${base}.${ext}`;
}

/** Uploads to `bucket` and resolves with the stored path (YYYY/MM/<time>-<name>). */
export async function uploadFile(
  bucket: Bucket,
  file: File,
  opts: { onProgress?: (fraction: number) => void; signal?: AbortSignal } = {},
): Promise<string> {
  const contentType = checkFile(bucket, file);
  const { data } = await getSupabase().auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new AdminError('session');

  const now = new Date();
  const path = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getTime()}-${safeName(file.name)}`;
  const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${path.split('/').map(encodeURIComponent).join('/')}`;

  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.setRequestHeader('cache-control', 'max-age=31536000');
    xhr.upload.onprogress = (e) => e.lengthComputable && opts.onProgress?.(e.loaded / e.total);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve(path);
      let body: { message?: string; statusCode?: string } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        /* not JSON */
      }
      reject(toAdminError({ status: Number(body.statusCode) || xhr.status, message: body.message }));
    };
    xhr.onerror = () => reject(new AdminError('network'));
    xhr.onabort = () => reject(new AdminError('aborted'));
    opts.signal?.addEventListener('abort', () => xhr.abort());
    xhr.send(file);
  });
}

/** Admin only (RLS). Missing files are ignored. */
export async function removeFile(bucket: Bucket, path: string | null | undefined) {
  if (!path) return;
  const { error } = await getSupabase().storage.from(bucket).remove([path]);
  if (error && import.meta.env.DEV) console.warn('[removeFile]', error);
}
