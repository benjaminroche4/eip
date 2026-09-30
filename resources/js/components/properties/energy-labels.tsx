import { type Property } from '@/components/properties/property-card';
import { useTranslation } from '@/hooks/use-translation';
import { formatPrice } from '@/lib/format-price';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';
import { useState } from 'react';

const CLASSES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const;
/** Literal class names per class so Tailwind sees them (official ADEME scale colours, tokens `--color-dpe-*` / `--color-ges-*`). */
const DPE: Record<string, string> = {
    A: 'bg-dpe-a text-white',
    B: 'bg-dpe-b text-white',
    C: 'bg-dpe-c text-text-heading',
    D: 'bg-dpe-d text-text-heading',
    E: 'bg-dpe-e text-text-heading',
    F: 'bg-dpe-f text-white',
    G: 'bg-dpe-g text-white',
};
const GES: Record<string, string> = {
    A: 'bg-ges-a text-text-heading',
    B: 'bg-ges-b text-text-heading',
    C: 'bg-ges-c text-white',
    D: 'bg-ges-d text-white',
    E: 'bg-ges-e text-white',
    F: 'bg-ges-f text-white',
    G: 'bg-ges-g text-white',
};

/** Official thresholds per class (kWh/m²/yr for the energy label, kg CO₂/m²/yr for the climate label). */
const RANGES: Record<'dpe' | 'ges', [number | null, number | null][]> = {
    dpe: [
        [null, 70],
        [71, 110],
        [111, 180],
        [181, 250],
        [251, 330],
        [331, 420],
        [421, null],
    ],
    ges: [
        [null, 6],
        [7, 11],
        [12, 30],
        [31, 50],
        [51, 70],
        [71, 100],
        [101, null],
    ],
};
/** Staircase heights A → G, literal for Tailwind. */
const STEPS = ['h-5', 'h-6', 'h-7', 'h-8', 'h-9', 'h-10', 'h-11'];

function Scale({ kind, value, label }: { kind: 'dpe' | 'ges'; value: string; label: string }) {
    const { t } = useTranslation();
    const colours = kind === 'dpe' ? DPE : GES;
    const [hovered, setHovered] = useState<string | null>(null);
    const shown = hovered ?? value;
    const [min, max] = RANGES[kind][CLASSES.indexOf(shown as (typeof CLASSES)[number])] ?? [null, null];
    const range =
        min === null
            ? t('property.dpe_range_up_to', { max: max ?? '' })
            : max === null
              ? t('property.dpe_range_from', { min })
              : t('property.dpe_range', { min, max });

    return (
        <div className="flex flex-col gap-3" onPointerLeave={() => setHovered(null)}>
            <p className="text-muted-foreground text-xs">{label}</p>
            {/* The official staircase (A the lowest step, G the highest). Hover (premium rework 2026-09-29): the class under the
                pointer lifts in full colour while a sand line draws under it, the others of the scale stay muted; the listing's
                class keeps its line. The readout under the bar follows the hovered class. 500 ms expo-out, still under reduced motion. */}
            <ol role="list" aria-label={label} className="flex items-end gap-1">
                {CLASSES.map((c, i) => {
                    const active = c === value;
                    return (
                        <li
                            key={c}
                            aria-current={active ? 'true' : undefined}
                            onPointerEnter={() => setHovered(c)}
                            className={cn(
                                'font-heading relative flex w-8 items-end justify-center pb-1 text-xs font-semibold transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none sm:w-9',
                                'after:bg-secondary-60 after:absolute after:inset-x-0 after:-bottom-2 after:h-0.5 after:origin-left after:scale-x-0 after:transition-transform after:duration-500 after:ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:after:transition-none',
                                STEPS[i],
                                colours[c],
                                active
                                    ? 'w-10 -translate-y-1 text-base after:scale-x-100 sm:w-11'
                                    : 'opacity-40 hover:-translate-y-1 hover:opacity-100 hover:after:scale-x-100',
                                hovered !== null && hovered !== c && !active && 'opacity-25',
                            )}
                        >
                            {c}
                        </li>
                    );
                })}
            </ol>
            <p aria-live="polite" className="text-muted-foreground text-xs tabular-nums">
                <span className="text-foreground font-medium">{t('property.dpe_class', { value: shown })}</span> · {range}{' '}
                {t(kind === 'dpe' ? 'property.dpe_unit_energy' : 'property.dpe_unit_climate')}
            </p>
        </div>
    );
}

/**
 * Energy labels of the detail page (2026-09-28, the mandatory notices of a French listing): the DPE (energy) and GES
 * (climate) classes A to G on their official colour scales, the listing's class enlarged, the estimated yearly energy
 * costs with the reference year, and the « logement à consommation énergétique excessive » notice for F and G.
 * (Two ui.sh restyle rounds on 2026-09-29 were dropped: the user kept this original.)
 */
export default function EnergyLabels({ property }: { property: Property }) {
    const { t, locale } = useTranslation();
    const dpe = property.dpe;
    if (!dpe) return null;
    const excessive = dpe.energy === 'F' || dpe.energy === 'G';

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-12">
                <Scale kind="dpe" value={dpe.energy} label={t('property.dpe_energy', { value: dpe.energy })} />
                <Scale kind="ges" value={dpe.climate} label={t('property.dpe_climate', { value: dpe.climate })} />
            </div>
            {/* Light grey note with a leading icon (user decision 2026-09-29), like the notices of the page */}
            <p className="text-grey-60 flex gap-2 text-xs text-pretty">
                <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.5} />
                <span>
                    {t('property.dpe_costs', { min: formatPrice(dpe.cost_min, locale), max: formatPrice(dpe.cost_max, locale), year: dpe.year })}
                </span>
            </p>
            {excessive && <p className="text-warning-foreground bg-warning/15 w-fit px-2 py-1 text-xs font-medium">{t('property.dpe_excessive')}</p>}
        </div>
    );
}
