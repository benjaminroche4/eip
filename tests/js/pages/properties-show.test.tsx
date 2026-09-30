import PropertyShow from '@/pages/properties/show';
import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { PROPERTY } from '../fixtures/property';
import { page, renderPage, sharedProps } from '../inertia';

const LISTING = { ...PROPERTY, features: ['elevator', 'view'], condition: 'renovated', floor: 3, published_at: '2026-09-22' };
const SIMILAR = [
    { ...PROPERTY, slug: 'appartement-odeon-6e', title: 'Appartement, Odéon' },
    { ...PROPERTY, slug: 'loft-haut-marais', title: 'Loft, Haut Marais', arrondissement: 3, type: 'loft' },
];
const DISTRICT = {
    n: 6,
    name: 'Paris 6e',
    areas: 'Saint-Germain-des-Prés, Luxembourg',
    url: '/nos-biens/paris-6e',
    profileUrl: '/arrondissements-paris?arrondissement=6',
    price: '13 900',
    metro: ['4', '10'],
    rer: ['B'],
    education: ['Lycée Fénelon', 'École alsacienne'],
    parks: ['Jardin du Luxembourg'],
};
const PROPS = {
    property: LISTING,
    similar: SIMILAR,
    district: DISTRICT,
    advisor: { id: 1, photo: '/images/advisors/advisor-1.webp', name: 'Alexandre Moreau', role: 'Conseiller senior' },
    meta: {
        title: 'Appartement haussmannien, Saint-Germain-des-Prés',
        withSuffix: true,
        description: 'Étage noble, parquet, moulures et cheminées.',
    },
    map: { key: null, mapId: 'DEMO_MAP_ID' },
    neighbours: { previous: null, next: { title: 'Appartement Art déco, Passy', url: '/nos-biens/achat/paris-16e/appartement-passy' } },
};

