import { type Property } from '@/components/properties/property-card';
import { useTranslation } from '@/hooks/use-translation';
import { formatPrice } from '@/lib/format-price';
import { cn } from '@/lib/utils';
import { type CSSProperties } from 'react';

/**
 * « Les pièces » and « Caractéristiques » of the detail page (2026-09-28): every room with its surface (a `dl`, the
 * surfaces summed), then the building facts — year, heating, orientation, yearly charges and property tax (sales),
 * co-ownership lots and procedure, rent-control reference and deposit (rentals). Unknown values are left out.
 * Legibility rework (user request 2026-09-29): the rooms as one stacked bar cut per room (ui.sh « Barre empilée »
 * chosen among 5), a legend of names and surfaces under it and the total surface on a hairline; the
 * facts as two labelled definition lists (« L'immeuble », « Copropriété et charges » or « Conditions de location »),
 * label left and value right on hairline rows, side by side from `sm`.
 */
export default function PropertyDetails({ property }: { property: Property }) {
    const { t, locale } = useTranslation();
    const rooms = property.rooms_detail ?? [];
    const isRent = property.transaction === 'rent';
    type Fact = { key: string; label: string; value: string | null };
    const building: Fact[] = [
        { key: 'year', label: t('property.year_built'), value: property.year_built ? String(property.year_built) : null },
        { key: 'heating', label: t('property.heating'), value: property.heating ?? null },
        { key: 'orientation', label: t('property.orientation'), value: property.orientation ?? null },
    ];
    const terms: Fact[] = [
        ...(isRent
            ? [
                  {
                      key: 'rent_reference',
                      label: t('property.rent_reference'),
                      value: property.rent_reference ? `${formatPrice(property.rent_reference, locale)} ${t('property.per_month')}` : null,
                  },
                  { key: 'deposit', label: t('property.deposit'), value: property.deposit ? formatPrice(property.deposit, locale) : null },
              ]
            : [
                  {
                      key: 'charges',
                      label: t('property.annual_charges'),
                      value:
                          property.annual_charges != null ? t('property.per_year', { amount: formatPrice(property.annual_charges, locale) }) : null,
                  },
                  {
                      key: 'tax',
                      label: t('property.property_tax'),
                      value: property.property_tax != null ? t('property.per_year', { amount: formatPrice(property.property_tax, locale) }) : null,
                  },
              ]),
        { key: 'lots', label: t('property.lots'), value: property.lots != null ? t('property.lots_value', { count: property.lots }) : null },
        {
            key: 'procedure',
            label: t('property.procedure'),
            value: property.procedure == null ? null : t(property.procedure ? 'property.procedure_yes' : 'property.procedure_no'),
        },
    ];

    const total = rooms.reduce((sum, room) => sum + room.surface, 0);
    const factList = (title: string, items: Fact[]) => {
        const shown = items.filter((f) => f.value !== null);
        if (shown.length === 0) return null;
        return (
            <div className="flex flex-col gap-3">
                <h3 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">{title}</h3>
                <dl className="divide-border/60 flex flex-col divide-y">
                    {shown.map((f) => (
                        <div key={f.key} className="flex items-baseline justify-between gap-6 py-2.5 text-sm">
                            <dt className="text-muted-foreground">{f.label}</dt>
                            <dd className="text-right font-medium tabular-nums">{f.value}</dd>
                        </div>
                    ))}
                </dl>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-10">
            {rooms.length > 0 && (
                // ui.sh « Barre empilée » chosen among 5 (user decision 2026-09-29): one 100 % bar cut per room, from the dark primary to
                // the sands, the legend under it (name + surface: the colour only repeats the figures), the total on a hairline
                <div className="flex flex-col gap-4">
                    <div aria-hidden className="flex h-3 w-full gap-px">
                        {rooms.map((room, i) => (
                            <div
                                key={room.name}
                                className={cn(
                                    'h-full',
                                    [
                                        'bg-primary',
                                        'bg-secondary-80',
                                        'bg-secondary-60',
                                        'bg-secondary-50',
                                        'bg-secondary-40',
                                        'bg-secondary-30',
                                        'bg-background-08',
                                    ][i % 7],
                                )}
                                style={{ '--progress': `${(room.surface / Math.max(total, 1)) * 100}%` } as CSSProperties}
                            />
                        ))}
                    </div>
                    <dl className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
                        {rooms.map((room, i) => (
                            <div key={room.name} className="flex items-baseline justify-between gap-4 text-sm">
                                <dt className="flex items-center gap-2">
                                    <span
                                        aria-hidden
                                        className={cn(
                                            'size-2.5 shrink-0',
                                            [
                                                'bg-primary',
                                                'bg-secondary-80',
                                                'bg-secondary-60',
                                                'bg-secondary-50',
                                                'bg-secondary-40',
                                                'bg-secondary-30',
                                                'bg-background-08',
                                            ][i % 7],
                                        )}
                                    />
                                    {room.name}
                                </dt>
                                <dd className="font-heading font-semibold tabular-nums">{t('properties.surface', { surface: room.surface })}</dd>
                            </div>
                        ))}
                        <div className="border-border/60 flex items-baseline justify-between gap-4 border-t pt-2 text-sm sm:col-span-2">
                            <dt className="font-medium">{t('property.rooms_total')}</dt>
                            <dd className="font-heading font-semibold tabular-nums">{t('properties.surface', { surface: total })}</dd>
                        </div>
                    </dl>
                </div>
            )}
            <div className="grid gap-8 sm:grid-cols-2 sm:gap-10">
                {factList(t('property.building_title'), building)}
                {factList(t(isRent ? 'property.rental_terms_title' : 'property.coownership_title'), terms)}
            </div>
        </div>
    );
}
