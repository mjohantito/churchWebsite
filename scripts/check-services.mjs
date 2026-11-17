// Church services: RLS + Sunday-protection triggers, tested through direct API
// calls (no UI) as an anonymous visitor, an editor and an admin.
//   node --env-file=.env.test-accounts scripts/check-services.mjs
// Needs TEST_ADMIN_* / TEST_EDITOR_* (staff accounts with those roles).
// Creates one service labelled "TES" and removes it again.
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n').map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
);
const mk = () => createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const anon = mk(), editor = mk(), admin = mk();
let fails = 0;
const check = (ok, label, d = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${d ? `  (${d})` : ''}`); };
const SUNDAY = '00000000-0000-4000-8000-000000000701';

await editor.auth.signInWithPassword({ email: process.env.TEST_EDITOR_EMAIL, password: process.env.TEST_EDITOR_PASSWORD });
await admin.auth.signInWithPassword({ email: process.env.TEST_ADMIN_EMAIL, password: process.env.TEST_ADMIN_PASSWORD });

const sundayTimes = async () => (await admin.from('church_service_times').select('day_of_week, start_time').eq('service_id', SUNDAY).order('start_time')).data ?? [];
const before = await sundayTimes();
const sundayRow = (await admin.from('church_services').select('*').eq('id', SUNDAY).single()).data;

// --- anon ---------------------------------------------------------------------
const pub = await anon.from('church_services').select('name_id, visible, church_service_times(day_of_week, start_time)').order('sort_order');
check(!pub.error && pub.data.length >= 3 && pub.data.every((s) => s.visible), 'anon reads visible services with their times', `${pub.data?.length} services`);
check(Boolean((await anon.from('church_services').insert({ name_id: 'x' })).error), 'anon cannot insert a service');
check(Boolean((await anon.rpc('save_church_service', { p_id: null, p_service: { name_id: 'x' }, p_times: [] })).error), 'anon cannot call save_church_service');

// --- editor: create + edit a normal service ---------------------------------------
const created = await editor.rpc('save_church_service', {
  p_id: null,
  p_service: { name_id: 'TES Youth night', name_en: 'TES Youth night', description_id: 'Tes.', visible: true, show_on_homepage: true, cta_type: 'none' },
  p_times: [{ day_of_week: 5, start_time: '19:00', label_id: '', label_en: '' }],
});
check(!created.error && typeof created.data === 'string', 'editor creates a service with times (one transaction)', created.error?.message);
const tesId = created.data;
const upd = await editor.rpc('save_church_service', {
  p_id: tesId,
  p_service: { name_id: 'TES Youth night (diubah)', visible: true, show_on_homepage: true, cta_type: 'link', cta_label_id: 'Info', cta_url: '/contact-us' },
  p_times: [{ day_of_week: 5, start_time: '19:30' }, { day_of_week: 6, start_time: '18:00' }],
});
check(!upd.error, 'editor edits the service and replaces its times', upd.error?.message);
const tesTimes = (await anon.from('church_service_times').select('start_time').eq('service_id', tesId)).data ?? [];
check(tesTimes.length === 2, 'public sees the new times', tesTimes.map((t) => t.start_time).join(', '));

// hide -> public no longer sees it (nor its times)
await editor.from('church_services').update({ visible: false }).eq('id', tesId);
const hidden = await anon.from('church_services').select('id').eq('id', tesId);
const hiddenTimes = await anon.from('church_service_times').select('id').eq('service_id', tesId);
check(hidden.data?.length === 0 && hiddenTimes.data?.length === 0, 'hidden service and its times are invisible to the public');
const staffSees = await editor.from('church_services').select('id').eq('id', tesId);
check(staffSees.data?.length === 1, 'staff still see the hidden service');

// --- editor: deletes are blocked ----------------------------------------------------------
await editor.from('church_services').delete().eq('id', tesId);
check((await admin.from('church_services').select('id').eq('id', tesId)).data?.length === 1, 'editor CANNOT delete a service');
await editor.from('church_services').delete().eq('id', SUNDAY);
check((await admin.from('church_services').select('id').eq('id', SUNDAY)).data?.length === 1, 'editor cannot delete Sunday');

// --- Sunday protection (editor and admin) ---------------------------------------------------
for (const [who, c] of [['editor', editor], ['admin', admin]]) {
  const rename = await c.from('church_services').update({ name_id: 'Ibadah Diubah' }).eq('id', SUNDAY);
  check(Boolean(rename.error), `${who} cannot rename Sunday via a direct update`, rename.error?.message);
  const renameEn = await c.from('church_services').update({ name_en: 'Changed' }).eq('id', SUNDAY);
  check(Boolean(renameEn.error), `${who} cannot change Sunday's English name`);
  const desc = await c.from('church_services').update({ description_id: 'x' }).eq('id', SUNDAY);
  check(Boolean(desc.error), `${who} cannot change Sunday's description`);
  const kind = await c.from('church_services').update({ kind: 'other' }).eq('id', SUNDAY);
  check(Boolean(kind.error), `${who} cannot change Sunday's kind`);
  const unfix = await c.from('church_services').update({ is_fixed: false }).eq('id', SUNDAY);
  check(Boolean(unfix.error), `${who} cannot un-fix Sunday`);
  const viaRpc = await c.rpc('save_church_service', { p_id: SUNDAY, p_service: { ...sundayRow, name_id: 'Ibadah Diubah' }, p_times: before });
  check(Boolean(viaRpc.error), `${who} cannot rename Sunday via save_church_service`);
}
const adminDel = await admin.from('church_services').delete().eq('id', SUNDAY);
check(Boolean(adminDel.error) && (await anon.from('church_services').select('id').eq('id', SUNDAY)).data?.length === 1, 'admin CANNOT delete Sunday (database trigger)', adminDel.error?.message);
check(Boolean((await editor.from('church_services').insert({ name_id: 'Fake fixed', is_fixed: true, kind: 'sunday' })).error), 'nobody can create a second Sunday / fixed service from the app');

