// Site navigation. Church facts (address, scripture) live in src/data/churchInfo.ts;
// service times are managed in /admin/services.

// Single source for the header, mobile menu, footer and router.
export const NAV = [
  { path: '/daily-bread', key: 'nav.dailyBread' },
  { path: '/church-services', key: 'nav.services' },
  { path: '/baptisan', key: 'nav.baptism' },
  { path: '/pengumuman', key: 'nav.announcements' },
  { path: '/jadwal-petugas', key: 'nav.roster' },
  { path: '/contact-us', key: 'nav.contact' },
] as const;

// Pages not built yet: rendered with the "Coming soon" PageHeader.
export const STUB_ROUTES = [
  { path: '/baptisan', key: 'nav.baptism' },
  { path: '/contact-us', key: 'nav.contact' },
  { path: '/sermons', key: 'nav.sermons' },
] as const;
export type NavKey = (typeof NAV)[number]['key'] | (typeof STUB_ROUTES)[number]['key'];
