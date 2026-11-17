// Security smoke test: acts as a PUBLIC visitor (publishable/anon key only)
// and checks that Row Level Security blocks everything it should.
//   npm run db:check              read/write denial checks (no data written)
//   npm run db:check -- --insert  also inserts ONE labelled test submission
// Reads VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY from .env.local.
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).replace(/^["']|["']$/g, '')]),
);
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) throw new Error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env.local');

const anon = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const doInsert = process.argv.includes('--insert');
let failures = 0;
const check = (ok, label, detail = '') => {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  (${detail})` : ''}`);
};
const denied = (res) => Boolean(res.error) || (Array.isArray(res.data) && res.data.length === 0);

// --- public content is readable ---------------------------------------------
const sermons = await anon.from('sermons').select('id, status');
check(!sermons.error && sermons.data.length > 0, 'anon can read published sermons', `${sermons.data?.length ?? 0} rows`);
check(!sermons.error && sermons.data.every((r) => r.status === 'published'), 'anon sees ONLY published sermons');

for (const table of ['announcements', 'daily_bread', 'weekly_items']) {
  const all = await anon.from(table).select('status');
  check(!all.error && all.data.every((r) => r.status === 'published'), `anon sees no draft ${table}`, `${all.data?.length ?? 0} visible`);
  const drafts = await anon.from(table).select('id').eq('status', 'draft');
  check(denied(drafts), `anon cannot query draft ${table}`);
}

const groups = await anon.from('groups').select('slug, active');
check(!groups.error && groups.data.every((g) => g.active), 'anon sees only active groups', `${groups.data?.length ?? 0} rows`);
const roster = await anon.from('duty_assignments').select('id').limit(1);
check(!roster.error, 'anon can read the duty roster');

// --- private data is not readable -------------------------------------------
check(denied(await anon.from('form_submissions').select('*')), 'anon cannot SELECT form_submissions');
check(denied(await anon.from('staff_users').select('*')), 'anon cannot SELECT staff_users');

// --- anon cannot write content or touch submissions -------------------------
const fakeId = '00000000-0000-4000-8000-000000000301';
const upd = await anon.from('form_submissions').update({ status: 'done' }).neq('id', '00000000-0000-0000-0000-000000000000').select('id');
check(denied(upd), 'anon cannot UPDATE form_submissions');
const del = await anon.from('form_submissions').delete().neq('id', '00000000-0000-0000-0000-000000000000').select('id');
check(denied(del), 'anon cannot DELETE form_submissions');
check(denied(await anon.from('sermons').update({ title_id: 'hacked' }).eq('id', fakeId).select('id')), 'anon cannot UPDATE sermons');
check(Boolean((await anon.from('sermons').insert({ title_id: 'x', preached_on: '2026-01-04' })).error), 'anon cannot INSERT sermons');
check(Boolean((await anon.from('staff_users').insert({ user_id: fakeId, full_name: 'x', role: 'admin' })).error), 'anon cannot make itself staff');

// Inserting with staff-only fields set must be rejected by the policy.
const sneaky = await anon.from('form_submissions').insert({
  type: 'contact', full_name: 'RLS test (should be rejected)', email: 'test@example.com', status: 'done', staff_notes: 'x',
});
check(Boolean(sneaky.error), 'anon cannot insert a submission with staff fields set');
// Length constraint
const tooLong = await anon.from('form_submissions').insert({ type: 'contact', full_name: 'x'.repeat(121), email: 'test@example.com' });
check(Boolean(tooLong.error), 'name longer than 120 characters is rejected');
const noContact = await anon.from('form_submissions').insert({ type: 'contact', full_name: 'No contact' });
check(Boolean(noContact.error), 'submission without phone or email is rejected');

// --- storage ------------------------------------------------------------------
const upload = await anon.storage.from('announcement-images').upload(`rls-test-${Date.now()}.png`, new Blob(['x'], { type: 'image/png' }));
check(Boolean(upload.error), 'anon cannot upload to storage');
const list = await anon.storage.from('sermon-slides').list();
check(denied(list), 'anon cannot list bucket contents');

// --- auth settings --------------------------------------------------------------
const settings = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } }).then((r) => r.json());
check(settings.disable_signup === true, 'public sign-up is disabled', `disable_signup=${settings.disable_signup}`);

// --- optional positive insert -----------------------------------------------------
if (doInsert) {
  const ok = await anon.from('form_submissions').insert({
    type: 'contact', full_name: 'TES OTOMATIS - boleh dihapus', email: 'test@example.com',
    message: 'Inserted by scripts/check-rls.mjs to prove anon INSERT works.', extra: { source: 'rls-check' },
  });
  check(!ok.error, 'anon CAN insert a normal submission', ok.error?.message ?? 'row created');
}

console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
