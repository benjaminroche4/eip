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
    summary: `Résumé ${i + 1}`,
    metro: i === 5 ? ['4', '10', '12'] : ['1'],
    rer: i === 5 ? ['B'] : [],
    stations: i === 5 ? ['Gare Test'] : [],
    attractions: [`Monument ${i + 1}`],
    dining: [`Table ${i + 1}`],
    parks: [`Jardin ${i + 1}`],
    education: [`Lycée ${i + 1}`],
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

    it('zooms with a two-finger pinch at 100 % (touch-pan-y keeps the browser from taking the gesture)', () => {
        page.props = sharedProps();
        const { container } = renderPage(<ParisMap items={ITEMS} selected={null} onSelect={() => {}} />);
        const plane = container.querySelector('.touch-pan-y')!;
        expect(plane).not.toHaveClass('overflow-auto'); // at 100 % the page scrolls over the map…
        const finger = (type: string, id: number, x: number, y: number) =>
            act(() => {
                plane.dispatchEvent(
                    Object.assign(new MouseEvent(type, { bubbles: true, clientX: x, clientY: y }), { pointerId: id, pointerType: 'touch' }),
                );
            });
        finger('pointerdown', 1, 100, 100);
        finger('pointerdown', 2, 120, 100); // 20px apart
        finger('pointermove', 2, 150, 100); // 50px: ×2.5 → one level in
        expect(container.querySelector('[class*="w-[175%]"]')).not.toBeNull();
        expect(container.querySelector('.overflow-auto')).toHaveClass('touch-pan-x', 'touch-pan-y'); // …then pans both ways
        finger('pointermove', 2, 110, 100); // 10px: ×0.2 → one level out
        expect(container.querySelector('[class*="w-[175%]"]')).toBeNull();
        finger('pointerup', 1, 100, 100);
        finger('pointerup', 2, 110, 100);
    });

    it('selects on tap without a hover state, one arrondissement after another (iOS swallowed the second tap, 2026-09-25)', () => {
        page.props = sharedProps();
        const { container } = renderPage(<Harness />);
        const map = screen.getByRole('group', { name: 'Carte des arrondissements de Paris' });
        const shapes = within(map).getAllByRole('button');
        const tap = (shape: Element) =>
            act(() => {
                for (const type of ['pointerdown', 'pointerenter', 'pointerup']) {
                    shape.dispatchEvent(
                        Object.assign(new MouseEvent(type, { bubbles: type !== 'pointerenter' }), { pointerId: 1, pointerType: 'touch' }),
                    );
                }
                (shape as SVGElement).focus();
                shape.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            });
        tap(shapes[5]);
        expect(shapes[5]).toHaveAttribute('aria-pressed', 'true');
        expect(container.querySelector('#arrondissement-6')).not.toHaveAttribute('hidden');
        tap(shapes[6]); // a second tap elsewhere selects the 7e right away
        expect(shapes[6]).toHaveAttribute('aria-pressed', 'true');
        expect(shapes[5]).toHaveAttribute('aria-pressed', 'false');
        expect(container.querySelector('#arrondissement-7')).not.toHaveAttribute('hidden');
        expect(container.querySelector('#arrondissement-6')).toHaveAttribute('hidden');
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
        expect(screen.getByText('Prix le plus bas')).toBeInTheDocument();
        expect(screen.getByText(/Survolez la carte pour comparer/)).toBeInTheDocument(); // the hint lives under the map since 2026-09-25
        expect(container.querySelector('.animate-rings')).not.toBeNull(); // the site's rings breathe behind the map
        expect(container.querySelector('[class*="perspective"]')).toHaveClass('-mx-6', 'lg:mx-0'); // the well runs edge to edge on mobile
        expect(container.querySelector('img[src="/images/home/hero-800.jpg"]')).toHaveClass('blur-2xl', 'saturate-50'); // blurred Paris under the sand veil, decorative (alt empty)
        expect(container.querySelector('[class*="rotateX(12deg)"]')).not.toBeNull(); // 3D tilt of the map plane
        expect(container.querySelectorAll('path[transform="translate(0 8)"]')).toHaveLength(1); // faked thickness under the city
        expect(screen.getByText('Sélectionnez un arrondissement sur la carte pour afficher sa fiche.')).toBeInTheDocument();
        expect(container.querySelectorAll('section[id^="arrondissement-"]')).toHaveLength(20); // all 20 profiles in the HTML…
        expect(container.querySelectorAll('section[id^="arrondissement-"]:not([hidden])')).toHaveLength(0); // …none shown yet

        const hint = screen.getByText(/Survolez la carte pour comparer/);
        expect(hint).not.toHaveClass('opacity-0');
        await user.hover(shapes[5]); // hover: map only
        expect(hint).toHaveClass('opacity-0'); // the hint fades while the map is explored (user decision 2026-09-25)
        expect(shapes[5]).toHaveClass('opacity-0'); // the piece in the loop hides…
        const overlay = map.querySelector('path[transform="translate(0 6)"]')!.parentElement!; // …its lifted twin is drawn after the loop, above every neighbour
        expect(map.lastElementChild).toBe(overlay); // …and above the Seine, the bois and the contour (user decision 2026-09-25)
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
        ).toEqual([
            'Points forts',
            "À qui ça s'adresse",
            'Typologie de logements',
            'Se déplacer',
            'À voir',
            'Se régaler',
            'Respirer',
            'Étudier',
            'À retenir',
        ]); // article-like column: the summary is the lead paragraph, the detailed rubrics follow (2026-09-25)
        expect(within(panel as HTMLElement).getByText('Point B 6')).toBeInTheDocument();
        expect(within(panel as HTMLElement).getByText(/Notaires du Grand Paris/)).toBeInTheDocument(); // the source closes the text column (2026-09-25)
        expect(
            within(panel as HTMLElement)
                .getByText('Résumé 6')
                .closest('.bg-card'),
        ).not.toHaveClass('border'); // white column on the sand band, no border (2026-09-25)
        // Card on the right: contact carries the arrondissement, the price gets its rank and distance to the dearest (2026-09-25)
        expect(within(panel as HTMLElement).getAllByRole('link', { name: 'Parler à un conseiller de ce quartier' })[0]).toHaveAttribute(
            'href',
            '/contact?district=6',
        );
        expect(within(panel as HTMLElement).getByText('6e arrondissement le plus abordable · 48 % sous le 20e')).toBeInTheDocument(); // 15 000 = 15th of 20 → 6th cheapest, vs 29 000 (Paris 20e)
        expect(within(panel as HTMLElement).getByText('Budget pour 60 m²').nextElementSibling).toHaveTextContent('≈ 900 000 €'); // budget icon row, French money format
        expect(within(panel as HTMLElement).getAllByText('Quartier 6').length).toBeGreaterThan(1); // the districts replace the name in the card's facts (also under the title)
        expect(within(panel as HTMLElement).getAllByText('Public 6').length).toBeGreaterThan(1); // the audience sentence explains the profile chip
        expect(within(panel as HTMLElement).getAllByText('Public 6').length).toBeGreaterThan(1); // the audience sentence is in the column and in the card
        expect(within(panel as HTMLElement).getByText('Logements 6')).toBeInTheDocument();
        expect(within(panel as HTMLElement).getByText('Résumé 6')).toBeInTheDocument(); // detailed summary as the lead
        // Getting around (2026-09-25): metro discs / RER squares in the lines' colours, named for assistive tech, then the stations
        expect(within(panel as HTMLElement).getByRole('img', { name: 'Ligne 4' })).toHaveClass('bg-metro-4', 'text-white', 'rounded-full');
        expect(within(panel as HTMLElement).getByRole('img', { name: 'Ligne 10' })).toHaveClass('bg-metro-10', 'text-text-heading');
        expect(within(panel as HTMLElement).getByRole('img', { name: 'RER B' })).toHaveClass('bg-rer-b', 'rounded-none');
        expect(within(panel as HTMLElement).getByText('Gare Test')).toBeInTheDocument();
        // Places as chip lists under their iconed headings
        expect(within(panel as HTMLElement).getByRole('heading', { level: 4, name: 'Se déplacer' })).toBeInTheDocument();
        expect(within(panel as HTMLElement).getByRole('heading', { level: 4, name: 'Étudier' })).toBeInTheDocument();
        expect(within(panel as HTMLElement).getByText('Monument 6')).toBeInTheDocument();
        expect(within(panel as HTMLElement).getByText('Table 6')).toBeInTheDocument();
        expect(within(panel as HTMLElement).getByText('Jardin 6')).toBeInTheDocument();
        expect(within(panel as HTMLElement).getByText('Lycée 6')).toBeInTheDocument();
        expect(within(panel as HTMLElement).queryByText('RER')).not.toBeNull();
        expect(within(container.querySelector('#arrondissement-1') as HTMLElement).queryByText('Gares')).toBeNull(); // no station row without stations
        expect(container.querySelector('[style*="--progress"]')?.getAttribute('style')).toContain('--progress: 41%'); // gauge follows
        expect(container.querySelector('circle.animate-value-ring')).toBeNull(); // no ring on selection (tried and removed)
        await user.hover(shapes[6]); // hovering another one: the selected keeps its thick sand outline
        expect(shapes[6]).toHaveClass('opacity-0'); // the 7e is now the lifted one
        expect(shapes[5]).toHaveClass('stroke-secondary-80', 'stroke-[4]'); // the 6e lands again, still marked as selected
        expect(shapes[5]).not.toHaveClass('opacity-60');

        await user.unhover(shapes[5]);
        await user.keyboard('{ArrowRight}'); // keyboard: the arrow moves the focus to the 7e (roving tabindex, 2026-09-25) → lit like a hover, not yet selected
        expect(shapes[6]).toHaveFocus();
        expect(shapes[6]).toHaveClass('opacity-0'); // lit like a hover: its lifted twin is in the overlay
        expect(container.querySelector('#arrondissement-7')).toHaveAttribute('hidden');
        await user.keyboard('{Enter}'); // Enter selects it
        expect(container.querySelector('#arrondissement-7')).not.toHaveAttribute('hidden');
        await user.keyboard(' '); // Space toggles the selection off
        expect(screen.getByText('Sélectionnez un arrondissement sur la carte pour afficher sa fiche.')).toBeInTheDocument();

        expect(await axe(container)).toHaveNoViolations();
    });

    it('is one Tab stop with a roving tabindex: arrows, Home / End, Escape, and a dark focus ring on the lifted twin (2026-09-25)', async () => {
        const user = userEvent.setup();
        page.props = sharedProps();
        const { container } = renderPage(<Harness />);
        const map = screen.getByRole('group', { name: 'Carte des arrondissements de Paris' });
        const shapes = within(map).getAllByRole('button');

        expect(map).toHaveAccessibleDescription(/Flèches pour passer d'un arrondissement à l'autre/);
        expect(shapes.filter((s) => s.getAttribute('tabindex') === '0')).toEqual([shapes[0]]); // only the 1er in the tab order…
        await user.tab();
        expect(shapes[0]).toHaveFocus(); // …reached in one Tab
        const twin = () => map.querySelectorAll('path[transform="translate(0 6)"] ~ path')[0];
        expect(twin()).toHaveClass('stroke-primary', 'stroke-[4]'); // keyboard focus: dark ring on the lifted twin
        await user.keyboard('{ArrowRight}');
        expect(shapes[1]).toHaveFocus();
        expect(shapes.filter((s) => s.getAttribute('tabindex') === '0')).toEqual([shapes[1]]); // the tab stop follows
        await user.keyboard('{ArrowLeft}{ArrowLeft}');
        expect(shapes[19]).toHaveFocus(); // wraps 1 → 20
        await user.keyboard('{Home}');
        expect(shapes[0]).toHaveFocus();
        await user.keyboard('{End}');
        expect(shapes[19]).toHaveFocus();
        await user.keyboard('{Enter}');
        expect(container.querySelector('#arrondissement-20')).not.toHaveAttribute('hidden');
        await user.keyboard('{Escape}'); // Escape clears the selection
        expect(container.querySelector('#arrondissement-20')).toHaveAttribute('hidden');
        await user.tab(); // Tab leaves the map (the next shape is not a tab stop)
        expect(shapes.some((s) => s === document.activeElement)).toBe(false);
    });

    it('lets the legend fade the arrondissements outside a price band (hover, focus, pinned by click)', async () => {
        const user = userEvent.setup();
        page.props = sharedProps();
        renderPage(<ParisMap items={ITEMS} selected={null} onSelect={() => {}} />);
        const map = screen.getByRole('group', { name: 'Carte des arrondissements de Paris' });
        const shapes = within(map).getAllByRole('button');
        const legend = screen.getByRole('group', { name: /Teinte proportionnelle au prix moyen/ });
        const steps = within(legend).getAllByRole('button');
        expect(steps).toHaveLength(8);
        expect(steps[0]).toHaveAccessibleName('De 10 000 à 12 375 € le m² : 3 arrondissements'); // prices grouped like the items, count in the band

        await user.hover(steps[7]); // the dearest band: the cheapest fade
        expect(shapes[0]).toHaveClass('opacity-25');
        expect(shapes[19]).not.toHaveClass('opacity-25');
        await user.unhover(steps[7]);
        expect(shapes[0]).not.toHaveClass('opacity-25');

        await user.click(steps[0]); // click pins the band…
        expect(steps[0]).toHaveAttribute('aria-pressed', 'true');
        await user.unhover(steps[0]);
        expect(shapes[19]).toHaveClass('opacity-25');
        await user.click(steps[0]); // …a second click releases it
        expect(steps[0]).toHaveAttribute('aria-pressed', 'false');
        await user.unhover(steps[0]);
        expect(shapes[19]).not.toHaveClass('opacity-25');

        act(() => steps[3].focus()); // keyboard focus on a step works like the hover
        expect(shapes[0]).toHaveClass('opacity-25');
    });

    it('shows the selected arrondissement under the map on mobile with a link that scrolls to its sheet', async () => {
        const user = userEvent.setup();
        page.props = sharedProps();
        const { container } = renderPage(<Harness />);
        const map = screen.getByRole('group', { name: 'Carte des arrondissements de Paris' });
        const shapes = within(map).getAllByRole('button');
        expect(screen.getByText('Choisissez un arrondissement sur la carte.')).toBeInTheDocument();

        await user.click(shapes[2]);
        const link = screen.getByRole('link', { name: 'Voir la fiche' });
        expect(link).toHaveAttribute('href', '#arrondissement-3');
        expect(link.parentElement).toHaveTextContent('Paris 3e · 12 000 €/m²');
        const scrollIntoView = vi.fn();
        container.querySelector<HTMLElement>('#arrondissement-3')!.scrollIntoView = scrollIntoView;
        await user.click(link);
        expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'smooth' });
        expect(await axe(container)).toHaveNoViolations();
    });
});
