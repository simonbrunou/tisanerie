import { describe, expect, it } from 'vitest';
import { breadcrumbList } from './jsonld';

describe('breadcrumbList', () => {
  const origin = 'https://tisanerie.app';
  const items = [
    { name: 'Home', url: '/en/' },
    { name: 'Discover', url: '/en/discover/' },
    { name: 'Chamomile', url: '/en/herbs/chamomile/' },
  ];

  it('emits schema.org types', () => {
    const out = breadcrumbList(items, origin);
    expect(out['@type']).toBe('BreadcrumbList');
    expect(out['@context']).toBe('https://schema.org');
  });

  it('is 1-indexed and preserves order', () => {
    const out = breadcrumbList(items, origin);
    expect(out.itemListElement).toHaveLength(3);
    expect(out.itemListElement[0].position).toBe(1);
    expect(out.itemListElement[2].position).toBe(3);
    expect(out.itemListElement[2].name).toBe('Chamomile');
  });

  it('builds absolute URLs from relative item urls', () => {
    const out = breadcrumbList(items, origin);
    expect(out.itemListElement[0].item).toBe('https://tisanerie.app/en/');
    expect(out.itemListElement[2].item).toBe('https://tisanerie.app/en/herbs/chamomile/');
  });
});
