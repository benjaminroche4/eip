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
    it('renders the story cards, the quote and the button to the blog, with mobile arrows', async () => {
        const { container } = renderPage(<SuccessStories stories={stories} />);

        expect(screen.getByRole('heading', { level: 2, name: 'Nos réussites' })).toBeInTheDocument();
        expect(screen.getAllByRole('article')).toHaveLength(2);
        expect(screen.getByRole('heading', { level: 3, name: '12 % au-dessus des attentes dans le 16e' })).toBeInTheDocument();
        expect(screen.getByText('28 jours')).toBeInTheDocument();
        expect(container.querySelector('img[src="/images/stories/story-1-1600.jpg"]')).toHaveAttribute('alt', 'Séjour lumineux');
        expect(container.querySelector('article')?.className).not.toMatch(/rounded|shadow/); // square, no shadow
        expect(screen.getByRole('link', { name: 'Explorer nos réussites' })).toHaveAttribute('href', '/blog');
        expect(container.querySelector('p.font-heading span')?.className).toMatch(/animate-manifesto-in|opacity-0/); // word-by-word reveal
        expect(screen.getByRole('button', { name: 'Réussite précédente' })).toBeDisabled();

        expect(await axe(container)).toHaveNoViolations();
    });
});
