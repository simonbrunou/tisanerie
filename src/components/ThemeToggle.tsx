import { useEffect, useState } from 'react';

interface Props {
  labels: {
    light: string;
    dark: string;
  };
}

export default function ThemeToggle({ labels }: Props) {
  const [dark, setDark] = useState<boolean>(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn-ghost px-3 py-1.5"
      aria-label={dark ? labels.light : labels.dark}
      aria-pressed={dark}
    >
      <span aria-hidden="true">{dark ? '☀️' : '🌙'}</span>
    </button>
  );
}
