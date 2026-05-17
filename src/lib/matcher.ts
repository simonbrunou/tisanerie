import type { HerbEntry, NeedEntry, HerbLite } from './types';

export type ScoredHerb = {
  herb: HerbLite;
  score: number;
  matchedBenefits: string[];
};

export function toHerbLite(entry: HerbEntry): HerbLite {
  return {
    id: entry.id,
    name: entry.data.name,
    emoji: entry.data.emoji,
    benefits: entry.data.benefits,
    primaryBenefits: entry.data.primaryBenefits,
    properties: entry.data.properties ?? [],
    afflictions: entry.data.afflictions ?? [],
    popularity: entry.data.popularity,
    flavor: entry.data.flavor,
  };
}

type ScoreableHerb = {
  benefits: readonly string[];
  primaryBenefits: readonly string[];
};

export function scoreHerb(herb: ScoreableHerb, needKeys: readonly string[]): number {
  let score = 0;
  for (const key of needKeys) {
    if (herb.primaryBenefits.includes(key)) {
      score += 2;
    } else if (herb.benefits.includes(key)) {
      score += 1;
    }
  }
  return score;
}

export function rankHerbs(
  herbs: HerbLite[],
  needKeys: readonly string[],
  limit = 6,
): ScoredHerb[] {
  if (needKeys.length === 0) return [];
  return herbs
    .map((herb) => ({
      herb,
      score: scoreHerb(herb, needKeys),
      matchedBenefits: needKeys.filter((k) =>
        herb.benefits.includes(k as HerbLite['benefits'][number]),
      ),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.herb.popularity - a.herb.popularity;
    })
    .slice(0, limit);
}

export function herbsForNeed(
  herbs: HerbEntry[],
  need: NeedEntry,
  limit = 6,
): ScoredHerb[] {
  return rankHerbs(herbs.map(toHerbLite), [need.data.benefit], limit);
}
