import GradientHairline from '@/components/layout/gradient-hairline';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { useSearchDraft } from '@/hooks/use-search-draft';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { Check, Search, X } from 'lucide-react';
import { type FormEvent, type KeyboardEvent, type ReactNode, type Ref, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

const ARRONDISSEMENTS = Array.from({ length: 20 }, (_, i) => i + 1);
/** Quick budgets (euros) offered under the budget cell. */
const BUDGETS = [1_000_000, 1_500_000, 2_000_000, 3_000_000, 5_000_000];
/** Below `sm` the lists open in a bottom sheet instead of a popover (the keyboard would cover a popover). */
const SMALL_SCREEN = '(max-width: 639px)';

/** « 1er » / « 2e » in French, « 1st » / « 2nd » / « 3rd » / « 4th » in English. */
const ordinal = (n: number, locale: string): string => {
    if (locale === 'fr') return n === 1 ? '1er' : `${n}e`;
    const teen = n % 100 >= 11 && n % 100 <= 13;
    const suffix = teen ? 'th' : (['th', 'st', 'nd', 'rd'][n % 10] ?? 'th');
    return `${n}${suffix}`;
};
const postalCode = (n: number) => `750${String(n).padStart(2, '0')}`;
/** Keeps the digits and groups the thousands like the site's prices (« 1 500 000 » in French, « 1,500,000 » in English). */
const digits = (value: string) => value.replace(/\D/g, '');
const groupThousands = (value: string, locale: string) => digits(value).replace(/\B(?=(\d{3})+(?!\d))/g, locale === 'fr' ? ' ' : ',');
/** Does the typed text match an arrondissement? « 16 », « 16e », « 75016 », « paris 6 »… */
const matchesCity = (query: string, n: number, locale: string): boolean => {
    const q = query.toLowerCase().replace(/paris/g, '').replace(/[\s-]/g, '');
    if (!q) return true;
    // the postal code only counts from three digits (« 7 » must not match every 750xx)
    const candidates = [String(n), ordinal(n, locale).toLowerCase(), ...(q.length >= 3 ? [postalCode(n)] : [])];
    return candidates.some((candidate) => candidate.startsWith(q));
};

/** True while the media query matches (false on the server and before the first effect). */
function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);
    useEffect(() => {
        const mql = window.matchMedia(query);
        const update = () => setMatches(mql.matches);
        update();
        mql.addEventListener('change', update);
        return () => mql.removeEventListener('change', update);
    }, [query]);
    return matches;
}

/** One cell of the bar: permanent small label above the value, sand background while hovered or focused. */
function Cell({ children, className, ref }: { children: ReactNode; className?: string; ref?: Ref<HTMLDivElement> }) {
    return (
        <div
            ref={ref}
            className={cn(
                'hover:bg-background-05 focus-within:bg-background-05 relative flex min-w-0 flex-col justify-center gap-1.5 px-5 py-4 transition-colors duration-300 motion-reduce:transition-none sm:h-full sm:flex-1 sm:px-6 sm:py-0',
                className,
            )}
        >
            {children}
        </div>
    );
}

/** Separator between cells, in sand like the card's edge: a horizontal hairline on mobile, a vertical one from `sm`. */
function Divider() {
    return (
        <>
            <GradientHairline className="via-secondary-30 sm:hidden" />
            <GradientHairline vertical className="via-secondary-30 my-4 hidden self-stretch sm:block" />
        </>
    );
}

/** The « × » that empties a cell, shown only when it holds a value. */
function ClearButton({ label, onClick, className }: { label: string; onClick: () => void; className?: string }) {
    return (
        <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={label}
            onClick={onClick}
            className={cn('text-muted-foreground shrink-0', className)}
        >
            <X aria-hidden />
        </Button>
    );
}

const labelClass = 'text-muted-foreground text-xs';
/** Rows of the lists, as the contact form's Select items: compact, check on the right. */
const itemClass = 'relative flex w-full cursor-default items-center py-1.5 pr-8 pl-2 text-sm select-none';
/** The city pills = the site's outline badge, square, on the sand card gradient (sand hairline, background-08 → 05 — user decision 2026-09-25). */
const pillClass =
    'border-secondary-30 from-background-08 to-background-05 text-foreground focus-within:ring-ring/50 shrink-0 rounded-none bg-linear-to-b whitespace-nowrap focus-within:ring-[3px]';
