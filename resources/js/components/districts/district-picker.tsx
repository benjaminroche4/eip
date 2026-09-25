import { type District } from '@/components/districts/paris-map';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/hooks/use-translation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useId } from 'react';

type DistrictPickerProps = {
    items: District[];
    selected: number | null;
    onSelect: (n: number | null) => void;
};

/** Same press feedback as the site's other arrows. */
const arrowClass = 'group transition-transform active:scale-90 motion-reduce:transition-none';

/**
 * Text alternative to the map (2026-09-25): a select of the 20 arrondissements with their districts, for visitors who
 * do not know Paris's geography and for assistive tech, plus previous / next arrows to browse the profiles without
 * going back up to the map. An arrow at the end of the range is `aria-disabled` (it keeps the focus).
 */
export default function DistrictPicker({ items, selected, onSelect }: DistrictPickerProps) {
    const { t } = useTranslation();
    const labelId = useId();
    const index = items.findIndex((d) => d.n === selected);
    const step = (delta: 1 | -1) => {
        const next = items[index + delta];
        if (next) onSelect(next.n);
    };
    const atStart = index <= 0;
    const atEnd = index >= items.length - 1; // nothing selected: « next » opens the first profile

    // One line at every width (user decision 2026-09-25): the select takes the remaining room on mobile, a fixed width from sm
    return (
        <div className="flex items-center gap-3">
            <span id={labelId} className="sr-only">
                {t('districts.choose_label')}
            </span>
            <Select value={selected === null ? '' : String(selected)} onValueChange={(v) => onSelect(v === '' ? null : Number(v))}>
                <SelectTrigger aria-labelledby={labelId} className="min-w-0 flex-1 sm:w-80 sm:flex-none">
                    <SelectValue placeholder={t('districts.choose_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                    {items.map((d) => (
                        <SelectItem key={d.n} value={String(d.n)}>
                            {d.name} · {d.areas}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <div className="flex shrink-0 items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className={arrowClass}
                    aria-label={t('districts.previous_district')}
                    aria-disabled={atStart}
                    onClick={() => !atStart && step(-1)}
                >
                    <ChevronLeft aria-hidden className="transition-transform group-active:-translate-x-0.5 motion-reduce:transition-none" />
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className={arrowClass}
                    aria-label={t('districts.next_district')}
                    aria-disabled={atEnd}
                    onClick={() => !atEnd && step(1)}
                >
                    <ChevronRight aria-hidden className="transition-transform group-active:translate-x-0.5 motion-reduce:transition-none" />
                </Button>
            </div>
        </div>
    );
}
