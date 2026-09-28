import ResetButton from '@/components/properties/reset-button';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { ArrowUpRight, SearchX } from 'lucide-react';

type EmptyResultsProps = {
    /** Offered when arrondissements are set: add their neighbours. */
    onWidenDistricts?: () => void;
    /** Offered when a max budget is set: +20 %. */
    onWidenBudget?: () => void;
    onReset: () => void;
};

/**
 * Zero result (user decision 2026-09-28): instead of a bare sentence, concrete ways to widen — the neighbouring
 * arrondissements, 20 % more budget — and « Tout effacer ». Announced as a status. The site's card (sand hairline,
 * `p-2`, inner sand gradient), everything centred, with air **around** the card (`my-8 sm:my-12`, the count row above
 * and the source below) — ui.sh variant « Carte du site, dégradé sable » chosen among 25, user decision 2026-09-28.
 */
export default function EmptyResults({ onWidenDistricts, onWidenBudget, onReset }: EmptyResultsProps) {
    const { t } = useTranslation();
    return (
        // Air around the card, between the count row above and the source line below (user decision 2026-09-28), not inside it
        <div role="status" className="border-secondary-30 bg-card mx-auto my-8 w-full max-w-xl border p-2 sm:my-12">
            <div className="from-background-08 to-background-05 flex flex-col items-center gap-6 bg-linear-to-b p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                    <span aria-hidden className="border-secondary-30 bg-card flex size-9 shrink-0 items-center justify-center border">
                        <SearchX className="size-4" strokeWidth={1.5} />
                    </span>
                    <p className="text-base font-medium">{t('properties.widen_title')}</p>
                    <p className="text-muted-foreground text-base/7 text-pretty sm:text-sm/6">{t('properties.empty')}</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                    {onWidenDistricts && (
                        <Button type="button" size="sm" onClick={onWidenDistricts}>
                            {t('properties.widen_neighbours')}
                            <ArrowUpRight aria-hidden />
                        </Button>
                    )}
                    {onWidenBudget && (
                        <Button type="button" size="sm" onClick={onWidenBudget}>
                            {t('properties.widen_budget')}
                            <ArrowUpRight aria-hidden />
                        </Button>
                    )}
                    <ResetButton onClick={onReset} label={t('properties.clear_all')} className="bg-card" />
                </div>
            </div>
        </div>
    );
}
