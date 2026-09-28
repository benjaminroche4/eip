import GradientHairline from '@/components/layout/gradient-hairline';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { useTranslation } from '@/hooks/use-translation';
import { groupThousands } from '@/lib/format-price';
import { ordinal } from '@/lib/ordinal';
import { neighbourhoodsMatching } from '@/lib/paris-neighbourhoods';
import { cn } from '@/lib/utils';
import {
    ArrowUpRight,
    Briefcase,
    Building2,
    Check,
    Home,
    Key,
    KeyRound,
    Landmark,
    LayoutGrid,
    MapPin,
    Plus,
    Search,
    Wallet,
    Warehouse,
    X,
    type LucideIcon,
} from 'lucide-react';
import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode, type Ref } from 'react';

export const ARRONDISSEMENTS = Array.from({ length: 20 }, (_, i) => i + 1);
/** Property types of the listing (keys of `properties.types`). */
export const PROPERTY_TYPES = ['apartment', 'house', 'mansion', 'loft'] as const;
/** Icons of the filters (user decision 2026-09-28): one per property type. */
const TYPE_ICONS: Record<(typeof PROPERTY_TYPES)[number], LucideIcon> = { apartment: Building2, house: Home, mansion: Landmark, loft: Warehouse };
export type Transaction = 'sale' | 'rent';
/** Quick monthly rents (euros) offered under the budget cell when renting. */
export const RENTS = [2_000, 3_000, 4_000, 6_000, 8_000, 12_000];
/** Quick budgets (euros) offered under the budget cell. */
export const BUDGETS = [400_000, 600_000, 800_000, 1_000_000, 1_500_000, 2_000_000, 3_000_000, 5_000_000];
const postalCode = (n: number) => `750${String(n).padStart(2, '0')}`;
/** Does the typed text match an arrondissement? « 16 », « 16e », « 75016 », « paris 6 »… */
const matchesCity = (query: string, n: number, locale: string): boolean => {
    const q = query.toLowerCase().replace(/paris/g, '').replace(/[\s-]/g, '');
    if (!q) return true;
    // the postal code only counts from three digits (« 7 » must not match every 750xx)
    const candidates = [String(n), ordinal(n, locale).toLowerCase(), ...(q.length >= 3 ? [postalCode(n)] : [])];
    return candidates.some((candidate) => candidate.startsWith(q));
};

