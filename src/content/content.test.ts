import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

// Recreate the schemas here instead of importing from content.config.ts
// (which depends on astro:content). This keeps tests runnable in Node.
const bilingual = z.object({ fr: z.string(), en: z.string() });
const bilingualArray = z.object({ fr: z.array(z.string()), en: z.array(z.string()) });
const plantPart = z.enum(['leaves', 'flowers', 'roots', 'bark', 'seeds', 'fruit', 'aerial']);

const benefitKey = z.enum([
  'stress', 'sleep', 'digestion', 'cold', 'focus', 'energy',
  'mood', 'immunity', 'headache', 'cramps', 'detox', 'refresh',
]);

const propertyKey = z.enum([
  'adaptogen', 'analgesic', 'anti-inflammatory', 'antimicrobial', 'antioxidant',
  'antispasmodic', 'antitussive', 'antiviral', 'anxiolytic', 'aromatic',
  'astringent', 'bitter', 'calmative', 'cardiotonic', 'carminative', 'cholagogue',
  'demulcent', 'depurative', 'diaphoretic', 'digestive', 'diuretic', 'emmenagogue',
  'expectorant', 'febrifuge', 'galactagogue', 'hepatoprotective', 'hypotensive',
  'immunomodulant', 'laxative', 'nervine', 'refrigerant', 'sedative', 'stimulant',
  'stomachic', 'tonic', 'uterine-tonic', 'vulnerary', 'warming',
]);

const afflictionKey = z.enum([
  'anxiety', 'insomnia', 'stress', 'nervous-tension', 'mild-depression', 'fatigue',
  'mental-exhaustion', 'poor-focus', 'memory-loss', 'irritability', 'restlessness',
  'headache', 'migraine', 'dizziness',
  'cold', 'flu', 'fever', 'cough', 'sore-throat', 'bronchitis', 'sinus-congestion',
  'hoarseness', 'asthma', 'seasonal-allergies',
  'indigestion', 'bloating', 'flatulence', 'nausea', 'heartburn', 'diarrhea',
  'constipation', 'ibs', 'stomach-cramps', 'loss-of-appetite', 'motion-sickness',
  'hangover', 'gastritis',
  'menstrual-cramps', 'heavy-periods', 'pms', 'menopausal-symptoms',
  'irregular-periods', 'lactation-support', 'morning-sickness',
  'uti', 'water-retention',
  'high-blood-pressure', 'palpitations', 'poor-circulation',
  'muscle-tension', 'joint-pain', 'arthritis', 'rheumatism',
  'eczema', 'acne', 'rashes', 'minor-wounds', 'burns', 'insect-bites', 'bruises',
  'oily-skin', 'dry-skin',
  'liver-sluggishness', 'detox-needs', 'high-cholesterol',
  'bad-breath', 'mouth-ulcers',
  'low-immunity', 'recurrent-infections',
]);

const herbSchema = z.object({
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
});

const needSchema = z.object({
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
});

const contentDir = fileURLToPath(new URL('.', import.meta.url));
const herbsDir = join(contentDir, 'herbs');
const needsDir = join(contentDir, 'needs');
const i18nDir = join(contentDir, '..', 'i18n');

function loadJson(dir: string, file: string): unknown {
  return JSON.parse(readFileSync(join(dir, file), 'utf-8'));
}

function listJsonFiles(dir: string): string[] {
  return readdirSync(dir).filter((f) => f.endsWith('.json'));
}

const herbFiles = listJsonFiles(herbsDir);
const needFiles = listJsonFiles(needsDir);

// Pre-parse all herbs and needs for cross-reference checks
const parsedHerbs = herbFiles.map((file) => ({
  id: file.replace('.json', ''),
  data: loadJson(herbsDir, file),
}));
const parsedNeeds = needFiles.map((file) => ({
  id: file.replace('.json', ''),
  data: loadJson(needsDir, file),
}));

describe('herb content validation', () => {
  it.each(herbFiles)('%s passes schema validation', (file) => {
    const data = loadJson(herbsDir, file);
    const result = herbSchema.safeParse(data);
    if (!result.success) {
      throw new Error(`${file}: ${result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
    }
  });

  it('every herb has primaryBenefits as a subset of benefits', () => {
    for (const { id, data } of parsedHerbs) {
      const herb = data as { benefits: string[]; primaryBenefits?: string[] };
      for (const pb of herb.primaryBenefits ?? []) {
        expect(herb.benefits, `${id}: primaryBenefit "${pb}" not in benefits`).toContain(pb);
      }
    }
  });
});

describe('need content validation', () => {
  it.each(needFiles)('%s passes schema validation', (file) => {
    const data = loadJson(needsDir, file);
    const result = needSchema.safeParse(data);
    if (!result.success) {
      throw new Error(`${file}: ${result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
    }
  });

  it('every need benefit key is served by at least one herb', () => {
    const allHerbBenefits = new Set(
      parsedHerbs.flatMap((h) => (h.data as { benefits: string[] }).benefits),
    );
    for (const { id, data } of parsedNeeds) {
      const need = data as { benefit: string };
      expect(allHerbBenefits, `need "${id}" benefit "${need.benefit}" has no matching herb`).toContain(need.benefit);
    }
  });

  it('blend herb references point to existing herb files', () => {
    const herbIds = new Set(parsedHerbs.map((h) => h.id));
    for (const { id, data } of parsedNeeds) {
      const need = data as { blends?: { herbs: string[] }[] };
      for (const blend of need.blends ?? []) {
        for (const herbRef of blend.herbs) {
          expect(herbIds, `need "${id}" references non-existent herb "${herbRef}"`).toContain(herbRef);
        }
      }
    }
  });
});

describe('i18n completeness', () => {
  const frJson = JSON.parse(readFileSync(join(i18nDir, 'fr.json'), 'utf-8')) as Record<string, string>;
  const enJson = JSON.parse(readFileSync(join(i18nDir, 'en.json'), 'utf-8')) as Record<string, string>;

  // Collect used property and affliction keys from herbs
  const usedProperties = new Set(
    parsedHerbs.flatMap((h) => (h.data as { properties?: string[] }).properties ?? []),
  );
  const usedAfflictions = new Set(
    parsedHerbs.flatMap((h) => (h.data as { afflictions?: string[] }).afflictions ?? []),
  );

  it('every used property key has FR and EN translations', () => {
    for (const key of usedProperties) {
      const i18nKey = `property.${key}`;
      expect(frJson, `missing FR translation for "${i18nKey}"`).toHaveProperty(i18nKey);
      expect(enJson, `missing EN translation for "${i18nKey}"`).toHaveProperty(i18nKey);
    }
  });

  it('every used affliction key has FR and EN translations', () => {
    for (const key of usedAfflictions) {
      const i18nKey = `affliction.${key}`;
      expect(frJson, `missing FR translation for "${i18nKey}"`).toHaveProperty(i18nKey);
      expect(enJson, `missing EN translation for "${i18nKey}"`).toHaveProperty(i18nKey);
    }
  });

  it('FR and EN have the same set of keys', () => {
    const frKeys = Object.keys(frJson).sort();
    const enKeys = Object.keys(enJson).sort();
    const onlyFr = frKeys.filter((k) => !enKeys.includes(k));
    const onlyEn = enKeys.filter((k) => !frKeys.includes(k));
    expect(onlyFr, `keys only in fr.json: ${onlyFr.join(', ')}`).toEqual([]);
    expect(onlyEn, `keys only in en.json: ${onlyEn.join(', ')}`).toEqual([]);
  });
});
