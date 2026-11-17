import type { Tables } from './db';
import { db } from './db';
import { AdminError, unwrap, unwrapList } from './errors';

export type Submission = Tables['form_submissions']['Row'];
export type SubmissionType = Submission['type'];
export type SubmissionStatus = Submission['status'];

export interface InboxFilter {
  type?: SubmissionType | '';
  status?: SubmissionStatus | '';
  search?: string;
}

/** Newest first, filtered. `limit` is higher for CSV export. */
export async function listSubmissions(filter: InboxFilter, limit = 200): Promise<Submission[]> {
  let q = db().from('form_submissions').select('*');
  if (filter.type) q = q.eq('type', filter.type);
  if (filter.status) q = q.eq('status', filter.status);
  const s = filter.search?.trim().replace(/[%_,()]/g, ' ').trim();
  if (s) q = q.ilike('full_name', `%${s}%`);
  return unwrapList(await q.order('created_at', { ascending: false }).limit(limit));
}

export async function getSubmission(id: string): Promise<Submission> {
  const row = unwrap(await db().from('form_submissions').select('*').eq('id', id).maybeSingle());
  if (!row) throw new AdminError('notFound');
  return row;
}

/** Staff may change only status and notes; handled_by is stamped by the database. */
export async function updateSubmission(id: string, patch: { status?: SubmissionStatus; staff_notes?: string | null }) {
  const row = unwrap(await db().from('form_submissions').update(patch).eq('id', id).select('*').maybeSingle());
  if (!row) throw new AdminError('forbidden');
  return row;
}

/** Admin only (RLS). */
export async function deleteSubmission(id: string) {
  const rows = unwrapList(await db().from('form_submissions').delete().eq('id', id).select('id'));
  if (!rows.length) throw new AdminError('forbidden');
}

/** Dashboard: new (unhandled) submissions per type, plus the latest five. */
export async function inboxSummary() {
  const [fresh, latest] = await Promise.all([
    db().from('form_submissions').select('type').eq('status', 'new').limit(1000),
    db().from('form_submissions').select('*').order('created_at', { ascending: false }).limit(5),
  ]);
  const counts: Partial<Record<SubmissionType, number>> = {};
  for (const r of unwrapList(fresh)) counts[r.type] = (counts[r.type] ?? 0) + 1;
  return { counts, latest: unwrapList(latest) };
}

/** CSV with a UTF-8 BOM (opens correctly in Excel). Guards against formula injection. */
export function submissionsToCsv(rows: Submission[], headers: string[]): string {
  const cell = (v: unknown) => {
    let s = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const lines = rows.map((r) =>
    [r.created_at, r.type, r.status, r.full_name, r.phone, r.email, r.message, r.extra, r.staff_notes].map(cell).join(','),
  );
  return '﻿' + [headers.map(cell).join(','), ...lines].join('\r\n');
}
