import Sitemap from '@/pages/sitemap';
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { page, renderPage, sharedProps } from '../inertia';

const GROUPS = [
    {
        title: 'Nos services',
        links: [
            { label: 'Acheter', href: '/acheter-immobilier-paris' },
            { label: 'Vendre', href: '/vendre-immobilier-paris' },
        ],
    },
    { title: 'Pages du site', links: [{ label: 'Accueil', href: '/' }] },
    { title: 'Liens légaux', links: [{ label: 'Plan du site', href: '/plan-du-site' }] },
];
const BLOG = {
    categories: [
        {
            label: 'Achat',
            href: '/blog/categorie/achat',
            posts: [
                { label: 'Article A', href: '/blog/a' },
                { label: 'Article B', href: '/blog/b' },
            ],
        },
    ],
    other: [{ label: 'Article C', href: '/blog/c' }],
};

describe('Sitemap page', () => {
    it('renders one nav landmark with a counted section per group and the articles grouped by category', async () => {
        page.props = sharedProps();
        const { container } = renderPage(<Sitemap groups={GROUPS} blog={BLOG} />);

        expect(screen.getByRole('heading', { level: 1, name: 'Toutes les pages du site' })).toBeInTheDocument();
        expect(screen.getByText(/^Estate in Paris, agence immobilière/)).toBeInTheDocument(); // GEO intro
        const main = within(container.querySelector('main')!); // the footer has its own nav landmarks
        expect(main.getAllByRole('navigation')).toHaveLength(1); // one landmark (« Plan du site »), sections inside
        expect(main.getByRole('heading', { level: 2, name: /Nos services.*2 liens/ })).toHaveClass('text-xl', 'font-medium'); // legal pages' size + count pill (sr-only wording)
        expect(main.getByRole('heading', { level: 2, name: /Articles du blog.*3 liens/ })).toBeInTheDocument();
        expect(main.getByRole('link', { name: 'Vendre' })).toHaveAttribute('href', '/vendre-immobilier-paris');
        expect(main.getByRole('heading', { level: 3, name: 'Achat' }).querySelector('a')).toHaveAttribute('href', '/blog/categorie/achat'); // category title → category page
        expect(main.getByRole('heading', { level: 3, name: 'Autres articles' })).toBeInTheDocument();
        expect(main.getByRole('link', { name: 'Article C' })).toHaveAttribute('href', '/blog/c');
        expect(container.querySelectorAll('main a')).toHaveLength(8);

        expect(await axe(container)).toHaveNoViolations();
    });

    it('omits the blog section without articles', () => {
        page.props = sharedProps();
        const { container } = renderPage(<Sitemap groups={GROUPS} blog={{ categories: [], other: [] }} />);
        expect(within(container.querySelector('main')!).queryByRole('heading', { level: 2, name: /Articles du blog/ })).not.toBeInTheDocument();
    });
});
