import {
    Cell,
    ClearButton,
    Divider,
    RadioPillsCell,
    TogglePillsCell,
    type Transaction,
    choicePillClass,
    controlClass,
    labelClass,
} from '@/components/search/search-bar';
import { useTranslation } from '@/hooks/use-translation';
import { groupThousands } from '@/lib/format-price';
import { cn } from '@/lib/utils';
import {
    ArrowUp,
    ArrowUpDown,
    ArrowUpToLine,
    BadgeCheck,
    BedDouble,
    CalendarCheck,
    Car,
    ConciergeBell,
    Eye,
    Hammer,
    Layers,
    type LucideIcon,
    Map,
    Maximize2,
    Sofa,
    Sparkles,
    Sun,
    TreePalm,
    VolumeX,
    Wine,
} from 'lucide-react';
import { useId } from 'react';

export const FEATURES = ['elevator', 'balcony', 'terrace', 'top_floor', 'parking', 'concierge', 'view', 'cellar', 'quiet'] as const;
export const CONDITIONS = ['to_renovate', 'renovated', 'new'] as const;
export const FLOORS = ['not_ground', 'top'] as const;
const SURFACES = [50, 80, 100, 150, 200, 300];
/** Icons of the filters (user decision 2026-09-28). */
const FEATURE_ICONS: Record<(typeof FEATURES)[number], LucideIcon> = {
    elevator: ArrowUpDown,
    balcony: Sun,
    terrace: TreePalm,
    top_floor: ArrowUpToLine,
    parking: Car,
    concierge: ConciergeBell,
    view: Eye,
    cellar: Wine,
    quiet: VolumeX,
};
const CONDITION_ICONS: Record<(typeof CONDITIONS)[number], LucideIcon> = { to_renovate: Hammer, renovated: Sparkles, new: BadgeCheck };

/** The richer criteria of « Nos biens » (user decision 2026-09-28), kept in the page's state next to the bar's own. */
export type MoreFilters = {
    /** Grouped digits as typed (« 1 500 000 »), '' = none. */
    budgetMin: string;
    surfaceMin: string;
    bedrooms: number[];
    features: string[];
    conditions: string[];
    floors: string[];
    furnished: boolean | null;
    availableOnly: boolean;
    areas: string[];
};

export const EMPTY_MORE: MoreFilters = {
    budgetMin: '',
    surfaceMin: '',
    bedrooms: [],
    features: [],
    conditions: [],
    floors: [],
    furnished: null,
    availableOnly: false,
    areas: [],
};

/** Bare digits of a grouped amount, or null. */
export const digits = (value: string): number | null => Number(value.replace(/\D/g, '')) || null;

type MoreFiltersProps = {
    value: MoreFilters;
    onChange: (patch: Partial<MoreFilters>) => void;
    transaction: Transaction;
    /** Quartiers to offer (the `area` of every listing). */
    areas: string[];
};

const stackedCell = 'sm:h-auto sm:flex-none sm:px-5 sm:py-4';

/** An amount cell (budget min, surface min): grouped digits typed in, quick amounts as pills under the field. */
function AmountCell({
    id,
    name,
    label,
    icon: Icon,
    value,
    unit,
    presets,
    presetsLabel,
    clearLabel,
    onChange,
}: {
    id: string;
    name: string;
    label: string;
    icon?: LucideIcon;
    value: string;
    unit: string;
    presets: number[];
    presetsLabel: string;
    clearLabel: string;
    onChange: (v: string) => void;
}) {
    const { locale } = useTranslation();
    return (
        <Cell className={stackedCell}>
            <label htmlFor={id} className={cn(labelClass, 'flex items-center gap-1.5')}>
                {Icon && <Icon aria-hidden className="size-3.5" strokeWidth={1.5} />}
                {label}
            </label>
            {value !== '' && <input type="hidden" name={name} value={value.replace(/\D/g, '')} />}
            <div className="flex min-h-7 w-full items-center gap-3">
                <input
                    id={id}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder={groupThousands(String(presets[1]), locale)}
                    value={value}
                    onChange={(e) => onChange(groupThousands(e.target.value, locale))}
                    className={cn(controlClass, 'flex-1 tabular-nums')}
                />
                <span aria-hidden className="text-muted-foreground text-sm">
                    {unit}
                </span>
                {value !== '' && <ClearButton label={clearLabel} onClick={() => onChange('')} />}
            </div>
            <div role="group" aria-label={presetsLabel} className="flex flex-wrap gap-2 pt-1">
                {presets.map((n) => {
                    const grouped = groupThousands(String(n), locale);
                    const chosen = value === grouped;
                    return (
                        <button
                            key={n}
                            type="button"
                            aria-pressed={chosen}
                            onClick={() => onChange(chosen ? '' : grouped)}
                            className={cn(choicePillClass(chosen), 'tabular-nums')}
                        >
                            {grouped}
                        </button>
                    );
                })}
            </div>
        </Cell>
    );
}