const controlClass = 'text-foreground placeholder:text-grey-40 h-7 w-full min-w-0 bg-transparent text-base/7 outline-none md:text-sm/7';
/** Panels of the lists: the popover on desktop, the bottom sheet below `sm`; same inner style. */
const panelClass = 'w-[var(--radix-popover-trigger-width)] p-1';

type CityOption = { n: number | null; label: string; code?: string };

/**
 * The arrondissement list (`role="listbox"`, multi-select): « Tout Paris » then the arrondissements matching the query;
 * `highlighted` is driven by the keyboard from the cell's input (`aria-activedescendant`). Rows are toggled on click
 * without stealing the input's focus (`onMouseDown` prevented).
 */
function CityList({
    id,
    options,
    cities,
    highlighted,
    onHighlight,
    onToggle,
    empty,
    className,
}: {
    id: string;
    options: CityOption[];
    cities: number[];
    highlighted: number;
    onHighlight: (i: number) => void;
    onToggle: (n: number | null) => void;
    empty: string;
    className?: string;
}) {
    return (
        <div id={id} role="listbox" aria-multiselectable className={cn('max-h-72 overflow-y-auto', className)}>
            {options.length === 0 && <p className="text-muted-foreground px-2 py-6 text-center text-sm">{empty}</p>}
            {options.map((option, i) => {
                const selected = option.n === null ? cities.length === 0 : cities.includes(option.n);
                return (
                    <div
                        key={option.n ?? 'all'}
                        id={`${id}-${option.n ?? 'all'}`}
                        role="option"
                        aria-selected={selected}
                        data-highlighted={highlighted === i || undefined}
                        onMouseDown={(e) => e.preventDefault()}
                        onMouseEnter={() => onHighlight(i)}
                        onClick={() => onToggle(option.n)}
                        className={cn(itemClass, 'data-highlighted:bg-accent data-highlighted:text-accent-foreground')}
                    >
                        <span className="flex-1">{option.label}</span>
                        {option.code && <span className="text-muted-foreground tabular-nums">{option.code}</span>}
                        <Check aria-hidden className={cn('absolute right-2 size-4', selected ? 'opacity-100' : 'opacity-0')} />
                    </div>
                );
            })}
        </div>
    );
}

/** Footer of the city list: the live count of chosen arrondissements and an explicit « Terminé ». */
function CityFooter({ count, onDone }: { count: number; onDone: () => void }) {
    const { t, tc } = useTranslation();
    return (
        <div className="border-border flex items-center justify-between gap-3 border-t p-1 pl-2">
            <span role="status" className="text-muted-foreground text-xs">
                {count === 0 ? t('home.search_city_all') : tc('home.search_city_count', count, { count })}
            </span>
            <Button type="button" size="sm" variant="outline" onClick={onDone}>
                {t('home.search_city_done')}
            </Button>
        </div>
    );
}

/** The quick amounts of the budget: a heading and one row per amount, the current one checked. */
function BudgetList({
    items,
    value,
    onPick,
    label,
}: {
    items: { value: string; label: string }[];
    value: string;
    onPick: (v: string) => void;
    label: string;
}) {
    return (
        <>
            <p className="text-muted-foreground px-2 py-1.5 text-xs">{label}</p>
            <ul role="list">
                {items.map((item) => (
                    <li key={item.value}>
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()} // keep the input's focus
                            onClick={() => onPick(item.value)}
                            className={cn(itemClass, 'hover:bg-accent focus-visible:bg-accent cursor-pointer tabular-nums outline-none')}
                        >
                            <span className="flex-1 text-left">{item.label}</span>
                            <Check aria-hidden className={cn('absolute right-2 size-4', value === item.value ? 'opacity-100' : 'opacity-0')} />
                        </button>
                    </li>
                ))}
            </ul>
        </>
    );
}

/** Title of the block: the site's h1 scale (the former hero h1 sizes), mixed case with a light tracking (user decisions 2026-09-25). */
const TITLE = 'font-heading text-center text-3xl/11 font-semibold tracking-wide text-balance text-white drop-shadow-md sm:text-4xl/13 lg:text-5xl/16';

