import i18n from '../i18n';
import { isIsoDate } from '../lib/dates';

/** Returns a translated message, or undefined when valid. */
type Msg = string | undefined;
export const required = (v: string): Msg => (v.trim() ? undefined : String(i18n.t('admin.validation.required')));
export const maxLen = (v: string, max: number): Msg => (v.length > max ? String(i18n.t('admin.validation.tooLong', { max })) : undefined);
export const requiredMax = (v: string, max: number): Msg => required(v) ?? maxLen(v, max);
export const date = (v: string): Msg => (isIsoDate(v) ? undefined : String(i18n.t('admin.validation.invalidDate')));

/** Drops undefined entries so "no errors" is an empty object. */
export function clean<K extends string>(e: Record<K, Msg>): Partial<Record<K, string>> {
  return Object.fromEntries(Object.entries(e).filter(([, v]) => v !== undefined)) as Partial<Record<K, string>>;
}

/** '' -> null for optional text columns. */
export const orNull = (v: string) => (v.trim() ? v.trim() : null);
