import { useEffect, useRef, useState } from 'react';

interface Props {
  minutes: number;
  labels: {
    start: string;
    pause: string;
    reset: string;
    done: string;
    ariaLabel: string;
  };
}

function format(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function chime() {
  try {
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    [0, 0.25, 0.55].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = [659.25, 783.99, 987.77][i];
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.18, now + delay + 0.02);
      gain.gain.linearRampToValueAtTime(0, now + delay + 0.9);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.9);
    });
    setTimeout(() => ctx.close(), 2000);
  } catch {}
}

export default function BrewingTimer({ minutes, labels }: Props) {
  const total = Math.max(1, Math.round(minutes * 60));
  const [remaining, setRemaining] = useState<number>(total);
  const [running, setRunning] = useState<boolean>(false);
  const [done, setDone] = useState<boolean>(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          setDone(true);
          chime();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [running]);

  const reset = () => {
    setRunning(false);
    setRemaining(total);
    setDone(false);
  };

  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const progress = 1 - remaining / total;
  const offset = circumference * progress;

  return (
    <div className="card flex flex-col items-center gap-4 p-6">
      <div className="relative">
        <svg width="180" height="180" viewBox="0 0 180 180" role="img" aria-label={labels.ariaLabel}>
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.12"
            strokeWidth="10"
          />
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - offset}
            transform="rotate(-90 90 90)"
            className="text-sage-600 dark:text-sage-300 transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="font-display text-4xl tabular-nums">{format(remaining)}</span>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {done ? labels.done : ''}
      </p>
      {done ? (
        <p className="font-display text-lg text-sage-700 dark:text-sage-200">{labels.done}</p>
      ) : null}
      <div className="flex gap-2">
        {!running ? (
          <button type="button" className="btn-primary" onClick={() => { setDone(false); setRunning(true); }}>
            {labels.start}
          </button>
        ) : (
          <button type="button" className="btn-ghost border border-sage-200 dark:border-sage-700" onClick={() => setRunning(false)}>
            {labels.pause}
          </button>
        )}
        <button type="button" className="btn-ghost" onClick={reset}>
          {labels.reset}
        </button>
      </div>
    </div>
  );
}
