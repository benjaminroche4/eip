import BlogCategoryFilter from '@/components/blog/blog-category-filter';
import { type BlogFilter } from '@/components/blog/types';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { renderPage } from '../inertia';

const filter: BlogFilter = {
    categories: [
        { name: 'Acheter', slug: 'acheter', color: '#1f729c', count: 8 },
        { name: 'Vendre', slug: 'vendre', color: null, count: 1 },
    ],
    total_all: 9,
    active: 'acheter',
    urls: { all: '/blog', acheter: '/blog?category=acheter', vendre: '/blog?category=vendre' },
};

describe('BlogCategoryFilter', () => {
    let scrollIntoView: ReturnType<typeof vi.fn>;
    beforeEach(() => {
        // jsdom declares scrollIntoView as a no-op on HTMLElement: spy on it there (restored by `restoreMocks`).
        scrollIntoView = vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => {});
    });

    it('lists « Tous » then each category as an underlined tab with its count badge, marking the active one', async () => {
        const { container } = renderPage(<BlogCategoryFilter filter={filter} />);

        const nav = screen.getByRole('navigation', { name: 'Filtrer par catégorie' });
        const links = within(nav).getAllByRole('link');
        expect(links.map((l) => l.getAttribute('href'))).toEqual(['/blog', '/blog?category=acheter', '/blog?category=vendre']);
        expect(links[0]).toHaveTextContent('Tous9 articles');
        expect(links[1]).toHaveTextContent('Acheter8 articles');
        expect(links[2]).toHaveTextContent('Vendre1 article');
        expect(links[1]).toHaveAttribute('aria-current', 'page');
        expect(links[1]).toHaveClass('text-foreground', 'uppercase', 'text-xs', 'focus-visible:ring-inset'); // Figma 712-19437, project scale; ring not clipped by the scrolling strip
        expect(links[0]).not.toHaveAttribute('aria-current');
        expect(links[0]).toHaveClass('text-muted-foreground');
        expect(links[1]).toHaveAttribute('data-active', 'true');
        expect(screen.getByTestId('tab-indicator')).toHaveClass('transition-[transform,width]'); // one sliding underline
        expect(links[1].querySelector('span')).toHaveClass('rounded-full', 'bg-primary'); // count badge
        expect(links[0].querySelector('span')).toHaveClass('bg-background-08');

        // Mobile: the strip scrolls horizontally and brings the active tab into view.
        expect(container.querySelector('ul')).toHaveClass('overflow-x-auto', 'snap-x');
        expect(scrollIntoView).toHaveBeenCalledWith({ inline: 'center', block: 'nearest' });

        // Clicking another tab moves the underline right away (optimistic), before the server answers.
        await userEvent.setup().click(links[2]);
        expect(links[2]).toHaveAttribute('data-active', 'true');
        expect(links[1]).toHaveAttribute('data-active', 'false');
        expect(links[1]).toHaveAttribute('aria-current', 'page'); // the real state still follows the server

        expect(await axe(container)).toHaveNoViolations();
    });
});
