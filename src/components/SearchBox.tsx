import Fuse from 'fuse.js';
import { useEffect, useMemo, useRef, useState } from 'react';

type SearchItem = {
  id: string;
  type: 'herb' | 'need';
  title: string;
  subtitle: string;
  emoji: string;
  href: string;
  haystack: string;
};

interface Props {
  items: SearchItem[];
  placeholder: string;
}

export default function SearchBox({ items, placeholder }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys: ['title', 'subtitle', 'haystack'],
        threshold: 0.34,
        ignoreLocation: true,
      }),
    [items],
  );

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return fuse.search(query).slice(0, 8).map((r) => r.item);
  }, [query, fuse]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <label className="sr-only" htmlFor="search-input">
        {placeholder}
      </label>
      <div className="flex items-center gap-2 rounded-full border border-sage-200 bg-white/80 px-4 py-2.5 shadow-card transition focus-within:border-sage-500 dark:border-sage-800/60 dark:bg-sage-900/40">
        <span aria-hidden="true" className="text-ink-muted">🔍</span>
        <input
          id="search-input"
          type="search"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm focus:outline-none"
          autoComplete="off"
        />
      </div>
      {open && results.length > 0 && (
        <ul className="absolute left-0 right-0 z-20 mt-2 max-h-80 overflow-auto rounded-2xl border border-sage-100 bg-paper/95 p-1 shadow-soft backdrop-blur dark:border-sage-800/60 dark:bg-paper-dark/95">
          {results.map((item) => (
            <li key={`${item.type}-${item.id}`}>
              <a
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-sage-100 dark:hover:bg-sage-800/60"
              >
                <span className="text-xl" aria-hidden="true">
                  {item.emoji}
                </span>
                <span className="flex flex-col">
                  <span className="font-medium">{item.title}</span>
                  <span className="text-xs text-ink-muted">{item.subtitle}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
