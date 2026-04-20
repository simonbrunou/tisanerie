import type { CollectionEntry } from 'astro:content';

export type HerbEntry = CollectionEntry<'herbs'>;
export type NeedEntry = CollectionEntry<'needs'>;

export type HerbLite = {
  id: string;
  name: { fr: string; en: string };
  emoji: string;
  benefits: readonly string[];
  primaryBenefits: readonly string[];
  popularity: number;
  flavor: { fr: string[]; en: string[] };
};
