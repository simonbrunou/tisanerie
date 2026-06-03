import { describe, expect, it } from 'vitest';
import {
  herbsWithAffliction,
  herbsWithProperty,
  usedAfflictionKeys,
  usedPropertyKeys,
} from './taxons';
import type { HerbEntry } from './types';

function herb(
  id: string,
  overrides: { properties?: string[]; afflictions?: string[]; popularity?: number } = {},
): HerbEntry {
  return {
    id,
    data: {
      name: { fr: id, en: id },
      emoji: '🌿',
      benefits: ['sleep'],
      primaryBenefits: [],
      properties: overrides.properties ?? [],
      afflictions: overrides.afflictions ?? [],
      popularity: overrides.popularity ?? 50,
      flavor: { fr: [], en: [] },
    },
  } as unknown as HerbEntry;
}

const herbs: HerbEntry[] = [
  herb('a', { properties: ['digestive', 'nervine'], afflictions: ['insomnia'], popularity: 80 }),
  herb('b', { properties: ['digestive', 'tonic'], afflictions: ['bloating', 'insomnia'], popularity: 60 }),
  herb('c', { properties: ['nervine'], afflictions: ['bloating'], popularity: 90 }),
];

describe('usedPropertyKeys', () => {
  it('returns unique sorted property keys across all herbs', () => {
    expect(usedPropertyKeys(herbs)).toEqual(['digestive', 'nervine', 'tonic']);
  });

  it('returns empty array when no herbs have properties', () => {
    expect(usedPropertyKeys([herb('x')])).toEqual([]);
  });
});

describe('usedAfflictionKeys', () => {
  it('returns unique sorted affliction keys across all herbs', () => {
    expect(usedAfflictionKeys(herbs)).toEqual(['bloating', 'insomnia']);
  });

  it('returns empty array when no herbs have afflictions', () => {
    expect(usedAfflictionKeys([herb('x')])).toEqual([]);
  });
});

describe('herbsWithProperty', () => {
  it('filters herbs that have the given property', () => {
    const result = herbsWithProperty(herbs, 'digestive', 'en');
    expect(result.map((h) => h.id)).toEqual(['a', 'b']);
  });

  it('sorts by popularity desc, then name asc', () => {
    const result = herbsWithProperty(herbs, 'nervine', 'en');
    expect(result.map((h) => h.id)).toEqual(['c', 'a']);
  });

  it('returns empty array for unused key', () => {
    expect(herbsWithProperty(herbs, 'adaptogen', 'fr')).toEqual([]);
  });
});

describe('herbsWithAffliction', () => {
  it('filters herbs that have the given affliction', () => {
    const result = herbsWithAffliction(herbs, 'insomnia', 'en');
    expect(result.map((h) => h.id)).toEqual(['a', 'b']);
  });

  it('sorts by popularity desc', () => {
    const result = herbsWithAffliction(herbs, 'bloating', 'en');
    expect(result.map((h) => h.id)).toEqual(['c', 'b']);
  });

  it('returns empty array for unused key', () => {
    expect(herbsWithAffliction(herbs, 'headache', 'fr')).toEqual([]);
  });
});
