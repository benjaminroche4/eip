import CtaCard from '@/components/home/cta-card';
import PageEyebrow from '@/components/page/page-eyebrow';
import ActiveFilters, { type ActiveFilter } from '@/components/properties/active-filters';
import DistrictLinks, { type DistrictLink } from '@/components/properties/district-links';
import EmptyResults from '@/components/properties/empty-results';
import FilterBar from '@/components/properties/filter-bar';
import MapPreview from '@/components/properties/map-preview';
import { digits, EMPTY_MORE, type MoreFilters } from '@/components/properties/more-filters';
import { type PriceBounds } from '@/components/properties/price-range';
import PropertiesMap, { type MapConfig } from '@/components/properties/properties-map';
import PropertyCard, { type Property } from '@/components/properties/property-card';
import PropertyCardSkeleton from '@/components/properties/property-card-skeleton';
import ResetButton from '@/components/properties/reset-button';
import SortSelect, { type Sort } from '@/components/properties/sort-select';
import ViewSwitch from '@/components/properties/view-switch';
import { type Transaction } from '@/components/search/search-bar';
import SeoHead from '@/components/seo/seo-head';
import { Button } from '@/components/ui/button';
import { LARGE_SCREEN, SMALL_SCREEN, useMediaQuery } from '@/hooks/use-media-query';
import { useTranslation } from '@/hooks/use-translation';
import PublicLayout from '@/layouts/public-layout';
import { scrollBehavior } from '@/lib/focus-field';
import { groupThousands } from '@/lib/format-price';
import { breadcrumbList, itemList, realEstateListings } from '@/lib/json-ld';
import { ordinal } from '@/lib/ordinal';
import { withNeighbours } from '@/lib/paris-neighbours';
import { propertyUrl } from '@/lib/property-url';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { Info } from 'lucide-react';
import { type MouseEvent, useCallback, useEffect, useRef, useState } from 'react';

/** [south, west, north, east] of the map frame searched with « Rechercher dans cette zone » (2026-09-28). */
export type Bounds = [number, number, number, number];
export type PropertyFilters = {
    city: number[];
    budget: number | null;
    transaction: Transaction;
    type: string[];
    rooms: number[];
    sort: Sort;
    bounds: Bounds | null;
    // Richer criteria (2026-09-28), as `PropertyQuery::toArray()` sends them
    budget_min: number | null;
    surface_min: number | null;
    bedrooms: number[];
    features: string[];
    condition: string[];
    floor: string[];
    furnished: boolean | null;
    available: boolean;
    area: string[];
};
type Pagination = { page: number; lastPage: number; total: number; perPage: number };
type Indexing = { noindex: boolean; canonical: string; prev: string | null; next: string | null };
/** The clean district page (`/nos-biens/paris-6e`, 2026-09-28): the arrondissement the listing is narrowed to. */
type District = { n: number; slug: string; name: string; areas: string; summary: string | null; price: string | null };
/** The clean district pages worth linking: every arrondissement with a property for sale. */
type PropertiesProps = {
    properties: Property[];
    pagination: Pagination;
    filters: PropertyFilters;
    indexing: Indexing;
    map: MapConfig;
    district: District | null;
    /** `rent` on the rentals landing (`/nos-biens/location`, 2026-09-30): its own title, h1 and intro. */
    landing: 'rent' | null;
    districts: DistrictLink[];
    /** Quartiers to offer in the filters. */
    areas: string[];
    /** Lowest / highest price of the listings per transaction: the bounds of the price range (2026-09-28). */
    priceBounds: PriceBounds;
};

/**
 * Readable, copy-pasteable query string (`?city[]=6&type[]=loft&budget=2000000&page=2`) — user decision 2026-09-28.
 * Inertia shows the URL as Laravel normalises it (`city%5B0%5D=6`, sorted), so the page rewrites the address bar after
 * every response and on arrival; the server reads both forms.
 */
