import { Icon as Iconify, addCollection } from '@iconify/react';
import solar from '../lib/solar-icons.json';

// Bundled subset of Solar icons (see scripts/build-icons.mjs): no runtime API calls.
addCollection(solar);

export function Icon({ name, className = 'h-5 w-5' }: { name: string; className?: string }) {
  return <Iconify icon={`solar:${name}`} className={className} aria-hidden="true" ssr />;
}
