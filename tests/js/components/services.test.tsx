import Services from '@/components/home/services';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { renderPage } from '../inertia';

describe('Services', () => {
    it('renders the header and four service cards linking to the service pages', async () => {
        const { container } = renderPage(<Services />);

        expect(
            screen.getByRole('heading', { level: 2, name: 'Des services immobiliers sur mesure, à chaque étape de votre projet' }),
        ).toBeInTheDocument();
        expect(screen.getByText('Ce que nous faisons')).toBeInTheDocument();
        const links = [
            ['Acheter', '/acheter-immobilier-paris'],
            ['Vendre', '/vendre-immobilier-paris'],
            ['Estimation', '/estimation-immobiliere-paris'],
            ['Accompagnement', '/contact'],
        ];
        for (const [title, href] of links) {
            const link = screen.getByText(title).closest('a')!;
            expect(link).toHaveAttribute('href', href);
            expect(link).toHaveClass('border-secondary-30', 'bg-card', 'p-2'); // the site's card surface
            expect(link.className).not.toMatch(/rounded-|shadow|dashed/); // square, no dashed frame, no shadow
        }
        expect(container.querySelectorAll('ul.snap-x > li')).toHaveLength(4);

        expect(await axe(container)).toHaveNoViolations();
    });

    it('offers previous / next arrows on mobile, the first one disabled at the start, cards reachable with the keyboard', async () => {
        renderPage(<Services />);
        expect(screen.getByRole('button', { name: 'Service précédent' })).toBeDisabled(); // first card centred: nothing before
        expect(screen.getByRole('button', { name: 'Service suivant' })).toBeEnabled();
        expect(screen.queryByRole('list', { name: 'Aller à un service' })).toBeNull(); // no dots
        await userEvent.tab();
        expect(screen.getByText('Acheter').closest('a')).toHaveFocus();
    });
});