const prettyQuery = (params: Record<string, unknown>): string =>
    Object.entries(params)
        .flatMap(([key, value]) =>
            Array.isArray(value) ? value.map((v) => `${key}[]=${encodeURIComponent(String(v))}`) : [`${key}=${encodeURIComponent(String(value))}`],
        )
        .join('&');
const showUrl = (url: string, params: Record<string, unknown>) => {
    const query = prettyQuery(params);
    window.history.replaceState(window.history.state, '', query ? `${url}?${query}` : url);
};

/** Query params of the current filters, as the controller reads them (`PropertyQuery::fromRequest`). */
const filterParams = (
    cities: number[],
    budget: number | null,
    transaction: Transaction,
    types: string[],
    rooms: number[],
    sort: Sort,
    bounds: Bounds | null,
    more: MoreFilters = EMPTY_MORE,
): Record<string, unknown> => ({
    ...(cities.length > 0 && { city: cities }),
    ...(budget !== null && { budget }),
    ...(transaction === 'rent' && { transaction }),
    ...(types.length > 0 && { type: types }),
    ...(rooms.length > 0 && { rooms }),
    ...(sort !== 'recent' && { sort }),
    ...(bounds !== null && { bounds: bounds.map((v) => v.toFixed(5)).join(',') }),
    ...(digits(more.budgetMin) !== null && { budget_min: digits(more.budgetMin) }),
    ...(digits(more.surfaceMin) !== null && { surface_min: digits(more.surfaceMin) }),
    ...(more.bedrooms.length > 0 && { bedrooms: more.bedrooms }),
    ...(more.features.length > 0 && { features: more.features }),
    ...(more.conditions.length > 0 && { condition: more.conditions }),
    ...(more.floors.length > 0 && { floor: more.floors }),
    ...(more.furnished !== null && { furnished: more.furnished ? '1' : '0' }),
    ...(more.availableOnly && { available: '1' }),
    ...(more.areas.length > 0 && { area: more.areas }),
});
/** The richer criteria as the bar's state holds them, from the server's applied filters. */
const moreFrom = (f: PropertyFilters, locale: string): MoreFilters => ({
    budgetMin: f.budget_min ? groupThousands(String(f.budget_min), locale) : '',
    surfaceMin: f.surface_min ? String(f.surface_min) : '',
    bedrooms: f.bedrooms,
    features: f.features,
    conditions: f.condition,
    floors: f.floor,
    furnished: f.furnished,
    availableOnly: f.available,
    areas: f.area,
});
/** The same key for the server's applied filters (the `filters` prop): equal to `paramsKey` once a response landed. */
const filtersKey = (f: PropertyFilters, locale: string) =>
    JSON.stringify(filterParams(f.city, f.budget, f.transaction, f.type, f.rooms, f.sort, f.bounds, moreFrom(f, locale)));

