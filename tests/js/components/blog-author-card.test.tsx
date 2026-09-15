import BlogAuthorCard from '@/components/blog/blog-author-card';
import { type BlogPost } from '@/components/blog/types';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { renderPage } from '../inertia';

const post: BlogPost = {
    id: 'p1',
    title: 'Acheter à Paris',
    slug: 'acheter-a-paris',
    url: '/blog/acheter-a-paris',
    excerpt: '',
    read_time: 16,
    published_at: '2026-09-14T08:00:00Z',
    updated_at: '2026-09-20T08:00:00Z',
    image: null,
    category: null,
    authors: [{ name: 'Élodie Garnier', slug: 'elodie-garnier', photo: 'https://cdn.sanity.io/avatar.webp' }],
    body: [],
    faqs: [],
    seo_title: '',
    seo_description: '',
    tags: [],
};

describe('BlogAuthorCard', () => {
    it('shows the author with avatar, both dates and the read time in the valuation-recap frame', async () => {
        const { container } = renderPage(<BlogAuthorCard post={post} />);

        const card = screen.getByRole('group', { name: 'Par Élodie Garnier' });
        expect(card).toHaveClass('border-secondary-30');
        expect(container.querySelector('img')).toHaveClass('rounded-full');
        expect(screen.getByText('Par')).toHaveClass('sr-only');
        // One row per fact, each with its lucide icon (ui.sh variant « Lignes à icônes »).
        expect(screen.getByText('Publié le').nextElementSibling).toHaveTextContent('14 septembre 2026');
        expect(screen.getByText('Publié le').querySelector('svg.lucide-calendar-days')).not.toBeNull();
        expect(screen.getByText('Mis à jour le').nextElementSibling).toHaveTextContent('20 septembre 2026');
        expect(screen.getByText('Mis à jour le').querySelector('svg.lucide-refresh-cw')).not.toBeNull();
        expect(screen.getByText('Lecture').nextElementSibling).toHaveTextContent('16 min de lecture');
        expect(screen.getByText('Lecture').querySelector('svg.lucide-clock')).not.toBeNull();

        expect(await axe(container)).toHaveNoViolations();
    });

    it('falls back to the agency name and hides the update row when the dates match', () => {
        renderPage(<BlogAuthorCard post={{ ...post, authors: [], updated_at: post.published_at, read_time: null }} />);

        expect(screen.getByRole('group', { name: 'Par Estate in Paris' })).toBeInTheDocument();
        expect(screen.queryByText('Mis à jour le')).toBeNull();
        expect(screen.queryByText('Lecture')).toBeNull();
    });
});