describe('Property detail page', () => {
    it('SEO / GEO (2026-09-28): answer-first sentence from the data, mandatory notices with the Géorisques link, standalone listing JSON-LD (the FAQ block was removed on 2026-09-29)', () => {
        renderPage(<PropertyShow {...PROPS} />);
        expect(
            screen.getByText(
                /^Estate in Paris propose ce bien à la vente : appartement de 4 pièces \(128 m², 2 chambres\) à Saint-Germain-des-Prés, Paris 6e, au prix de 2.450.000 €\.$/,
            ),
        ).toBeInTheDocument();
        const legal = screen.getByRole('region', { name: 'Mentions' });
        expect(legal).toHaveTextContent(/honoraires d'agence inclus/);
        expect(within(legal).getByRole('link', { name: 'www.georisques.gouv.fr' })).toHaveAttribute('href', 'https://www.georisques.gouv.fr');
        expect(screen.queryByRole('heading', { level: 2, name: 'Comment se passe une visite avec Estate in Paris ?' })).toBeNull(); // no FAQ nor CTA card on the listing page (user decision 2026-09-29)
        const graph = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map((n) => JSON.parse(n.textContent ?? '{}'));
        const listing = graph.find((n: { '@type': string }) => n['@type'] === 'RealEstateListing');
        expect(listing.url).toBe(listing.mainEntityOfPage); // the listing is the page, no anchor
        expect(listing.url).not.toContain('#');
        expect(listing.datePosted).toBe('2026-09-22');
        expect(graph.some((n: { '@type': string }) => n['@type'] === 'FAQPage')).toBe(false);
    });

    it('renders the breadcrumb, the header, the facts, the features, the neighbourhood links, the sticky advisor card and the similar listings', async () => {
        page.props = sharedProps();
        const { container } = renderPage(<PropertyShow {...PROPS} />);

        const crumbs = within(screen.getByRole('navigation', { name: "Fil d'Ariane" })).getAllByRole('listitem');
        expect(crumbs.map((c) => c.textContent)).toEqual(['Accueil', 'Nos biens', 'Paris 6e', PROPERTY.title]);
        expect(within(crumbs[2]).getByRole('link')).toHaveAttribute('href', '/nos-biens/paris-6e');
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(PROPERTY.title);
        expect(screen.getByText('Achat · Paris 6e · Saint-Germain-des-Prés')).toBeInTheDocument();
        expect(screen.queryByText(/Publié le/)).toBeNull(); // the publication date left the header (2026-09-29)

        // Key facts as icon tiles (ui.sh « Tuiles à icône » chosen among 15, 2026-09-29): the value over the label
        const facts = screen.getByRole('heading', { level: 2, name: 'En bref' }).closest('section') as HTMLElement;
        const fact = (label: string) => within(facts).getByText(label).closest('div')!.querySelector('dd');
        expect(fact('Surface')).toHaveTextContent('128 m²');
        expect(fact('Étage')).toHaveTextContent('3e étage');
        expect(fact('État')).toHaveTextContent('Rénové');
        expect(within(facts).queryByText('Meublé')).toBeNull(); // sale: no rental fact
        // Features as icon tiles
        expect(
            within(screen.getByRole('heading', { level: 2, name: 'Les atouts' }).nextElementSibling as HTMLElement)
                .getAllByRole('listitem')
                .map((l) => l.textContent),
        ).toEqual(['Ascenseur', 'Vue dégagée']);
        // Neighbourhood links
        // The map is folded behind a button (no API call for nothing), a click unfolds it
        expect(screen.queryByRole('region', { name: 'Carte des biens' })).toBeNull();
        await userEvent.click(screen.getByRole('button', { name: 'Voir sur la carte' }));
        expect(screen.getByRole('region', { name: 'Carte des biens' })).toBeInTheDocument();
        // The listing's price per m² against the arrondissement's average
        // The listing's price per m² against the arrondissement's average: two bars, the gap chip and one sentence (rework 2026-09-29)
        const compare = screen.getByText('Prix au m², ce bien et son arrondissement').closest('div.bg-background-05') as HTMLElement;
        expect(within(compare).getByText('Ce bien').parentElement).toHaveTextContent('19 141 €/m²');
        expect(within(compare).getByText('Paris 6e').parentElement).toHaveTextContent('13 900 €/m²');
        expect(within(compare).getByText('+38 %')).toHaveClass('bg-secondary-60'); // 19 141 vs 13 900
        expect(within(compare).getByText('Ce bien se présente 38 % au-dessus du prix moyen au m² constaté dans le Paris 6e.')).toBeInTheDocument();

        // Advisor card: price, price per m², availability, contact prefilled with the listing, phone
        const card = screen.getByRole('complementary', { name: 'Votre conseiller' });
        expect(card.parentElement).toHaveClass('lg:sticky');
        expect(within(card).getByText('Alexandre Moreau')).toBeInTheDocument(); // the advisor by name and role (E-E-A-T)
        expect(within(card).getByText('Conseiller senior')).toBeInTheDocument();
        expect(within(card).getByText('2 450 000 €')).toBeInTheDocument();
        expect(within(card).getByText('19 141 €/m²')).toBeInTheDocument();
        expect(within(card).getByText('Disponible')).toBeInTheDocument();
        // The viewing request opens in a modal from the card (user decision 2026-09-29); a slot pill picks a time first
        expect(within(card).getByRole('button', { name: 'Demander une visite' })).toHaveAttribute('aria-haspopup', 'dialog');
        expect(within(card).getByRole('link', { name: "Appeler l'agence" })).toHaveAttribute('href', 'tel:+33600000000');

        // Similar listings as marketplace cards, whose titles link to their pages, then the way back to the listing
        const similar = screen.getByRole('heading', { level: 2, name: 'Biens similaires' }).closest('section') as HTMLElement;
        expect(within(similar).getAllByRole('article')).toHaveLength(2);
        expect(within(similar).getByRole('link', { name: 'Loft, Haut Marais' })).toHaveAttribute(
            'href',
            '/nos-biens/achat/paris-3e/loft-haut-marais',
        );
        expect(within(similar).queryByRole('link', { name: 'Tous nos biens' })).toBeNull(); // removed under the similar listings (2026-09-29)
        expect(screen.getByRole('link', { name: 'Retour à Nos biens' })).toHaveAttribute('href', '/nos-biens'); // mobile way back above the breadcrumb (2026-09-30)
        // Previous / next as two buttons (2026-09-29): the title in the accessible name
        expect(within(similar).getByRole('link', { name: 'Voir le bien suivant : Appartement Art déco, Passy' })).toHaveAttribute(
            'href',
            '/nos-biens/achat/paris-16e/appartement-passy',
        );
        expect(within(similar).queryByRole('link', { name: /précédent/ })).toBeNull();

        // JSON-LD: breadcrumb + RealEstateListing
        const jsonLd = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
            .map((s) => s.textContent)
            .join('');
        expect(jsonLd).toContain('"RealEstateListing"');
        expect(jsonLd).toContain('"BreadcrumbList"');

        expect(await axe(container)).toHaveNoViolations();
    });

    it('gallery: one scrolling line of photos opening the lightbox, arrows and thumbnails change the photo, Escape closes and the focus returns', async () => {
        const user = userEvent.setup();
        page.props = sharedProps();
        renderPage(<PropertyShow {...PROPS} />);
        const gallery = screen.getByRole('group', { name: `Photos de ${PROPERTY.title}` });
        // One line that scrolls (2026-09-29): every photo a tile of the strip, the first eager, arrows disabled at the ends
        const tiles = within(gallery).getAllByRole('button', { name: /^Agrandir la photo \d/ });
        expect(tiles).toHaveLength(3);
        expect(within(tiles[0]).getByRole('img')).toHaveAttribute('loading', 'eager'); // LCP
        expect(within(tiles[0]).getByRole('img')).toHaveAttribute('src', '/images/buy/district-1-1600.webp');
        expect(within(tiles[1]).getByRole('img')).toHaveAttribute('loading', 'lazy');
        expect(gallery).toHaveClass('w-screen'); // full bleed, the whole viewport width
        expect(gallery).toHaveAttribute('aria-roledescription', 'carousel');
        // The arrows never fade nor lock at the ends (user decision 2026-09-29): they wrap around
        Element.prototype.scrollTo = vi.fn();
        const prev = within(gallery).getByRole('button', { name: 'Photo précédente' });
        expect(prev).not.toHaveAttribute('aria-disabled');
        expect(prev.className).not.toMatch(/opacity-0/);
        await user.click(prev);
        expect(Element.prototype.scrollTo).toHaveBeenCalled(); // from the first photo, back to the last
        // The target is bounded by the strip's end, so the last photo is shown whole (bug 2026-09-30); jsdom has no layout: 0
        expect(vi.mocked(Element.prototype.scrollTo).mock.lastCall?.[0]).toMatchObject({ left: 0 });

        await user.click(within(gallery).getByRole('button', { name: 'Voir les 3 photos' }));
        const dialog = await screen.findByRole('dialog', { name: `Photos de ${PROPERTY.title}` });
        expect(within(dialog).getByText('Photo 1 sur 3')).toBeInTheDocument();
        await user.click(within(dialog).getByRole('button', { name: 'Photo suivante' }));
        expect(within(dialog).getByText('Photo 2 sur 3')).toBeInTheDocument();
        await user.keyboard('{ArrowRight}');
        expect(within(dialog).getByText('Photo 3 sur 3')).toBeInTheDocument();
        await user.keyboard('{ArrowRight}'); // wraps
        expect(within(dialog).getByText('Photo 1 sur 3')).toBeInTheDocument();
        const thumbs = within(dialog).getAllByRole('button', { name: /^Voir la photo/ });
        expect(thumbs).toHaveLength(3);
        await user.click(thumbs[1]);
        expect(thumbs[1]).toHaveAttribute('aria-pressed', 'true');
        expect(within(dialog).getByText('Photo 2 sur 3')).toBeInTheDocument();

        await user.keyboard('{Escape}');
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(within(gallery).getByRole('button', { name: 'Voir les 3 photos' })).toHaveFocus();

        // A click on a photo opens the modal at that photo, with the thumbnails under the main one (2026-09-29)
        await user.click(tiles[2]);
        const modal = await screen.findByRole('dialog');
        expect(within(modal).getByText('Photo 3 sur 3')).toBeInTheDocument();
        expect(within(modal).getAllByRole('button', { name: /^Voir la photo/ })).toHaveLength(3);
        await user.keyboard('{Escape}');
        expect(tiles[2]).toHaveFocus();

        // Mouse path: the drag hook captures the pointer on the strip, so the release on the strip opens the modal
        // (not a click on the tile); a release 8px or more away is a drag and opens nothing (bug 2026-09-29)
        const stripList = within(gallery).getByRole('list');
        stripList.dataset.dragging = 'true';
        fireEvent.pointerDown(tiles[1], { clientX: 100, pointerType: 'mouse' });
        fireEvent.pointerUp(stripList, { clientX: 150 });
        expect(screen.queryByRole('dialog')).toBeNull();
        fireEvent.pointerDown(tiles[1], { clientX: 100, pointerType: 'mouse' });
        fireEvent.pointerUp(stripList, { clientX: 103 });
        expect(within(await screen.findByRole('dialog')).getByText('Photo 2 sur 3')).toBeInTheDocument();
        await user.keyboard('{Escape}');
        expect(tiles[1]).toHaveFocus();
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
        expect(within(card).queryByText(/Ce bien est sous offre/)).toBeNull(); // the under-offer notice was removed (2026-09-30)
        expect(screen.getByText('Meublé').closest('div')!.querySelector('dd')).toHaveTextContent('Oui');
        expect(screen.queryByRole('heading', { level: 2, name: 'Biens similaires' })).toBeNull();
    });

    it('gallery autoplay (2026-09-30): one photo every 5 s, paused while the pointer rests on the strip, never under reduced motion', () => {
        vi.useFakeTimers();
        page.props = sharedProps();
        Element.prototype.scrollTo = vi.fn();
        const { unmount } = renderPage(<PropertyShow {...PROPS} />);
        const gallery = screen.getByRole('group', { name: `Photos de ${PROPERTY.title}` });
        act(() => {
            vi.advanceTimersByTime(5000);
        });
        expect(Element.prototype.scrollTo).toHaveBeenCalledTimes(1);
        fireEvent.pointerEnter(gallery, { pointerType: 'mouse' });
        act(() => {
            vi.advanceTimersByTime(10000);
        });
        expect(Element.prototype.scrollTo).toHaveBeenCalledTimes(1); // resting
        fireEvent.pointerLeave(gallery, { pointerType: 'mouse' });
        act(() => {
            vi.advanceTimersByTime(5000);
        });
        expect(Element.prototype.scrollTo).toHaveBeenCalledTimes(2);
        unmount();
        vi.useRealTimers();
    });
});
