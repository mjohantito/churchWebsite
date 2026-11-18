// SAMPLE sermons for the /sermons page (clearly marked "Contoh / Sample").
//   node --env-file=.env.test-accounts scripts/sample-sermons.mjs add
//   node --env-file=.env.test-accounts scripts/sample-sermons.mjs remove
// Signs in as an admin (TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD), so RLS applies.
// Rows use the fixed ids 00000000-0000-4000-8000-0000000009NN; the sample
// slide file is sermon-slides/contoh/contoh-slide-khotbah.pdf. `remove`
// deletes exactly those rows and that file, nothing else.
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n').map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
);
const c = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const cmd = process.argv[2];
if (!['add', 'remove'].includes(cmd)) { console.error('usage: sample-sermons.mjs add|remove'); process.exit(2); }
const { error: authErr } = await c.auth.signInWithPassword({ email: process.env.TEST_ADMIN_EMAIL, password: process.env.TEST_ADMIN_PASSWORD });
if (authErr) { console.error('sign-in failed:', authErr.message); process.exit(1); }

const SLIDES = 'contoh/contoh-slide-khotbah.pdf';
const id = (n) => `00000000-0000-4000-8000-0000000009${String(n).padStart(2, '0')}`;
// Open-licence Blender films as stand-in videos.
const VIDEOS = ['aqz-KE-bpKQ', 'eRsGyueVLvQ', 'R6MlUcmOul8'];
const PREACHERS = ['Pdt. Contoh Satu', 'Pdt. Contoh Dua', 'Ev. Contoh Tiga'];
const TOPICS = [
  ['Kasih yang Sabar', 'Patient Love', '1 Korintus 13:4–7'],
  ['Terang di Tengah Gelap', 'Light in the Darkness', 'Yohanes 1:5'],
  ['Iman yang Bertumbuh', 'Growing Faith', 'Markus 4:30–32'],
  ['Damai yang Melampaui Akal', 'Peace Beyond Understanding', 'Filipi 4:7'],
  ['Gembala yang Baik', 'The Good Shepherd', 'Yohanes 10:11'],
  ['Pengharapan Natal', 'The Hope of Christmas', 'Lukas 2:10–11'],
  ['Langkah Baru di Tahun Baru', 'New Steps in a New Year', 'Yesaya 43:19'],
  ['Berdoa Tanpa Henti', 'Pray Without Ceasing', '1 Tesalonika 5:17'],
  ['Garam dan Terang', 'Salt and Light', 'Matius 5:13–16'],
  ['Kebangkitan dan Hidup', 'The Resurrection and the Life', 'Yohanes 11:25'],
  ['Roh yang Menolong', 'The Helper Spirit', 'Yohanes 14:26'],
  ['Melayani dengan Sukacita', 'Serving with Joy', 'Mazmur 100:2'],
  ['Satu Tubuh Banyak Anggota', 'One Body, Many Parts', '1 Korintus 12:12'],
  ['Saling Menerima', 'Accepting One Another', 'Roma 15:7'],
];
// Sundays across 2025 and 2026.
const DATES = ['2025-10-05', '2025-10-19', '2025-11-09', '2025-11-30', '2025-12-21', '2025-12-25', '2026-01-04',
  '2026-02-15', '2026-03-22', '2026-04-05', '2026-05-24', '2026-07-12', '2026-09-06', '2026-11-08'];

function summary(n, lang) {
  return lang === 'id'
    ? `**Contoh ringkasan** khotbah nomor ${n}. Teks ini hanya data contoh untuk menguji halaman materi khotbah.\n\nParagraf kedua dengan *penekanan* dan [tautan contoh](https://example.org) untuk memeriksa format.\n\nParagraf ketiga agar ringkasan cukup panjang untuk cuplikan di daftar.`
    : `**Sample summary** for sermon number ${n}. This is sample data only, to test the sermon materials page.\n\nA second paragraph with *emphasis* and a [sample link](https://example.org) to check formatting.\n\nA third paragraph so the summary is long enough for the list excerpt.`;
}

// A tiny, valid one-page PDF ("Contoh slide khotbah").
function samplePdf() {
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    null,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  const text = 'BT /F1 36 Tf 80 330 Td (CONTOH slide khotbah - sample data) Tj ET';
  objs[3] = `<< /Length ${text.length} >>\nstream\n${text}\nendstream`;
  let out = '%PDF-1.4\n'; const offs = [];
  objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offs.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}

if (cmd === 'add') {
  const up = await c.storage.from('sermon-slides').upload(SLIDES, samplePdf(), { contentType: 'application/pdf', upsert: true });
  if (up.error) { console.error('slide upload failed:', up.error.message); process.exit(1); }
  const rows = TOPICS.map(([tid, ten, ref], i) => {
    const n = i + 1;
    return {
      id: id(n),
      title_id: `Contoh: ${tid}`,
      title_en: `Sample: ${ten}`,
      preacher: PREACHERS[i % PREACHERS.length],
      preached_on: DATES[i],
      scripture_ref: ref,
      youtube_id: n === 4 ? null : VIDEOS[i % VIDEOS.length], // #4: no video
      summary_id: n === 9 ? null : summary(n, 'id'), // #9: no summary
      summary_en: n === 9 ? null : summary(n, 'en'),
      slides_path: n === 7 ? null : SLIDES, // #7: no slides
      status: 'published',
    };
  });
  rows.push({ id: id(99), title_id: 'Contoh DRAF khotbah (tidak boleh tampil)', title_en: 'Sample DRAFT sermon (must not appear)',
    preacher: 'Pdt. Contoh Satu', preached_on: '2026-10-25', youtube_id: VIDEOS[0], summary_id: 'Draf.', slides_path: SLIDES, status: 'draft' });
  const { error } = await c.from('sermons').upsert(rows, { onConflict: 'id' });
  if (error) { console.error('insert failed:', error.message); process.exit(1); }
  console.log(`added ${rows.length - 1} published sample sermons + 1 draft, and ${SLIDES}`);
} else {
  const ids = [...TOPICS.map((_, i) => id(i + 1)), id(99)];
  const del = await c.from('sermons').delete().in('id', ids).select('id');
  if (del.error) { console.error('delete failed:', del.error.message); process.exit(1); }
  const rm = await c.storage.from('sermon-slides').remove([SLIDES]);
  console.log(`removed ${del.data.length} sample sermons; slide file ${rm.error ? `not removed (${rm.error.message})` : 'removed'}`);
}
