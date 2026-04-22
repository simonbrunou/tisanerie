import type { Locale } from '~/i18n/routes';
import type { HerbEntry } from './types';

function uniqueSorted(values: readonly string[]): string[] {
  return Array.from(new Set(values)).sort();
}

export function usedPropertyKeys(herbs: readonly HerbEntry[]): string[] {
  return uniqueSorted(herbs.flatMap((h) => h.data.properties ?? []));
}

export function usedAfflictionKeys(herbs: readonly HerbEntry[]): string[] {
  return uniqueSorted(herbs.flatMap((h) => h.data.afflictions ?? []));
}

function sortHerbs(lang: Locale, herbs: HerbEntry[]): HerbEntry[] {
  return [...herbs].sort((a, b) => {
    if (b.data.popularity !== a.data.popularity) {
      return b.data.popularity - a.data.popularity;
    }
    return a.data.name[lang].localeCompare(b.data.name[lang]);
  });
}

export function herbsWithProperty(
  herbs: readonly HerbEntry[],
  key: string,
  lang: Locale,
): HerbEntry[] {
  return sortHerbs(
    lang,
    herbs.filter((h) => (h.data.properties ?? []).includes(key as never)),
  );
}

export function herbsWithAffliction(
  herbs: readonly HerbEntry[],
  key: string,
  lang: Locale,
): HerbEntry[] {
  return sortHerbs(
    lang,
    herbs.filter((h) => (h.data.afflictions ?? []).includes(key as never)),
  );
}
