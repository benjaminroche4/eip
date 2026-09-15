import BlogPagination, { pageItems } from '@/components/blog/blog-pagination';
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { renderPage } from '../inertia';

describe('pageItems', () => {
    it('lists every page up to 7, then keeps first, last and a window around the current page', () => {
        expect(pageItems(1, 1)).toEqual([1]);
        expect(pageItems(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
        expect(pageItems(1, 10)).toEqual([1, 2, null, 10]);
        expect(pageItems(5, 10)).toEqual([1, null, 4, 5, 6, null, 10]);
        expect(pageItems(10, 10)).toEqual([1, null, 9, 10]);
    });
});

describe('BlogPagination', () => {
    it('renders nothing for a single page', () => {
        const { container } = renderPage(<BlogPagination current={1} last={1} prev={null} next={null} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders crawlable page links with the current page marked, and disables the arrow with no target', async () => {
        const { container } = renderPage(<BlogPagination current={2} last={3} prev="/blog" next="/blog?page=3" />);

        const nav = screen.getByRole('navigation', { name: 'Pagination des articles' });
        const pages = within(nav).getAllByRole('link', { name: /^Page \d$/ });
        expect(pages.map((l) => l.getAttribute('href'))).toEqual(['/blog', '/blog?page=2', '/blog?page=3']);
        expect(pages[1]).toHaveAttribute('aria-current', 'page');
        expect(pages[0]).not.toHaveAttribute('aria-current');
        expect(screen.getByRole('link', { name: 'Articles précédents' })).toHaveAttribute('href', '/blog');
        expect(screen.getByRole('link', { name: 'Articles suivants' })).toHaveAttribute('href', '/blog?page=3');

        expect(await axe(container)).toHaveNoViolations();
    });

    it('reminds the active filter under the row when given a context', () => {
        renderPage(
            <BlogPagination current={2} last={4} prev="/blog?category=acheter" next="/blog?category=acheter&page=3" context="Page 2 / 4 · Acheter" />,
        );
        expect(screen.getByRole('navigation', { name: 'Pagination des articles' })).toHaveTextContent('Page 2 / 4 · Acheter');
    });

    it('turns the arrows into disabled buttons on the first and last page', () => {
        renderPage(<BlogPagination current={1} last={2} prev={null} next="/blog?page=2" />);
        expect(screen.getByRole('button', { name: 'Articles précédents' })).toBeDisabled();
        expect(screen.getByRole('link', { name: 'Articles suivants' })).toBeInTheDocument();
    });
});