type HeroSearchProps = {
    className?: string;
    /** Number of properties currently on offer (`config('seo.listings_count')`, real figure only); null hides the line. */
    listings?: number | null;
};

/**
 * Search bar of the home hero (Figma 712-25068 desktop / 712-25576 mobile, integrated 2026-09-25 with no logic — user
 * decision: no search page yet, the submit only prevents the default). Two criteria, city / postal code and max budget.
 * - City = a multi-select typed **directly in the cell** (user decision 2026-09-25, « fais tout de 1 à 5 »): the input is a
 *   combobox over the arrondissements (« 16 », « 16e », « 75016 », « Paris 6 »); arrows highlight, Enter toggles the
 *   highlighted row and clears the text, Backspace on an empty text removes the last pill, Escape closes. Each chosen
 *   arrondissement is a square sand pill with its own « × »; a « Tout Paris » pill stands for no filter; the pills
 *   stay on one line and collapse to the last picked one + « +N » when they would overflow (measured on an invisible
 *   twin). The list has a footer with the live count and « Terminé ».
 * - Budget = digit-only input grouping its thousands, with quick amounts offered while it has the focus.
 * - Below `sm` both lists open in a **bottom sheet** (with their own input) instead of a popover the keyboard would cover.
 * - Under the card: the number of properties on offer when known (`listings`, real figure from the config). The
 *   suggested searches were built then removed the same day (user decision).
 * - The criteria are **remembered for the session** (`useSearchDraft`, `sessionStorage`).
 * Every control has a `name` (`city[]`, `budget`) for the future GET to the results page.
 */
type SearchBlockProps = {
    small: boolean;
    listings: number | null;
    cities: number[];
    setCities: (update: number[] | ((c: number[]) => number[])) => void;
    budget: string;
    setBudget: (value: string) => void;
};

