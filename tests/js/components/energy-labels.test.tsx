import EnergyLabels from '@/components/properties/energy-labels';
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { PROPERTY } from '../fixtures/property';
import { page, renderPage, sharedProps } from '../inertia';

const DPE = { energy: 'C', climate: 'B', cost_min: 5200, cost_max: 7100, year: 2021 };

describe('EnergyLabels', () => {
    it('shows both official scales with the listing class enlarged, the costs sentence, and nothing without a label', async () => {
        page.props = sharedProps();
        const { container, rerender } = renderPage(<EnergyLabels property={{ ...PROPERTY, dpe: DPE }} />);

        const energy = screen.getByRole('list', { name: 'Consommation énergétique : classe C' });
        expect(within(energy).getAllByRole('listitem')).toHaveLength(7);
        const active = within(energy)
            .getAllByRole('listitem')
            .find((li) => li.getAttribute('aria-current') === 'true')!;
        expect(active).toHaveTextContent('C');
        expect(active).toHaveClass('bg-dpe-c', 'w-11', '-translate-y-1'); // the listing's class, lifted and wider on the official staircase (2026-09-29)
        expect(within(energy).getAllByRole('listitem')[0]).toHaveClass('opacity-40');
        expect(screen.getByRole('list', { name: 'Émissions de gaz à effet de serre : classe B' })).toBeInTheDocument();
        expect(screen.getByText(/entre 5 200 € et 7 100 € par an/)).toBeInTheDocument();
        expect(screen.queryByText('Logement à consommation énergétique excessive')).toBeNull();
        expect(await axe(container)).toHaveNoViolations();

        rerender(<EnergyLabels property={{ ...PROPERTY, dpe: { ...DPE, energy: 'G' } }} />);
        expect(screen.getByText('Logement à consommation énergétique excessive')).toBeInTheDocument();
        rerender(<EnergyLabels property={{ ...PROPERTY, dpe: null }} />);
        expect(screen.queryByRole('list')).toBeNull();
    });
});
