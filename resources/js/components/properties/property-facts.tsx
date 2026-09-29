import { type Property } from '@/components/properties/property-card';
import { useTranslation } from '@/hooks/use-translation';
import { BedDouble, Building2, Layers, LayoutGrid, type LucideIcon, Maximize2, Sofa, Wrench } from 'lucide-react';

export type Fact = { key: string; label: string; value: string; icon: LucideIcon };

/**
 * Key facts of the detail page as one compact line (ui.sh variant « Une ligne à icônes » chosen among 8, user decision
 * 2026-09-29, replacing the figures strip of the day before): « 165 m² · 5 pièces · 3 chambres · 5e étage · À rénover ·
 * Appartement » with the thin icons of the cards' footer, a `dl` whose labels stay for assistive tech (`sr-only`);
 * surface, rooms, bedrooms, floor, condition, type, furnished for a rental. Unknown values are left out.
 */
/** The key facts of a listing, unknown values left out (shared with the header variants, 2026-09-29). */
export function usePropertyFacts(property: Property): Fact[] {
    const { t, tc } = useTranslation();
    return (
        [
            { key: 'surface', icon: Maximize2, label: t('property.surface'), value: t('properties.surface', { surface: property.surface }) },
            { key: 'rooms', icon: LayoutGrid, label: t('property.rooms'), value: tc('properties.rooms', property.rooms, { count: property.rooms }) },
            {
                key: 'bedrooms',
                icon: BedDouble,
                label: t('property.bedrooms'),
                value: tc('properties.bedrooms', property.bedrooms, { count: property.bedrooms }),
            },
            {
                key: 'floor',
                icon: Layers,
                label: t('property.floor'),
                value:
                    property.floor === null || property.floor === undefined
                        ? null
                        : tc('property.floor_value', property.floor, { count: property.floor }),
            },
            {
                key: 'condition',
                icon: Wrench,
                label: t('property.condition'),
                value: property.condition ? t(`properties.condition.${property.condition}`) : null,
            },
            { key: 'type', icon: Building2, label: t('property.type'), value: t(`properties.types.${property.type}`) },
            ...(property.transaction === 'rent'
                ? [{ key: 'furnished', icon: Sofa, label: t('property.furnished'), value: t(property.furnished ? 'property.yes' : 'property.no') }]
                : []),
        ] as { key: string; label: string; value: string | null; icon: LucideIcon }[]
    ).filter((f): f is Fact => f.value !== null);
}

export default function PropertyFacts({ property }: { property: Property }) {
    const facts = usePropertyFacts(property);

    return (
        <dl className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            {facts.map((f) => (
                <div key={f.key} className="flex items-center gap-1.5 whitespace-nowrap tabular-nums">
                    <dt className="sr-only">{f.label}</dt>
                    <f.icon aria-hidden className="text-muted-foreground size-4" strokeWidth={1.5} />
                    <dd>{f.value}</dd>
                </div>
            ))}
        </dl>
    );
}