/**
 * « Nos biens » (2026-09-25, layout after the Relocation in Paris marketplace — user decision): the header and the
 * extended search bar are centred above everything (the bar shows only arrondissements + budget and a « Filtres » button opening the rest in a modal at every width; under `lg` the header is not sticky and the bar sticks instead, 2026-09-28), then the
 * page runs edge to edge and splits in two from `lg`: the live count (the h2) and the grid of cards on the left
 * (2 columns, 3 on wide screens), the Google map on the right, sticky, both exactly half the width, one price marker
 * per property. **Hybrid pagination (2026-09-26)**: the server paginates (`?page=N`, SSR, `noindex` past page 1,
 * `rel prev/next`); a filter change asks page 1 as a partial reload (300 ms debounce on the budget), « Voir plus » is
 * a real link to the next page whose click appends that page in place (merge prop) and updates the URL, so the map
 * keeps every displayed property (the map refits only on a filter change, 2026-09-28). Hovering a card lifts its marker and the reverse; choosing a marker scrolls to its
 * card; a chosen chip opens the mini card `MapPreview` over the map. JSON-LD breadcrumb + ItemList of the displayed properties
 * + one `RealEstateListing` per property (2026-09-28).
 * 2026-09-28 review: a **sort select** (`sort-select.tsx`, `?sort=`) on the count row; a filter change **dims the
 * current cards** and only swaps them for skeletons past 400 ms (no flash for a fast answer); each filter change
 * **pushes a history entry** (Back undoes it: the local state re-syncs from the `filters` prop); the first four cards
 * load their photo eagerly (LCP); the full-screen map takes the focus, **Escape** brings the list back and the focus
 * returns to the Liste | Carte switch, which hides once the closing CTA card is in view.
 * **Clean district pages** (`district` prop, 2026-09-28): the same page narrowed to one arrondissement with its own
 * title, h1, intro and breadcrumb; a filter change leaves for the plain listing with the criteria in the query string.
 * The « Par arrondissement » links under the list (`districts`) point to every district page with properties.
 * **« Rechercher dans cette zone »** (2026-09-28): the map hands its frame back as a `bounds` filter, shown as a
 * removable chip on the count row; the map never refits on that filter (the user framed it).
 */
