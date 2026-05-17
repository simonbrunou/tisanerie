import { describe, expect, it } from 'vitest';
import { t } from './utils';

describe('t', () => {
  it('looks up a key in the requested language', () => {
    expect(t('fr', 'site.name')).toBe('Tisanerie');
    expect(t('en', 'nav.discover')).toBe('Discover');
  });

  it('interpolates parameters', () => {
    const s = t('en', 'taxon.intro.property', { count: 3 });
    expect(s).toContain('3');
    expect(s).not.toContain('{count}');
  });

  it('falls back from a missing key to the literal key string', () => {
    const missing = 'zzz.nonexistent' as unknown as Parameters<typeof t>[1];
    expect(t('fr', missing)).toBe(missing);
  });
});