/** The card, its lists and the suggestions for one style (the criteria live in `HeroSearch`, shared by every copy). */
function SearchBlock({ small, listings, cities, setCities, budget, setBudget }: SearchBlockProps) {
    const { t, tc, locale } = useTranslation();
    const id = useId();
    const toggleCity = (n: number | null) => {
        if (n === null) setCities([]);
        else setCities((c) => (c.includes(n) ? c.filter((x) => x !== n) : [...c, n]));
    };
    const clearLabel = (field: string) => t('home.search_clear', { field });

    // --- city combobox ----------------------------------------------------------------------------------------------
    const [query, setQuery] = useState('');
    const [cityOpen, setCityOpen] = useState(false);
    const [highlighted, setHighlighted] = useState(0);
    const cityInput = useRef<HTMLInputElement>(null);
    const cityCellRef = useRef<HTMLDivElement>(null);
    const budgetCellRef = useRef<HTMLDivElement>(null);
    const listId = `${id}-city-list`;
    const options: CityOption[] = [
        ...(query.trim() === '' ? [{ n: null, label: t('home.search_city_all') }] : []),
        ...ARRONDISSEMENTS.filter((n) => matchesCity(query, n, locale)).map((n) => ({
            n,
            label: `Paris ${ordinal(n, locale)}`,
            code: postalCode(n),
        })),
    ];
    useEffect(() => setHighlighted(0), [query]);
    const closeCity = () => {
        setCityOpen(false);
        setQuery('');
    };
    const onCityKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            setCityOpen(true);
            if (options.length === 0) return;
            setHighlighted((h) => (h + (e.key === 'ArrowDown' ? 1 : options.length - 1)) % options.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const option = options[highlighted];
            if (option) {
                toggleCity(option.n);
                setQuery('');
            }
        } else if (e.key === 'Backspace' && query === '' && cities.length > 0) {
            setCities((c) => c.slice(0, -1));
        } else if (e.key === 'Escape') {
            closeCity();
        } else if (e.key === 'Tab') {
            setCityOpen(false);
        }
    };

    // Pills stay on one line (user decision 2026-09-25): an invisible twin row holding every pill and the input is
    // measured against the visible row; when it would overflow, only the last picked pill and a « +N » badge are shown.
    const rowRef = useRef<HTMLDivElement>(null);
    const measureRef = useRef<HTMLDivElement>(null);
    const [collapsed, setCollapsed] = useState(false);
    useLayoutEffect(() => {
        const measure = () => {
            const row = rowRef.current;
            const twin = measureRef.current;
            if (!row || !twin) return;
            setCollapsed(cities.length > 1 && twin.scrollWidth > row.clientWidth);
        };
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [cities]);
    const shown = collapsed ? cities.slice(-1) : cities;
    const hidden = cities.length - shown.length;
    const pill = (n: number) => (
        <Badge key={n} variant="outline" className={cn(pillClass, 'gap-1 pr-0.5')}>
            Paris {ordinal(n, locale)}
            <button
                type="button"
                aria-label={t('home.search_remove', { city: `Paris ${ordinal(n, locale)}` })}
                onClick={() => toggleCity(n)}
                className="focus-ring hover:bg-background-05 hover:text-foreground flex size-4 items-center justify-center rounded-none"
            >
                <X aria-hidden className="size-3" />
            </button>
        </Badge>
    );

    // --- budget -----------------------------------------------------------------------------------------------------
    const [budgetOpen, setBudgetOpen] = useState(false);
    const budgetItems = BUDGETS.map((n) => ({ value: groupThousands(String(n), locale), label: `${groupThousands(String(n), locale)} €` }));
    const pickBudget = (v: string) => {
        setBudget(v);
        setBudgetOpen(false);
    };

    const cityCell = (
        <Cell ref={cityCellRef}>
            <label htmlFor={`${id}-city`} className={labelClass}>
                {t('home.search_city')}
            </label>
            {cities.map((n) => (
                <input key={n} type="hidden" name="city[]" value={n} />
            ))}
            <div className="flex w-full items-center gap-3">
                {/* Invisible twin of the row, measured to decide the collapse (never read by assistive tech) */}
                <div
                    ref={measureRef}
                    aria-hidden
                    className="pointer-events-none invisible absolute inset-x-5 flex items-center gap-2 overflow-hidden sm:inset-x-6"
                >
                    {cities.map(pill)}
                    <span className="w-24 shrink-0" />
                </div>
                <div ref={rowRef} className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                    {cities.length === 0 && (
                        <Badge variant="outline" className={pillClass}>
                            {t('home.search_city_all')}
                        </Badge>
                    )}
                    {shown.map(pill)}
                    {hidden > 0 && (
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()} // the focus stays in the cell's input
                            onClick={() => {
                                cityInput.current?.focus();
                                setCityOpen(true);
                            }}
                            aria-label={t('home.search_city_others', {
                                count: hidden,
                                list: cities
                                    .slice(0, -1)
                                    .map((n) => `Paris ${ordinal(n, locale)}`)
                                    .join(', '),
                            })}
                            className={cn(badgeVariants({ variant: 'outline' }), pillClass, 'focus-ring hover:bg-background-05 tabular-nums')}
                        >
                            +{hidden}
                        </button>
                    )}
                    {/* The combobox input, typed in the cell itself; below sm it only opens the sheet */}
                    <input
                        ref={cityInput}
                        id={`${id}-city`}
                        type="text"
                        role="combobox"
                        aria-expanded={cityOpen}
                        aria-controls={listId}
                        aria-autocomplete="list"
                        aria-activedescendant={cityOpen && options[highlighted] ? `${listId}-${options[highlighted].n ?? 'all'}` : undefined}
                        autoComplete="off"
                        readOnly={small}
                        placeholder={cities.length === 0 ? t('home.search_city_hint') : t('home.search_city_more')}
                        value={small ? '' : query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setCityOpen(true);
                        }}
                        onFocus={() => setCityOpen(true)}
                        onClick={() => setCityOpen(true)}
                        onKeyDown={small ? undefined : onCityKeyDown}
                        className={cn(controlClass, 'min-w-24 flex-1 text-sm/7')}
                    />
                </div>
                {cities.length > 0 && <ClearButton label={clearLabel(t('home.search_city'))} onClick={() => setCities([])} />}
            </div>
        </Cell>
    );

    const budgetCell = (
        <Cell ref={budgetCellRef}>
            <label htmlFor={`${id}-budget`} className={labelClass}>
                {t('home.search_budget')}
            </label>
            <div className="flex w-full items-center gap-3">
                <input
                    id={`${id}-budget`}
                    name="budget"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    readOnly={small}
                    placeholder={t('home.search_budget_placeholder')}
                    value={budget}
                    onChange={(e) => setBudget(groupThousands(e.target.value, locale))}
                    onFocus={() => setBudgetOpen(true)}
                    onClick={() => setBudgetOpen(true)}
                    onKeyDown={(e) => (e.key === 'Tab' || e.key === 'Escape') && setBudgetOpen(false)}
                    className={cn(controlClass, 'flex-1 tabular-nums')}
                />
                {budget && <ClearButton label={clearLabel(t('home.search_budget'))} onClick={() => setBudget('')} />}
                <span aria-hidden className="text-grey-40 text-sm">
                    €
                </span>
            </div>
        </Cell>
    );

    return (
        <>
            <div className="flex flex-col gap-4">
                {/* White card edged in sand: the two cells (stacked on mobile, one row from sm) then the square button flush with the edge */}
                <div className="bg-card border-secondary-30 relative flex flex-col border sm:flex-row">
                    <div className="flex min-w-0 flex-col sm:min-h-18 sm:flex-1 sm:flex-row sm:items-stretch">
                        {small ? (
                            cityCell
                        ) : (
                            // Desktop: the list is a popover anchored on the whole cell, at the cell's width (contact dropdown style)
                            <Popover open={cityOpen} onOpenChange={(open) => (open ? setCityOpen(true) : closeCity())}>
                                <PopoverAnchor asChild>{cityCell}</PopoverAnchor>
                                <PopoverContent
                                    align="start"
                                    sideOffset={8}
                                    onOpenAutoFocus={(e) => e.preventDefault()}
                                    onFocusOutside={(e) => e.preventDefault()} // the focus stays in the cell's input
                                    onInteractOutside={(e) => cityCellRef.current?.contains(e.target as Node) && e.preventDefault()} // the cell (pills, ×, « +N ») is not « outside »
                                    className={panelClass}
                                >
                                    <CityList
                                        id={listId}
                                        options={options}
                                        cities={cities}
                                        highlighted={highlighted}
                                        onHighlight={setHighlighted}
                                        onToggle={(n) => {
                                            toggleCity(n);
                                            setQuery('');
                                            cityInput.current?.focus();
                                        }}
                                        empty={t('home.search_city_empty')}
                                    />
                                    <CityFooter count={cities.length} onDone={closeCity} />
                                </PopoverContent>
                            </Popover>
                        )}
                        <Divider />
                        {small ? (
                            budgetCell
                        ) : (
                            <Popover open={budgetOpen} onOpenChange={setBudgetOpen}>
                                <PopoverAnchor asChild>{budgetCell}</PopoverAnchor>
                                <PopoverContent
                                    align="start"
                                    sideOffset={8}
                                    onOpenAutoFocus={(e) => e.preventDefault()}
                                    onFocusOutside={(e) => e.preventDefault()}
                                    onInteractOutside={(e) => budgetCellRef.current?.contains(e.target as Node) && e.preventDefault()}
                                    className={panelClass}
                                >
                                    <BudgetList items={budgetItems} value={budget} onPick={pickBudget} label={t('home.search_budget_shortcuts')} />
                                </PopoverContent>
                            </Popover>
                        )}
                    </div>
                    {/* Primary button, magnifier only (user decision 2026-09-25); the text stays as its accessible name */}
                    <Button type="submit" size="lg" aria-label={t('home.search_cta')} className="w-full sm:h-auto sm:w-18 sm:self-stretch sm:px-0">
                        <Search aria-hidden className="size-5" />
                    </Button>
                </div>
                {/* Under the card: the properties on offer (real figure only, hidden without one) */}
                {listings !== null && (
                    <p className="text-center text-sm text-white/90 drop-shadow-sm">{tc('home.search_listings', listings, { count: listings })}</p>
                )}
            </div>

            {/* Below sm: the lists open in bottom sheets with their own input (a popover would sit under the keyboard) */}
            {small && (
                <>
                    <Sheet open={cityOpen} onOpenChange={(open) => (open ? setCityOpen(true) : closeCity())}>
                        <SheetContent side="bottom" hideClose className="bg-card flex max-h-[85dvh] flex-col gap-0 p-0">
                            <SheetTitle className="px-4 pt-4 text-base font-medium">{t('home.search_city')}</SheetTitle>
                            <SheetDescription className="sr-only">{t('home.search_city_hint')}</SheetDescription>
                            <div className="p-4 pt-3">
                                <input
                                    type="text"
                                    role="combobox"
                                    aria-expanded
                                    aria-controls={`${listId}-sheet`}
                                    aria-autocomplete="list"
                                    aria-label={t('home.search_city_hint')}
                                    autoFocus
                                    autoComplete="off"
                                    inputMode="numeric"
                                    placeholder={t('home.search_city_hint')}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={onCityKeyDown}
                                    className="border-border bg-card focus-visible:ring-ring/50 h-12 w-full border px-4 text-base outline-none focus-visible:ring-[3px]"
                                />
                            </div>
                            <CityList
                                id={`${listId}-sheet`}
                                options={options}
                                cities={cities}
                                highlighted={highlighted}
                                onHighlight={setHighlighted}
                                onToggle={(n) => {
                                    toggleCity(n);
                                    setQuery('');
                                }}
                                empty={t('home.search_city_empty')}
                                className="max-h-none flex-1 px-1 [&_[role=option]]:py-3"
                            />
                            <div className="pb-[env(safe-area-inset-bottom)]">
                                <CityFooter count={cities.length} onDone={closeCity} />
                            </div>
                        </SheetContent>
                    </Sheet>
                    <Sheet open={budgetOpen} onOpenChange={setBudgetOpen}>
                        <SheetContent side="bottom" hideClose className="bg-card flex max-h-[85dvh] flex-col gap-0 p-0">
                            <SheetTitle className="px-4 pt-4 text-base font-medium">{t('home.search_budget')}</SheetTitle>
                            <SheetDescription className="sr-only">{t('home.search_budget_shortcuts')}</SheetDescription>
                            <div className="relative p-4 pt-3">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    aria-label={t('home.search_budget')}
                                    autoFocus
                                    autoComplete="off"
                                    placeholder={t('home.search_budget_placeholder')}
                                    value={budget}
                                    onChange={(e) => setBudget(groupThousands(e.target.value, locale))}
                                    onKeyDown={(e) => e.key === 'Enter' && setBudgetOpen(false)}
                                    className="border-border bg-card focus-visible:ring-ring/50 h-12 w-full border px-4 pr-10 text-base tabular-nums outline-none focus-visible:ring-[3px]"
                                />
                                <span aria-hidden className="text-grey-40 absolute inset-y-0 right-8 flex items-center text-sm">
                                    €
                                </span>
                            </div>
                            <div className="px-1 [&_li_button]:py-3">
                                <BudgetList items={budgetItems} value={budget} onPick={pickBudget} label={t('home.search_budget_shortcuts')} />
                            </div>
                            <div className="border-border flex justify-end border-t p-1 pb-[calc(0.25rem+env(safe-area-inset-bottom))]">
                                <Button type="button" size="sm" variant="outline" onClick={() => setBudgetOpen(false)}>
                                    {t('home.search_city_done')}
                                </Button>
                            </div>
                        </SheetContent>
                    </Sheet>
                </>
            )}
        </>
    );
}

export default function HeroSearch({ className, listings = null }: HeroSearchProps) {
    const { t, locale } = useTranslation();
    const small = useMediaQuery(SMALL_SCREEN);
    const [cities, setCities] = useState<number[]>([]);
    const [budget, setBudget] = useState('');
    useSearchDraft({ cities, budget }, (draft) => {
        setCities(draft.cities);
        setBudget(groupThousands(draft.budget, locale));
    });
    const onSubmit = (e: FormEvent<HTMLFormElement>) => e.preventDefault();

    return (
        <form role="search" aria-label={t('home.search_label')} onSubmit={onSubmit} className={cn('mx-auto w-full max-w-3xl', className)}>
            <div className="flex w-full flex-col gap-6 sm:gap-8">
                <p className={TITLE}>{t('home.search_title')}</p>
                <SearchBlock small={small} listings={listings} cities={cities} setCities={setCities} budget={budget} setBudget={setBudget} />
            </div>
        </form>
    );
}
