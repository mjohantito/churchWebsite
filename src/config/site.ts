// Site navigation. Church facts (times, address, scripture) live in src/data/churchInfo.ts.

// Single source for the header, mobile menu, footer and router.
export const NAV = [
  { path: '/daily-bread', key: 'nav.dailyBread' },
  { path: '/church-services', key: 'nav.services' },
  { path: '/baptisan', key: 'nav.baptism' },
  { path: '/pengumuman', key: 'nav.announcements' },
  { path: '/jadwal-petugas', key: 'nav.roster' },
  { path: '/contact-us', key: 'nav.contact' },
] as const;

export const STUB_ROUTES = [...NAV, { path: '/sermons', key: 'nav.sermons' }] as const;
export type NavKey = (typeof STUB_ROUTES)[number]['key'];
