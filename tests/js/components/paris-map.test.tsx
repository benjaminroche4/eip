import DistrictDetail from '@/components/districts/district-detail';
import ParisMap, { type District } from '@/components/districts/paris-map';
import { PARIS_ARRONDISSEMENTS, PARIS_BOIS, PARIS_OUTLINE, PARIS_SEINE } from '@/lib/paris-arrondissements';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { page, renderPage, sharedProps } from '../inertia';

const ITEMS: District[] = Array.from({ length: 20 }, (_, i) => ({
    n: i + 1,
    name: `Paris ${i + 1}e`,
    areas: `Quartier ${i + 1}`,
    profile: i % 2 ? 'Familles' : 'Prestige',
    price: `${10 + i} 000`,
    extra: `Atout ${i + 1}`,
    positives: [`Point A ${i + 1}`, `Point B ${i + 1}`, `Point C ${i + 1}`],
    audience: `Public ${i + 1}`,
    housing: `Logements ${i + 1}`,
}));

function Harness() {
    const [selected, setSelected] = useState<number | null>(null);
    return (
        <>
            <ParisMap items={ITEMS} selected={selected} onSelect={setSelected} />
            <DistrictDetail items={ITEMS} selected={selected} />
        </>
    );
}

// The interaction test drives many user events on 20 shapes: under the full run's load it can pass 5 s.
vi.setConfig({ testTimeout: 15000 });

