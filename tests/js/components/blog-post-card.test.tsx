import BlogPostCard from '@/components/blog/blog-post-card';
import { type BlogPostSummary } from '@/components/blog/types';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { renderPage } from '../inertia';

const post: BlogPostSummary = {
    id: 'p2',
    title: 'Vendre un appartement à Paris',
    slug: 'vendre-un-appartement',
    url: '/blog/vendre-un-appartement',
    excerpt: 'Les étapes clés, du mandat à la signature.',
    read_time: 4,
    published_at: '2026-09-15T08:00:00Z',
    updated_at: '2026-09-15T08:00:00Z',
    image: { url: '/img.jpg', srcset: '/img.jpg 800w', width: 1200, height: 800, alt: '' },
    category: { name: 'Vendre', slug: 'vendre', color: '#c2a878' },
    authors: [{ name: 'Élodie Garnier', slug: 'elodie-garnier', photo: 'https://cdn.sanity.io/avatar.webp' }],
};

describe('BlogPostCard', () => {
    it('frames the post with a coloured category pill, author avatar + short date under the photo, and a read link', async () => {
        const user = userEvent.setup();
        const { container } = renderPage(<BlogPostCard post={post} />);

        expect(screen.getByRole('article')).toHaveClass('border', 'hover:border-foreground/40', 'transition-colors');
        expect(screen.getByText('Vendre')).toHaveClass('rounded-full');
        const dot = screen.getByTestId('category-dot');
        expect(dot).toHaveClass('bg-(--category-color)');
        expect(dot.style.getPropertyValue('--category-color')).toBe('#c2a878');
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Vendre un appartement à Paris');
        const time = container.querySelector('time')!;
        expect(time).toHaveAttribute('datetime', '2026-09-15T08:00:00Z');
        expect(time).toHaveTextContent('15 sept. 2026'); // short month
        expect(time.parentElement).toHaveTextContent('Par Élodie Garnier15 sept. 2026'); // sr-only « Par », name · date, no read time nor icons
        const avatar = container.querySelector('img[src="https://cdn.sanity.io/avatar.webp"]')!;
        expect(avatar).toHaveClass('rounded-full');
        expect(avatar).toHaveAttribute('alt', '');
        expect(container.querySelector('svg.lucide-calendar-days')).toBeNull();
        expect(container.querySelector('img.aspect-\\[3\\/2\\]')).toHaveClass('group-hover:scale-105'); // photo zoom on card hover
        expect(screen.getByRole('heading', { level: 2 })).toHaveClass('line-clamp-2'); // no fixed height: the read link is pinned with mt-auto instead

        const links = screen.getAllByRole('link');
        expect(links.map((l) => l.textContent)).toEqual(['Vendre un appartement à Paris', "Lire l'article"]);
        links.forEach((l) => expect(l).toHaveAttribute('href', '/blog/vendre-un-appartement'));
        expect(links[1]).toHaveClass('inline-flex'); // text + arrow on one line (linkClass's inline-block must not win)
        expect(links[1]).not.toHaveClass('inline-block');
        links.forEach((l) => expect(l).not.toHaveClass('after:h-px')); // no drawn-underline hover on card links
        expect(links[1]).toHaveClass('text-muted-foreground', 'group-hover:text-foreground'); // discreet read link

        await user.tab();
        expect(links[0]).toHaveFocus(); // the decorative image link is skipped (tabIndex -1)
        await user.tab();
        expect(links[1]).toHaveFocus();

        expect(await axe(container)).toHaveNoViolations();
    });

    it('falls back to the agency name without author, and to the primary colour without category colour', () => {
        const { container } = renderPage(
            <BlogPostCard post={{ ...post, image: null, authors: [], category: { name: 'Vendre', slug: 'vendre', color: null } }} />,
        );

        expect(container.querySelector('img')).toBeNull();
        expect(screen.getByText('Estate in Paris')).toBeInTheDocument();
        expect(screen.getByTestId('category-dot')).toHaveClass('bg-primary');
        expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });
});
