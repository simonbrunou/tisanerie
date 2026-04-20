import fr from './fr.json';
import en from './en.json';
import type { Locale } from './routes';

const dictionaries = { fr, en } as const;
export type Dict = typeof fr;
export type TKey = keyof Dict;

export function getDict(lang: Locale): Dict {
  return dictionaries[lang];
}

export function t(lang: Locale, key: TKey, params?: Record<string, string | number>): string {
  const raw = dictionaries[lang][key] ?? dictionaries.en[key] ?? key;
  if (!params) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? ''));
}

export function interpolate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? ''));
}