describe('ParisMap + DistrictDetail', () => {
    afterEach(() => vi.useRealTimers());

    it('zooms the map in three levels with the mobile buttons (flat, scrollable plane while zoomed)', async () => {
        const user = userEvent.setup();
        page.props = sharedProps();
        const { container } = renderPage(<ParisMap items={ITEMS} selected={null} onSelect={() => {}} />);

        const zoomIn = screen.getByRole('button', { name: 'Agrandir la carte' });
        const zoomOut = screen.getByRole('button', { name: 'Réduire la carte' });
        expect(zoomOut).toBeDisabled();
        expect(container.querySelector('[class*="rotateX(12deg)"]')).not.toBeNull(); // tilted at 100 %
        await user.click(zoomIn);
        expect(container.querySelector('[class*="w-[175%]"]')).not.toBeNull(); // 175 %
        expect(container.querySelector('[class*="rotateX(12deg)"]')).toBeNull(); // flat while zoomed
        expect(container.querySelector('.overflow-auto')).toHaveClass('touch-pan-x', 'touch-pan-y'); // scrollable to pan
        await user.click(zoomIn);
        expect(container.querySelector('[class*="w-[250%]"]')).not.toBeNull();
        expect(zoomIn).toBeDisabled();
        await user.click(zoomOut);
        await user.click(zoomOut);
        expect(zoomOut).toBeDisabled();
    });

    it('lifts the 6e by itself once after the reveal, then settles', () => {
        vi.useFakeTimers();
        page.props = sharedProps();
        const { container } = renderPage(<ParisMap items={ITEMS} selected={null} onSelect={() => {}} />);
        const shapes = container.querySelectorAll('[role="button"]');

        expect(shapes[5]).not.toHaveClass('opacity-0');
        act(() => vi.advanceTimersByTime(1500)); // after the cascade
        expect(shapes[5]).toHaveClass('opacity-0'); // the 6e's lifted twin is up
        expect(container.querySelector('path[transform="translate(0 6)"]')).not.toBeNull();
        act(() => vi.advanceTimersByTime(1100)); // a second later
        expect(shapes[5]).not.toHaveClass('opacity-0'); // settled, once
    });

    it('has real shapes for the 20 arrondissements, the Seine and the two bois', () => {
        expect(PARIS_ARRONDISSEMENTS.map((s) => s.n)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
        PARIS_ARRONDISSEMENTS.forEach((s) => expect(s.d).toMatch(/^M[\d. L]+Z$/));
        expect(PARIS_SEINE.length).toBeGreaterThan(0);
        expect(PARIS_BOIS).toHaveLength(2);
        expect(PARIS_OUTLINE).toMatch(/^M[\d. L]+Z$/); // the city's silhouette
        PARIS_ARRONDISSEMENTS.forEach((s) => expect(s.area).toBeGreaterThan(0));
    });

    it('lights on hover, selects on click / keyboard and fills the detail panel under the map', async () => {
        const user = userEvent.setup();
        page.props = sharedProps();
        const { container } = renderPage(<Harness />);

        const map = screen.getByRole('group', { name: 'Carte des arrondissements de Paris' });
        const shapes = within(map).getAllByRole('button');
        expect(shapes).toHaveLength(20);
        expect(shapes[5]).toHaveAccessibleName('Paris 6e : Quartier 6, 15 000 €/m²');
        expect(shapes[0]).toHaveAttribute('fill-opacity', '0.2'); // price gradient: cheapest lightest…
        expect(shapes[19]).toHaveAttribute('fill-opacity', '1'); // …dearest full sand
        expect(container.querySelector('pattern')).not.toBeNull(); // hatched bois
        expect(container.querySelectorAll('path[stroke-width="7"]').length).toBeGreaterThan(0); // the Seine ribbon…
        expect(container.querySelectorAll('path[stroke-width="13"]').length).toBeGreaterThan(0); // …over its sand bank
        expect(container.querySelectorAll('path[transform="translate(3 3)"]')).toHaveLength(1); // paper-cut offset contour
        expect(screen.getByText('Plus abordable')).toBeInTheDocument();
        expect(container.querySelector('.animate-rings')).not.toBeNull(); // the site's rings breathe behind the map
        expect(container.querySelector('[class*="perspective"]')).toHaveClass('-mx-6', 'lg:mx-0'); // the well runs edge to edge on mobile
        expect(container.querySelector('img[src="/images/home/hero-800.jpg"]')).toHaveClass('blur-2xl', 'saturate-50'); // blurred Paris under the sand veil, decorative (alt empty)
        expect(container.querySelector('[class*="rotateX(12deg)"]')).not.toBeNull(); // 3D tilt of the map plane
        expect(container.querySelectorAll('path[transform="translate(0 8)"]')).toHaveLength(1); // faked thickness under the city
        expect(screen.getByText('Sélectionnez un arrondissement sur la carte pour afficher sa fiche.')).toBeInTheDocument();
        expect(container.querySelectorAll('section[id^="arrondissement-"]')).toHaveLength(20); // all 20 profiles in the HTML…
        expect(container.querySelectorAll('section[id^="arrondissement-"]:not([hidden])')).toHaveLength(0); // …none shown yet

        await user.hover(shapes[5]); // hover: map only
        expect(shapes[5]).toHaveClass('opacity-0'); // the piece in the loop hides…
        const overlay = map.querySelector('path[transform="translate(0 6)"]')!.parentElement!; // …its lifted twin is drawn after the loop, above every neighbour
        expect(overlay.querySelectorAll('path')[0]).toHaveAttribute('transform', 'translate(0 6)'); // thickness
        expect(overlay.querySelectorAll('path')[1]).toHaveClass('fill-secondary-80', '-translate-y-2', 'scale-[1.04]'); // levitates, deep sand
        expect(overlay.querySelector('text')).toHaveClass('font-semibold', 'fill-primary-foreground'); // the white number rising with the piece
        expect(shapes[0]).toHaveClass('opacity-60');
        expect(container.querySelector('#arrondissement-6')).toHaveAttribute('hidden');

        await user.click(shapes[5]); // click: selection → detail panel
        expect(shapes[5]).toHaveAttribute('aria-pressed', 'true');
        const panel = container.querySelector('#arrondissement-6')!;
        expect(panel).not.toHaveAttribute('hidden');
        expect(within(panel as HTMLElement).getByRole('heading', { level: 3, name: 'Paris 6e' })).toBeInTheDocument();
        expect(
            within(panel as HTMLElement)
                .getAllByRole('heading', { level: 4 })
                .map((h) => h.textContent),
        ).toEqual(['Points forts', "À qui ça s'adresse", 'Typologie de logements', 'À retenir']); // four iconed rows on the left
        expect(within(panel as HTMLElement).getByText('Point B 6')).toBeInTheDocument();
        expect(within(panel as HTMLElement).getByRole('link', { name: 'Parler à un conseiller de ce quartier' })).toHaveAttribute('href', '/contact'); // card on the right
        expect(within(panel as HTMLElement).getByText('Public 6')).toBeInTheDocument();
        expect(within(panel as HTMLElement).getByText('Logements 6')).toBeInTheDocument();
        expect(container.querySelector('[style*="--progress"]')?.getAttribute('style')).toContain('--progress: 41%'); // gauge follows
        expect(container.querySelector('circle.animate-value-ring')).toBeNull(); // no ring on selection (tried and removed)
        await user.hover(shapes[6]); // hovering another one: the selected keeps its thick sand outline
        expect(shapes[6]).toHaveClass('opacity-0'); // the 7e is now the lifted one
        expect(shapes[5]).toHaveClass('stroke-secondary-80', 'stroke-[4]'); // the 6e lands again, still marked as selected
        expect(shapes[5]).not.toHaveClass('opacity-60');

        await user.unhover(shapes[5]);
        await user.tab(); // keyboard: the next shape (7e, after the clicked 6e) takes the focus → lit like a hover, not yet selected
        expect(shapes[6]).toHaveFocus();
        expect(shapes[6]).toHaveClass('opacity-0'); // lit like a hover: its lifted twin is in the overlay
        expect(container.querySelector('#arrondissement-7')).toHaveAttribute('hidden');
        await user.keyboard('{Enter}'); // Enter selects it
        expect(container.querySelector('#arrondissement-7')).not.toHaveAttribute('hidden');
        await user.keyboard(' '); // Space toggles the selection off
        expect(screen.getByText('Sélectionnez un arrondissement sur la carte pour afficher sa fiche.')).toBeInTheDocument();

        expect(await axe(container)).toHaveNoViolations();
    });
});
