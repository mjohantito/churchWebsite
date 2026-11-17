import 'i18next';
import type id from './id';
import type { AdminDictionary } from './admin-id';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    // `admin` is added at runtime by src/admin/AdminApp.tsx (separate chunk).
    resources: { translation: typeof id & { admin: AdminDictionary } };
  }
}
