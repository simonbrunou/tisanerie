import { localizedPath, type Locale } from '~/i18n/routes';
import { t, type TKey } from '~/i18n/utils';
import type { HerbEntry, NeedEntry } from './types';
import { usedAfflictionKeys, usedPropertyKeys } from './taxons';

export type SearchItem = {
  id: string;
  type: 'herb' | 'need' | 'property' | 'affliction';
  title: string;
  subtitle: string;
  emoji: string;
  href: string;
  haystack: string;
};

export function buildSearchItems(
  lang: Locale,
  herbs: readonly HerbEntry[],
  needs: readonly NeedEntry[],
): SearchItem[] {
  const propertyKeys = usedPropertyKeys(herbs);
  const afflictionKeys = usedAfflictionKeys(herbs);

  return [
    ...herbs.map<SearchItem>((h) => ({
      id: h.id,
      type: 'herb',
      title: h.data.name[lang],
      subtitle: h.data.scientific,
      emoji: h.data.emoji,
      href: localizedPath(lang, 'herbs', h.id),
      haystack: [
        h.data.name.fr,
        h.data.name.en,
        h.data.scientific,
        ...h.data.flavor.fr,
        ...h.data.flavor.en,
        ...h.data.benefits,
        ...(h.data.properties ?? []).flatMap((k) => [
          t('fr', `property.${k}` as TKey),
          t('en', `property.${k}` as TKey),
        ]),
        ...(h.data.afflictions ?? []).flatMap((k) => [
          t('fr', `affliction.${k}` as TKey),
          t('en', `affliction.${k}` as TKey),
        ]),
      ].join(' '),
    })),
    ...needs.map<SearchItem>((n) => ({
      id: n.id,
      type: 'need',
      title: n.data.name[lang],
      subtitle: n.data.short[lang],
      emoji: n.data.emoji,
      href: localizedPath(lang, 'needs', n.id),
      haystack: [n.data.name.fr, n.data.name.en, n.data.benefit, ...n.data.related].join(' '),
    })),
    ...propertyKeys.map<SearchItem>((k) => ({
      id: k,
      type: 'property',
      title: t(lang, `property.${k}` as TKey),
      subtitle: t(lang, 'search.typeProperty'),
      emoji: '🌿',
      href: localizedPath(lang, 'properties', k),
      haystack: [t('fr', `property.${k}` as TKey), t('en', `property.${k}` as TKey), k].join(' '),
    })),
    ...afflictionKeys.map<SearchItem>((k) => ({
      id: k,
      type: 'affliction',
      title: t(lang, `affliction.${k}` as TKey),
      subtitle: t(lang, 'search.typeAffliction'),
      emoji: '🩹',
      href: localizedPath(lang, 'afflictions', k),
      haystack: [t('fr', `affliction.${k}` as TKey), t('en', `affliction.${k}` as TKey), k].join(' '),
    })),
  ];
}
