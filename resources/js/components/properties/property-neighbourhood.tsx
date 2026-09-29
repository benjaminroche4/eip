import { type Property } from '@/components/properties/property-card';
import PropertyTransport from '@/components/properties/property-transport';
import { useTranslation } from '@/hooks/use-translation';
import { formatPrice } from '@/lib/format-price';
import { cn } from '@/lib/utils';
import { GraduationCap, TrainFront, Trees, type LucideIcon } from 'lucide-react';
import { type CSSProperties, type ReactNode } from 'react';

type PropertyNeighbourhoodProps = {
    property: Property;
    /** Arrondissement facts from the profile: average price per m² (« 14 000 »), schools and parks. */
    district: { price: string | null; education: string[]; parks: string[] };
    /** « Paris 16e ». */
    arrondissement: string;
};

/**
 * « Le quartier » block of the detail page (rework 2026-09-29, user request « améliore cette section »): the price
 * per m² **read against the arrondissement as two bars** on a sand card (this listing in the dark primary, the
 * arrondissement in sand, the longer one full width), the gap as a sand chip and **one plain sentence** that says
 * above / below and by how much (GEO: citable, sourced Notaires); then three rubrics on the site's icon tiles —
 * metro and RER stations with the walking time, schools, parks and gardens — the places as chips instead of a
 * dot-separated line. Information is never carried by colour alone: every bar has its label and its value.
 */
export default function PropertyNeighbourhood({ property, district, arrondissement }: PropertyNeighbourhoodProps) {
    const { t, locale } = useTranslation();
    const districtSqm = district.price ? Number(district.price.replace(/\D/g, '')) : 0;
    const listingSqm = property.price_sqm ?? Math.round(property.price / property.surface);
    const gap = districtSqm > 0 ? Math.round(((listingSqm - districtSqm) / districtSqm) * 100) : 0;
    const max = Math.max(listingSqm, districtSqm, 1);
    const isRent = property.transaction === 'rent';

    const bar = (label: string, value: number, className: string) => (
        <div className="grid grid-cols-[minmax(0,8rem)_1fr_auto] items-center gap-x-4 gap-y-1 sm:grid-cols-[minmax(0,11rem)_1fr_auto]">
            <dt className="text-sm">{label}</dt>
            {/* The bar only repeats the figure beside it */}
            <div aria-hidden className="bg-secondary-30/40 h-2 w-full">
                <div
                    className={cn('h-full w-(--progress) transition-[width] duration-700 motion-reduce:transition-none', className)}
                    style={{ '--progress': `${Math.round((value / max) * 100)}%` } as CSSProperties}
                />
            </div>
            <dd className="font-heading text-right text-base font-semibold tabular-nums">
                {t('property.price_per_sqm', { price: formatPrice(value, locale) })}
            </dd>
        </div>
    );
    const reading =
        gap === 0
            ? t('property.gap_reading_equal', { arrondissement })
            : t(gap > 0 ? 'property.gap_reading_above' : 'property.gap_reading_below', { percent: Math.abs(gap), arrondissement });

    // Legibility (user request 2026-09-29): one rubric per row, the icon tile and its label in a fixed left column from
    // `sm`, the content aligned in the right one, a hairline between rows; places as a plain list with a sand dot, one
    // per line (long school names wrapped badly as chips)
    const rubric = (Icon: LucideIcon, label: string, body: ReactNode) => (
        <div className="grid gap-3 py-5 first:pt-0 last:pb-0 sm:grid-cols-[11rem_1fr] sm:gap-8">
            <h3 className="flex items-center gap-3 self-start text-sm font-medium">
                <span aria-hidden className="border-secondary-30 bg-card flex size-9 shrink-0 items-center justify-center border">
                    <Icon className="size-4" strokeWidth={1.5} />
                </span>
                {label}
            </h3>
            <div className="min-w-0">{body}</div>
        </div>
    );
    const places = (items: string[]) => (
        <ul role="list" className="flex flex-col gap-1.5 text-sm/6">
            {items.map((item) => (
                <li key={item} className="flex gap-3">
                    <span aria-hidden className="bg-secondary-60 mt-2.5 size-1.5 shrink-0 rounded-full" />
                    {item}
                </li>
            ))}
        </ul>
    );
    const stops = property.transport ?? [];

    const gapChip = (
        <p className="bg-secondary-60 text-foreground px-2 py-0.5 text-xs font-medium tabular-nums">
            {t(gap >= 0 ? 'property.price_gap_above' : 'property.price_gap_below', { percent: Math.abs(gap) })}
        </p>
    );
    const source = <p className="text-grey-60 text-xs text-pretty">{t('property.price_source')}</p>;
    const showCompare = districtSqm > 0 && !isRent;
    const rubrics = (
        <div className="divide-border/60 flex flex-col divide-y">
            {stops.length > 0 && rubric(TrainFront, t('property.on_foot'), <PropertyTransport property={property} />)}
            {district.education.length > 0 && rubric(GraduationCap, t('property.district_schools'), places(district.education.slice(0, 3)))}
            {district.parks.length > 0 && rubric(Trees, t('property.district_parks'), places(district.parks.slice(0, 3)))}
        </div>
    );

    return (
        <div className="flex flex-col gap-8">
            {showCompare && (
                <div className="bg-background-05 flex flex-col gap-5 p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">{t('property.price_compare')}</p>
                        {gapChip}
                    </div>
                    <dl className="flex flex-col gap-3">
                        {bar(t('property.listing_price'), listingSqm, 'bg-primary')}
                        {bar(arrondissement, districtSqm, 'bg-secondary-60')}
                    </dl>
                    {/* GEO: one factual, self-contained sentence, then its source */}
                    <p className="text-sm/6 text-pretty">{reading}</p>
                    {source}
                </div>
            )}
            {rubrics}
        </div>
    );
}
