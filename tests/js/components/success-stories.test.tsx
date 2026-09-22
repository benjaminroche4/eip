import SuccessStories, { type SuccessStory } from '@/components/home/success-stories';
import { screen } from '@testing-library/react';
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
        expect(container.querySelector('ul')).toHaveClass('snap-x', 'cursor-grab', 'lg:px-0'); // one draggable row at every width, flush left from lg
        expect(container.querySelector('ul > li')).toHaveClass('snap-center', 'lg:snap-start');
        expect(screen.getByRole('button', { name: 'Réussite suivante' }).parentElement).not.toHaveClass('lg:hidden');
        expect(container.querySelector('img[src="/images/stories/story-1-1600.jpg"]')).toHaveAttribute('alt', 'Séjour lumineux');
        expect(container.querySelector('ul li > div')?.className).not.toMatch(/rounded|shadow/); // square, no shadow
        expect(screen.getByRole('link', { name: 'Explorer nos réussites' })).toHaveAttribute('href', '/blog');
        expect(container.querySelector('p.font-heading span')?.className).toMatch(/animate-manifesto-in|opacity-0/); // word-by-word reveal
        expect(screen.getByRole('button', { name: 'Réussite précédente' })).toBeDisabled();

        expect(await axe(container)).toHaveNoViolations();
    });
});