export default function PropertiesPage({
    properties,
    pagination,
    filters,
    indexing,
    map,
    district,
    landing,
    districts,
    areas,
    priceBounds,
}: PropertiesProps) {
    const { t, tc, locale } = useTranslation();
    const { ziggy, seo } = usePage<SharedData>().props;
    const origin = new URL(ziggy.location).origin;
    const url = route('properties');
    const pageUrl = district ? `${url}/${district.slug}` : url;
    // Absolute detail URL for the structured data (Ziggy gives an absolute one; the test double a path)
    const detailUrl = (p: Property) => {
        const u = propertyUrl(p, locale);
        return u.startsWith('http') ? u : `${origin}${u}`;
    };
    const small = useMediaQuery(SMALL_SCREEN);
    const desktopView = useMediaQuery(LARGE_SCREEN);

    const [cities, setCities] = useState<number[]>(filters.city);
    const [budget, setBudget] = useState(filters.budget ? groupThousands(String(filters.budget), locale) : '');
    const [transaction, setTransaction] = useState<Transaction>(filters.transaction);
    const [types, setTypes] = useState<string[]>(filters.type);
    const [rooms, setRooms] = useState<number[]>(filters.rooms);
    const [sort, setSort] = useState<Sort>(filters.sort);
    const [bounds, setBounds] = useState<Bounds | null>(filters.bounds);
    const [more, setMoreState] = useState<MoreFilters>(() => moreFrom(filters, locale));
    const setMore = useCallback((patch: Partial<MoreFilters>) => setMoreState((m) => ({ ...m, ...patch })), []);
    const [active, setActive] = useState<string | null>(null);
    // A chosen price chip opens the mini card over the map (user decision 2026-09-26)
    const [selected, setSelected] = useState<string | null>(null);
    const selectedProperty = properties.find((p) => p.slug === selected) ?? null;
    const closePreview = useCallback(() => setSelected(null), []);
    // What is loading: a filter change replaces the grid by skeletons, « Voir plus » appends some (user decision 2026-09-28)
    const [loading, setLoading] = useState<'filters' | 'more' | null>(null);
    // A filter change first dims the current cards; skeletons only replace them once the answer takes more than 400 ms (2026-09-28)
    const [slow, setSlow] = useState(false);
    useEffect(() => {
        if (loading !== 'filters') {
            setSlow(false);
            return;
        }
        const timer = window.setTimeout(() => setSlow(true), 400);
        return () => window.clearTimeout(timer);
    }, [loading]);
    // Mobile, Airbnb-like (user decision 2026-09-28): the list alone, a floating « Carte » pill switches to a full-screen map
    // (filter bar on top, « Liste » pill to come back); the page behind stops scrolling meanwhile
    const [view, setView] = useState<'list' | 'map'>('list');
    const mapView = useRef<HTMLDivElement>(null);
    const viewSwitch = useRef<HTMLDivElement>(null);
    const closingCard = useRef<HTMLDivElement>(null);
    useEffect(() => {
        document.body.classList.toggle('max-lg:overflow-hidden', view === 'map');
        return () => document.body.classList.remove('max-lg:overflow-hidden');
    }, [view]);
    // Full-screen map = a modal view: the focus enters it, Escape brings the list back (a11y rule); the focus then
    // returns to the switch that opened it (2026-09-28). An open mini card takes the Escape first (it closes itself).
    useEffect(() => {
        if (view !== 'map') return;
        mapView.current?.focus({ preventScroll: true });
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== 'Escape' || selected) return;
            setView('list');
            viewSwitch.current?.querySelector<HTMLButtonElement>('button')?.focus();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [view, selected]);

    const budgetValue = Number(budget.replace(/\D/g, '')) || null;
    // Badge of the « Filtres » button = the criteria set inside the modal (project, types, rooms; user decision 2026-09-28);
    // arrondissements and budget are visible in the bar itself
    const moreCount =
        Number(digits(more.budgetMin) !== null) +
        Number(digits(more.surfaceMin) !== null) +
        Number(more.bedrooms.length > 0) +
        Number(more.features.length > 0) +
        Number(more.conditions.length > 0) +
        Number(more.floors.length > 0) +
        Number(more.furnished !== null) +
        Number(more.availableOnly) +
        Number(more.areas.length > 0);
    const activeFilters = Number(transaction !== 'sale') + Number(types.length > 0) + Number(rooms.length > 0) + moreCount;
    const filtered = cities.length > 0 || budgetValue !== null || activeFilters > 0 || bounds !== null;
    const params = filterParams(cities, budgetValue, transaction, types, rooms, sort, bounds, more);
    const paramsKey = JSON.stringify(params);
    // The map refits on a change of the applied criteria, except the frame the user drew (`bounds`): that one is theirs
    const fitKey = filtersKey({ ...filters, bounds: null }, locale);

    // Filters → page 1 from the server (partial reload, props replaced), debounced so typing a budget does not fire per digit
    // Nothing on mount (the server already applied the URL's filters), nor when the criteria come back unchanged; a
    // mounted flag would fire under React's strict-mode double effects and rewrite the URL
    const sentKey = useRef(paramsKey);
    // On arrival (the home's GET, a pasted link) the address bar gets the readable form of the same criteria
    // (Inertia writes its own, normalised URL asynchronously right after the first render: the rewrite waits a tick).
    // A clean district URL keeps its path as long as its only criterion is the arrondissement.
    useEffect(() => {
        if (district && Object.keys(JSON.parse(sentKey.current)).join() === 'city' && pagination.page === 1) return;
        const timer = window.setTimeout(
            () => showUrl(url, { ...JSON.parse(sentKey.current), ...(pagination.page > 1 && { page: pagination.page }) }),
            150,
        );
        return () => window.clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on mount
    }, []);
    useEffect(() => {
        if (paramsKey === sentKey.current) return;
        const timer = window.setTimeout(() => {
            sentKey.current = paramsKey;
            // Each change pushes a history entry, so Back undoes a filter (Airbnb-like, user decision 2026-09-28)
            router.get(url, JSON.parse(paramsKey), {
                only: ['properties', 'pagination', 'filters', 'indexing', 'district'],
                preserveState: true,
                preserveScroll: true,
                replace: false,
                queryStringArrayFormat: 'brackets',
                onStart: () => setLoading('filters'),
                onSuccess: () => showUrl(url, JSON.parse(paramsKey)),
                onFinish: () => setLoading(null),
            });
        }, 300);
        return () => window.clearTimeout(timer);
    }, [paramsKey, url]);
    // Back / forward: Inertia restores that entry's props, the criteria shown must follow them (nothing after our own
    // responses, whose `filters` are exactly what was sent)
    const appliedKey = filtersKey(filters, locale);
    useEffect(() => {
        if (appliedKey === sentKey.current) return;
        sentKey.current = appliedKey;
        setCities(filters.city);
        setBudget(filters.budget ? groupThousands(String(filters.budget), locale) : '');
        setTransaction(filters.transaction);
        setTypes(filters.type);
        setRooms(filters.rooms);
        setSort(filters.sort);
        setBounds(filters.bounds);
        setMoreState(moreFrom(filters, locale));
        // eslint-disable-next-line react-hooks/exhaustive-deps -- `filters` and `locale` only matter when the key changes
    }, [appliedKey]);

    const reset = () => {
        setCities([]);
        setBudget('');
        setTypes([]);
        setRooms([]);
        setBounds(null);
        setMoreState(EMPTY_MORE);
    };
    // The criteria in force, as removable chips (2026-09-28)
    const chips: ActiveFilter[] = [
        ...cities.map((n) => ({
            key: `city-${n}`,
            label: `Paris ${ordinal(n, locale)}`,
            onRemove: () => setCities((c) => c.filter((x) => x !== n)),
        })),
        ...(budgetValue !== null ? [{ key: 'budget', label: t('properties.chip_budget', { amount: budget }), onRemove: () => setBudget('') }] : []),
        ...(digits(more.budgetMin) !== null
            ? [{ key: 'budget_min', label: t('properties.chip_budget_min', { amount: more.budgetMin }), onRemove: () => setMore({ budgetMin: '' }) }]
            : []),
        ...(digits(more.surfaceMin) !== null
            ? [{ key: 'surface_min', label: t('properties.chip_surface', { surface: more.surfaceMin }), onRemove: () => setMore({ surfaceMin: '' }) }]
            : []),
        ...(transaction === 'rent' ? [{ key: 'rent', label: t('properties.transaction.rent'), onRemove: () => setTransaction('sale') }] : []),
        ...types.map((type) => ({
            key: `type-${type}`,
            label: t(`properties.types.${type}`),
            onRemove: () => setTypes((v) => v.filter((x) => x !== type)),
        })),
        ...rooms.map((n) => ({
            key: `rooms-${n}`,
            label: tc('properties.search_rooms_exact', n, { count: n }),
            onRemove: () => setRooms((v) => v.filter((x) => x !== n)),
        })),
        ...more.bedrooms.map((n) => ({
            key: `bedrooms-${n}`,
            label: tc('properties.chip_bedrooms', n, { count: n }),
            onRemove: () => setMore({ bedrooms: more.bedrooms.filter((x) => x !== n) }),
        })),
        ...more.features.map((f) => ({
            key: `feature-${f}`,
            label: t(`properties.feature.${f}`),
            onRemove: () => setMore({ features: more.features.filter((x) => x !== f) }),
        })),
        ...more.conditions.map((c) => ({
            key: `condition-${c}`,
            label: t(`properties.condition.${c}`),
            onRemove: () => setMore({ conditions: more.conditions.filter((x) => x !== c) }),
        })),
        ...more.floors.map((f) => ({
            key: `floor-${f}`,
            label: t(`properties.floor.${f}`),
            onRemove: () => setMore({ floors: more.floors.filter((x) => x !== f) }),
        })),
        ...more.areas.map((a) => ({ key: `area-${a}`, label: a, onRemove: () => setMore({ areas: more.areas.filter((x) => x !== a) }) })),
        ...(more.furnished !== null
            ? [{ key: 'furnished', label: t(`properties.furnished.${more.furnished ? 'yes' : 'no'}`), onRemove: () => setMore({ furnished: null }) }]
            : []),
        ...(more.availableOnly
            ? [{ key: 'available', label: t('properties.available_only'), onRemove: () => setMore({ availableOnly: false }) }]
            : []),
        ...(bounds !== null
            ? [{ key: 'bounds', label: t('properties.area_filter'), removeLabel: t('properties.area_clear'), onRemove: () => setBounds(null) }]
            : []),
    ];
    // « Voir plus »: the next page appended in place (the controller sends `properties` as a merge prop past page 1)
    const loadMore = (e: MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        router.get(
            url,
            { ...params, page: pagination.page + 1 },
            {
                only: ['properties', 'pagination', 'indexing'],
                preserveState: true,
                preserveScroll: true,
                replace: true,
                queryStringArrayFormat: 'brackets',
                onStart: () => setLoading('more'),
                onSuccess: () => showUrl(url, { ...params, page: pagination.page + 1 }),
                onFinish: () => setLoading(null),
            },
        );
    };
    const scrollTo = (slug: string) => document.getElementById(slug)?.scrollIntoView({ block: 'center', behavior: scrollBehavior() });

    const crumbs = [
        { name: t('nav.home'), url: route('home') },
        { name: t('pages.properties.title'), url },
        ...(district ? [{ name: district.name, url: pageUrl }] : []),
    ];
    const title = district
        ? t('properties.district_seo_title', { name: district.name })
        : landing === 'rent'
          ? t('properties.rent_seo_title')
          : t('pages.properties.seo_title');
    const description = district
        ? t('properties.district_seo_description', { name: district.name })
        : landing === 'rent'
          ? t('properties.rent_seo_description')
          : t('pages.properties.seo_description');

    return (
        <>
            <SeoHead
                title={title}
                description={description}
                canonical={indexing.canonical}
                noindex={indexing.noindex}
                prev={indexing.prev}
                next={indexing.next}
                // Every entity links to its detail page, never to an anchor; the agency is the provider (SEO audit 2026-09-30)
                image={properties[0] ? `${origin}${properties[0].photos[0].replace('{w}', '1600')}` : undefined}
                imageAlt={properties[0]?.photo_alt}
                jsonLd={[
                    breadcrumbList(crumbs, origin),
                    itemList(properties.filter((p) => !p.off_market).map((p) => ({ name: p.title, url: detailUrl(p) }))),
                    ...realEstateListings(
                        properties.map((p) => ({ ...p, url: detailUrl(p) })),
                        origin,
                        pageUrl,
                        locale,
                        false,
                        { name: seo.organization.name, url: origin },
                    ),
                ]}
            />
            <PublicLayout className="max-w-none px-0 pt-0 pb-0 sm:pt-0 sm:pb-0 lg:px-0 lg:pt-0" backdrop={false} stickyHeader={false}>
                {/* Header and search bar centred above the split (user decision 2026-09-25) */}
                <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-8 px-6 pt-10 pb-8 text-center sm:pt-12 sm:pb-10 lg:px-8 lg:pt-14">
                    <div className="flex max-w-2xl flex-col items-center gap-4">
                        <PageEyebrow>{t('pages.properties.title')}</PageEyebrow>
                        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                            {district
                                ? t('properties.district_headline', { name: district.name })
                                : landing === 'rent'
                                  ? t('properties.rent_headline')
                                  : t('properties.headline')}
                        </h1>
                        {/* GEO: a self-contained sentence */}
                        <p className="text-muted-foreground text-base/7 text-pretty sm:text-sm/6">
                            {district
                                ? t('properties.district_intro', { name: district.name, areas: district.areas })
                                : landing === 'rent'
                                  ? t('properties.rent_intro')
                                  : t('pages.properties.intro')}
                        </p>
                        {/* District page: the arrondissement's profile and its average price, so the page carries more than a grid (SEO audit 2026-09-30) */}
                        {district?.summary && <p className="text-muted-foreground text-base/7 text-pretty sm:text-sm/6">{district.summary}</p>}
                        {district?.price && (
                            <p className="text-sm font-medium tabular-nums">
                                {t('properties.district_price_line', { name: district.name, price: district.price })}
                            </p>
                        )}
                    </div>
                </div>

                {/* The page's bar at every width (user decision 2026-09-28: two criteria + « Filtres »); under lg it sticks (the header does not) and, in map view, its twin sits on the map */}
                {(view === 'list' || desktopView) && (
                    <FilterBar
                        small={small}
                        cities={cities}
                        setCities={setCities}
                        budget={budget}
                        setBudget={setBudget}
                        extended={{ transaction, setTransaction, types, setTypes, rooms, setRooms }}
                        activeFilters={activeFilters}
                        total={pagination.total}
                        onReset={reset}
                        more={more}
                        onMore={setMore}
                        areas={areas}
                        priceBounds={priceBounds}
                    />
                )}

                {/* The criteria in force as chips, under the bar (user decision 2026-09-28; the « Recevoir les nouveaux biens » alert link was removed the same day, user decision) */}
                {chips.length > 0 && (
                    <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-6 pt-4 lg:px-0">
                        <ActiveFilters filters={chips} onClear={reset} />
                    </div>
                )}

                {/* Split screen from lg: list on the left, sticky map on the right */}
                {/* Section rhythm between the bar and the list (`gap-20 sm:gap-28` of the other pages from lg; tighter under lg where the bar is pinned) */}
                <div className="flex flex-col pt-8 sm:pt-10 lg:flex-row lg:items-start lg:pt-20">
                    <div className="flex min-w-0 flex-col gap-6 px-6 lg:w-1/2 lg:pr-6 lg:pl-8">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h2
                                aria-live="polite"
                                aria-busy={loading !== null || undefined}
                                className="text-xl font-medium tracking-tight tabular-nums"
                            >
                                {district
                                    ? tc(`properties.count_${transaction}_district`, pagination.total, {
                                          count: pagination.total,
                                          name: district.name,
                                      })
                                    : tc(`properties.count_${transaction}`, pagination.total, { count: pagination.total })}
                            </h2>
                            <div className="flex flex-wrap items-center gap-3">
                                {filtered && <ResetButton onClick={reset} />}
                                <SortSelect value={sort} onChange={setSort} />
                            </div>
                        </div>

                        {/* Dimmed while a fast answer is on its way, skeletons only past 400 ms (2026-09-28) */}
                        <div
                            aria-busy={loading === 'filters' || undefined}
                            className={cn(
                                'flex flex-col gap-6 transition-opacity duration-300 motion-reduce:transition-none',
                                loading === 'filters' && !slow && 'pointer-events-none opacity-60',
                            )}
                        >
                            {loading === 'filters' && slow ? (
                                <ul role="list" aria-hidden className="grid gap-6 sm:grid-cols-2 2xl:grid-cols-3">
                                    {Array.from({ length: 6 }, (_, i) => (
                                        <li key={i} className="flex">
                                            <PropertyCardSkeleton />
                                        </li>
                                    ))}
                                </ul>
                            ) : properties.length === 0 ? (
                                <EmptyResults
                                    onWidenDistricts={cities.length > 0 ? () => setCities((c) => withNeighbours(c)) : undefined}
                                    onWidenBudget={
                                        budgetValue !== null
                                            ? () => setBudget(groupThousands(String(Math.round((budgetValue * 1.2) / 1000) * 1000), locale))
                                            : undefined
                                    }
                                    onReset={reset}
                                />
                            ) : (
                                <ul role="list" className="grid gap-6 sm:grid-cols-2 2xl:grid-cols-3">
                                    {properties.map((property, index) => (
                                        <li key={property.slug} className="flex">
                                            {/* The first four cards are above the fold at every width: eager first photo (LCP, 2026-09-28) */}
                                            <PropertyCard
                                                property={property}
                                                active={active === property.slug}
                                                onActivate={setActive}
                                                priority={pagination.page === 1 && index < 4}
                                            />
                                        </li>
                                    ))}
                                    {loading === 'more' &&
                                        Array.from({ length: 3 }, (_, i) => (
                                            <li key={`skeleton-${i}`} aria-hidden className="flex">
                                                <PropertyCardSkeleton />
                                            </li>
                                        ))}
                                </ul>
                            )}
                        </div>
                        {indexing.next && (
                            <div className="flex flex-col items-center gap-2 pt-2">
                                <Button asChild variant="outline" size="lg">
                                    <a href={indexing.next} onClick={loadMore} aria-busy={loading === 'more' || undefined}>
                                        {loading === 'more' ? t('properties.loading') : t('properties.load_more')}
                                    </a>
                                </Button>
                                <p className="text-muted-foreground text-xs tabular-nums">
                                    {t('properties.shown', { shown: properties.length, total: pagination.total })}
                                </p>
                            </div>
                        )}
                        {/* Light grey note with a leading icon (user decision 2026-09-28), like the districts' source line */}
                        <p className="text-grey-60 flex gap-2 text-xs text-pretty">
                            <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.5} />
                            <span>{t('properties.source')}</span>
                        </p>
                        {districts.length > 0 && <DistrictLinks districts={districts} current={district?.n ?? null} />}
                    </div>

                    {/* Mobile: hidden behind the « Carte » pill, then full screen; desktop: the sticky half (`lg:contents` hands the map to the split) */}
                    <div
                        ref={mapView}
                        tabIndex={view === 'map' ? -1 : undefined}
                        aria-label={view === 'map' ? t('properties.view_map') : undefined}
                        aria-keyshortcuts={view === 'map' ? 'Escape' : undefined}
                        className={cn('lg:contents', view === 'map' ? 'bg-card focus-ring fixed inset-0 z-40 flex flex-col' : 'max-lg:hidden')}
                    >
                        {view === 'map' && <p className="sr-only">{t('properties.view_map_exit')}</p>}
                        {view === 'map' && (
                            <FilterBar
                                small={small}
                                cities={cities}
                                setCities={setCities}
                                budget={budget}
                                setBudget={setBudget}
                                extended={{ transaction, setTransaction, types, setTypes, rooms, setRooms }}
                                activeFilters={activeFilters}
                                total={pagination.total}
                                onReset={reset}
                                more={more}
                                onMore={setMore}
                                areas={areas}
                                priceBounds={priceBounds}
                                className="absolute inset-x-0 top-3"
                            />
                        )}
                        <PropertiesMap
                            properties={properties}
                            active={active}
                            onActivate={setActive}
                            onSelect={(slug) => setSelected((current) => (current === slug ? null : slug))}
                            config={map}
                            fitKey={fitKey}
                            selected={selected}
                            onSearchArea={setBounds}
                            preview={
                                selectedProperty && (
                                    <MapPreview
                                        property={selectedProperty}
                                        onClose={closePreview}
                                        onShow={(slug) => {
                                            setView('list');
                                            scrollTo(slug);
                                            closePreview();
                                        }}
                                    />
                                )
                            }
                            className="h-full flex-1 max-lg:border-0 max-lg:p-0 lg:sticky lg:top-27 lg:mr-8 lg:h-[calc(100dvh-7.75rem)] lg:w-[calc(50%-2rem)]"
                        />
                    </div>
                </div>
                {/* Floating list / map switch, Airbnb-like (user decision 2026-09-28) — `properties/view-switch.tsx`, square Liste | Carte segment, ui.sh variant chosen among 25 */}
                <ViewSwitch ref={viewSwitch} view={view} onToggle={() => setView((v) => (v === 'map' ? 'list' : 'map'))} until={closingCard} />

                {/* Same section rhythm as the other pages (`gap-20 sm:gap-28`) between the list and the closing CTA (user decision 2026-09-26) */}
                <div ref={closingCard} className="mx-auto w-full max-w-5xl px-6 pt-20 pb-16 sm:pt-28 sm:pb-20 lg:px-8">
                    <CtaCard />
                </div>
            </PublicLayout>
        </>
    );
}