/** One cell of the bar: permanent small label above the value, sand background while hovered or focused. */
export function Cell({ children, className, ref }: { children: ReactNode; className?: string; ref?: Ref<HTMLDivElement> }) {
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
export function Divider({ vertical = false, horizontal = false }: { vertical?: boolean; horizontal?: boolean }) {
    if (vertical) return <span aria-hidden className="bg-secondary-30 w-px self-stretch" />;
    if (horizontal) return <GradientHairline className="via-secondary-30" />;
    return (
        <>
            <GradientHairline className="via-secondary-30 sm:hidden" />
            <span aria-hidden className="bg-secondary-30 hidden w-px self-stretch sm:block" />
        </>
    );
}

/** The « × » that empties a cell, shown only when it holds a value. */
export function ClearButton({ label, onClick, className }: { label: string; onClick: () => void; className?: string }) {
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
export const labelClass = 'text-muted-foreground text-[0.6875rem] font-medium tracking-wider uppercase';
/** Compact mode: the cell is a thin row, side by side with the others at every width. */
const compactCellClass = 'flex-1 px-4 py-3 sm:px-4 sm:py-3';
/** The value row of a cell (pills + input, or the amount). */
export const valueRowClass = 'flex min-h-7 w-full items-center gap-3';
/** Rows of the lists, as the contact form's Select items: compact, check on the right. */
export const itemClass = 'relative flex w-full cursor-default items-center py-1.5 pr-8 pl-2 text-sm select-none';
/** The city pills = the site's outline badge, square, on the sand card gradient (sand hairline, background-08 → 05 — user decision 2026-09-25). */
export const pillClass =
    'border-secondary-30 from-background-08 to-background-05 text-foreground focus-within:ring-ring/50 shrink-0 rounded-none bg-linear-to-b whitespace-nowrap focus-within:ring-[3px]';
export const controlClass = 'text-foreground placeholder:text-grey-40 h-7 w-full min-w-0 bg-transparent text-base/7 outline-none md:text-sm/7';
/** Panels of the lists: the popover on desktop, the bottom sheet below `sm`; same inner style. */
export const panelClass = 'animate-panel-in w-[var(--radix-popover-trigger-width)] p-1 motion-reduce:animate-none';

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
function CityFooter({ count, onDone, doneLabel }: { count: number; onDone: () => void; doneLabel?: string }) {
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
                    {count === 0 ? t('search_bar.city_all') : tc('search_bar.city_count', count, { count })}
                </span>
            </span>
            <Button type="button" size="sm" variant="outline" onClick={onDone}>
                {doneLabel ?? t('search_bar.city_done')}
            </Button>
        </div>
    );
}

/** The quick amounts of the budget: a heading and one row per amount, the current one checked. */
export function BudgetList({
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

/** A choice pill of the direct-pick cells: the sand outline pill at rest, the dark primary when chosen. */
export const choicePillClass = (chosen: boolean) =>
    cn(
        badgeVariants({ variant: 'outline' }),
        'focus-ring cursor-pointer rounded-none whitespace-nowrap transition-colors duration-300 motion-reduce:transition-none',
        chosen
            ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90 bg-none'
            : cn(pillClass, 'hover:bg-background-05 hover:bg-none'),
    );

/**
 * Single-choice cell with every option in view (user decision 2026-09-28, « simplifier les inputs pour faciliter le
 * clic » — a dropdown for two values was one tap too many): a `radiogroup` of pills, the chosen one dark; arrows move
 * the choice, the row wraps when the cell is stacked.
 */
export function RadioPillsCell({
    id,
    name,
    label,
    icon: Icon,
    value,
    options,
    onChange,
    className,
}: {
    id: string;
    name: string;
    label: string;
    icon?: LucideIcon;
    value: string;
    options: { value: string; label: string; icon?: LucideIcon }[];
    onChange: (value: string) => void;
    className?: string;
}) {
    const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
        const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (delta === 0) return;
        e.preventDefault();
        const next = options[(i + delta + options.length) % options.length];
        onChange(next.value);
        (e.currentTarget.parentElement?.children[options.indexOf(next)] as HTMLElement | undefined)?.focus();
    };
    return (
        <Cell className={className}>
            <span id={`${id}-label`} className={cn(labelClass, 'flex items-center gap-1.5')}>
                {Icon && <Icon aria-hidden className="size-3.5" strokeWidth={1.5} />}
                {label}
            </span>
            <input type="hidden" name={name} value={value} />
            <div role="radiogroup" aria-labelledby={`${id}-label`} className="flex flex-wrap gap-2">
                {options.map((option, i) => (
                    <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={option.value === value}
                        tabIndex={option.value === value ? 0 : -1}
                        onClick={() => onChange(option.value)}
                        onKeyDown={(e) => onKeyDown(e, i)}
                        className={cn(choicePillClass(option.value === value), option.icon && 'gap-1.5')}
                    >
                        {option.icon && <option.icon aria-hidden className="size-3.5" strokeWidth={1.5} />}
                        {option.label}
                    </button>
                ))}
            </div>
        </Cell>
    );
}

/**
 * Multi-choice cell with every option in view (user decision 2026-09-28, same reason as `RadioPillsCell`): one toggle
 * pill per option (`aria-pressed`), dark when kept, plus a « Tous » pill that empties the choice and reads as pressed
 * while nothing is kept.
 */
export function TogglePillsCell({
    id,
    name,
    label,
    icon: Icon,
    values,
    options,
    onChange,
    allLabel,
    className,
}: {
    id: string;
    name: string;
    label: string;
    icon?: LucideIcon;
    values: string[];
    options: { value: string; label: string; sr?: string; icon?: LucideIcon }[];
    onChange: (values: string[]) => void;
    allLabel: string;
    className?: string;
}) {
    const toggle = (v: string) => onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
    return (
        <Cell className={className}>
            <span id={`${id}-label`} className={cn(labelClass, 'flex items-center gap-1.5')}>
                {Icon && <Icon aria-hidden className="size-3.5" strokeWidth={1.5} />}
                {label}
            </span>
            {values.map((v) => (
                <input key={v} type="hidden" name={`${name}[]`} value={v} />
            ))}
            <div role="group" aria-labelledby={`${id}-label`} className="flex flex-wrap gap-2">
                <button
                    type="button"
                    aria-pressed={values.length === 0}
                    onClick={() => onChange([])}
                    className={choicePillClass(values.length === 0)}
                >
                    {allLabel}
                </button>
                {options.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        aria-pressed={values.includes(option.value)}
                        onClick={() => toggle(option.value)}
                        className={cn(choicePillClass(values.includes(option.value)), option.icon && 'gap-1.5')}
                    >
                        {option.icon && <option.icon aria-hidden className="size-3.5" strokeWidth={1.5} />}
                        {option.sr ? (
                            <>
                                <span aria-hidden>{option.label}</span>
                                <span className="sr-only">{option.sr}</span>
                            </>
                        ) : (
                            option.label
                        )}
                    </button>
                ))}
            </div>
        </Cell>
    );
}

