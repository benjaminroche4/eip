import { rise } from '@/components/home/hero-rise';
import GradientHairline from '@/components/layout/gradient-hairline';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { useSearchDraft } from '@/hooks/use-search-draft';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { Check, Plus, Search, X } from 'lucide-react';
import {
    type CSSProperties,
    type FormEvent,
    Fragment,
    type KeyboardEvent,
    type ReactNode,
    type Ref,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';

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

/** Separator between cells, in sand like the card's edge: a horizontal hairline on mobile, a full-height sand rule from `sm` (user decision 2026-09-25). */
function Divider() {
    return (
        <>
            <GradientHairline className="via-secondary-30 sm:hidden" />
            <span aria-hidden className="bg-secondary-30 hidden w-px self-stretch sm:block" />
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

/** Small label above the value, in spaced capitals (ui.sh « libellés en capitales », user decision 2026-09-25). */
const labelClass = 'text-muted-foreground text-[0.6875rem] font-medium tracking-wider uppercase';
/** The value row of a cell (pills + input, or the amount). */
const valueRowClass = 'flex w-full items-center gap-3';
/** Rows of the lists, as the contact form's Select items: compact, check on the right. */
const itemClass = 'relative flex w-full cursor-default items-center py-1.5 pr-8 pl-2 text-sm select-none';
/** The city pills = the site's outline badge, square, on the sand card gradient (sand hairline, background-08 → 05 — user decision 2026-09-25). */
const pillClass =
    'border-secondary-30 from-background-08 to-background-05 text-foreground focus-within:ring-ring/50 shrink-0 rounded-none bg-linear-to-b whitespace-nowrap focus-within:ring-[3px]';
const controlClass = 'text-foreground placeholder:text-grey-40 h-7 w-full min-w-0 bg-transparent text-base/7 outline-none md:text-sm/7';
/** Panels of the lists: the popover on desktop, the bottom sheet below `sm`; same inner style. */
const panelClass = 'animate-panel-in w-[var(--radix-popover-trigger-width)] p-1 motion-reduce:animate-none';

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
            {/* Round sand counter (user decision 2026-09-25); the sentence stays for assistive tech */}
            <span role="status" className="flex items-center gap-2">
                {count > 0 && (
                    <span
                        key={count}
                        aria-hidden
                        className="bg-secondary-30 text-foreground animate-pop flex size-6 items-center justify-center rounded-full text-xs font-medium tabular-nums motion-reduce:animate-none"
                    >
                        {count}
                    </span>
                )}
                <span className={cn('text-muted-foreground text-xs', count > 0 && 'sr-only')}>
                    {count === 0 ? t('home.search_city_all') : tc('home.search_city_count', count, { count })}
                </span>
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
/** Word-by-word reveal of the title: first word at the cascade's step 0 (300 ms), then 40 ms per word. */
const TITLE_AT_MS = 300;
const WORD_MS = 40;
const TITLE = 'font-heading text-center text-3xl/11 font-semibold tracking-wide text-balance text-white drop-shadow-md sm:text-4xl/13 lg:text-5xl/16';

type HeroSearchProps = { className?: string };

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
 * - Below `sm` the arrondissement list opens in a **classic bottom sheet** (no search field, nothing focused: the keyboard
 *   never opens — user decision 2026-09-25); the budget keeps the amounts popover at every width.
 * - Nothing under the card any more: the suggested searches, then the proof line (properties on offer / sold, Google
 *   rating) were built then removed the same day (user decisions 2026-09-25).
 * - The criteria are **remembered for the session** (`useSearchDraft`, `sessionStorage`).
 * - Motion (user decision 2026-09-25, all `motion-reduce`-safe): title written word by word (`manifesto-in`, 40 ms per word from 300 ms), card and trust
 *   row rising in cascade (`hero-rise` steps 1 and 3), a pill pops in and fades out before leaving (`pop` / `pill-out`), the panels
 *   rise 4px in fade (`panel-in`), the counter pops on each change, the magnifier nudges up-right and turns sand on hover, and one
 *   light sweep crosses the card 1.4 s after load (`sweep-shimmer`, single pass).
 * Every control has a `name` (`city[]`, `budget`) for the future GET to the results page.
 */
type SearchBlockProps = {
    small: boolean;
    cities: number[];
    setCities: (update: number[] | ((c: number[]) => number[])) => void;
    budget: string;
    setBudget: (value: string) => void;
};

/** The card and its lists (the criteria live in `HeroSearch`, with the session draft). */
function SearchBlock({ small, cities, setCities, budget, setBudget }: SearchBlockProps) {
    const { t, locale } = useTranslation();
    const id = useId();
    // A removed pill fades and shrinks for 200 ms before leaving (immediately under reduced motion)
    const [leaving, setLeaving] = useState<number[]>([]);
    const removeCity = (n: number) => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setCities((c) => c.filter((x) => x !== n));
            return;
        }
        setLeaving((l) => [...l, n]);
        window.setTimeout(() => {
            setCities((c) => c.filter((x) => x !== n));
            setLeaving((l) => l.filter((x) => x !== n));
        }, 200);
    };
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
    const [cityFocused, setCityFocused] = useState(false);
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
        <Badge
            key={n}
            variant="outline"
            className={cn(pillClass, 'gap-1 pr-0.5', leaving.includes(n) ? 'animate-pill-out' : 'animate-pop', 'motion-reduce:animate-none')}
        >
            Paris {ordinal(n, locale)}
            <button
                type="button"
                aria-label={t('home.search_remove', { city: `Paris ${ordinal(n, locale)}` })}
                onClick={() => removeCity(n)}
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
            <div className={valueRowClass}>
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
                    {/* The combobox input, typed in the cell itself; below sm it only opens the sheet. While it is empty, a
                        « + Ajouter » button sits in its place (pointer affordance, the input stays the keyboard control — user decision 2026-09-25) */}
                    <div className="relative flex min-w-24 flex-1 items-center">
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
                            inputMode={small ? 'none' : undefined} // mobile: the cell only opens the list, never the keyboard (user decision 2026-09-25)
                            // at rest the « + Ajouter » button sits in the empty field; once focused, the field says what to type (user decision 2026-09-25)
                            placeholder={!small && cityFocused ? t('home.search_city_hint') : undefined}
                            value={small ? '' : query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setCityOpen(true);
                            }}
                            onFocus={() => {
                                setCityFocused(true);
                                setCityOpen(true);
                            }}
                            onBlur={() => setCityFocused(false)}
                            onClick={() => setCityOpen(true)}
                            onKeyDown={small ? undefined : onCityKeyDown}
                            className={cn(controlClass, 'w-full text-sm/7')}
                        />
                        {(small || (query === '' && !cityFocused)) && (
                            <button
                                type="button"
                                tabIndex={-1}
                                aria-hidden
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                    cityInput.current?.focus();
                                    setCityOpen(true);
                                }}
                                className="text-muted-foreground hover:text-foreground absolute left-0 flex items-center gap-1 text-sm/7 transition-colors duration-300 motion-reduce:transition-none"
                            >
                                <Plus aria-hidden className="size-4" />
                                {t('home.search_city_more')}
                            </button>
                        )}
                    </div>
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
            <div className={valueRowClass}>
                <input
                    id={`${id}-budget`}
                    name="budget"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
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
                {/* White card edged in sand with a translucent white halo (ui.sh mix of « libellés en capitales » and « halo blanc », user
                    decision 2026-09-25): the two cells (stacked on mobile, one row from sm) then the square button flush with the edge */}
                <div
                    style={rise(1).style}
                    className={cn(
                        'bg-card border-secondary-30 relative flex flex-col overflow-hidden border ring-4 ring-white/25',
                        rise(1).className,
                    )}
                >
                    {/* One light sweep across the card once it has risen (the header button's shimmer, a single pass — user decision 2026-09-25) */}
                    <span
                        aria-hidden
                        className="via-secondary-30/70 animate-sweep-shimmer pointer-events-none absolute inset-y-0 left-0 z-10 w-1/2 bg-linear-to-r from-transparent to-transparent blur-[2px] [animation-delay:1400ms] [animation-fill-mode:both] [animation-iteration-count:1] motion-reduce:hidden"
                    />
                    <div className="flex flex-col sm:flex-row">
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
                            {/* Budget: the same popover of quick amounts at every width (a number field may open the keyboard) */}
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
                        </div>
                        {/* Primary button, magnifier only (user decision 2026-09-25); the text stays as its accessible name */}
                        <Button
                            type="submit"
                            size="lg"
                            aria-label={t('home.search_cta')}
                            className="group w-full sm:h-auto sm:w-18 sm:self-stretch sm:px-0"
                        >
                            {/* Mobile: a plain conversion text next to the magnifier (user decision 2026-09-25); icon only from sm */}
                            <span className="sm:sr-only">{t('home.search_cta_short')}</span>
                            <Search
                                aria-hidden
                                className="group-hover:text-secondary-60 size-5 transition-[transform,color] duration-300 group-hover:translate-x-px group-hover:-translate-y-px motion-reduce:transition-none"
                            />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Below sm: the arrondissement list opens in a classic bottom sheet (no field, no keyboard) */}
            {small && (
                <>
                    <Sheet open={cityOpen} onOpenChange={(open) => (open ? setCityOpen(true) : closeCity())}>
                        <SheetContent
                            side="bottom"
                            hideClose
                            onOpenAutoFocus={(e) => e.preventDefault()} // classic list: nothing takes the focus, so no keyboard (user decision 2026-09-25)
                            className="bg-card flex max-h-[85dvh] flex-col gap-0 p-0"
                        >
                            <SheetTitle className="px-4 pt-4 text-base font-medium">{t('home.search_city')}</SheetTitle>
                            <SheetDescription className="sr-only">{t('home.search_city_hint')}</SheetDescription>
                            <CityList
                                id={`${listId}-sheet`}
                                options={options}
                                cities={cities}
                                highlighted={-1} // no keyboard here: no highlighted row (a hover state would linger under the finger)
                                onHighlight={setHighlighted}
                                onToggle={(n) => {
                                    toggleCity(n);
                                    setQuery('');
                                }}
                                empty={t('home.search_city_empty')}
                                className="max-h-none flex-1 px-1 pt-2 [&_[role=option]]:py-3"
                            />
                            <div className="pb-[env(safe-area-inset-bottom)]">
                                <CityFooter count={cities.length} onDone={closeCity} />
                            </div>
                        </SheetContent>
                    </Sheet>
                </>
            )}
        </>
    );
}

export default function HeroSearch({ className }: HeroSearchProps) {
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
                {/* The title is written word by word (the manifesto's reveal: slight 3D tilt + blur dissipating, 40 ms per word,
                    starting at the cascade's first step) — user decision 2026-09-25 */}
                <p className={TITLE}>
                    {t('home.search_title')
                        .split(' ')
                        .map((word, i) => (
                            <Fragment key={i}>
                                {i > 0 && ' '}
                                <span
                                    style={{ '--stagger': `${TITLE_AT_MS + i * WORD_MS}ms` } as CSSProperties}
                                    className="animate-manifesto-in inline-block [animation-delay:var(--stagger)] motion-reduce:animate-none"
                                >
                                    {word}
                                </span>
                            </Fragment>
                        ))}
                </p>
                <SearchBlock small={small} cities={cities} setCities={setCities} budget={budget} setBudget={setBudget} />
            </div>
        </form>
    );
}
