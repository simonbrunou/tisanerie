import { describe, expect, it } from 'vitest';
import { localizedPath, parseLangFromPath, swapLocaleInPath } from './routes';

describe('localizedPath', () => {
  it('returns the language root for the home key', () => {
    expect(localizedPath('fr', 'home')).toBe('/fr/');
    expect(localizedPath('en', 'home')).toBe('/en/');
  });

  it('builds a slug path for herbs with localized segments', () => {
    expect(localizedPath('fr', 'herbs', 'chamomile')).toBe('/fr/plantes/chamomile/');
    expect(localizedPath('en', 'herbs', 'chamomile')).toBe('/en/herbs/chamomile/');
  });

  it('builds a section-only path without a slug', () => {
    expect(localizedPath('fr', 'discover')).toBe('/fr/decouvrir/');
    expect(localizedPath('en', 'discover')).toBe('/en/discover/');
  });
});

describe('parseLangFromPath', () => {
  it('detects the leading locale segment', () => {
    expect(parseLangFromPath('/fr/')).toBe('fr');
    expect(parseLangFromPath('/en/about/')).toBe('en');
  });

  it('falls back to the default locale when missing', () => {
    expect(parseLangFromPath('/')).toBe('fr');
    expect(parseLangFromPath('/unknown/')).toBe('fr');
  });
});

describe('swapLocaleInPath', () => {
  it('swaps the root language', () => {
    expect(swapLocaleInPath('/fr/', 'en')).toBe('/en/');
  });

  it('translates known route segments', () => {
    expect(swapLocaleInPath('/fr/plantes/chamomile/', 'en')).toBe('/en/herbs/chamomile/');
    expect(swapLocaleInPath('/en/needs/sleep/', 'fr')).toBe('/fr/besoins/sleep/');
  });

  it('leaves unknown segments as-is under the new locale', () => {
    expect(swapLocaleInPath('/fr/mystery/', 'en')).toBe('/en/mystery/');
  });

  it('is a no-op when target equals current', () => {
    expect(swapLocaleInPath('/fr/plantes/chamomile/', 'fr')).toBe('/fr/plantes/chamomile/');
  });
});
