import { defineCollection, z } from 'astro:content';

const bilingual = z.object({ fr: z.string(), en: z.string() });
const bilingualArray = z.object({ fr: z.array(z.string()), en: z.array(z.string()) });

const plantPart = z.enum(['leaves', 'flowers', 'roots', 'bark', 'seeds', 'fruit', 'aerial']);

const benefitKey = z.enum([
  'stress',
  'sleep',
  'digestion',
  'cold',
  'focus',
  'energy',
  'mood',
  'immunity',
  'headache',
  'cramps',
  'detox',
  'refresh',
]);

export type BenefitKey = z.infer<typeof benefitKey>;

const herbs = defineCollection({
  type: 'data',
  schema: z.object({
    name: bilingual,
    scientific: z.string(),
    description: bilingual,
    benefits: z.array(benefitKey).min(1),
    primaryBenefits: z.array(benefitKey).default([]),
    flavor: bilingualArray,
    part: plantPart,
    brewing: z.object({
      temperatureC: z.number().int().min(50).max(100),
      timeMin: z.number().min(1).max(30),
      gramsPerCup: z.number().min(0.5).max(10),
    }),
    warnings: bilingual.optional(),
    emoji: z.string().default('🌿'),
    image: z.string().optional(),
    popularity: z.number().int().min(0).max(100).default(50),
  }),
});

const needs = defineCollection({
  type: 'data',
  schema: z.object({
    name: bilingual,
    short: bilingual,
    description: bilingual,
    benefit: benefitKey,
    related: z.array(benefitKey).default([]),
    emoji: z.string().default('✨'),
    safety: bilingual.optional(),
    blends: z
      .array(
        z.object({
          name: bilingual,
          herbs: z.array(z.string()).min(1),
          instructions: bilingual,
        }),
      )
      .default([]),
  }),
});

export const collections = { herbs, needs };
