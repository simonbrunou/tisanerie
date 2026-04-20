export const locales = ['fr', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'fr';

export type RouteKey = 'home' | 'needs' | 'herbs' | 'discover' | 'search' | 'about';

export const routeSegments: Record<RouteKey, Record<Locale, string>> = {
  home: { fr: '', en: '' },
  needs: { fr: 'besoins', en: 'needs' },
  herbs: { fr: 'plantes', en: 'herbs' },
  discover: { fr: 'decouvrir', en: 'discover' },
  search: { fr: 'recherche', en: 'search' },
  about: { fr: 'a-propos', en: 'about' },
};

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

function stripBase(pathname: string): string {
  if (!base) return pathname;
  return pathname.startsWith(base) ? pathname.slice(base.length) || '/' : pathname;
}

export function localizedPath(lang: Locale, key: RouteKey, slug?: string): string {
  const seg = routeSegments[key][lang];
  const parts = [base, lang];
  if (seg) parts.push(seg);
  if (slug) parts.push(slug);
  return parts.join('/') + '/';
}

export function parseLangFromPath(pathname: string): Locale {
  const m = stripBase(pathname).match(/^\/(fr|en)(\/|$)/);
  return (m?.[1] as Locale) ?? defaultLocale;
}

export function swapLocaleInPath(pathname: string, target: Locale): string {
  const stripped = stripBase(pathname);
  const current = parseLangFromPath(stripped);
  let rest = stripped.replace(/^\/(fr|en)/, '').replace(/^\/+/, '');
  if (current !== target) {
    for (const key of Object.keys(routeSegments) as RouteKey[]) {
      const currentSeg = routeSegments[key][current];
      const targetSeg = routeSegments[key][target];
      if (!currentSeg || !targetSeg || currentSeg === targetSeg) continue;
      if (rest === currentSeg || rest.startsWith(currentSeg + '/')) {
        rest = targetSeg + rest.slice(currentSeg.length);
        break;
      }
    }
  }
  return base + '/' + target + (rest ? '/' + rest : '/');
}
