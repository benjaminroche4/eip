import Services from '@/components/home/services';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { renderPage } from '../inertia';

describe('Services', () => {
    it('renders the header and four service cards linking to the service pages', async () => {
        const { container } = renderPage(<Services />);

        expect(screen.getByRole('heading', { level: 2, name: 'Que pouvons-nous faire pour votre projet immobilier à Paris ?' })).toBeInTheDocument();
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

    it('recomputes the current card on resize, so the arrows never keep a stale index after a layout change (2026-09-22)', async () => {
        const { container } = renderPage(<Services />);
        const row = container.querySelector('ul.snap-x') as HTMLElement;
        const cards = Array.from(row.children) as HTMLElement[];
        // Layout: 288px cards 16px apart, 400px viewport, the row scrolled so the second card sits in the middle
        Object.defineProperty(row, 'clientWidth', { value: 400, configurable: true });
        cards.forEach((card, i) => {
            Object.defineProperty(card, 'offsetLeft', { value: i * 304, configurable: true });
            Object.defineProperty(card, 'offsetWidth', { value: 288, configurable: true });
        });
        row.scrollLeft = 248;
        expect(screen.getByRole('button', { name: 'Service précédent' })).toBeDisabled(); // not measured yet (no scroll event)

        window.dispatchEvent(new Event('resize'));
        await waitFor(() => expect(screen.getByRole('button', { name: 'Service précédent' })).toBeEnabled());
        expect(screen.getByRole('button', { name: 'Service suivant' })).toBeEnabled();
    });
});
