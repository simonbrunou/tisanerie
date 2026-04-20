import { useMemo, useState } from 'react';
import type { Locale } from '~/i18n/routes';

type NeedOption = {
  id: string;
  emoji: string;
  name: string;
  short: string;
};

interface Props {
  lang: Locale;
  needs: NeedOption[];
  searchHref: string; // absolute URL of /recherche or /search for this lang
  labelSubmit: string;
  labelSubmitMany: string;
}

export default function NeedPicker({
  needs,
  searchHref,
  labelSubmit,
  labelSubmitMany,
}: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const target = useMemo(() => {
    if (selected.length === 0) return null;
    const params = new URLSearchParams();
    for (const id of selected) params.append('need', id);
    return `${searchHref}?${params.toString()}`;
  }, [selected, searchHref]);

  const label =
    selected.length <= 1
      ? labelSubmit
      : labelSubmitMany.replace('{count}', String(selected.length));

  return (
    <div className="flex flex-col gap-6">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {needs.map((need) => {
          const active = selected.includes(need.id);
          return (
            <li key={need.id}>
              <button
                type="button"
                onClick={() => toggle(need.id)}
                aria-pressed={active}
                className={`group flex h-full w-full flex-col gap-2 rounded-3xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 ${
                  active
                    ? 'border-sage-500 bg-sage-700 text-paper shadow-soft dark:border-sage-300 dark:bg-sage-500 dark:text-paper-dark'
                    : 'border-sage-100 bg-white/70 hover:-translate-y-0.5 hover:shadow-card dark:border-sage-800/60 dark:bg-sage-900/40'
                }`}
              >
                <span className="text-2xl" aria-hidden="true">
                  {need.emoji}
                </span>
                <span className="font-display text-base leading-tight">{need.name}</span>
                <span
                  className={`text-xs leading-snug ${
                    active ? 'text-paper/80' : 'text-ink-muted dark:text-sage-200/70'
                  }`}
                >
                  {need.short}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink-muted">
          {selected.length}
          {selected.length > 0 && ' ✓'}
        </span>
        <a
          href={target ?? '#'}
          aria-disabled={!target}
          onClick={(e) => {
            if (!target) e.preventDefault();
          }}
          className={`btn-primary ${!target ? 'pointer-events-none opacity-40' : ''}`}
        >
          {label}
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  );
}
