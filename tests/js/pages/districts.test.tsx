import { type District } from '@/components/districts/paris-map';
import Districts from '@/pages/districts';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { page, renderPage, sharedProps } from '../inertia';

const ITEMS: District[] = Array.from({ length: 20 }, (_, i) => ({
    n: i + 1,
    name: `Paris ${i + 1}e`,
    areas: `Quartier ${i + 1}`,
    profile: 'Familles',
    price: `${10 + i} 000`,
    extra: `Atout ${i + 1}`,
    positives: ['A', 'B', 'C'],
    audience: 'Public',
    housing: 'Logements',
    summary: `Résumé ${i + 1}`,
    metro: ['1'],
    rer: [],
    stations: [],
    attractions: ['M'],
    dining: ['T'],
    parks: ['J'],
    education: ['L'],
}));

describe('Districts page', () => {
    it('opens on the arrondissement of the URL and writes every selection back to the URL (2026-09-25)', async () => {
        const user = userEvent.setup();
        page.props = sharedProps();
        window.history.replaceState(null, '', '/arrondissements-paris?arrondissement=14');
        const { container } = renderPage(<Districts items={ITEMS} selected={14} />);

        expect(container.querySelector('#arrondissement-14')).not.toHaveAttribute('hidden'); // preselected server-side
        expect(container.querySelector('#districts-profile')).toHaveClass('w-screen', 'from-background-05', 'from-40%'); // sand band breakout (2026-09-25)
        expect(screen.getByRole('combobox', { name: 'Choisir un arrondissement' })).toHaveTextContent('Paris 14e');

        const map = screen.getByRole('group', { name: 'Carte des arrondissements de Paris' });
        // jsdom lays everything at 0: the sheet's bottom (0) is not < 0 and its top (0) not below 80 % of the viewport → no scroll
        const scrolls = vi.fn();
        window.HTMLElement.prototype.scrollIntoView = scrolls;
        await user.click(within(map).getAllByRole('button')[5]);
        expect(window.location.search).toBe('?arrondissement=6'); // shareable link, no history entry
        expect(scrolls).not.toHaveBeenCalled();
        // Sheet below the fold: the whole block (picker + sheet, `scroll-mt-24`) comes into view, not the sheet alone (2026-09-25)
        const sheet = container.querySelector<HTMLElement>('#arrondissement-7')!;
        sheet.getBoundingClientRect = () => ({ top: 2000, bottom: 3000 }) as DOMRect;
        await user.click(within(map).getAllByRole('button')[6]);
        expect(scrolls).toHaveBeenCalledTimes(1);
        expect(scrolls.mock.instances[0]).toBe(container.querySelector('#districts-profile'));
        expect(scrolls).toHaveBeenCalledWith({ block: 'start', behavior: 'smooth' });
        expect(container.querySelector('#arrondissement-7')).not.toHaveAttribute('hidden');
        expect(container.querySelector('#arrondissement-6')).toHaveAttribute('hidden');
        expect(container.querySelector('#arrondissement-14')).toHaveAttribute('hidden');

        await user.click(screen.getByRole('button', { name: 'Arrondissement suivant' }));
        expect(window.location.search).toBe('?arrondissement=8');

        await user.click(within(map).getAllByRole('button')[7]); // second click on the selected one deselects
        expect(window.location.search).toBe('');
        window.history.replaceState(null, '', '/');
    });

    it('preselects from a shared anchor when the URL has no parameter', () => {
        page.props = sharedProps();
        window.history.replaceState(null, '', '/arrondissements-paris#arrondissement-3');
        const { container } = renderPage(<Districts items={ITEMS} selected={6} />); // the server's default…
        expect(container.querySelector('#arrondissement-3')).not.toHaveAttribute('hidden'); // …yields to the anchor
        expect(container.querySelector('#arrondissement-6')).toHaveAttribute('hidden');
        window.history.replaceState(null, '', '/');
    });
});
