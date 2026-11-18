// Announcements by week (migration 20261118120000), tested through direct API
// calls as an anonymous visitor, an editor and an admin.
//   node --env-file=.env.test-accounts scripts/check-announcements.mjs [--keep]
// Needs TEST_ADMIN_* / TEST_EDITOR_* (staff accounts with those roles).
// Creates a group "TES Kelompok" with announcements A–E (this week) and F–J
// (next week), plus a draft-only week; removes everything again unless --keep.
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { addWeeks, currentWeekStart, shiftDays } from '../src/lib/week.ts'; // Sunday-to-Saturday weeks

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n').map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
);
const mk = () => createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const anon = mk(), editor = mk(), admin = mk();
const KEEP = process.argv.includes('--keep');
let fails = 0;
const check = (ok, label, d = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${d ? `  (${d})` : ''}`); };

const W0 = currentWeekStart(), W1 = addWeeks(W0, 1), WDRAFT = addWeeks(W0, 3);

await editor.auth.signInWithPassword({ email: process.env.TEST_EDITOR_EMAIL, password: process.env.TEST_EDITOR_PASSWORD });
await admin.auth.signInWithPassword({ email: process.env.TEST_ADMIN_EMAIL, password: process.env.TEST_ADMIN_PASSWORD });

// --- setup: test group (admin-only table) --------------------------------------------
const g = await admin.from('groups').insert({ slug: 'tes-kelompok', name: 'TES Kelompok', sort_order: 99 }).select('id').single();
check(!g.error, 'admin creates the test group', g.error?.message);
const GROUP = g.data?.id;
const titles = (rows) => rows.map((r) => r.title_id.replace('TES ', '')).join('');
const publicWeek = async (week) =>
  (await anon.from('announcements').select('title_id').eq('week_start', week).eq('group_id', GROUP).order('sort_order').order('created_at')).data ?? [];

// --- editor creates A–E (this week) and F–J (next week) -------------------------------
const mkRows = (letters, week) => letters.split('').map((l) => ({ group_id: GROUP, title_id: `TES ${l}`, body_id: `Isi ${l}`, week_start: week, status: 'published' }));
const ins = await editor.from('announcements').insert([...mkRows('ABCDE', W0), ...mkRows('FGHIJ', W1)]).select('id, title_id, week_start');
check(!ins.error && ins.data.length === 10, 'editor creates A–E (this week) and F–J (next week)', ins.error?.message);
const id = Object.fromEntries((ins.data ?? []).map((r) => [r.title_id.slice(4), r.id]));

check(titles(await publicWeek(W0)) === 'ABCDE', 'public: this week shows only A–E', titles(await publicWeek(W0)));
check(titles(await publicWeek(W1)) === 'FGHIJ', 'public: next week shows only F–J (published ahead is reachable)', titles(await publicWeek(W1)));

// --- constraint and default ---------------------------------------------------------------
for (const [off, day] of [[1, 'Monday'], [6, 'Saturday']]) {
  const bad = await editor.from('announcements').insert({ group_id: GROUP, title_id: 'TES bad', body_id: 'x', week_start: shiftDays(W0, off) });
  check(bad.error?.code === '23514', `week_start on a ${day} is rejected (CHECK: must be a Sunday)`, bad.error?.code);
}
const noWeek = await editor.from('announcements').insert({ group_id: GROUP, title_id: 'TES default', body_id: 'x' }).select('id, week_start').single();
check(noWeek.data?.week_start === W0, 'omitted week_start defaults to this Jakarta Sunday', noWeek.data?.week_start);
await admin.from('announcements').delete().eq('id', noWeek.data?.id);

// --- draft-only week --------------------------------------------------------------------
const draft = await editor.from('announcements').insert({ group_id: GROUP, title_id: 'TES draft', body_id: 'x', week_start: WDRAFT, status: 'draft' }).select('id').single();
const weeks = (await anon.rpc('announcement_weeks')).data ?? [];
check(weeks.includes(W0) && weeks.includes(W1), 'announcement_weeks() (anon) lists this and next week', weeks.join(', '));
check(!weeks.includes(WDRAFT), 'a week with only a draft is NOT listed for visitors');
check((await publicWeek(WDRAFT)).length === 0, 'visitors see nothing in the draft-only week');
check(((await anon.from('announcements').select('id').eq('id', draft.data?.id)).data ?? []).length === 0, 'anon cannot read the draft by id');
check(((await editor.from('announcements').select('id').eq('week_start', WDRAFT)).data ?? []).length === 1, 'staff do see the draft');
const staffWeeks = (await editor.rpc('announcement_weeks')).data ?? [];
check(!staffWeeks.includes(WDRAFT), 'announcement_weeks() lists published weeks only, also for staff');

// --- anon cannot write ------------------------------------------------------------------
check(Boolean((await anon.from('announcements').insert({ group_id: GROUP, title_id: 'x', body_id: 'x' })).error), 'anon cannot insert');
check(Boolean((await anon.rpc('reorder_announcements', { p_week: W0, p_ids: [id.A] })).error), 'anon cannot call reorder_announcements');
check(Boolean((await anon.rpc('copy_announcements_to_next_week', { p_ids: [id.A] })).error), 'anon cannot call copy_announcements_to_next_week');

// --- reorder (editor) ---------------------------------------------------------------------
const re = await editor.rpc('reorder_announcements', { p_week: W0, p_ids: [id.E, id.D, id.C, id.B, id.A, id.F] });
check(!re.error && re.data === 5, 'editor reorders this week (id from another week ignored)', `${re.data} ${re.error?.message ?? ''}`);
check(titles(await publicWeek(W0)) === 'EDCBA', 'public order follows sort_order', titles(await publicWeek(W0)));
check(titles(await publicWeek(W1)) === 'FGHIJ', 'next week order untouched');

// --- new items and moved items go to the END of their week (20261118130000) -------------------
const k = await editor.from('announcements').insert({ group_id: GROUP, title_id: 'TES K', body_id: 'x', week_start: W0, status: 'published' }).select('id').single();
check(titles(await publicWeek(W0)) === 'EDCBAK', 'a new item after a reorder goes to the end (not the top)', titles(await publicWeek(W0)));
await editor.from('announcements').update({ week_start: W1 }).eq('id', k.data?.id);
check(titles(await publicWeek(W1)) === 'FGHIJK', 'an item moved to another week goes to the end of that week', titles(await publicWeek(W1)));
await admin.from('announcements').delete().eq('id', k.data?.id);

// --- copy to next week (editor) -------------------------------------------------------------
const c1 = await editor.rpc('copy_announcements_to_next_week', { p_ids: [id.A] });
check(!c1.error && c1.data === 1, 'editor copies A to next week', c1.error?.message);
const nextStaff = (await editor.from('announcements').select('title_id, status, sort_order').eq('week_start', W1).eq('group_id', GROUP).order('sort_order').order('created_at')).data ?? [];
check(titles(nextStaff) === 'FGHIJA' && nextStaff.at(-1).status === 'draft', 'copy lands after F–J as a draft', nextStaff.map((r) => `${r.title_id.slice(4)}:${r.status}:${r.sort_order}`).join(' '));
check(titles(await publicWeek(W1)) === 'FGHIJ', 'the copied draft is not public');
const c2 = await editor.rpc('copy_announcements_to_next_week', { p_ids: [id.E, id.D, id.C, id.B, id.A] });
check(c2.data === 5, 'copy all (5) to next week', String(c2.data));
const nextAll = (await editor.from('announcements').select('title_id, status').eq('week_start', W1).eq('group_id', GROUP).order('sort_order').order('created_at')).data ?? [];
check(titles(nextAll) === 'FGHIJAEDCBA' && nextAll.slice(5).every((r) => r.status === 'draft'), 'copies keep their order, after the existing items', titles(nextAll));

// --- deletes: editor blocked, admin allowed ---------------------------------------------------
await editor.from('announcements').delete().eq('id', id.J);
check(((await admin.from('announcements').select('id').eq('id', id.J)).data ?? []).length === 1, 'editor CANNOT delete an announcement');
const del = await admin.from('announcements').delete().eq('id', id.J).select('id');
check(del.data?.length === 1, 'admin deletes an announcement');
check(titles(await publicWeek(W1)) === 'FGHI', 'deleted item is gone from the public week');

// --- cleanup ---------------------------------------------------------------------------------
if (!KEEP) {
  await admin.from('announcements').delete().eq('group_id', GROUP);
  await admin.from('groups').delete().eq('id', GROUP);
  const left = (await admin.from('announcements').select('id').like('title_id', 'TES %')).data ?? [];
  check(left.length === 0, 'cleanup: test announcements and group removed');
}

console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
process.exit(fails ? 1 : 0);