/**
 * The extra criteria of the filters modal, under the bar's own cells and in the bar's style (the price range sits on top of the modal): surface min,
 * bedrooms, amenities (every one required), state, floor, quartier, and for rentals furnished / unfurnished; last, a
 * toggle to hide the listings under offer. Everything applies live like the rest (user decision 2026-09-28, « fais tout »).
 */
export default function MoreFilters({ value, onChange, transaction, areas }: MoreFiltersProps) {
    const { t, tc } = useTranslation();
    const id = useId();
    const any = t('properties.any_label');
    const numberPills = (values: number[]) => values.map(String);

    return (
        <>
            <Divider horizontal />
            <AmountCell
                id={`${id}-surface`}
                name="surface_min"
                label={t('properties.surface_min')}
                icon={Maximize2}
                value={value.surfaceMin}
                unit="m²"
                presets={SURFACES}
                presetsLabel={t('properties.surface_shortcuts')}
                clearLabel={t('search_bar.clear', { field: t('properties.surface_min') })}
                onChange={(surfaceMin) => onChange({ surfaceMin })}
            />
            <Divider horizontal />
            <TogglePillsCell
                id={`${id}-bedrooms`}
                name="bedrooms"
                label={t('properties.bedrooms_label')}
                icon={BedDouble}
                values={numberPills(value.bedrooms)}
                options={[1, 2, 3, 4, 5].map((n) => ({
                    value: String(n),
                    label: n === 5 ? '5+' : String(n),
                    sr: tc('properties.search_bedrooms_exact', n, { count: n }),
                }))}
                onChange={(values) => onChange({ bedrooms: values.map(Number).sort((a, b) => a - b) })}
                allLabel={t('properties.search_any')}
                className={stackedCell}
            />
            <Divider horizontal />
            <TogglePillsCell
                id={`${id}-features`}
                name="features"
                label={t('properties.features_label')}
                icon={Sparkles}
                values={value.features}
                options={FEATURES.map((f) => ({ value: f, label: t(`properties.feature.${f}`), icon: FEATURE_ICONS[f] }))}
                onChange={(features) => onChange({ features })}
                allLabel={any}
                className={stackedCell}
            />
            <Divider horizontal />
            <TogglePillsCell
                id={`${id}-condition`}
                name="condition"
                label={t('properties.condition_label')}
                icon={Hammer}
                values={value.conditions}
                options={CONDITIONS.map((c) => ({ value: c, label: t(`properties.condition.${c}`), icon: CONDITION_ICONS[c] }))}
                onChange={(conditions) => onChange({ conditions })}
                allLabel={any}
                className={stackedCell}
            />
            <Divider horizontal />
            <TogglePillsCell
                id={`${id}-floor`}
                name="floor"
                label={t('properties.floor_label')}
                icon={Layers}
                values={value.floors}
                options={FLOORS.map((f) => ({ value: f, label: t(`properties.floor.${f}`), icon: f === 'top' ? ArrowUpToLine : ArrowUp }))}
                onChange={(floors) => onChange({ floors })}
                allLabel={any}
                className={stackedCell}
            />
            {areas.length > 0 && (
                <>
                    <Divider horizontal />
                    <TogglePillsCell
                        id={`${id}-area`}
                        name="area"
                        label={t('properties.area_label')}
                        icon={Map}
                        values={value.areas}
                        options={areas.map((a) => ({ value: a, label: a }))}
                        onChange={(areas) => onChange({ areas })}
                        allLabel={t('properties.search_any')}
                        className={stackedCell}
                    />
                </>
            )}
            {transaction === 'rent' && (
                <>
                    <Divider horizontal />
                    <RadioPillsCell
                        id={`${id}-furnished`}
                        name="furnished"
                        label={t('properties.furnished_label')}
                        icon={Sofa}
                        value={value.furnished === null ? '' : value.furnished ? '1' : '0'}
                        options={[
                            { value: '', label: any },
                            { value: '1', label: t('properties.furnished.yes') },
                            { value: '0', label: t('properties.furnished.no') },
                        ]}
                        onChange={(v) => onChange({ furnished: v === '' ? null : v === '1' })}
                        className={stackedCell}
                    />
                </>
            )}
            <Divider horizontal />
            <Cell className={stackedCell}>
                <span id={`${id}-available-label`} className={cn(labelClass, 'flex items-center gap-1.5')}>
                    <CalendarCheck aria-hidden className="size-3.5" strokeWidth={1.5} />
                    {t('properties.availability_label')}
                </span>
                {value.availableOnly && <input type="hidden" name="available" value="1" />}
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        aria-pressed={value.availableOnly}
                        aria-describedby={`${id}-available-label`}
                        onClick={() => onChange({ availableOnly: !value.availableOnly })}
                        className={choicePillClass(value.availableOnly)}
                    >
                        {t('properties.available_only')}
                    </button>
                </div>
            </Cell>
        </>
    );
}
