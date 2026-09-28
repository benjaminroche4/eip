import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { X } from 'lucide-react';

export type ActiveFilter = {
    key: string;
    label: string;
    onRemove: () => void;
    /** Own wording of the « × » (default « Retirer :label »). */ removeLabel?: string;
};

type ActiveFiltersProps = { filters: ActiveFilter[]; onClear: () => void };

/**
 * The criteria in force as removable chips under the bar (user decision 2026-09-28): one sand pill per criterion with
 * its « × », plus « Tout effacer ». Nothing renders while no criterion is set. Announced as a list for assistive tech.
 */
export default function ActiveFilters({ filters, onClear }: ActiveFiltersProps) {
    const { t } = useTranslation();
    if (filters.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-2">
            <ul role="list" aria-label={t('properties.active_filters')} className="flex flex-wrap items-center gap-2">
                {filters.map((f) => (
                    <li key={f.key}>
                        <span className="border-secondary-30 from-background-08 to-background-05 flex items-center gap-1 border bg-linear-to-b py-0.5 pr-0.5 pl-2 text-xs font-medium">
                            {f.label}
                            <button
                                type="button"
                                aria-label={f.removeLabel ?? t('properties.remove_filter', { filter: f.label })}
                                onClick={f.onRemove}
                                className="focus-ring hover:bg-background-05 flex size-5 items-center justify-center rounded-none"
                            >
                                <X aria-hidden className="size-3" />
                            </button>
                        </span>
                    </li>
                ))}
            </ul>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="text-muted-foreground hover:text-foreground h-6 px-2 text-xs"
            >
                {t('properties.clear_all')}
            </Button>
        </div>
    );
}
