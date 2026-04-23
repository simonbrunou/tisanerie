import { describe, expect, it } from 'vitest';
import { herbsForNeed, rankHerbs, scoreHerb } from './matcher';
import type { HerbEntry, HerbLite, NeedEntry } from './types';

function lite(overrides: Partial<HerbLite> & { id: string }): HerbLite {
  return {
    name: { fr: overrides.id, en: overrides.id },
    emoji: '🌿',
    benefits: [],
    primaryBenefits: [],
    properties: [],
    afflictions: [],
    popularity: 50,
    flavor: { fr: [], en: [] },
    ...overrides,
  };
}

describe('scoreHerb', () => {
  it('adds 2 for a primary benefit match', () => {
    const h = lite({ id: 'chamomile', benefits: ['sleep'], primaryBenefits: ['sleep'] });
    expect(scoreHerb(h, ['sleep'])).toBe(2);
  });

  it('adds 1 for a secondary (non-primary) benefit match', () => {
    const h = lite({ id: 'peppermint', benefits: ['digestion'], primaryBenefits: [] });
    expect(scoreHerb(h, ['digestion'])).toBe(1);
  });

  it('returns 0 for an unrelated need', () => {
    const h = lite({ id: 'ginger', benefits: ['digestion'], primaryBenefits: ['digestion'] });
    expect(scoreHerb(h, ['sleep'])).toBe(0);
  });

  it('accumulates across multiple need keys', () => {
    const h = lite({
      id: 'melissa',
      benefits: ['sleep', 'stress'],
      primaryBenefits: ['sleep'],
    });
    expect(scoreHerb(h, ['sleep', 'stress'])).toBe(3);
  });
});

describe('rankHerbs', () => {
  const herbs: HerbLite[] = [
    lite({ id: 'a', benefits: ['sleep'], primaryBenefits: ['sleep'], popularity: 80 }),
    lite({ id: 'b', benefits: ['sleep'], primaryBenefits: [], popularity: 90 }),
    lite({ id: 'c', benefits: ['sleep'], primaryBenefits: ['sleep'], popularity: 70 }),
    lite({ id: 'd', benefits: ['focus'], primaryBenefits: ['focus'], popularity: 99 }),
  ];

  it('returns [] for empty needKeys', () => {
    expect(rankHerbs(herbs, [])).toEqual([]);
  });

  it('filters out herbs that score 0', () => {
    const ranked = rankHerbs(herbs, ['sleep']);
    expect(ranked.map((r) => r.herb.id)).not.toContain('d');
  });

  it('sorts by score desc, then popularity desc', () => {
    const ranked = rankHerbs(herbs, ['sleep']);
    expect(ranked.map((r) => r.herb.id)).toEqual(['a', 'c', 'b']);
  });

  it('honors the limit', () => {
    const ranked = rankHerbs(herbs, ['sleep'], 2);
    expect(ranked).toHaveLength(2);
  });

  it('records matchedBenefits only from benefits present on the herb', () => {
    const h = lite({ id: 'x', benefits: ['sleep'], primaryBenefits: ['sleep'] });
    const [entry] = rankHerbs([h], ['sleep', 'focus']);
    expect(entry.matchedBenefits).toEqual(['sleep']);
  });
});

describe('herbsForNeed', () => {
  it('ranks herbs by the need’s benefit, default limit 6', () => {
    const entries: HerbEntry[] = Array.from({ length: 8 }, (_, i) => ({
      id: `h${i}`,
      data: {
        name: { fr: `h${i}`, en: `h${i}` },
        emoji: '🌿',
        benefits: ['sleep'],
        primaryBenefits: ['sleep'],
        properties: [],
        afflictions: [],
        popularity: 100 - i,
        flavor: { fr: [], en: [] },
      },
    })) as unknown as HerbEntry[];

    const need = {
      id: 'sleep',
      data: { benefit: 'sleep' },
    } as unknown as NeedEntry;

    const ranked = herbsForNeed(entries, need);
    expect(ranked).toHaveLength(6);
    expect(ranked[0].herb.id).toBe('h0');
  });
});