// Sunday times: editable, but at least one must remain
const delAll = await editor.from('church_service_times').delete().eq('service_id', SUNDAY);
check(Boolean(delAll.error) && (await sundayTimes()).length === before.length, 'removing ALL Sunday times is rejected (and rolled back)', delAll.error?.message);
const emptyRpc = await admin.rpc('save_church_service', { p_id: SUNDAY, p_service: sundayRow, p_times: [] });
check(Boolean(emptyRpc.error) && (await sundayTimes()).length === before.length, 'saving Sunday with no times is rejected');
const editTimes = await editor.rpc('save_church_service', { p_id: SUNDAY, p_service: sundayRow, p_times: [{ day_of_week: 0, start_time: '08:30' }] });
check(!editTimes.error && (await sundayTimes()).map((t) => t.start_time).join() === '08:30:00', 'editor CAN change Sunday times (keeping at least one)', editTimes.error?.message);
const move = await editor.from('church_service_times').update({ service_id: tesId }).eq('service_id', SUNDAY);
check(Boolean(move.error), 'a time cannot be moved to another service');
// restore Sunday exactly as it was
const restore = await admin.rpc('save_church_service', {
  p_id: SUNDAY, p_service: sundayRow,
  p_times: [{ day_of_week: 0, start_time: '08:15', label_id: 'Ibadah pagi', label_en: 'Morning service' }, { day_of_week: 0, start_time: '18:15', label_id: 'Ibadah sore', label_en: 'Evening service' }],
});
check(!restore.error && (await sundayTimes()).length === 2, 'Sunday restored to 08.15 + 18.15');

// --- admin deletes the test service -----------------------------------------------------------
const del = await admin.from('church_services').delete().eq('id', tesId).select('id');
check(del.data?.length === 1, 'admin deletes a normal service');
check(((await admin.from('church_service_times').select('id').eq('service_id', tesId)).data ?? []).length === 0, 'its times are removed with it');

await editor.auth.signOut(); await admin.auth.signOut();
console.log(fails ? `\n${fails} FAILED` : '\nAll service checks passed');
process.exit(fails ? 1 : 0);
