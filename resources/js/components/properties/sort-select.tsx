import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/hooks/use-translation';
import { useId } from 'react';

/** Sort orders of the listing, as `PropertyQuery::SORTS` accepts them; `recent` = the source order, the only indexable one. */
export const SORTS = ['recent', 'price_asc', 'price_desc', 'sqm_asc', 'surface_asc', 'surface_desc'] as const;
export type Sort = (typeof SORTS)[number];

type SortSelectProps = { value: Sort; onChange: (sort: Sort) => void };

/**
 * Sort select of « Nos biens » (2026-09-28), on the count row opposite the h2: a labelled `Select` of the site
 * (« Trier par » visible, the trigger named by it) whose change asks the server for page 1 in that order, like a filter
 * (`?sort=price_asc` in the URL, `noindex`). « Réinitialiser » leaves it alone: an order is not a criterion.
 */
export default function SortSelect({ value, onChange }: SortSelectProps) {
    const { t } = useTranslation();
    const labelId = useId();

    return (
        <div className="flex items-center gap-2">
            <span id={labelId} className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                {t('properties.sort_label')}
            </span>
            <Select value={value} onValueChange={(v) => onChange(v as Sort)}>
                <SelectTrigger size="sm" aria-labelledby={labelId}>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                    {SORTS.map((sort) => (
                        <SelectItem key={sort} value={sort}>
                            {t(`properties.sort.${sort}`)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
