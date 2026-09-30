import PropertiesPage from '@/pages/properties';
import { router } from '@inertiajs/react';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { PROPERTY } from '../fixtures/property';
import { page, renderPage, sharedProps } from '../inertia';

const PROPERTIES = [
    PROPERTY,
    {
        ...PROPERTY,
        slug: 'hotel-8e',
        title: "Hôtel particulier, Triangle d'or",
        arrondissement: 8,
        area: "Triangle d'or",
        type: 'mansion',
        price: 9800000,
        rooms: 9,
        bedrooms: 5,
    },
    {
        ...PROPERTY,
        slug: 'loft-3e',
        title: 'Loft, Haut Marais',
        arrondissement: 3,
        area: 'Haut Marais',
        type: 'loft',
        price: 1650000,
        rooms: 3,
        bedrooms: 2,
    },
    {
        ...PROPERTY,
        slug: 'location-4e',
        title: 'Meublé, Marais',
        arrondissement: 4,
        area: 'Marais',
        transaction: 'rent' as const,
        price: 6500,
        rooms: 3,
        bedrooms: 2,
    },
];
const FILTERS = {
    city: [],
    budget: null,
    transaction: 'sale' as const,
    type: [] as string[],
    rooms: [] as number[],
    sort: 'recent' as const,
    bounds: null as [number, number, number, number] | null,
    budget_min: null as number | null,
    surface_min: null as number | null,
    bedrooms: [] as number[],
    features: [] as string[],
    condition: [] as string[],
    floor: [] as string[],
    furnished: null as boolean | null,
    available: false,
    area: [] as string[],
};
const MAP = { key: null, mapId: 'DEMO_MAP_ID' };
const DISTRICTS = [
    { n: 3, slug: 'paris-3e', url: '/nos-biens/paris-3e', name: 'Paris 3e', count: 1 },
    { n: 6, slug: 'paris-6e', url: '/nos-biens/paris-6e', name: 'Paris 6e', count: 1 },
    { n: 8, slug: 'paris-8e', url: '/nos-biens/paris-8e', name: 'Paris 8e', count: 1 },
];
const BASE = { district: null, landing: null, districts: DISTRICTS };
const SALES = PROPERTIES.filter((p) => p.transaction === 'sale');
const PAGINATION = { page: 1, lastPage: 1, total: SALES.length, perPage: 12 };
const INDEXING = { noindex: false, canonical: 'http://localhost/nos-biens', prev: null, next: null };
const get = vi.mocked(router.get);
// Each filter change pushes a history entry so Back undoes it (2026-09-28); « Voir plus » still replaces
const RELOAD = {
    only: ['properties', 'pagination', 'filters', 'indexing', 'district'],
    preserveState: true,
    preserveScroll: true,
    replace: false,
    queryStringArrayFormat: 'brackets',
};
const BOUNDS = { sale: { min: 1_100_000, max: 4_300_000 }, rent: { min: 3_200, max: 6_900 } };

beforeEach(() => get.mockClear());

afterEach(() => document.querySelectorAll('script[src*="maps.googleapis.com"]').forEach((s) => s.remove()));

