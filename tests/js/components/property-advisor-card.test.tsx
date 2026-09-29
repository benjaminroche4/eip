import PropertyAdvisorCard from '@/components/properties/property-advisor-card';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { PROPERTY } from '../fixtures/property';
import { page, renderPage, sharedProps } from '../inertia';

const ADVISOR = { id: 1, photo: '/images/advisors/advisor-1.webp', name: 'Maris Moreau', role: 'Conseillère senior' };

describe('PropertyAdvisorCard', () => {
    it('keeps the fees sentence in a tooltip on the info icon and drops the « mis en vente » line, keeping only a price drop (2026-09-29)', async () => {
        const user = userEvent.setup();
        page.props = sharedProps();
        const { container, rerender } = renderPage(
            <PropertyAdvisorCard
                property={{ ...PROPERTY, price_history: [{ date: '2026-09-25', price: PROPERTY.price }] }}
                advisor={ADVISOR}
                reference="AP-6"
            />,
        );

        expect(screen.queryByText(/Mis en vente le/)).toBeNull();
        expect(screen.queryByText("Honoraires d'agence inclus, à la charge du vendeur.")).toBeNull(); // not in the card any more
        const info = screen.getByRole('button', { name: 'Honoraires' });
        await user.hover(info);
        expect((await screen.findAllByText("Honoraires d'agence inclus, à la charge du vendeur."))[0]).toBeInTheDocument();
        await user.unhover(info);
        await user.tab(); // keyboard: the icon takes the focus and opens the tooltip
        expect(await screen.findByRole('tooltip')).toHaveTextContent("Honoraires d'agence inclus");
        expect(await axe(container)).toHaveNoViolations();

        rerender(
            <PropertyAdvisorCard
                property={{
                    ...PROPERTY,
                    price_history: [
                        { date: '2026-08-15', price: 3290000 },
                        { date: '2026-09-12', price: 3150000 },
                    ],
                }}
                advisor={ADVISOR}
                reference="AP-6"
            />,
        );
        expect(screen.getByText(/Baisse de 4 % le 12 septembre 2026/)).toBeInTheDocument();
        // The advisor sits in a white, sand-lined panel (variante ui.sh « Conseiller encadré » choisie parmi 24, 2026-09-29)
        expect(screen.getByText('Maris Moreau').closest('.border-secondary-30')).toHaveClass('bg-card', 'border', 'p-3');
    });
});
