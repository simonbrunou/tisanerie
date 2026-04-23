import Fuse from 'fuse.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { SearchItem } from '~/lib/searchItems';

interface Props {
  items: SearchItem[];
  placeholder: string;
}

export default function SearchBox({ items, placeholder }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
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
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, []);

  useEffect(() => {
    if (results.length === 0) {
      setActiveIndex(-1);
      return;
    }
    if (activeIndex >= results.length) {
      setActiveIndex(results.length - 1);
    }
  }, [results, activeIndex]);

  const inputId = 'search-input';
  const listboxId = 'search-results';
  const activeDescendant = activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined;

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) {
      if (e.key === 'Escape') {
        setOpen(false);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => (i + 1) % results.length);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
      return;
    }

    if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      window.location.assign(results[activeIndex].href);
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <label className="sr-only" htmlFor={inputId}>
        {placeholder}
      </label>
      <div
        className="flex items-center gap-2 rounded-full border border-sage-200 bg-white/80 px-4 py-2.5 shadow-card transition focus-within:border-sage-500 dark:border-sage-800/60 dark:bg-sage-900/40"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open && results.length > 0}
        aria-owns={listboxId}
      >
        <span aria-hidden="true" className="text-ink-muted">🔍</span>
        <input
          id={inputId}
          type="search"
          value={query}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm focus:outline-none"
          autoComplete="off"
          aria-autocomplete="list"
          aria-activedescendant={activeDescendant}
        />
      </div>
      {open && results.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 z-20 mt-2 max-h-80 overflow-auto rounded-2xl border border-sage-100 bg-paper/95 p-1 shadow-soft backdrop-blur dark:border-sage-800/60 dark:bg-paper-dark/95"
        >
          {results.map((item, index) => {
            const active = index === activeIndex;
            return (
              <li key={`${item.type}-${item.id}`}>
                <a
                  id={`${listboxId}-${index}`}
                  role="option"
                  aria-selected={active}
                  href={item.href}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${
                    active
                      ? 'bg-sage-100 dark:bg-sage-800/60'
                      : 'hover:bg-sage-100 dark:hover:bg-sage-800/60'
                  }`}
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
            );
          })}
        </ul>
      )}
    </div>
  );
}