/** The extra criteria of the properties page's bar (user decision 2026-09-25: « plus complète, notamment location / achat »). */
export type ExtendedFilters = {
    transaction: Transaction;
    setTransaction: (value: Transaction) => void;
    /** Property types kept (empty = all). */
    types: string[];
    setTypes: (values: string[]) => void;
    /** Room counts kept, 5 = « 5 et plus » (empty = all). */
    rooms: number[];
    setRooms: (values: number[]) => void;
};

export type SearchBarProps = {
    small: boolean;
    cities: number[];
    setCities: (update: number[] | ((c: number[]) => number[])) => void;
    budget: string;
    setBudget: (value: string) => void;
    /** Adds the transaction toggle, the type and the rooms cells (properties page); the hero keeps the two-criteria bar. */
    extended?: ExtendedFilters;
    /** Two cells side by side at every width, no extended cells, `action` in place of the submit button (sticky mobile bar of the properties page, 2026-09-28). */
    compact?: boolean;
    action?: ReactNode;
    /** One cell per line at every width (the full-screen filters modal of the properties page, 2026-09-28). */
    stacked?: boolean;
    /** Mobile text of the submit button (default « Voir les biens »). */
    ctaLabel?: string;
    /** No submit button inside the card (the modal places its own). */
    hideSubmit?: boolean;
    /** No budget cell (the filters modal carries the price range on top, 2026-09-28). */
    hideBudget?: boolean;
    /** No card around the cells (the modal frames them itself). */
    frameless?: boolean;
    className?: string;
};

/**
 * The search bar's card and its lists — shared by the home hero (two criteria: arrondissements, max budget) and the
 * properties page (extended: achat / location, arrondissements, type, rooms, budget). The criteria live in the parent
 * (session draft on the home, page filters on the listing). See `hero-search.tsx` for the interaction notes.
 */
