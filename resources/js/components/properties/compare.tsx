import { type Property } from '@/components/properties/property-card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from '@/hooks/use-translation';
import { formatPrice } from '@/lib/format-price';
import { ordinal } from '@/lib/ordinal';
import { cn } from '@/lib/utils';
import { Check, Columns3, Minus, X } from 'lucide-react';
import { useState } from 'react';

export const COMPARE_MAX = 3;

type CompareTrayProps = { properties: Property[]; onRemove: (slug: string) => void; onClear: () => void };

/**
 * Comparison of 2-3 listings (user decision 2026-09-28): a tray pinned at the bottom while at least one card is ticked
 * (count, « Comparer », « Vider »), and a dialog laying the chosen ones side by side — price, price per m², surface,
 * rooms, bedrooms, floor, state, amenities — a check or a dash per cell.
 */
export default function CompareTray({ properties, onRemove, onClear }: CompareTrayProps) {
    const { t, tc, locale } = useTranslation();
    const [open, setOpen] = useState(false);
    if (properties.length === 0) return null;
    const features = Array.from(new Set(properties.flatMap((p) => p.features ?? [])));
    const rows: { key: string; label: string; cell: (p: Property) => string }[] = [
        {
            key: 'price',
            label: t('properties.price'),
            cell: (p) => `${formatPrice(p.price, locale)}${p.transaction === 'rent' ? ` ${t('properties.per_month')}` : ''}`,
        },
        {
            key: 'sqm',
            label: t('properties.compare_sqm'),
            cell: (p) => `${formatPrice(p.price_sqm ?? Math.round(p.price / p.surface), locale)}/m²`,
        },
        { key: 'surface', label: t('properties.compare_surface'), cell: (p) => t('properties.surface', { surface: p.surface }) },
        { key: 'rooms', label: t('properties.search_rooms'), cell: (p) => String(p.rooms) },
        { key: 'bedrooms', label: t('properties.bedrooms_label'), cell: (p) => String(p.bedrooms) },
        {
            key: 'floor',
            label: t('properties.floor_label'),
            cell: (p) => (p.floor == null ? '·' : p.floor === 0 ? t('properties.ground_floor') : ordinal(p.floor, locale)),
        },
        { key: 'condition', label: t('properties.condition_label'), cell: (p) => (p.condition ? t(`properties.condition.${p.condition}`) : '·') },
    ];

    return (
        <>
            <div
                role="region"
                aria-label={t('properties.compare_title')}
                className="border-secondary-30 bg-card fixed bottom-24 left-1/2 z-40 flex max-w-[calc(100vw-3rem)] -translate-x-1/2 items-center gap-3 border p-1.5 pl-3 ring-4 ring-white/25 lg:bottom-6"
            >
                <p className="text-sm font-medium tabular-nums">{tc('properties.compare_tray', properties.length, { count: properties.length })}</p>
                <Button type="button" size="sm" disabled={properties.length < 2} onClick={() => setOpen(true)}>
                    <Columns3 aria-hidden />
                    {t('properties.compare_open')}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={onClear} aria-label={t('properties.compare_clear')}>
                    <X aria-hidden />
                </Button>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="bg-background-05 max-h-[90dvh] overflow-y-auto rounded-none p-6 shadow-none sm:max-w-3xl">
                    <DialogTitle className="text-xl font-medium tracking-tight">{t('properties.compare_title')}</DialogTitle>
                    <DialogDescription className="sr-only">{t('properties.compare_max')}</DialogDescription>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="align-top">
                                    <td className="p-2" />
                                    {properties.map((p) => (
                                        <th key={p.slug} scope="col" className="bg-card min-w-40 p-2 text-left font-medium">
                                            <img
                                                src={p.photos[0].replace('{w}', '800')}
                                                alt=""
                                                width={800}
                                                height={600}
                                                loading="lazy"
                                                className="mb-2 aspect-[4/3] w-full object-cover"
                                            />
                                            <span className="block text-balance">{p.title}</span>
                                            <span className="text-muted-foreground block text-xs">
                                                Paris {ordinal(p.arrondissement, locale)} · {p.area}
                                            </span>
                                            <button
                                                type="button"
                                                aria-label={t('properties.compare_remove_x', { title: p.title })}
                                                onClick={() => onRemove(p.slug)}
                                                className="focus-ring text-muted-foreground hover:text-foreground mt-1 flex items-center gap-1 text-xs"
                                            >
                                                <X aria-hidden className="size-3" />
                                                {t('properties.compare_remove')}
                                            </button>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row) => (
                                    <tr key={row.key} className="border-secondary-30 border-t">
                                        <th scope="row" className="text-muted-foreground p-2 text-left text-xs font-medium tracking-wider uppercase">
                                            {row.label}
                                        </th>
                                        {properties.map((p) => (
                                            <td key={p.slug} className="bg-card p-2 tabular-nums">
                                                {row.cell(p)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                {features.map((f) => (
                                    <tr key={f} className="border-secondary-30 border-t">
                                        <th scope="row" className="text-muted-foreground p-2 text-left text-xs font-medium tracking-wider uppercase">
                                            {t(`properties.feature.${f}`)}
                                        </th>
                                        {properties.map((p) => {
                                            const has = (p.features ?? []).includes(f);
                                            return (
                                                <td key={p.slug} className={cn('bg-card p-2', has ? 'text-success' : 'text-muted-foreground')}>
                                                    {has ? <Check aria-hidden className="size-4" /> : <Minus aria-hidden className="size-4" />}
                                                    <span className="sr-only">{has ? t('properties.compare_yes') : t('properties.compare_no')}</span>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
