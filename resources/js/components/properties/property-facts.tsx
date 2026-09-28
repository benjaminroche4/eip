import { type Property } from '@/components/properties/property-card';
import { useTranslation } from '@/hooks/use-translation';
import { BedDouble, Building2, Layers, LayoutGrid, Maximize2, Sofa, Wrench } from 'lucide-react';

/**
 * « En bref » of the detail page (2026-09-28): the key facts as icon tiles (surface, rooms, bedrooms, floor, condition,
 * type, furnished for a rental), a `dl` in a responsive grid. Unknown values are left out.
 */
export default function PropertyFacts({ property }: { property: Property }) {
    const { t, tc } = useTranslation();
    const facts: { key: string; icon: typeof BedDouble; label: string; value: string | null }[] = [
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
    ];

    return (
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {facts
                .filter((f) => f.value !== null)
                .map((f) => (
                    // The tile lives in the <dt> (a <dl> group holds only dt / dd — axe `definition-list`), the value indents under the label
                    <div key={f.key} className="flex flex-col gap-0.5">
                        <dt className="text-muted-foreground flex items-center gap-3 text-xs">
                            <span
                                aria-hidden
                                className="border-secondary-30 bg-card text-foreground flex size-9 shrink-0 items-center justify-center border"
                            >
                                <f.icon className="size-4" strokeWidth={1.5} />
                            </span>
                            {f.label}
                        </dt>
                        <dd className="pl-12 text-sm font-medium tabular-nums">{f.value}</dd>
                    </div>
                ))}
        </dl>
    );
}
