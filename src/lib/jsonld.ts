import { localizedPath, type Locale, type RouteKey } from '~/i18n/routes';
import { t, type TKey } from '~/i18n/utils';
import type { HerbEntry, NeedEntry } from './types';

export type Breadcrumb = { name: string; url: string };

export function breadcrumbList(items: Breadcrumb[], siteOrigin: string | URL) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: new URL(it.url, siteOrigin).toString(),
    })),
  };
}

export function herbThing(herb: HerbEntry, lang: Locale, canonicalUrl: string) {
  const otherLang: Locale = lang === 'fr' ? 'en' : 'fr';
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: herb.data.name[lang],
    alternateName: herb.data.name[otherLang],
    description: herb.data.description[lang],
    inLanguage: lang === 'fr' ? 'fr-FR' : 'en-US',
    url: canonicalUrl,
    about: {
      '@type': 'Substance',
      name: herb.data.scientific,
    },
  };
}

function homeCrumb(lang: Locale): Breadcrumb {
  return { name: t(lang, 'site.name'), url: localizedPath(lang, 'home') };
}

function discoverCrumb(lang: Locale): Breadcrumb {
  return { name: t(lang, 'nav.discover'), url: localizedPath(lang, 'discover') };
}

export function buildHerbCrumbs(lang: Locale, herb: HerbEntry): Breadcrumb[] {
  return [
    homeCrumb(lang),
    discoverCrumb(lang),
    { name: herb.data.name[lang], url: localizedPath(lang, 'herbs', herb.id) },
  ];
}

export function buildNeedCrumbs(lang: Locale, need: NeedEntry): Breadcrumb[] {
  return [
    homeCrumb(lang),
    discoverCrumb(lang),
    { name: need.data.name[lang], url: localizedPath(lang, 'needs', need.id) },
  ];
}

export function buildTaxonCrumbs(
  lang: Locale,
  kind: 'property' | 'affliction',
  taxonKey: string,
): Breadcrumb[] {
  const route: RouteKey = kind === 'property' ? 'properties' : 'afflictions';
  const sectionLabelKey: TKey = kind === 'property' ? 'herb.properties' : 'herb.afflictions';
  const labelKey = `${kind}.${taxonKey}` as TKey;
  return [
    homeCrumb(lang),
    discoverCrumb(lang),
    { name: t(lang, sectionLabelKey), url: localizedPath(lang, 'discover') },
    { name: t(lang, labelKey), url: localizedPath(lang, route, taxonKey) },
  ];
}
