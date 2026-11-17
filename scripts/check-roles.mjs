// Role test: signs in as an EDITOR and an ADMIN and calls the API directly,
// bypassing the UI, to prove RLS enforces the role rules.
//   node --env-file=<file with TEST_* vars> scripts/check-roles.mjs
// Needs TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD / TEST_EDITOR_EMAIL / TEST_EDITOR_PASSWORD
// (staff accounts with those roles). Everything it creates is labelled "TES ROLE"
// and removed again by the admin at the end.
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
);
const need = (k) => process.env[k] || (() => { throw new Error(`Missing ${k}`); })();
const client = () => createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

let failures = 0;
const check = (ok, label, detail = '') => {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  (${detail})` : ''}`);
};

const editor = client();
const admin = client();
const e = await editor.auth.signInWithPassword({ email: need('TEST_EDITOR_EMAIL'), password: need('TEST_EDITOR_PASSWORD') });
check(!e.error, 'editor can sign in', e.error?.message);
const a = await admin.auth.signInWithPassword({ email: need('TEST_ADMIN_EMAIL'), password: need('TEST_ADMIN_PASSWORD') });
check(!a.error, 'admin can sign in', a.error?.message);
const editorId = e.data.user?.id;

// --- staff_users ---------------------------------------------------------------
const eStaff = await editor.from('staff_users').select('user_id, role');
check(eStaff.data?.length === 1 && eStaff.data[0].role === 'editor', 'editor sees only their own staff row', `${eStaff.data?.length} row(s)`);
const aStaff = await admin.from('staff_users').select('user_id');
check((aStaff.data?.length ?? 0) >= 2, 'admin sees all staff rows', `${aStaff.data?.length} rows`);
check(Boolean((await editor.from('staff_users').insert({ user_id: editorId, full_name: 'x', role: 'admin' })).error), 'editor cannot add staff');
const promote = await editor.from('staff_users').update({ role: 'admin' }).eq('user_id', editorId).select('id');
check(!promote.data?.length, 'editor cannot promote themselves to admin');

// --- content: editor creates/edits, cannot delete -------------------------------
const groups = await editor.from('groups').select('id').limit(1);
const ins = await editor.from('announcements')
  .insert({ group_id: groups.data[0].id, title_id: 'TES ROLE pengumuman', body_id: 'Tes peran editor.', status: 'draft' })
  .select('id').single();
check(!ins.error, 'editor can create an announcement', ins.error?.message);
const annId = ins.data?.id;
const upd = await editor.from('announcements').update({ title_id: 'TES ROLE pengumuman (diubah)' }).eq('id', annId).select('id');
check(upd.data?.length === 1, 'editor can edit an announcement');
const drafts = await editor.from('sermons').select('id').eq('status', 'draft');
check((drafts.data?.length ?? 0) >= 1, 'editor (staff) can read drafts');
await editor.from('announcements').delete().eq('id', annId);
const still = await admin.from('announcements').select('id').eq('id', annId);
check(still.data?.length === 1, 'editor CANNOT delete an announcement (row still there)');
for (const table of ['daily_bread', 'sermons', 'weekly_items', 'duty_assignments']) {
  const del = await editor.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000').select('id');
  check(!del.data?.length, `editor cannot delete ${table}`);
}

// --- groups / duty roles: admin only --------------------------------------------
check(Boolean((await editor.from('groups').insert({ slug: 'tes-role-editor', name: 'TES ROLE' })).error), 'editor cannot add a group');
const gUpd = await editor.from('groups').update({ name: 'hacked' }).eq('id', groups.data[0].id).select('id');
check(!gUpd.data?.length, 'editor cannot rename a group');
check(Boolean((await editor.from('duty_roles').insert({ name_id: 'TES ROLE' })).error), 'editor cannot add a duty role');
const g = await admin.from('groups').insert({ slug: 'tes-role-admin', name: 'TES ROLE', sort_order: 99, active: false }).select('id').single();
check(!g.error, 'admin can add a group', g.error?.message);
const gDel = await admin.from('groups').delete().eq('id', g.data?.id).select('id');
check(gDel.data?.length === 1, 'admin can delete a group');

// --- roster: editor can blank a cell without delete rights -------------------------
const cell = await editor.from('duty_assignments').select('id, names').limit(1).single();
const blank = await editor.from('duty_assignments').update({ names: '' }).eq('id', cell.data.id).select('id');
check(blank.data?.length === 1, 'editor can clear a roster cell (saved as blank)');
await editor.from('duty_assignments').update({ names: cell.data.names }).eq('id', cell.data.id);

// --- inbox ------------------------------------------------------------------------
const sub = await editor.from('form_submissions').select('id, status, full_name').order('created_at').limit(1).single();
check(!sub.error && sub.data, 'editor can read the inbox');
const st = await editor.from('form_submissions').update({ status: 'contacted', staff_notes: 'TES ROLE catatan' }).eq('id', sub.data.id).select('status, handled_by').single();
check(st.data?.status === 'contacted' && st.data?.handled_by === editorId, 'editor can change status; handled_by is stamped automatically');
const nameChange = await editor.from('form_submissions').update({ full_name: 'changed' }).eq('id', sub.data.id);
check(Boolean(nameChange.error), 'editor cannot change what the person submitted (name)');
const subDel = await editor.from('form_submissions').delete().eq('id', sub.data.id).select('id');
check(!subDel.data?.length, 'editor cannot delete a submission');
await admin.from('form_submissions').update({ status: sub.data.status, staff_notes: null }).eq('id', sub.data.id);

// --- storage --------------------------------------------------------------------------
const path = `tes-role-${Date.now()}.png`;
const png = new Blob([Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='), (c) => c.charCodeAt(0))], { type: 'image/png' });
const up = await editor.storage.from('announcement-images').upload(path, png, { contentType: 'image/png' });
check(!up.error, 'editor can upload an image', up.error?.message);
await editor.storage.from('announcement-images').remove([path]);
const listed = await admin.storage.from('announcement-images').list('', { search: path });
check(listed.data?.some((f) => f.name === path), 'editor cannot delete a file');
const rm = await admin.storage.from('announcement-images').remove([path]);
check(!rm.error && rm.data?.length === 1, 'admin can delete a file');
const tooBig = await editor.storage.from('daily-bread-audio').upload(`tes-role-${Date.now()}.mp3`, new Blob([new Uint8Array(16 * 1024 * 1024)], { type: 'audio/mpeg' }), { contentType: 'audio/mpeg' });
check(Boolean(tooBig.error), 'audio over 15 MB is rejected by the bucket');

// --- admin deletes, cleanup ----------------------------------------------------------
const aDel = await admin.from('announcements').delete().eq('id', annId).select('id');
check(aDel.data?.length === 1, 'admin can delete an announcement');

await editor.auth.signOut();
await admin.auth.signOut();
console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll role checks passed');
process.exit(failures ? 1 : 0);