describe('Properties page', () => {
    it('centres the header and the two-criteria bar with its « Filtres » button, then splits: count and cards on the left, the map region on the right', async () => {
        page.props = sharedProps();
        const { container } = renderPage(
            <PropertiesPage
                properties={SALES}
                pagination={PAGINATION}
                filters={FILTERS}
                indexing={INDEXING}
                map={MAP}
                districts={[]}
                areas={[]}
                priceBounds={BOUNDS}
                {...BASE}
            />,
        );

        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Nos biens à vendre à Paris');
        // The bar shows only the two main criteria at every width (user decision 2026-09-28), the rest sits behind « Filtres »
        const search = screen.getByRole('search', { name: 'Filtres rapides' });
        expect(screen.queryByRole('search', { name: 'Filtrer les biens' })).toBeNull(); // no extended bar in the page any more
        expect(search).toHaveClass('text-left'); // the header is centred, the bar's labels stay left-aligned as on the home
        expect(within(search).getByRole('combobox', { name: 'Arrondissement' })).toBeInTheDocument();
        expect(within(search).getByRole('textbox', { name: 'Budget maximum' })).toBeInTheDocument();
        expect(within(search).queryByRole('radiogroup', { name: 'Projet' })).toBeNull();
        expect(within(search).getByRole('button', { name: 'Filtres' })).toHaveAttribute('aria-haspopup', 'dialog');
        expect(search.parentElement).toHaveClass('lg:max-w-4xl', 'sticky', 'top-3'); // centred on desktop, pinned at every width (user decision 2026-09-28)
        expect(screen.getByRole('heading', { level: 2, name: /bien/ })).toHaveTextContent('3 biens à vendre à Paris'); // the server's total
        expect(screen.getAllByRole('article')).toHaveLength(3);
        expect(container.querySelector('ul.grid')).toHaveClass('sm:grid-cols-2', '2xl:grid-cols-3');
        const map = screen.getByRole('region', { name: 'Carte des biens' });
        expect(map).toHaveClass('lg:sticky', 'lg:w-[calc(50%-2rem)]', 'border', 'p-1.5'); // half the width minus its right margin, boxed like the cards (user decision 2026-09-26)
        expect(map.parentElement!.previousElementSibling).toHaveClass('lg:w-1/2');
        expect(screen.getByRole('heading', { level: 2, name: /biens à vendre/ })).toHaveAttribute('aria-live', 'polite'); // the count is the section's h2, announced live
        expect(map).toHaveTextContent('GOOGLE_MAPS_API_KEY'); // no key in the test env: the sand panel says so
        expect(document.querySelector('script[src*="maps.googleapis.com"]')).toBeNull();

        expect(await axe(container)).toHaveNoViolations();
    });

    it('loads the Google Maps API once a key is given, in the page language, with the marker library', () => {
        page.props = sharedProps();
        renderPage(
            <PropertiesPage
                properties={SALES}
                pagination={PAGINATION}
                filters={FILTERS}
                indexing={INDEXING}
                map={{ key: 'test-key', mapId: 'DEMO_MAP_ID' }}
                districts={[]}
                areas={[]}
                priceBounds={BOUNDS}
                {...BASE}
            />,
        );
        const script = document.querySelector<HTMLScriptElement>('script[src*="maps.googleapis.com"]');
        expect(script?.src).toContain('key=test-key');
        expect(script?.src).toContain('libraries=marker');
        expect(script?.src).toContain('language=fr');
        expect(script?.async).toBe(true);
    });

    it('asks the server for page 1 on each filter change (debounced, partial reload), with the current criteria as query params', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        page.props = sharedProps();
        renderPage(
            <PropertiesPage
                properties={SALES}
                pagination={PAGINATION}
                filters={{ ...FILTERS, city: [8], budget: 10000000 }}
                indexing={INDEXING}
                map={MAP}
                districts={[]}
                areas={[]}
                priceBounds={BOUNDS}
                {...BASE}
            />,
        );
        const quick = screen.getByRole('search', { name: 'Filtres rapides' });
        expect(get).not.toHaveBeenCalled(); // nothing on mount: the server already applied the URL's filters

        await user.click(screen.getByRole('button', { name: 'Réinitialiser' }));
        vi.advanceTimersByTime(300);
        expect(get).toHaveBeenLastCalledWith('/nos-biens', {}, expect.objectContaining(RELOAD));
        // While the server answers, the current cards are first dimmed (a fast answer never flashes skeletons), then
        // replaced by skeleton cards once the wait passes 400 ms (2026-09-28)
        const options = get.mock.calls[0][2] as { onStart: () => void; onFinish: () => void };
        act(() => options.onStart());
        expect(screen.getAllByRole('article')).toHaveLength(3);
        const results = screen.getAllByRole('article')[0].closest('[aria-busy]')!;
        expect(results).toHaveClass('opacity-60', 'pointer-events-none');
        expect(document.querySelectorAll('.animate-pulse')).toHaveLength(0);
        expect(screen.getByRole('heading', { level: 2, name: /bien/ })).toHaveAttribute('aria-busy', 'true');
        act(() => vi.advanceTimersByTime(400));
        expect(screen.queryAllByRole('article')).toHaveLength(0);
        expect(document.querySelectorAll('.animate-pulse')).toHaveLength(6);
        act(() => options.onFinish());
        expect(screen.getAllByRole('article')).toHaveLength(3);
        expect(screen.getAllByRole('article')[0].closest('[aria-busy]')).toBeNull();

        // The sort select asks page 1 in that order, like a filter; « Réinitialiser » leaves it alone (2026-09-28)
        const sortTrigger = screen.getByRole('combobox', { name: 'Trier par' });
        expect(sortTrigger).toHaveTextContent('Nouveautés');
        await user.click(sortTrigger);
        await user.click(await screen.findByRole('option', { name: 'Prix croissant' }));
        vi.advanceTimersByTime(300);
        expect(get).toHaveBeenLastCalledWith('/nos-biens', { sort: 'price_asc' }, expect.objectContaining(RELOAD));
        expect(screen.getByRole('combobox', { name: 'Trier par' })).toHaveTextContent('Prix croissant');
        expect(screen.queryByRole('button', { name: 'Réinitialiser' })).toBeNull(); // an order is not a criterion
        await user.click(screen.getByRole('combobox', { name: 'Trier par' }));
        await user.click(await screen.findByRole('option', { name: 'Nouveautés' }));
        vi.advanceTimersByTime(300);
        expect(get).toHaveBeenLastCalledWith('/nos-biens', {}, expect.objectContaining(RELOAD));

        // The other criteria live in the « Filtres » modal (a bottom sheet in jsdom, which is never `lg`)
        await user.click(within(quick).getByRole('button', { name: 'Filtres' }));
        const search = within(await screen.findByRole('dialog', { name: 'Filtres' })).getByRole('search', { name: 'Tous les filtres' });

        // Projet: every option in view as a radio pill (user decision 2026-09-28: no dropdown for two values)
        const project = within(search).getByRole('radiogroup', { name: 'Projet' });
        await user.click(within(project).getByRole('radio', { name: 'Location' }));
        vi.advanceTimersByTime(300);
        expect(get).toHaveBeenLastCalledWith('/nos-biens', { transaction: 'rent' }, expect.objectContaining(RELOAD));
        expect(within(project).getByRole('radio', { name: 'Location' })).toHaveAttribute('aria-checked', 'true');
        expect(within(project).getByRole('radio', { name: 'Location' })).toHaveClass('bg-primary');
        await user.click(within(project).getByRole('radio', { name: 'Achat' }));
        // Type: toggle pills, « Tous » pressed while nothing is kept
        const types = within(search).getByRole('group', { name: 'Type de bien' });
        expect(within(types).getByRole('button', { name: 'Tous' })).toHaveAttribute('aria-pressed', 'true');
        await user.click(within(types).getByRole('button', { name: 'Loft' }));
        await user.click(within(types).getByRole('button', { name: 'Hôtel particulier' }));
        expect(within(types).getByRole('button', { name: 'Loft' })).toHaveAttribute('aria-pressed', 'true');
        expect(within(types).getByRole('button', { name: 'Tous' })).toHaveAttribute('aria-pressed', 'false');
        vi.advanceTimersByTime(300);
        expect(get).toHaveBeenLastCalledWith('/nos-biens', { type: ['loft', 'mansion'] }, expect.objectContaining(RELOAD));
        await user.click(within(types).getByRole('button', { name: 'Loft' })); // a second tap drops it
        vi.advanceTimersByTime(300);
        expect(get).toHaveBeenLastCalledWith('/nos-biens', { type: ['mansion'] }, expect.objectContaining(RELOAD));
        await user.click(within(types).getByRole('button', { name: 'Tous' }));
        vi.advanceTimersByTime(300);
        expect(get).toHaveBeenLastCalledWith('/nos-biens', {}, expect.objectContaining(RELOAD));
        // Rooms: toggle pills too (1 … 4, « 5+ », full wording sr-only)
        const roomsGroup = within(search).getByRole('group', { name: 'Pièces' });
        await user.click(within(roomsGroup).getByRole('button', { name: '5 pièces et plus' }));
        await user.click(within(roomsGroup).getByRole('button', { name: '3 pièces' }));
        vi.advanceTimersByTime(300);
        expect(get).toHaveBeenLastCalledWith('/nos-biens', { rooms: [3, 5] }, expect.objectContaining(RELOAD)); // sorted
        await user.click(within(roomsGroup).getByRole('button', { name: 'Tous' }));
        vi.advanceTimersByTime(300);
        expect(get).toHaveBeenLastCalledWith('/nos-biens', {}, expect.objectContaining(RELOAD));

        await user.click(screen.getByRole('button', { name: 'Fermer les filtres' }));
        await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Filtres' })).toBeNull());
        get.mockClear();
        await user.type(within(quick).getByRole('textbox', { name: 'Budget maximum' }), '2000000');
        expect(get).not.toHaveBeenCalled(); // one request once typing pauses, not one per digit
        vi.advanceTimersByTime(300);
        expect(get).toHaveBeenCalledTimes(1);
        expect(get).toHaveBeenLastCalledWith('/nos-biens', { budget: 2000000 }, expect.objectContaining(RELOAD));
        await user.click(within(quick).getByRole('button', { name: 'Effacer Budget maximum' }));

        await user.click(within(quick).getByRole('combobox', { name: 'Arrondissement' }));
        await user.type(within(quick).getByRole('combobox', { name: 'Arrondissement' }), '3{Enter}');
        await user.keyboard('{Escape}');
        vi.advanceTimersByTime(300);
        expect(get).toHaveBeenLastCalledWith('/nos-biens', { city: [3] }, expect.objectContaining(RELOAD));
        // After the response the address bar shows the readable, copy-pasteable form (user decision 2026-09-28)
        const replaceState = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});
        act(() => (get.mock.calls.at(-1)![2] as { onSuccess: () => void }).onSuccess());
        expect(replaceState.mock.calls.at(-1)?.slice(1)).toEqual(['', '/nos-biens?city[]=3']);
        replaceState.mockRestore();
        vi.useRealTimers();
    });

    it('re-syncs the shown criteria from the server filters when history brings other ones back (Back / forward)', () => {
        page.props = sharedProps();
        const { rerender } = renderPage(
            <PropertiesPage
                properties={SALES}
                pagination={PAGINATION}
                filters={{ ...FILTERS, city: [8] }}
                indexing={INDEXING}
                map={MAP}
                districts={[]}
                areas={[]}
                priceBounds={BOUNDS}
                {...BASE}
            />,
        );
        expect(screen.getByRole('button', { name: 'Filtres' }).querySelector('.rounded-full')).toBeNull(); // the 8e shows in the bar: no badge (only the modal's criteria count)
        // Inertia restores the previous entry's props (no request of ours): the bar follows, without firing a reload
        rerender(
            <PropertiesPage
                properties={SALES}
                pagination={PAGINATION}
                filters={{ ...FILTERS, city: [3, 6], budget: 2000000, sort: 'price_desc' }}
                indexing={INDEXING}
                map={MAP}
                districts={[]}
                areas={[]}
                priceBounds={BOUNDS}
                {...BASE}
            />,
        );
        expect(screen.getByRole('button', { name: 'Filtres' }).querySelector('.rounded-full')).toBeNull(); // arrondissements, budget and sort are visible outside the modal
        expect(screen.getByRole('textbox', { name: 'Budget maximum' })).toHaveValue('2 000 000');
        expect(screen.getByRole('combobox', { name: 'Trier par' })).toHaveTextContent('Prix décroissant');
        expect(get).not.toHaveBeenCalled();
    });

    it('marks the first four cards of page 1 as the LCP candidates (eager first photo), the others stay lazy', () => {
        page.props = sharedProps();
        const five = [...SALES, { ...PROPERTY, slug: 'a-5' }, { ...PROPERTY, slug: 'a-6' }];
        renderPage(
            <PropertiesPage
                properties={five}
                pagination={{ ...PAGINATION, total: 5 }}
                filters={FILTERS}
                indexing={INDEXING}
                map={MAP}
                districts={[]}
                areas={[]}
                priceBounds={BOUNDS}
                {...BASE}
            />,
        );
        const firstPhoto = (slug: string) =>
            screen
                .getAllByRole('article')
                .find((a) => a.id === slug)!
                .querySelector('img')!;
        expect(firstPhoto(SALES[0].slug)).toHaveAttribute('loading', 'eager');
        expect(firstPhoto(SALES[0].slug)).toHaveAttribute('fetchpriority', 'high');
        expect(firstPhoto('a-5')).toHaveAttribute('loading', 'eager');
        expect(firstPhoto('a-6')).toHaveAttribute('loading', 'lazy');
        // Only the first photo of a card is eager
        expect(screen.getAllByRole('article')[0].querySelectorAll('img')[1]).toHaveAttribute('loading', 'lazy');
    });

    it('offers « Voir plus » as a real link to the next page that appends it in place, and shows the SEO pagination hints', async () => {
        const user = userEvent.setup();
        page.props = sharedProps();
        const indexing = {
            noindex: true,
            canonical: 'http://localhost/nos-biens?page=2',
            prev: 'http://localhost/nos-biens',
            next: 'http://localhost/nos-biens?page=3',
        };
        renderPage(
            <PropertiesPage
                properties={SALES}
                pagination={{ page: 2, lastPage: 3, total: 30, perPage: 12 }}
                filters={FILTERS}
                indexing={indexing}
                map={MAP}
                districts={[]}
                areas={[]}
                priceBounds={BOUNDS}
                {...BASE}
            />,
        );

        expect(screen.getByRole('heading', { level: 2, name: /bien/ })).toHaveTextContent('30 biens à vendre à Paris');
        const more = screen.getByRole('link', { name: 'Voir plus de biens' });
        expect(more).toHaveAttribute('href', 'http://localhost/nos-biens?page=3'); // crawlable
        expect(screen.getByText('3 biens affichés sur 30')).toBeInTheDocument();
        expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
        expect(document.head.querySelector('link[rel="prev"]')).toHaveAttribute('href', 'http://localhost/nos-biens');
        expect(document.head.querySelector('link[rel="next"]')).toHaveAttribute('href', 'http://localhost/nos-biens?page=3');

        await user.click(more);
        expect(get).toHaveBeenCalledWith(
            '/nos-biens',
            { page: 3 },
            expect.objectContaining({ only: ['properties', 'pagination', 'indexing'], preserveState: true, preserveScroll: true, replace: true }),
        );
        // While the next page loads, three skeleton cards follow the existing ones and the link says it is loading
        const options = get.mock.calls[0][2] as { onStart: () => void; onFinish: () => void };
        act(() => options.onStart());
        expect(screen.getAllByRole('article')).toHaveLength(3);
        expect(document.querySelectorAll('.animate-pulse')).toHaveLength(3);
        expect(screen.getByRole('link', { name: 'Chargement…' })).toHaveAttribute('aria-busy', 'true');
        act(() => options.onFinish());
        expect(document.querySelectorAll('.animate-pulse')).toHaveLength(0);
    });

    it('mobile, Airbnb-like: the header scrolls away, the bar sticks instead, and « Filtres » opens the full bar in a bottom sheet', async () => {
        const user = userEvent.setup();
        page.props = sharedProps();
        const replaceState = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});
        const { container } = renderPage(
            <PropertiesPage
                properties={SALES}
                pagination={PAGINATION}
                filters={{ ...FILTERS, city: [8], type: ['loft'] }}
                indexing={INDEXING}
                map={MAP}
                districts={[]}
                areas={[]}
                priceBounds={BOUNDS}
                {...BASE}
            />,
        );
        await waitFor(() => expect(replaceState.mock.calls.map((c) => c[2])).toContain('/nos-biens?city[]=8&type[]=loft')); // arrival from the home's GET: readable URL, once Inertia wrote its own
        replaceState.mockRestore();
        expect(container.querySelector('header')).toHaveClass('static'); // not sticky on this page at any width
        const quick = screen.getByRole('search', { name: 'Filtres rapides' });
        expect(quick.parentElement).toHaveClass('sticky', 'top-3', 'before:backdrop-blur-sm', 'before:bg-linear-to-b'); // pinned, blurred gradient veil behind
        expect(within(quick).getByRole('combobox', { name: 'Arrondissement' })).toBeInTheDocument();
        expect(within(quick).getByRole('textbox', { name: 'Budget maximum' })).toBeInTheDocument();
        expect(within(quick).queryByRole('button', { name: 'Lancer ma recherche' })).toBeNull(); // compact: the dark square button is « Filtres »
        expect(within(quick).queryByRole('radiogroup', { name: 'Projet' })).toBeNull(); // the other criteria live in the modal
        expect(within(quick).getByText('Arrondissement')).toHaveClass('uppercase'); // the home bar's labels
        expect(within(quick).getByText('Arrondissement').querySelector('svg')).toBeNull(); // no pin on the page's bar, only in the modal (user decision 2026-09-29)
        expect(within(quick).getByText('Budget')).toHaveAttribute('aria-hidden'); // shortened on screen, « Budget maximum » stays the accessible name

        const toggle = screen.getByRole('button', { name: 'Filtres, 1' }); // one criterion set in the modal (the type); the 8e is visible in the bar itself
        expect(toggle.querySelector('.rounded-full')).toHaveTextContent('1'); // the site's round sand badge
        await user.click(toggle);
        const sheet = await screen.findByRole('dialog', { name: 'Filtres' });
        expect(sheet).toHaveClass('bottom-0', 'max-h-[90dvh]'); // bottom sheet sized to its content
        expect(sheet).not.toHaveClass('h-dvh');
        expect(document.querySelector('.fixed.inset-0.bg-black\\/30')).not.toBeNull(); // the rest of the screen dimmed
        const all = within(sheet).getByRole('search', { name: 'Tous les filtres' });
        expect(within(all).getByRole('radiogroup', { name: 'Projet' }).closest('.sm\\:flex-none')).toHaveClass('sm:h-auto', 'sm:py-4'); // one filter per line at every width
        expect(within(within(all).getByRole('radiogroup', { name: 'Projet' })).getByRole('radio', { name: 'Achat' })).toHaveAttribute(
            'aria-checked',
            'true',
        );
        await user.click(within(sheet).getByRole('button', { name: 'Voir les 3 biens' })); // the bar's own submit, relabelled
        await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Filtres' })).toBeNull());
        await user.click(screen.getByRole('button', { name: 'Filtres, 1' }));
        await user.click(await screen.findByRole('button', { name: 'Fermer les filtres' }));
        await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Filtres' })).toBeNull());
    });

    it('mobile, Airbnb-like: the list shows alone, the floating « Carte » pill switches to the full-screen map and back to « Liste »', async () => {
        const user = userEvent.setup();
        page.props = sharedProps();
        renderPage(
            <PropertiesPage
                properties={SALES}
                pagination={PAGINATION}
                filters={FILTERS}
                indexing={INDEXING}
                map={MAP}
                districts={[]}
                areas={[]}
                priceBounds={BOUNDS}
                {...BASE}
            />,
        );
        const map = screen.getByRole('region', { name: 'Carte des biens' });
        expect(map.parentElement).toHaveClass('max-lg:hidden', 'lg:contents');
        // Square Liste | Carte segment (ui.sh variant chosen among 25, user decision 2026-09-28): the active view is pressed
        const segment = screen.getByRole('group', { name: 'Affichage des biens' });
        expect(segment).toHaveClass('fixed', 'lg:hidden', 'border-secondary-30');
        expect(segment).not.toHaveClass('rounded-full');
        const pill = within(segment).getByRole('button', { name: 'Carte' });
        expect(pill).toHaveAttribute('aria-pressed', 'false');
        expect(within(segment).getByRole('button', { name: 'Liste' })).toHaveAttribute('aria-pressed', 'true');

        const slab = segment.querySelector('[aria-hidden].bg-primary')!;
        expect(slab).toHaveClass('translate-x-0', 'transition-transform', 'motion-reduce:transition-none'); // the dark slab sits under « Liste »…
        await user.click(pill);
        expect(slab).toHaveClass('translate-x-full'); // …and slides under « Carte » (user decision 2026-09-28)
        expect(map.parentElement).toHaveClass('fixed', 'inset-0');
        expect(document.body).toHaveClass('max-lg:overflow-hidden');
        expect(pill).toHaveAttribute('aria-pressed', 'true'); // « Carte » is now the active segment…
        expect(within(segment).getByRole('button', { name: 'Liste' })).toHaveAttribute('aria-pressed', 'false'); // …« Liste » the way back
        expect(within(map.parentElement as HTMLElement).getByRole('search', { name: 'Filtres rapides' })).toBeInTheDocument(); // the filter bar on top of the map

        await user.click(within(segment).getByRole('button', { name: 'Liste' }));
        expect(map.parentElement).toHaveClass('max-lg:hidden');
        expect(document.body).not.toHaveClass('max-lg:overflow-hidden');
    });

    it('full-screen map: the focus enters it, Escape brings the list back and the focus returns to the switch (2026-09-28)', async () => {
        const user = userEvent.setup();
        page.props = sharedProps();
        renderPage(
            <PropertiesPage
                properties={SALES}
                pagination={PAGINATION}
                filters={FILTERS}
                indexing={INDEXING}
                map={MAP}
                districts={[]}
                areas={[]}
                priceBounds={BOUNDS}
                {...BASE}
            />,
        );
        const map = screen.getByRole('region', { name: 'Carte des biens' });
        const segment = screen.getByRole('group', { name: 'Affichage des biens' });
        expect(map.parentElement).not.toHaveAttribute('tabindex');

        await user.click(within(segment).getByRole('button', { name: 'Carte' }));
        expect(map.parentElement).toHaveAttribute('tabindex', '-1');
        expect(map.parentElement).toHaveFocus();
        expect(map.parentElement).toHaveTextContent('Échap pour revenir à la liste');

        await user.keyboard('{Escape}');
        expect(map.parentElement).toHaveClass('max-lg:hidden');
        expect(within(segment).getByRole('button', { name: 'Liste' })).toHaveAttribute('aria-pressed', 'true');
        expect(within(segment).getByRole('button', { name: 'Liste' })).toHaveFocus();
    });

    it('clean district page: its own h1, intro and breadcrumb, the arrondissement links under the list, the URL left as it is (2026-09-28)', async () => {
        page.props = sharedProps();
        const replaceState = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});
        const { container } = renderPage(
            <PropertiesPage
                properties={[SALES[0]]}
                pagination={{ ...PAGINATION, total: 1 }}
                filters={{ ...FILTERS, city: [6] }}
                indexing={{ ...INDEXING, canonical: 'http://localhost/nos-biens/paris-6e' }}
                map={MAP}
                areas={[]}
                priceBounds={BOUNDS}
                district={{
                    n: 6,
                    slug: 'paris-6e',
                    name: 'Paris 6e',
                    areas: 'Saint-Germain-des-Prés, Luxembourg',
                    summary: 'Le 6e est Saint-Germain-des-Prés, l’adresse la plus recherchée de Paris.',
                    price: '14 500',
                }}
                districts={DISTRICTS}
            />,
        );
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Nos biens à vendre à Paris 6e');
        expect(screen.getByText(/Saint-Germain-des-Prés, Luxembourg/)).toBeInTheDocument(); // the intro names the districts
        // Thin page no more (SEO audit 2026-09-30): the arrondissement's profile, its average price, the count naming it
        expect(screen.getByText(/l’adresse la plus recherchée de Paris/)).toBeInTheDocument();
        expect(screen.getByText('Prix moyen constaté dans le Paris 6e : 14 500 €/m² (Notaires du Grand Paris).')).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2, name: /bien/ })).toHaveTextContent('à Paris 6e');
        expect(document.title).toContain('Biens à vendre à Paris 6e');
        // Crawlable links to every district page with properties, the current one marked
        const nav = screen.getByRole('navigation', { name: 'Nos biens par arrondissement' });
        expect(within(nav).getByRole('link', { name: 'Paris 6e (1)' })).toHaveAttribute('aria-current', 'page');
        expect(within(nav).getByRole('link', { name: 'Paris 8e (1)' })).toHaveAttribute('href', '/nos-biens/paris-8e');
        // JSON-LD: the breadcrumb gains the arrondissement, each property gets its RealEstateListing
        // React 19 hoists the metadata tags to <head>, not the scripts: they stay in the rendered tree
        const jsonLd = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
            .map((s) => s.textContent)
            .join('');
        expect(jsonLd).toContain('"RealEstateListing"');
        // Every entity links to its detail page, never to an anchor, and names the agency (SEO audit 2026-09-30)
        expect(jsonLd).toContain(`"url":"http://localhost/nos-biens/achat/paris-6e/${PROPERTY.slug}"`);
        expect(jsonLd).not.toContain('#appartement');
        expect(jsonLd).toContain('"provider":{"@type":"RealEstateAgent"');
        expect(jsonLd).toContain('"floorSize":{"@type":"QuantitativeValue","value":128,"unitCode":"MTK"}');
        expect(jsonLd).toContain('"postalCode":"75006"');
        expect(jsonLd).toContain('"name":"Paris 6e"');
        // The clean path stays: no rewrite to `?city[]=6` on arrival
        await new Promise((r) => setTimeout(r, 200));
        expect(replaceState.mock.calls.map((c) => c[2])).not.toContain('/nos-biens?city[]=6');
        replaceState.mockRestore();
        expect(await axe(container)).toHaveNoViolations();
    });

    it('shows the searched map area as a removable chip and drops it from the criteria (2026-09-28)', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        page.props = sharedProps();
        renderPage(
            <PropertiesPage
                properties={SALES}
                pagination={PAGINATION}
                filters={{ ...FILTERS, bounds: [48.85, 2.33, 48.86, 2.35] }}
                indexing={INDEXING}
                map={MAP}
                districts={[]}
                areas={[]}
                priceBounds={BOUNDS}
                {...BASE}
            />,
        );
        expect(screen.getByText('Zone de la carte')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Réinitialiser' })).toBeInTheDocument(); // the area counts as a criterion
        await user.click(screen.getByRole('button', { name: 'Retirer la zone de la carte' }));
        vi.advanceTimersByTime(300);
        expect(get).toHaveBeenLastCalledWith('/nos-biens', {}, expect.objectContaining(RELOAD));
        expect(screen.queryByText('Zone de la carte')).toBeNull();
        vi.useRealTimers();
    });

    it('finds arrondissements from a neighbourhood name typed in the bar (2026-09-28)', async () => {
        const user = userEvent.setup();
        page.props = sharedProps();
        renderPage(
            <PropertiesPage
                properties={SALES}
                pagination={PAGINATION}
                filters={FILTERS}
                indexing={INDEXING}
                map={MAP}
                districts={[]}
                areas={[]}
                priceBounds={BOUNDS}
                {...BASE}
            />,
        );
        const quick = screen.getByRole('search', { name: 'Filtres rapides' });
        const city = within(quick).getByRole('combobox', { name: 'Arrondissement' });
        await user.click(city);
        await user.type(city, 'marais');
        const list = screen.getByRole('listbox');
        expect(
            within(list)
                .getAllByRole('option')
                .map((o) => o.textContent),
        ).toEqual(['Paris 3eMarais, Haut Marais', 'Paris 4eMarais']); // the name in place of the postal code
        await user.clear(city);
        await user.type(city, 'germain');
        expect(
            within(screen.getByRole('listbox'))
                .getAllByRole('option')
                .map((o) => o.textContent),
        ).toEqual(['Paris 6eSaint-Germain-des-Prés']);
        expect(city).toHaveAttribute('placeholder', 'Arrondissement, quartier ou code postal');
    });

    it('lifts a card while its pointer is over it (the map chip follows the same state)', async () => {
        const user = userEvent.setup();
        page.props = sharedProps();
        renderPage(
            <PropertiesPage
                properties={SALES}
                pagination={PAGINATION}
                filters={FILTERS}
                indexing={INDEXING}
                map={MAP}
                districts={[]}
                areas={[]}
                priceBounds={BOUNDS}
                {...BASE}
            />,
        );
        const card = screen.getAllByRole('article').find((a) => a.id === 'loft-3e')!;
        await user.hover(card);
        expect(card).toHaveAttribute('data-active', 'true');
        await user.unhover(card);
        expect(card).not.toHaveAttribute('data-active');
    });

    it('shows the criteria in force as chips under the bar with the alert link, widens a zero result (2026-09-28)', async () => {
        const user = userEvent.setup();
        page.props = sharedProps();
        renderPage(
            <PropertiesPage
                properties={[]}
                pagination={{ ...PAGINATION, total: 0 }}
                filters={{ ...FILTERS, city: [6], budget: 2000000, bedrooms: [3], features: ['elevator'] }}
                indexing={INDEXING}
                map={MAP}
                districts={[]}
                areas={['Passy']}
            />,
        );
        // Chips: one per criterion, removable; « Tout effacer »; the alert link carries the search
        const chips = screen.getByRole('list', { name: 'Critères actifs' });
        expect(
            within(chips)
                .getAllByRole('listitem')
                .map((li) => li.textContent),
        ).toEqual(['Paris 6e', '< 2 000 000 €', '3 chambres', 'Ascenseur']);
        expect(screen.queryByRole('link', { name: 'Recevoir les nouveaux biens de cette recherche' })).toBeNull(); // alert link removed (user decision 2026-09-28)
        expect(screen.getByRole('button', { name: 'Filtres, 2' })).toBeInTheDocument(); // bedrooms + amenity live in the modal
        // Zero result: widen to the neighbours of the 6e, or raise the budget by 20 %
        await user.click(screen.getByRole('button', { name: 'Inclure les arrondissements voisins' }));
        expect(
            within(chips)
                .getAllByRole('listitem')
                .map((li) => li.textContent)
                .slice(0, 6),
        ).toEqual(['Paris 1er', 'Paris 5e', 'Paris 6e', 'Paris 7e', 'Paris 14e', 'Paris 15e']);
        await user.click(screen.getByRole('button', { name: 'Augmenter le budget de 20 %' }));
        expect(within(chips).getByText('< 2 400 000 €')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Retirer Ascenseur' }));
        expect(within(chips).queryByText('Ascenseur')).toBeNull();
        await user.click(within(chips.parentElement as HTMLElement).getByRole('button', { name: 'Tout effacer' })); // the chips row's one (the empty state has its own)
        expect(screen.queryByRole('list', { name: 'Critères actifs' })).toBeNull();
    });

    it('folds the pinned bar to one line once scrolled under lg, and unfolds it on a tap (2026-09-28)', async () => {
        const user = userEvent.setup();
        page.props = sharedProps();
        renderPage(
            <PropertiesPage
                properties={SALES}
                pagination={PAGINATION}
                filters={{ ...FILTERS, city: [6, 16], budget: 1500000 }}
                indexing={INDEXING}
                map={MAP}
                districts={[]}
                areas={[]}
                priceBounds={BOUNDS}
            />,
        );
        expect(screen.getByRole('search', { name: 'Filtres rapides' })).toBeInTheDocument();
        Object.defineProperty(window, 'scrollY', { value: 400, configurable: true });
        act(() => {
            window.dispatchEvent(new Event('scroll'));
        });
        await waitFor(() => expect(screen.queryByRole('search', { name: 'Filtres rapides' })).toBeNull());
        const summary = screen.getByRole('button', { name: 'Modifier la recherche' });
        expect(summary).toHaveTextContent('Paris 6e, Paris 16e · < 1 500 000 €');
        await user.click(summary);
        expect(screen.getByRole('search', { name: 'Filtres rapides' })).toBeInTheDocument();
        Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
    });
    it('rentals landing (SEO audit 2026-09-30): its own title, h1 and intro, the rentals count', () => {
        page.props = sharedProps();
        renderPage(
            <PropertiesPage
                properties={PROPERTIES.filter((p) => p.transaction === 'rent')}
                pagination={{ page: 1, lastPage: 1, total: 1, perPage: 12 }}
                filters={{ ...FILTERS, transaction: 'rent' }}
                indexing={{ ...INDEXING, canonical: 'http://localhost/nos-biens/location' }}
                map={MAP}
                areas={[]}
                priceBounds={BOUNDS}
                {...BASE}
                landing="rent"
            />,
        );
        expect(document.title).toContain('Appartements de prestige à louer à Paris');
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Nos biens à louer à Paris');
        expect(screen.getByText(/actuellement à la location à Paris/)).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2, name: /location/ })).toHaveTextContent('1 bien en location à Paris');
    });
});