export default function SearchBar({
    small,
    cities,
    setCities,
    budget,
    setBudget,
    extended,
    compact = false,
    action,
    stacked = false,
    ctaLabel,
    hideSubmit = false,
    hideBudget = false,
    frameless = false,
    className,
}: SearchBarProps) {
    const { t, tc, locale } = useTranslation();
    // Stacked: the `sm:` row layout is overridden so the bar reads like its mobile version at every width
    const stackedCell = stacked ? 'sm:h-auto sm:flex-none sm:px-5 sm:py-4' : undefined;
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
    const clearLabel = (field: string) => t('search_bar.clear', { field });

    // --- city combobox ----------------------------------------------------------------------------------------------
    const [query, setQuery] = useState('');
    const [cityOpen, setCityOpen] = useState(false);
    const [highlighted, setHighlighted] = useState(0);
    const cityInput = useRef<HTMLInputElement>(null);
    const [cityFocused, setCityFocused] = useState(false);
    const cityCellRef = useRef<HTMLDivElement>(null);
    const budgetCellRef = useRef<HTMLDivElement>(null);
    const listId = `${id}-city-list`;
    // A neighbourhood name (« Marais », « Saint-Germain ») offers its arrondissements, the name shown in place of the postal code (2026-09-28)
    const hoods = neighbourhoodsMatching(query);
    const hintFor = (n: number) =>
        hoods
            .filter((h) => h.arrondissements.includes(n))
            .map((h) => h.name)
            .join(', ');
    const options: CityOption[] = [
        ...(query.trim() === '' ? [{ n: null, label: t('search_bar.city_all') }] : []),
        ...ARRONDISSEMENTS.filter((n) => matchesCity(query, n, locale) || hintFor(n) !== '').map((n) => ({
            n,
            label: `Paris ${ordinal(n, locale)}`,
            code: hintFor(n) || postalCode(n),
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
            if (cityOpen) e.stopPropagation();
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
                aria-label={t('search_bar.remove', { city: `Paris ${ordinal(n, locale)}` })}
                onClick={() => removeCity(n)}
                className="focus-ring hover:bg-background-05 hover:text-foreground flex size-4 items-center justify-center rounded-none"
            >
                <X aria-hidden className="size-3" />
            </button>
        </Badge>
    );

    // --- budget -----------------------------------------------------------------------------------------------------
    const [budgetOpen, setBudgetOpen] = useState(false);
    const budgetItems = (extended?.transaction === 'rent' ? RENTS : BUDGETS).map((n) => ({
        value: groupThousands(String(n), locale),
        label: `${groupThousands(String(n), locale)} €${extended?.transaction === 'rent' ? ` ${t('properties.per_month')}` : ''}`,
    }));
    const pickBudget = (v: string) => {
        setBudget(v);
        setBudgetOpen(false);
    };

    const cityCell = (
        <Cell ref={cityCellRef} className={cn(extended && 'sm:flex-[1.4]', compact && cn(compactCellClass, 'flex-[1.3]'), stackedCell)}>
            <label htmlFor={`${id}-city`} className={cn(labelClass, 'flex items-center gap-1.5')}>
                {extended && <MapPin aria-hidden className="size-3.5" strokeWidth={1.5} />}
                {t('search_bar.city')}
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
                            {t('search_bar.city_all')}
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
                            aria-label={t('search_bar.city_others', {
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
                            placeholder={!small && cityFocused ? t('search_bar.city_hint') : undefined}
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
                                <span className={cn(compact && 'sr-only')}>{t('search_bar.city_more')}</span>
                            </button>
                        )}
                    </div>
                </div>
                {cities.length > 0 && <ClearButton label={clearLabel(t('search_bar.city'))} onClick={() => setCities([])} />}
            </div>
        </Cell>
    );

    const budgetCell = (
        <Cell ref={budgetCellRef} className={cn(compact && compactCellClass, stackedCell)}>
            <label htmlFor={`${id}-budget`} className={cn(labelClass, 'flex items-center gap-1.5')}>
                {extended && !compact && <Wallet aria-hidden className="size-3.5" strokeWidth={1.5} />}
                {/* The accessible name stays « Budget maximum »; the compact bar only shortens what is displayed */}
                {compact ? (
                    <>
                        <span aria-hidden>{t('search_bar.budget_short')}</span>
                        <span className="sr-only">{t('search_bar.budget')}</span>
                    </>
                ) : (
                    t('search_bar.budget')
                )}
            </label>
            <div className={valueRowClass}>
                {/* The GET carries the bare digits (a shareable `?budget=2000000`), the visible field keeps its grouped text */}
                {budget !== '' && <input type="hidden" name="budget" value={budget.replace(/\D/g, '')} />}
                <input
                    id={`${id}-budget`}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder={t('search_bar.budget_placeholder')}
                    value={budget}
                    onChange={(e) => setBudget(groupThousands(e.target.value, locale))}
                    onFocus={() => setBudgetOpen(true)}
                    onClick={() => setBudgetOpen(true)}
                    onKeyDown={(e) => {
                        if (e.key !== 'Tab' && e.key !== 'Escape') return;
                        if (e.key === 'Escape' && budgetOpen) e.stopPropagation();
                        setBudgetOpen(false);
                    }}
                    className={cn(controlClass, 'flex-1 tabular-nums')}
                />
                {budget && <ClearButton label={clearLabel(t('search_bar.budget'))} onClick={() => setBudget('')} />}
                <span aria-hidden className="text-grey-40 text-sm">
                    €
                </span>
            </div>
        </Cell>
    );

    return (
        <>
            <div className={cn('flex flex-col gap-4', className)}>
                {/* White card edged in sand: the two cells (stacked on mobile, one row from sm) then the square button flush with the edge */}
                {/* White card edged in sand with a translucent white halo (ui.sh mix of « libellés en capitales » and « halo blanc », user
                    decision 2026-09-25): the two cells (stacked on mobile, one row from sm) then the square button flush with the edge */}
                <div className={cn('relative flex flex-col', frameless ? 'bg-card' : 'bg-card border-secondary-30 border ring-4 ring-white/25')}>
                    <div className={cn('flex sm:flex-row', compact ? 'flex-row' : 'flex-col', stacked && 'sm:flex-col')}>
                        <div
                            className={cn(
                                'flex min-w-0 sm:min-h-18 sm:flex-1 sm:flex-row sm:items-stretch',
                                compact ? 'flex-row items-stretch' : 'flex-col',
                                stacked && 'sm:min-h-0 sm:flex-col',
                            )}
                        >
                            {extended && !compact && (
                                <>
                                    {/* Achat / Location, the type and the rooms: every option in view as a pill (user decision 2026-09-28) */}
                                    <RadioPillsCell
                                        id={`${id}-transaction`}
                                        name="transaction"
                                        label={t('properties.search_transaction')}
                                        icon={Briefcase}
                                        value={extended.transaction}
                                        options={(['sale', 'rent'] as const).map((value) => ({
                                            value,
                                            label: t(`properties.transaction.${value}`),
                                            icon: value === 'sale' ? Key : KeyRound,
                                        }))}
                                        onChange={(v) => extended.setTransaction(v as Transaction)}
                                        className={cn('sm:flex-none', stackedCell)}
                                    />
                                    <Divider horizontal={stacked} />
                                </>
                            )}
                            {/* The list is a popover anchored on the whole cell, at the cell's width (contact dropdown style) — the same at every
                                width, like the budget (user decision 2026-09-25); on mobile the cell never opens the keyboard */}
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
                                        highlighted={small ? -1 : highlighted} // no keyboard on mobile: no highlighted row (a hover state would linger under the finger)
                                        onHighlight={setHighlighted}
                                        onToggle={(n) => {
                                            toggleCity(n);
                                            setQuery('');
                                            if (!small) cityInput.current?.focus();
                                        }}
                                        empty={t('search_bar.city_empty')}
                                    />
                                    <CityFooter count={cities.length} onDone={closeCity} />
                                </PopoverContent>
                            </Popover>
                            {extended && !compact && (
                                <>
                                    <Divider horizontal={stacked} />
                                    <TogglePillsCell
                                        id={`${id}-type`}
                                        name="type"
                                        label={t('properties.search_type')}
                                        icon={Building2}
                                        values={extended.types}
                                        options={PROPERTY_TYPES.map((type) => ({
                                            value: type,
                                            label: t(`properties.types.${type}`),
                                            icon: TYPE_ICONS[type],
                                        }))}
                                        onChange={extended.setTypes}
                                        allLabel={t('properties.search_any')}
                                        className={stackedCell}
                                    />
                                    <Divider horizontal={stacked} />
                                    <TogglePillsCell
                                        id={`${id}-rooms`}
                                        name="rooms"
                                        label={t('properties.search_rooms')}
                                        icon={LayoutGrid}
                                        values={extended.rooms.map(String)}
                                        options={[1, 2, 3, 4, 5].map((n) => ({
                                            value: String(n),
                                            label: n === 5 ? '5+' : String(n),
                                            sr: tc('properties.search_rooms_exact', n, { count: n }),
                                        }))}
                                        onChange={(values) => extended.setRooms(values.map(Number).sort((a, b) => a - b))}
                                        allLabel={t('properties.search_any')}
                                        className={cn('sm:flex-none', stackedCell)}
                                    />
                                </>
                            )}
                            {!hideBudget && (
                                <>
                                    <Divider vertical={compact} horizontal={stacked} />
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
                                            <BudgetList
                                                items={budgetItems}
                                                value={budget}
                                                onPick={pickBudget}
                                                label={t('search_bar.budget_shortcuts')}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </>
                            )}
                        </div>
                        {/* Primary button, magnifier only (user decision 2026-09-25); the text stays as its accessible name. None in compact mode: the filters apply live */}
                        {compact && action}
                        {!compact && !hideSubmit && (
                            <Button
                                type="submit"
                                size="lg"
                                aria-label={ctaLabel ?? t('search_bar.cta')}
                                className={cn('group w-full sm:h-auto sm:w-18 sm:self-stretch sm:px-0', stacked && 'sm:h-10 sm:w-full sm:px-6')}
                            >
                                {/* Mobile: a plain conversion text next to the magnifier (user decision 2026-09-25); icon only from sm */}
                                <span className={cn('sm:sr-only', stacked && 'sm:not-sr-only')}>{ctaLabel ?? t('search_bar.cta_short')}</span>
                                {/* Mobile: the site's arrow next to the text, like every other button; from sm the magnifier alone */}
                                <ArrowUpRight aria-hidden className={cn('sm:hidden', stacked && 'sm:block')} />
                                <Search
                                    aria-hidden
                                    className={cn(
                                        'group-hover:text-secondary-60 hidden size-5 transition-[transform,color] duration-300 group-hover:translate-x-px group-hover:-translate-y-px motion-reduce:transition-none sm:block',
                                        stacked && 'sm:hidden',
                                    )}
                                />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
