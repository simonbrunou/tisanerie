import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import BrewingTimer from '~/components/BrewingTimer';

const labels = {
  start: 'Démarrer',
  pause: 'Pause',
  reset: 'Réinitialiser',
  done: 'Terminé',
  ariaLabel: "Minuteur d'infusion",
};

afterEach(cleanup);

// First island test — proves the jsdom Vitest project works and covers the timer's
// mm:ss formatting (a real, previously-untested display surface).
describe('BrewingTimer', () => {
  it('renders the initial time as zero-padded mm:ss', () => {
    render(<BrewingTimer minutes={5} labels={labels} />);
    expect(screen.getByText('05:00')).toBeDefined();
  });

  it('clamps a sub-minute brew to ≥ 1s and formats it', () => {
    render(<BrewingTimer minutes={0.5} labels={labels} />);
    expect(screen.getByText('00:30')).toBeDefined();
  });

  it('formats brews of ten minutes or more', () => {
    render(<BrewingTimer minutes={12} labels={labels} />);
    expect(screen.getByText('12:00')).toBeDefined();
  });

  it('exposes the accessible timer label', () => {
    render(<BrewingTimer minutes={5} labels={labels} />);
    expect(screen.getByRole('img', { name: labels.ariaLabel })).toBeDefined();
  });
});
