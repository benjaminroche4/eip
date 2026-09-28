import PropertyCard from '@/components/properties/property-card';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { PROPERTY } from '../fixtures/property';
import { renderPage } from '../inertia';

describe('PropertyCard', () => {
    it('renders the marketplace card: scrolling photos, availability with the advisor, price with fees, transaction + type, location, facts row', async () => {
        const { container } = renderPage(<PropertyCard property={PROPERTY} />);

        const photos = screen.getByRole('group', { name: 'Photos de Appartement haussmannien, Saint-Germain-des-Prés' });
        expect(
            within(photos)
                .getAllByRole('img')
                .map((img) => img.getAttribute('alt')),
        ).toEqual([
            'Salon haussmannien lumineux (photo 1 sur 3)',
            'Salon haussmannien lumineux (photo 2 sur 3)',
            'Salon haussmannien lumineux (photo 3 sur 3)',
        ]);
        expect(screen.getByText('Disponible').querySelector('span')).toHaveClass('bg-success'); // green dot + wording
        expect(screen.getByText('Disponible').parentElement).toHaveClass('absolute', 'top-3', 'left-3'); // inset on the photo
        expect(screen.queryByText('AB')).toBeNull(); // no advisor portrait on the card (user decision 2026-09-26)
        expect(screen.getByText('2 450 000 €').parentElement).toHaveTextContent('Prix 2 450 000 € 19 141 €/m² · Honoraires inclus');
        expect(screen.getByText('2 450 000 €').parentElement).toHaveClass('bg-background-05'); // sand band glued under the photo
        expect(screen.getByText('2 450 000 €').parentElement!.previousElementSibling).toContainElement(screen.getByText('Disponible')); // right after the photo block
        expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Appartement haussmannien, Saint-Germain-des-Prés'); // title alone, h3 under the page's count h2
        expect(screen.getByText(/^Achat ·/)).toHaveTextContent('Achat · Paris 6e arrondissementParis 6e'); // eyebrow: sr-only wording + short visible arrondissement
        const facts = within(screen.getByRole('list'))
            .getAllByRole('listitem')
            .map((li) => li.textContent);
        expect(facts).toEqual(['2 chambres2 ch.', '4 pièces4 p.', '128 m²']); // sr-only wording + short visible label, then the surface
        expect(screen.getByRole('link', { name: PROPERTY.title })).toHaveAttribute('href', `/nos-biens/${PROPERTY.slug}`); // the title links to the detail page (2026-09-28)
        expect(await axe(container)).toHaveNoViolations();
    });

    it('shows a monthly rent with its charges note, the « under offer » state, and a single photo without carousel', () => {
        renderPage(
            <PropertyCard property={{ ...PROPERTY, transaction: 'rent', price: 6500, available: false, photos: [PROPERTY.photos[0]] }} active />,
        );
        expect(screen.getByText('6 500 €').parentElement).toHaveTextContent('Prix 6 500 € / mois · Charges incluses');
        expect(screen.getByText(/^Location ·/)).toHaveClass('uppercase');
        expect(screen.getByText('Sous offre').querySelector('span')).toHaveClass('bg-muted-foreground');
        expect(screen.getByRole('article')).toHaveAttribute('data-active', 'true'); // lifted by its marker on the map
        expect(screen.queryByRole('group')).toBeNull();
        expect(screen.getByRole('img')).toHaveAttribute('alt', 'Salon haussmannien lumineux');
        expect(screen.getByRole('img')).toHaveClass('group-hover:scale-105'); // photo zooms on the card's hover
    });

    it('makes a featured listing stand out the chosen way: a sand « Coup de cœur » chip next to the availability and the light sweep across the price band (2026-09-28)', async () => {
        const { container } = renderPage(<PropertyCard property={{ ...PROPERTY, featured: true }} />);
        const chip = screen.getByText('Coup de cœur');
        expect(chip).toHaveClass('bg-secondary-60');
        expect(chip.parentElement).toContainElement(screen.getByText('Disponible')); // same row on the photo
        const band = screen.getByText('2 450 000 €').parentElement!;
        expect(band).toHaveClass('bg-background-05', 'overflow-hidden');
        const sweep = band.querySelector('.animate-sweep-shimmer')!;
        expect(sweep).toHaveAttribute('aria-hidden');
        expect(sweep).toHaveClass('motion-reduce:hidden', 'w-1/2', 'skew-x-[-12deg]');
        expect(band).toHaveTextContent('Prix 2 450 000 € 19 141 €/m² · Honoraires inclus'); // the rest of the card is unchanged
        expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(PROPERTY.title);
        expect(await axe(container)).toHaveNoViolations();
    });

    it('hides a confidential (off-market) listing the chosen way: one lightly blurred photo, a frosted-glass lock disc centred on the photo, « Prix sur demande » on the band, the rest visible', () => {
        renderPage(<PropertyCard property={{ ...PROPERTY, off_market: true }} />);
        expect(screen.queryByRole('group', { name: /Photos de/ })).toBeNull(); // no carousel: one still photo
        expect(screen.getByRole('img', { name: PROPERTY.photo_alt })).toHaveClass('blur-sm');
        const mark = screen.getByRole('img', { name: 'Off-market' }); // frosted-glass lock disc in a thin ring
        expect(mark).toHaveClass('rounded-full', 'ring-white/30');
        expect(mark.firstElementChild).toHaveClass('backdrop-blur-md', 'bg-white/25');
        expect(mark.parentElement).toHaveClass('inset-0', 'items-center', 'justify-center'); // centred on the photo
        expect(screen.queryByText('Disponible')).toBeNull();
        expect(screen.getByText('Prix sur demande').parentElement).toHaveTextContent('Prix: Prix sur demande Confidentiel');
        expect(screen.queryByText('2 450 000 €')).toBeNull();
        expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Appartement haussmannien, Saint-Germain-des-Prés'); // title, arrondissement and facts stay
        expect(screen.getByText(/^Achat ·/)).toBeInTheDocument();
        expect(screen.getByText('128 m²')).toBeInTheDocument();
    });

    it('flags a listing published within 14 days as « Nouveau » next to the availability, and offers the comparison tick', async () => {
        const user = userEvent.setup();
        const onCompare = vi.fn();
        const { rerender } = renderPage(<PropertyCard property={{ ...PROPERTY, is_new: true }} onCompare={onCompare} />);
        expect(screen.getByText('Nouveau')).toHaveClass('bg-secondary-60');
        expect(screen.getByText('Disponible').parentElement).toContainElement(screen.getByText('Nouveau'));
        const tick = screen.getByRole('button', { name: `Comparer : ${PROPERTY.title}` });
        expect(tick).toHaveAttribute('aria-pressed', 'false');
        await user.click(tick);
        expect(onCompare).toHaveBeenCalledWith(PROPERTY.slug);

        rerender(<PropertyCard property={PROPERTY} onCompare={onCompare} compared />);
        expect(screen.getByRole('button', { name: `Ne plus comparer : ${PROPERTY.title}` })).toHaveAttribute('aria-pressed', 'true');
        rerender(<PropertyCard property={PROPERTY} onCompare={onCompare} compareFull />);
        const full = screen.getByRole('button', { name: `Comparer : ${PROPERTY.title}` });
        expect(full).toHaveAttribute('aria-disabled', 'true'); // three already ticked
        await user.click(full);
        expect(onCompare).toHaveBeenCalledTimes(1);
        expect(screen.queryByText('Nouveau')).toBeNull();
    });
});
