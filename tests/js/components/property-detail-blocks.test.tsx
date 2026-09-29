import EnergyLabels from '@/components/properties/energy-labels';
import PropertyDetails from '@/components/properties/property-details';
import PropertyTransport from '@/components/properties/property-transport';
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { PROPERTY } from '../fixtures/property';
import { renderPage } from '../inertia';

const LISTING = {
    ...PROPERTY,
    rooms_detail: [
        { name: 'Séjour double', surface: 42 },
        { name: 'Chambre 1', surface: 18 },
    ],
    year_built: 1868,
    heating: 'Gaz individuel',
    orientation: 'Est / Ouest',
    annual_charges: 4800,
    property_tax: 2100,
    lots: 24,
    procedure: false,
    dpe: { energy: 'F', climate: 'D', cost_min: 1810, cost_max: 2490, year: 2021 },
    transport: [{ name: 'Saint-Germain-des-Prés', kind: 'metro' as const, lines: ['4'], minutes: 3 }],
};

describe('Detail page blocks (2026-09-28)', () => {
    it('details: the rooms with their surfaces and the building facts; rentals show the rent reference and deposit instead of charges and tax', () => {
        const { rerender } = renderPage(<PropertyDetails property={LISTING} />);
        expect(screen.getByText('Séjour double').nextElementSibling).toHaveTextContent('42 m²');
        expect(screen.getByText('Surface totale').nextElementSibling).toHaveTextContent('60 m²'); // the rooms summed (legibility rework 2026-09-29)
        expect(screen.getByText("L'immeuble")).toBeInTheDocument();
        expect(screen.getByText('Copropriété et charges')).toBeInTheDocument();
        expect(screen.getByText('Année de construction').nextElementSibling).toHaveTextContent('1868');
        expect(screen.getByText('Charges de copropriété').nextElementSibling).toHaveTextContent(/4 800 € \/ an/);
        expect(screen.getByText('Copropriété').nextElementSibling).toHaveTextContent('24 lots');
        expect(screen.getByText('Procédure en cours').nextElementSibling).toHaveTextContent('Aucune');
        rerender(<PropertyDetails property={{ ...LISTING, transaction: 'rent', rent_reference: 5890, deposit: 13000 }} />);
        expect(screen.getByText('Loyer de référence majoré').nextElementSibling).toHaveTextContent(/5 890 € \/ mois/);
        expect(screen.getByText('Dépôt de garantie').nextElementSibling).toHaveTextContent(/13 000 €/);
        expect(screen.queryByText('Taxe foncière')).toBeNull();
    });

    it("energy labels: both scales with the listing's class marked, the yearly costs, and the excessive-consumption notice for F and G", async () => {
        const { container } = renderPage(<EnergyLabels property={LISTING} />);
        const energy = screen.getByRole('list', { name: 'Consommation énergétique : classe F' });
        expect(within(energy).getAllByRole('listitem')).toHaveLength(7);
        expect(within(energy).getByText('F').closest('li')).toHaveAttribute('aria-current', 'true');
        expect(
            within(screen.getByRole('list', { name: 'Émissions de gaz à effet de serre : classe D' }))
                .getByText('D')
                .closest('li'),
        ).toHaveAttribute('aria-current', 'true');
        expect(screen.getByText(/entre 1 810 € et 2 490 € par an/)).toHaveTextContent(/1er janvier 2021/);
        expect(screen.getByText('Logement à consommation énergétique excessive')).toBeInTheDocument();
        expect(await axe(container)).toHaveNoViolations();
    });

    it('transport: the line badges, the station and the walking time', () => {
        renderPage(<PropertyTransport property={LISTING} />);
        expect(screen.getByRole('img', { name: 'Ligne 4' })).toBeInTheDocument();
        expect(screen.getByText('Saint-Germain-des-Prés')).toBeInTheDocument();
        expect(screen.getByText('3 min à pied')).toBeInTheDocument();
    });
});
