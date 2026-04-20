import { useEffect, useMemo, useState } from 'react';
import type { Locale } from '~/i18n/routes';

type HerbItem = {
  id: string;
  name: string;
  scientific: string;
  emoji: string;
  flavor: string[];
  benefits: string[];
  primaryBenefits: string[];
  popularity: number;
  href: string;
};

type NeedItem = {
  id: string;
  name: string;
  emoji: string;
  benefit: string;
};

interface Props {
  lang: Locale;
  herbs: HerbItem[];
  needs: NeedItem[];
  labels: {
    title: string;
    subtitleTemplate: string;
    empty: string;
    noResults: string;
    score: string;
  };
}

function scoreHerb(herb: HerbItem, keys: string[]): { score: number } {
  let score = 0;
  for (const k of keys) {
    if (herb.primaryBenefits.includes(k)) score += 2;
    else if (herb.benefits.includes(k)) score += 1;
  }
  return { score };
}

export default function SearchResults({ herbs, needs, labels }: Props) {
  const [needIds, setNeedIds] = useState<string[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNeedIds(params.getAll('need'));
  }, []);

  const selectedNeeds = useMemo(
    () => needs.filter((n) => needIds.includes(n.id)),
    [needs, needIds],
  );

  const selectedKeys = useMemo(
    () => selectedNeeds.map((n) => n.benefit),
    [selectedNeeds],
  );

  const ranked = useMemo(() => {
    if (selectedKeys.length === 0) return [];
    return herbs
      .map((h) => ({ herb: h, ...scoreHerb(h, selectedKeys) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || b.herb.popularity - a.herb.popularity)
      .slice(0, 12);
  }, [herbs, selectedKeys]);

  if (needIds.length === 0) {
    return <p className="prose-muted">{labels.empty}</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-4xl">{labels.title}</h1>
        <p className="prose-muted mt-2">
          {labels.subtitleTemplate.replace(
            '{needs}',
            selectedNeeds.map((n) => `${n.emoji} ${n.name}`).join(' · '),
          )}
        </p>
      </div>
      {ranked.length === 0 ? (
        <p className="prose-muted">{labels.noResults}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ranked.map(({ herb, score }) => (
            <li key={herb.id}>
              <a
                href={herb.href}
                className="card group flex h-full flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-soft"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-sage-100 text-3xl dark:bg-sage-800/60">
                    {herb.emoji}
                  </span>
                  <span className="chip-amber">
                    {labels.score} · {score}
                  </span>
                </div>
                <div>
                  <h3 className="font-display text-lg leading-tight">{herb.name}</h3>
                  <p className="text-xs italic text-ink-muted">{herb.scientific}</p>
                </div>
                <div className="mt-auto flex flex-wrap gap-1.5">
                  {herb.flavor.slice(0, 3).map((f) => (
                    <span key={f} className="chip">
                      {f}
                    </span>
                  ))}
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
