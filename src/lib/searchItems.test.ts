import { describe, expect, it } from 'vitest';
import { buildSearchItems } from './searchItems';
import { localizedPath } from '~/i18n/routes';
import { t } from '~/i18n/utils';
import type { HerbEntry, NeedEntry } from './types';

const chamomile = {
  id: 'chamomile',
  data: {
    name: { fr: 'Camomille', en: 'Chamomile' },
    scientific: 'Matricaria chamomilla',
    emoji: '🌼',
    benefits: ['sleep'],
    primaryBenefits: ['sleep'],
    properties: ['digestive'],
    afflictions: ['insomnia'],
    popularity: 95,
    flavor: { fr: ['florale'], en: ['floral'] },
  },
} as unknown as HerbEntry;

const ginger = {
  id: 'ginger',
  data: {
    name: { fr: 'Gingembre', en: 'Ginger' },
    scientific: 'Zingiber officinale',
    emoji: '🫚',
    benefits: ['digestion'],
    primaryBenefits: ['digestion'],
    properties: ['digestive'],
    afflictions: [],
    popularity: 85,
    flavor: { fr: ['épicé'], en: ['spicy'] },
  },
} as unknown as HerbEntry;

const sleepNeed = {
  id: 'sleep',
  data: {
    name: { fr: 'Sommeil', en: 'Sleep' },
    short: { fr: 'Dormir mieux', en: 'Sleep better' },
    benefit: 'sleep',
    emoji: '😴',
    related: ['stress'],
  },
} as unknown as NeedEntry;

describe('buildSearchItems', () => {
  const items = buildSearchItems('fr', [chamomile, ginger], [sleepNeed]);

  it('produces one entry per herb, need, plus derived property/affliction taxons', () => {
    const counts = items.reduce<Record<string, number>>((acc, it) => {
      acc[it.type] = (acc[it.type] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({ herb: 2, need: 1, property: 1, affliction: 1 });
  });

  it('uses localizedPath for hrefs', () => {
    const herb = items.find((it) => it.id === 'chamomile' && it.type === 'herb');
    expect(herb?.href).toBe(localizedPath('fr', 'herbs', 'chamomile'));

    const prop = items.find((it) => it.type === 'property' && it.id === 'digestive');
    expect(prop?.href).toBe(localizedPath('fr', 'properties', 'digestive'));

    const affl = items.find((it) => it.type === 'affliction' && it.id === 'insomnia');
    expect(affl?.href).toBe(localizedPath('fr', 'afflictions', 'insomnia'));
  });

  it('includes FR + EN name, scientific, flavor and translated taxons in the haystack', () => {
    const herb = items.find((it) => it.id === 'chamomile' && it.type === 'herb')!;
    expect(herb.haystack).toContain('Camomille');
    expect(herb.haystack).toContain('Chamomile');
    expect(herb.haystack).toContain('Matricaria chamomilla');
    expect(herb.haystack).toContain('florale');
    expect(herb.haystack).toContain('floral');
    expect(herb.haystack).toContain(t('fr', 'property.digestive'));
    expect(herb.haystack).toContain(t('en', 'property.digestive'));
    expect(herb.haystack).toContain(t('fr', 'affliction.insomnia'));
    expect(herb.haystack).toContain(t('en', 'affliction.insomnia'));
  });
});
