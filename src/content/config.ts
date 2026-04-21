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

const propertyKey = z.enum([
  'adaptogen',
  'analgesic',
  'anti-inflammatory',
  'antimicrobial',
  'antioxidant',
  'antispasmodic',
  'antitussive',
  'antiviral',
  'anxiolytic',
  'aromatic',
  'astringent',
  'bitter',
  'calmative',
  'cardiotonic',
  'carminative',
  'cholagogue',
  'demulcent',
  'depurative',
  'diaphoretic',
  'digestive',
  'diuretic',
  'emmenagogue',
  'expectorant',
  'febrifuge',
  'galactagogue',
  'hepatoprotective',
  'hypotensive',
  'immunomodulant',
  'laxative',
  'nervine',
  'refrigerant',
  'sedative',
  'stimulant',
  'stomachic',
  'tonic',
  'uterine-tonic',
  'vulnerary',
  'warming',
]);

export type PropertyKey = z.infer<typeof propertyKey>;

const afflictionKey = z.enum([
  // mind & nervous system
  'anxiety',
  'insomnia',
  'stress',
  'nervous-tension',
  'mild-depression',
  'fatigue',
  'mental-exhaustion',
  'poor-focus',
  'memory-loss',
  'irritability',
  'restlessness',
  // head
  'headache',
  'migraine',
  'dizziness',
  // respiratory
  'cold',
  'flu',
  'fever',
  'cough',
  'sore-throat',
  'bronchitis',
  'sinus-congestion',
  'hoarseness',
  'asthma',
  'seasonal-allergies',
  // digestive
  'indigestion',
  'bloating',
  'flatulence',
  'nausea',
  'heartburn',
  'diarrhea',
  'constipation',
  'ibs',
  'stomach-cramps',
  'loss-of-appetite',
  'motion-sickness',
  'hangover',
  'gastritis',
  // women's health
  'menstrual-cramps',
  'heavy-periods',
  'pms',
  'menopausal-symptoms',
  'irregular-periods',
  'lactation-support',
  'morning-sickness',
  // urinary & kidneys
  'uti',
  'water-retention',
  'kidney-sluggishness',
  // circulatory & heart
  'high-blood-pressure',
  'palpitations',
  'poor-circulation',
  // musculoskeletal
  'muscle-cramps',
  'muscle-tension',
  'joint-pain',
  'arthritis',
  'rheumatism',
  'back-pain',
  // skin
  'eczema',
  'acne',
  'rashes',
  'minor-wounds',
  'burns',
  'insect-bites',
  'bruises',
  'oily-skin',
  'dry-skin',
  // liver & metabolism
  'liver-sluggishness',
  'detox-needs',
  'high-cholesterol',
  // mouth & breath
  'bad-breath',
  'mouth-ulcers',
  // immunity
  'low-immunity',
  'recurrent-infections',
]);

export type AfflictionKey = z.infer<typeof afflictionKey>;

const herbs = defineCollection({
  type: 'data',
  schema: z.object({
    name: bilingual,
    scientific: z.string(),
    description: bilingual,
    benefits: z.array(benefitKey).min(1),
    primaryBenefits: z.array(benefitKey).default([]),
    properties: z.array(propertyKey).default([]),
    afflictions: z.array(afflictionKey).default([]),
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
