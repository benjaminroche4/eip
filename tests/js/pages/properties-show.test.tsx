import PropertyShow from '@/pages/properties/show';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { PROPERTY } from '../fixtures/property';
import { page, renderPage, sharedProps } from '../inertia';

const LISTING = { ...PROPERTY, features: ['elevator', 'view'], condition: 'renovated', floor: 3, published_at: '2026-09-22' };
const SIMILAR = [
    { ...PROPERTY, slug: 'appartement-odeon-6e', title: 'Appartement, Odéon' },
    { ...PROPERTY, slug: 'loft-haut-marais-3e', title: 'Loft, Haut Marais', arrondissement: 3, type: 'loft' },
];
const DISTRICT = {
    n: 6,
    name: 'Paris 6e',
    areas: 'Saint-Germain-des-Prés, Luxembourg',
    url: '/nos-biens/paris-6e',
    profileUrl: '/arrondissements-paris?arrondissement=6',
};
const PROPS = {
    property: LISTING,
    similar: SIMILAR,
    district: DISTRICT,
    advisor: { id: 1, photo: '/images/advisors/advisor-1.webp' },
    seo: { title: 'Appartement haussmannien, Saint-Germain-des-Prés', withSuffix: true, description: 'Étage noble, parquet, moulures et cheminées.' },
    map: { key: null, mapId: 'DEMO_MAP_ID' },
};

describe('Property detail page', () => {
    it('renders the breadcrumb, the header, the facts, the features, the neighbourhood links, the sticky advisor card and the similar listings', async () => {
        page.props = sharedProps();
        const { container } = renderPage(<PropertyShow {...PROPS} />);

        const crumbs = within(screen.getByRole('navigation', { name: "Fil d'Ariane" })).getAllByRole('listitem');
        expect(crumbs.map((c) => c.textContent)).toEqual(['Accueil', 'Nos biens', 'Paris 6e', PROPERTY.title]);
        expect(within(crumbs[2]).getByRole('link')).toHaveAttribute('href', '/nos-biens/paris-6e');
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(PROPERTY.title);
        expect(screen.getByText('Achat · Paris 6e · Saint-Germain-des-Prés')).toBeInTheDocument();
        expect(screen.getByText(/Publié le 22 septembre 2026/)).toBeInTheDocument();

        // Facts as icon tiles
        const facts = screen.getByRole('heading', { level: 2, name: 'En bref' }).nextElementSibling as HTMLElement;
        expect(within(facts).getByText('Surface').nextElementSibling).toHaveTextContent('128 m²');
        expect(within(facts).getByText('Étage').nextElementSibling).toHaveTextContent('3e étage');
        expect(within(facts).getByText('État').nextElementSibling).toHaveTextContent('Rénové');
        expect(within(facts).queryByText('Meublé')).toBeNull(); // sale: no rental fact
        // Features as check chips
        expect(
            within(screen.getByRole('heading', { level: 2, name: 'Les atouts' }).nextElementSibling as HTMLElement)
                .getAllByRole('listitem')
                .map((l) => l.textContent),
        ).toEqual(['Ascenseur', 'Vue dégagée']);
        // Neighbourhood links
        expect(screen.getByRole('link', { name: 'Tous nos biens à Paris 6e' })).toHaveAttribute('href', '/nos-biens/paris-6e');
        expect(screen.getByRole('link', { name: 'La fiche du Paris 6e' })).toHaveAttribute('href', '/arrondissements-paris?arrondissement=6');
        expect(screen.getByRole('region', { name: 'Carte des biens' })).toBeInTheDocument();

        // Advisor card: price, price per m², availability, contact prefilled with the listing, phone
        const card = screen.getByRole('complementary', { name: 'Votre conseiller' });
        expect(card).toHaveClass('lg:sticky');
        expect(within(card).getByText('2 450 000 €')).toBeInTheDocument();
        expect(within(card).getByText('19 141 €/m²')).toBeInTheDocument();
        expect(within(card).getByText('Disponible')).toBeInTheDocument();
        expect(within(card).getByRole('link', { name: 'Demander une visite' })).toHaveAttribute('href', `/contact?property=${PROPERTY.slug}`);
        expect(within(card).getByRole('link', { name: "Appeler l'agence" })).toHaveAttribute('href', 'tel:+33600000000');

        // Similar listings as marketplace cards, whose titles link to their pages, then the way back to the listing
        const similar = screen.getByRole('heading', { level: 2, name: 'Biens similaires' }).closest('section') as HTMLElement;
        expect(within(similar).getAllByRole('article')).toHaveLength(2);
        expect(within(similar).getByRole('link', { name: 'Loft, Haut Marais' })).toHaveAttribute('href', '/nos-biens/loft-haut-marais-3e');
        expect(within(similar).getByRole('link', { name: 'Tous nos biens' })).toHaveAttribute('href', '/nos-biens');

        // JSON-LD: breadcrumb + RealEstateListing
        const jsonLd = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
            .map((s) => s.textContent)
            .join('');
        expect(jsonLd).toContain('"RealEstateListing"');
        expect(jsonLd).toContain('"BreadcrumbList"');

        expect(await axe(container)).toHaveNoViolations();
    });

    it('gallery: the thumbnails swap the large photo, with the keyboard too', async () => {
        const user = userEvent.setup();
        page.props = sharedProps();
        renderPage(<PropertyShow {...PROPS} />);
        const gallery = screen.getByRole('group', { name: `Photos de ${PROPERTY.title}` });
        const large = () => gallery.querySelector('img')!;
        expect(large()).toHaveAttribute('src', '/images/buy/district-1-1600.webp');
        expect(large()).toHaveAttribute('loading', 'eager'); // LCP
        const thumbs = within(gallery).getAllByRole('button');
        expect(thumbs).toHaveLength(3);
        expect(thumbs[0]).toHaveAttribute('aria-pressed', 'true');

        await user.click(thumbs[1]);
        expect(large()).toHaveAttribute('src', '/images/buy/district-2-1600.webp');
        expect(thumbs[1]).toHaveAttribute('aria-pressed', 'true');
        expect(thumbs[0]).toHaveAttribute('aria-pressed', 'false');

        thumbs[1].focus();
        await user.keyboard('{ArrowRight}');
        expect(large()).toHaveAttribute('src', '/images/buy/district-3-1600.webp');
        expect(thumbs[2]).toHaveFocus();
        await user.keyboard('{ArrowRight}'); // wraps
        expect(large()).toHaveAttribute('src', '/images/buy/district-1-1600.webp');
        expect(within(gallery).getByText('Photo 1 sur 3')).toHaveClass('sr-only');
    });

    it('rental: monthly price with the charges note, the furnished fact, and the under-offer notice replaces the promise', () => {
        page.props = sharedProps();
        renderPage(
            <PropertyShow
                {...PROPS}
                property={{ ...LISTING, transaction: 'rent', price: 6500, furnished: true, charges_included: true, available: false }}
                similar={[]}
            />,
        );
        const card = screen.getByRole('complementary', { name: 'Votre conseiller' });
        expect(within(card).getByText(/6 500 €/)).toBeInTheDocument();
        expect(within(card).getByText('Charges comprises')).toBeInTheDocument();
        expect(within(card).getByText('Sous offre')).toBeInTheDocument();
        expect(within(card).getByText(/Ce bien est sous offre/)).toBeInTheDocument();
        expect(screen.getByText('Meublé').nextElementSibling).toHaveTextContent('Oui');
        expect(screen.queryByRole('heading', { level: 2, name: 'Biens similaires' })).toBeNull();
    });
});
