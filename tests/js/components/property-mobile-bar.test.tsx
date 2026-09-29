import PropertyMobileBar from '@/components/properties/property-mobile-bar';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { PROPERTY } from '../fixtures/property';
import { page, renderPage, sharedProps } from '../inertia';

const ADVISOR = { id: 1, photo: '/images/advisors/advisor-1.webp', name: 'Alexandre Moreau', role: 'Conseiller senior' };

describe('PropertyMobileBar', () => {
    it('is fixed to the screen bottom from the start with the price and the visit link, and opens the advisor card in a sheet', async () => {
        page.props = sharedProps();
        const user = userEvent.setup();
        const { container, rerender } = renderPage(<PropertyMobileBar property={PROPERTY} advisor={ADVISOR} reference="AP-6" />);

        const cta = screen.getByRole('link', { name: 'Demander une visite' });
        expect(cta).toHaveAttribute('href', `/contact?property=${PROPERTY.slug}`);
        expect(cta.parentElement).toHaveClass('fixed', 'bottom-0', 'z-60', 'lg:hidden');
        expect(screen.getByText('2 450 000 €')).toBeInTheDocument();
        expect(screen.getByText('Disponible')).toBeInTheDocument();
        expect(screen.queryByRole('complementary')).toBeNull(); // the card waits in the sheet

        // The chevron opens the whole card above the bar; Escape closes it and gives the focus back
        const toggle = screen.getByRole('button', { name: 'Voir le détail du bien et du conseiller' });
        expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await user.click(toggle);
        expect(toggle).toHaveAttribute('aria-expanded', 'true');
        const sheet = screen.getByRole('dialog', { name: 'Votre conseiller' });
        const card = within(sheet).getByRole('complementary', { name: 'Votre conseiller' });
        expect(within(card).getByText('Alexandre Moreau')).toBeInTheDocument();
        expect(within(card).getByText('19 141 €/m²')).toBeInTheDocument();
        expect(within(card).getByRole('button', { name: 'Demander une visite' })).toHaveAttribute('aria-haspopup', 'dialog');
        expect(await axe(container)).toHaveNoViolations();
        sheet.focus(); // jsdom does not move the focus into a non-modal sheet as browsers do
        await user.keyboard('{Escape}');
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(toggle).toHaveFocus();

        rerender(<PropertyMobileBar property={{ ...PROPERTY, transaction: 'rent', price: 6500 }} advisor={ADVISOR} reference="AP-6" />);
        expect(screen.getByText(/6 500 €/)).toHaveTextContent('/ mois'); // rental: monthly
    });
});
