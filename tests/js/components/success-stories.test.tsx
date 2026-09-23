import SuccessStories, { type SuccessStory } from '@/components/home/success-stories';
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { renderPage } from '../inertia';

const stories: SuccessStory[] = [
    {
        title: '12 % au-dessus des attentes dans le 16e',
        place: 'Paris 16e',
        duration: '28 jours',
        result: '+12 % vs estimation',
        photo: '/images/stories/story-1-{w}.jpg',
        alt: 'Séjour lumineux',
    },
    {
        title: 'Un hôtel particulier vendu hors marché',
        place: 'Paris 7e',
        duration: '42 jours',
        result: 'Vente confidentielle',
        photo: '/images/stories/story-2-{w}.jpg',
        alt: 'Chambre contemporaine',
    },
];

describe('SuccessStories', () => {
    it('renders the photos only, the quote and the button to the blog, with arrows at every width', async () => {
        const { container } = renderPage(<SuccessStories stories={stories} />);

        expect(screen.getByRole('heading', { level: 2, name: 'Quels résultats obtenons-nous pour nos clients ?' })).toBeInTheDocument();
        expect(screen.queryAllByRole('article')).toHaveLength(0); // photos only, no text overlay (user decision 2026-09-22)
        expect(screen.queryByText('28 jours')).not.toBeInTheDocument();
        expect(screen.getAllByRole('img')).toHaveLength(2);
        expect(container.querySelector('ul')).toHaveClass('snap-x', 'data-[overflowing=true]:cursor-grab', 'lg:px-0'); // one draggable row at every width, flush left from lg
        expect(container.querySelector('ul > li')).toHaveClass('snap-center', 'lg:snap-start');
        expect(screen.getByRole('button', { name: 'Réussite suivante' }).parentElement).not.toHaveClass('lg:hidden');
        expect(container.querySelector('img[src="/images/stories/story-1-1600.jpg"]')).toHaveAttribute('alt', 'Séjour lumineux');
        expect(container.querySelector('ul li > div')?.className).not.toMatch(/rounded|shadow/); // square, no shadow
        expect(screen.getByRole('link', { name: 'Explorer nos réussites' })).toHaveAttribute('href', '/blog');
        expect(container.querySelector('p.font-heading span')?.className).toMatch(/animate-manifesto-in|opacity-0/); // word-by-word reveal
        expect(screen.getByRole('button', { name: 'Réussite précédente' })).toBeDisabled(); // finite row: at the start, the previous arrow is off (dimmed)
        expect(screen.getByRole('button', { name: 'Réussite suivante' })).toBeEnabled();
        // The arrows follow the scroll edges: at the far end the next arrow switches off, the previous one comes back
        const row = container.querySelector('ul')!;
        Object.defineProperty(row, 'scrollWidth', { value: 1200, configurable: true });
        Object.defineProperty(row, 'clientWidth', { value: 400, configurable: true });
        row.scrollLeft = 800;
        row.dispatchEvent(new Event('scroll'));
        await waitFor(() => expect(screen.getByRole('button', { name: 'Réussite suivante' })).toBeDisabled());
        expect(screen.getByRole('button', { name: 'Réussite précédente' })).toBeEnabled();
        expect(container.querySelectorAll('ul > li')).toHaveLength(2); // one copy, no loop (user decision 2026-09-22)
        expect(container.querySelector('ul > li:last-child')!.className).toMatch(/lg:last:snap-end/); // the last photo shows in full at the end

        expect(await axe(container)).toHaveNoViolations();
    });

    it('switches « next » off and drops the grab cursor when the whole row fits on screen (2026-09-22)', async () => {
        const { container } = renderPage(<SuccessStories stories={stories} />);
        const row = container.querySelector('ul')!;
        expect(row).toHaveAttribute('data-overflowing', 'false'); // jsdom: nothing measurable, nothing claimed
        expect(screen.getByRole('button', { name: 'Réussite suivante' })).toBeEnabled();

        // Layout available, the row fits: no overflow, both arrows off
        Object.defineProperty(row, 'scrollWidth', { value: 800, configurable: true });
        Object.defineProperty(row, 'clientWidth', { value: 800, configurable: true });
        window.dispatchEvent(new Event('resize'));
        await waitFor(() => expect(screen.getByRole('button', { name: 'Réussite suivante' })).toBeDisabled());
        expect(screen.getByRole('button', { name: 'Réussite précédente' })).toBeDisabled();
        expect(row).toHaveAttribute('data-overflowing', 'false');

        // The row overflows again (narrower viewport): the grab cursor and « next » come back
        Object.defineProperty(row, 'clientWidth', { value: 400, configurable: true });
        window.dispatchEvent(new Event('resize'));
        await waitFor(() => expect(row).toHaveAttribute('data-overflowing', 'true'));
        expect(screen.getByRole('button', { name: 'Réussite suivante' })).toBeEnabled();
    });
});
