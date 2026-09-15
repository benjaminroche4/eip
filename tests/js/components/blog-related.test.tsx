import BlogRelated from '@/components/blog/blog-related';
import { type BlogPostSummary } from '@/components/blog/types';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { renderPage } from '../inertia';

const post = (id: string, title: string): BlogPostSummary => ({
    id,
    title,
    slug: id,
    url: `/blog/${id}`,
    excerpt: '',
    read_time: null,
    published_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z',
    image: null,
    category: null,
    authors: [],
});

describe('BlogRelated', () => {
    it('lists the latest articles as cards in a mobile-scrollable row', async () => {
        const { container } = renderPage(<BlogRelated posts={[post('a', 'Article A'), post('b', 'Article B'), post('c', 'Article C')]} />);

        expect(screen.getByRole('region', { name: 'Nos derniers articles' })).toBeInTheDocument();
        expect(screen.getAllByRole('article')).toHaveLength(3);
        expect(container.querySelector('ul')).toHaveClass('overflow-x-auto', 'snap-x', 'sm:grid');

        expect(await axe(container)).toHaveNoViolations();
    });

    it('renders nothing without posts', () => {
        const { container } = renderPage(<BlogRelated posts={[]} />);
        expect(container).toBeEmptyDOMElement();
    });
});
