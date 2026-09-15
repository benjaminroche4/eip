import BlogFeaturedPost from '@/components/blog/blog-featured-post';
import { type BlogPostSummary } from '@/components/blog/types';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { renderPage } from '../inertia';

const post: BlogPostSummary = {
    id: 'p1',
    title: 'Acheter à Paris en 2026',
    slug: 'acheter-a-paris',
    url: '/blog/acheter-a-paris',
    excerpt: 'Ce qu’il faut savoir avant de signer.',
    read_time: 6,
    published_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z',
    image: { url: '/img.jpg', srcset: '/img.jpg 800w', width: 1200, height: 800, alt: '' },
    category: { name: 'Acheter', slug: 'acheter', color: null },
    authors: [{ name: 'Élodie Garnier', slug: 'elodie-garnier', photo: 'https://cdn.sanity.io/avatar.webp' }],
};

describe('BlogFeaturedPost', () => {
    it('shows the latest post as a double card with the label, category pill, meta, title and read link', async () => {
        const user = userEvent.setup();
        const { container } = renderPage(<BlogFeaturedPost post={post} />);

        expect(screen.getByRole('article', { name: 'Acheter à Paris en 2026' })).toHaveClass('border', 'hover:border-foreground/40'); // same frame as the cards
        expect(screen.getByText('Dernier article')).toHaveClass('text-center', 'uppercase'); // label centred on the outer sand frame (Relocation in Paris pattern)
        expect(screen.getByRole('article', { name: 'Acheter à Paris en 2026' }).querySelector('.bg-card')).not.toBeNull(); // inner white card
        expect(container.querySelector('time')!.parentElement).toHaveTextContent('Par Élodie Garnier1 sept. 2026'); // same meta block as the cards
        expect(screen.getByText('Acheter')).toHaveClass('rounded-full'); // category pill on the photo
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Acheter à Paris en 2026');
        expect(container.querySelector('img.aspect-\\[3\\/2\\]')).toHaveAttribute('fetchpriority', 'high'); // LCP candidate

        const links = screen.getAllByRole('link');
        expect(links.map((l) => l.textContent)).toEqual(['Acheter à Paris en 2026', "Lire l'article"]);
        links.forEach((l) => expect(l).toHaveAttribute('href', '/blog/acheter-a-paris'));

        await user.tab();
        expect(links[0]).toHaveFocus(); // the decorative image link is skipped (tabIndex -1)
        await user.tab();
        expect(links[1]).toHaveFocus();

        expect(await axe(container)).toHaveNoViolations();
    });
});
